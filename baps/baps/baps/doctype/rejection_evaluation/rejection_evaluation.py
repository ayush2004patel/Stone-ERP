# rejection_evaluation.py
from __future__ import unicode_literals
import frappe
from frappe.model.document import Document
from frappe import _
from frappe.utils import nowdate

class RejectionEvaluation(Document):
    def validate(self):
        """
        Server-side validation to keep request_status and status consistent.
        - request_status: Pending / Accepted / Rejected
        - status: Available / Reject Request / Accept and Cannot Use / Accept and Can Use
        """
        # 1) Safety: ensure status (if set) is one of the field's options
        df = self.meta.get_field("status")
        if df and getattr(df, "options", None):
            allowed = [o.strip() for o in df.options.split("\n") if o.strip()]
            if self.status and self.status not in allowed:
                frappe.throw(
                    _("Status '{0}' is not valid. It must be one of: {1}").format(
                        self.status, ", ".join(allowed)
                    )
                )
        
        # 2) Enforce consistent combinations between request_status and status
        req = (self.request_status or "").strip()
        st = (self.status or "").strip()
        
        # If Accepted → status must be one of "Available", "Accept and Can Use", "Accept and Cannot Use"
        if req == "Accepted":
            valid_statuses = {"Available", "Accept and Can Use", "Accept and Cannot Use"}
            if st and st not in valid_statuses:
                frappe.throw(
                    _("When Request Status is 'Accepted', Status must be one of: {0}. "
                      "You set: {1}").format(", ".join(valid_statuses), st)
                )
        
        # If Rejected → status must usually be "Reject Request"
        if req == "Rejected":
            if st and st != "Reject Request":
                frappe.throw(
                    _("When Request Status is 'Rejected', Status should be 'Reject Request' "
                      "or left empty. You set: {0}").format(st)
                )

    def on_update(self):
        """
        Called after document is saved.
        When status = "Reject Request", update the linked Block's internal_status to "Wastage"
        """
        # Check if status is "Reject Request"
        if self.status == "Reject Request":
            self.update_block_to_wastage()

    def update_block_to_wastage(self):
        """
        Update the Block's internal_status to Wastage when rejection is confirmed
        """
        # Get the block number from the 'number' field
        block_number = self.number
        
        if not block_number:
            frappe.log_error(
                f"No block/stone number found in Rejection Evaluation {self.name}",
                "Block Wastage Update"
            )
            return
        
        # Check if this Block exists
        if not frappe.db.exists("Block", block_number):
            frappe.log_error(
                f"Block {block_number} not found for Rejection Evaluation {self.name}",
                "Block Wastage Update"
            )
            return
        
        try:
            # Update Block's internal_status to Wastage
            frappe.db.set_value(
                "Block",
                block_number,
                "internal_status",
                "Wastage",
                update_modified=True
            )
            
            # Commit the change
            frappe.db.commit()
            
            # Log success
            frappe.msgprint(
                _("Block {0} internal status has been updated to Wastage").format(block_number),
                alert=True
            )
            
            # Add a comment to the Block document for audit trail
            block_doc = frappe.get_doc("Block", block_number)
            block_doc.add_comment(
                "Info",
                f"Internal status changed to Wastage due to Rejection Evaluation {self.name}"
            )
            
        except Exception as e:
            frappe.log_error(
                frappe.get_traceback(),
                f"Failed to update Block {block_number} to Wastage from Rejection Evaluation {self.name}"
            )
            frappe.throw(
                _("Failed to update Block status to Wastage. Please check Error Log.")
            )

    # ----------------------------------------------------------------------
    # REJECT REQUEST
    # ----------------------------------------------------------------------
    @frappe.whitelist()
    def reject_request(self, reason: str = None):
        """
        Called from client when user clicks 'Reject Request'.
        Behavior:
         - set request_status = "Rejected"
         - set decision = "Rejected"
         - set status = "Reject Request"
         - store rejection_reason field
         - write Rejection Evaluation ID back to Inspection Demo.rejection_evaluation
         - Update Block internal_status to Wastage (via on_update hook)
        """
        re_name = self.name
        
        # Set request_status (safe if field exists)
        try:
            if self.meta.get_field("request_status"):
                self.request_status = "Rejected"
        except Exception:
            frappe.log_error(
                frappe.get_traceback(),
                f"reject_request: request_status set failed for {re_name}"
            )
        
        # Set decision (if field exists) or set attribute quietly
        try:
            if self.meta.get_field("decision"):
                self.decision = "Rejected"
            else:
                try:
                    self.set("decision", "Rejected")
                except Exception:
                    pass
        except Exception:
            frappe.log_error(
                frappe.get_traceback(),
                f"reject_request: decision set failed for {re_name}"
            )
        
        # Set visible select field 'status' on Rejection Evaluation → "Reject Request"
        try:
            df = self.meta.get_field("status")
            if df:
                self.set("status", "Reject Request")
        except Exception:
            frappe.log_error(
                frappe.get_traceback(),
                f"reject_request: could not set status for {re_name}"
            )
        
        # Store rejection reason in a field on the form (no Activity comment)
        if reason:
            try:
                if self.meta.get_field("rejection_reason"):
                    self.rejection_reason = reason
            except Exception:
                frappe.log_error(
                    frappe.get_traceback(),
                    f"reject_request: could not set rejection_reason for {re_name}"
                )
        
        # Save the Rejection Evaluation (this will trigger on_update which updates Block)
        try:
            self.save(ignore_permissions=True)
        except Exception:
            frappe.log_error(
                frappe.get_traceback(),
                f"reject_request: save failed for {re_name}"
            )
        
        # ------------------------------------------------------------------
        # WRITE BACK TO INSPECTION DEMO (set rejection_evaluation link)
        # ------------------------------------------------------------------
        ins_name = getattr(self, "inspection_demo", None)
        if ins_name:
            try:
                # check field exists on meta
                ins_meta = frappe.get_meta("Inspection Demo")
                if ins_meta.get_field("rejection_evaluation"):
                    old_val = frappe.db.get_value(
                        "Inspection Demo", ins_name, "rejection_evaluation"
                    )
                    frappe.db.set_value(
                        "Inspection Demo",
                        ins_name,
                        "rejection_evaluation",
                        self.name,
                        update_modified=True,
                    )
                    new_val = frappe.db.get_value(
                        "Inspection Demo", ins_name, "rejection_evaluation"
                    )
                    # Show what happened so we SEE it
                    frappe.msgprint(
                        _("Linked Inspection Demo {0}: Rejection Evaluation changed "
                          "from {1} to {2}").format(ins_name, old_val or "None", new_val or "None"),
                        alert=True,
                    )
                else:
                    frappe.msgprint(
                        _("Inspection Demo has no field 'rejection_evaluation' on meta."),
                        alert=True,
                    )
            except Exception:
                # Now we STOP quietly hiding the error
                frappe.throw(
                    _("Failed to set 'rejection_evaluation' on Inspection Demo {0}. "
                      "Check Error Log.").format(ins_name)
                )
        
        frappe.msgprint(
            _("Rejection Evaluation Request {0} has been marked Rejected and Block status updated to Wastage.").format(
                re_name
            ),
            alert=True,
        )
        
        return {"status": "Rejected", "name": re_name}

    # ----------------------------------------------------------------------
    # ACCEPT REQUEST
    # ----------------------------------------------------------------------
    @frappe.whitelist()
    def accept_request(self, decision: str):
        """
        Called from client when user selects:
        - 'can_use'    → Accept and Can Use
        - 'cannot_use' → Accept and Cannot Use
        - 'available'  → Available  (NEW: used for Block Inspection)
        - other strings → attempted as-is
        Behavior:
         - set request_status = "Accepted" (if field exists)
         - set decision = readable label (if field exists)
         - attempt to set visible 'status' field to the readable label (only if field exists and accepts it)
         - copy extra fields from Inspection Demo into this Rejection Evaluation (if mappings enabled)
         - save doc
         - DOES NOT modify any Inspection Demo by default (keeps behavior minimal)
        """
        # Set request_status safely
        try:
            if self.meta.get_field("request_status"):
                self.request_status = "Accepted"
        except Exception:
            frappe.log_error(
                frappe.get_traceback(),
                f"accept_request: request_status set failed for {self.name}",
            )
        
        # Map token -> readable label
        label = ""
        can_use_flag = None
        if decision == "can_use":
            label = "Accept and Can Use"
            can_use_flag = 1
        elif decision == "cannot_use":
            label = "Accept and Cannot Use"
            can_use_flag = 0
        elif decision == "available":
            # NEW: Block Inspection acceptance simplified label
            label = "Available"
            # no can_use flag change implied here
            can_use_flag = None
        else:
            # fallback: use the raw decision string as label (if it's a readable label)
            label = decision or ""
        
        # Set decision field safely
        try:
            # If meta has decision field and we have a label, set it
            if self.meta.get_field("decision") and label:
                self.decision = label
            else:
                # attempt to set attribute directly if decision field missing or label empty
                try:
                    self.set("decision", label)
                except Exception:
                    pass
        except Exception:
            frappe.log_error(
                frappe.get_traceback(), f"accept_request: decision set failed for {self.name}"
            )
        
        # Set can_use flag if field exists
        try:
            if self.meta.get_field("can_use") and can_use_flag is not None:
                self.can_use = can_use_flag
            else:
                try:
                    # attempt to set attribute even if meta field absent (non-fatal)
                    self.set("can_use", can_use_flag)
                except Exception:
                    pass
        except Exception:
            frappe.log_error(
                frappe.get_traceback(), f"accept_request: can_use set failed for {self.name}"
            )
        
        # Attempt to set visible select field 'status' to label (only if field exists and label is allowed).
        try:
            df = self.meta.get_field("status")
            if df and label:
                try:
                    # df.options is a single string of newline-separated values; normalize and check membership
                    opts = []
                    if getattr(df, "options", None):
                        opts = [o.strip() for o in df.options.split("\n") if o.strip()]
                    # Only set the status if our label matches one of the allowed options
                    if label in opts:
                        self.set("status", label)
                    else:
                        # safe fallback: log info and do not set status to avoid validation error
                        frappe.log(
                            f"accept_request: not setting status to '{label}' because it's not in allowed options"
                        )
                except Exception:
                    frappe.log_error(
                        frappe.get_traceback(),
                        f"accept_request: could not set 'status' to '{label}' for {self.name}",
                    )
        except Exception:
            pass
        
        # Optionally copy extra fields from linked Inspection Demo into this Rejection Evaluation
        ins_doc = None
        if getattr(self, "inspection_demo", None):
            try:
                ins_doc = frappe.get_doc("Inspection Demo", self.inspection_demo)
            except Exception:
                ins_doc = None
        
        if ins_doc:
            # copy fields into this Rejection Evaluation (no changes to Inspection Demo)
            try:
                _copy_additional_fields_from_inspection_demo(self, ins_doc)
            except Exception:
                frappe.log_error(
                    frappe.get_traceback(),
                    f"accept_request: copying fields failed for {self.name}",
                )
        
        # Save after all changes
        try:
            self.save(ignore_permissions=True)
        except Exception:
            frappe.log_error(
                frappe.get_traceback(), f"accept_request: save failed for {self.name}"
            )
        
        # ------------------------------------------------------------------
        # WRITE BACK TO INSPECTION DEMO (set rejection_evaluation link)
        # ------------------------------------------------------------------
        ins_name = getattr(self, "inspection_demo", None)
        if ins_name:
            try:
                ins_meta = frappe.get_meta("Inspection Demo")
                if ins_meta.get_field("rejection_evaluation"):
                    old_val = frappe.db.get_value(
                        "Inspection Demo", ins_name, "rejection_evaluation"
                    )
                    frappe.db.set_value(
                        "Inspection Demo",
                        ins_name,
                        "rejection_evaluation",
                        self.name,
                        update_modified=True,
                    )
                    new_val = frappe.db.get_value(
                        "Inspection Demo", ins_name, "rejection_evaluation"
                    )
                    frappe.msgprint(
                        _("Linked Inspection Demo {0}: Rejection Evaluation changed "
                          "from {1} to {2}").format(ins_name, old_val or "None", new_val or "None"),
                        alert=True,
                    )
                else:
                    frappe.msgprint(
                        _("Inspection Demo has no field 'rejection_evaluation' on meta."),
                        alert=True,
                    )
            except Exception:
                frappe.throw(
                    _("Failed to set 'rejection_evaluation' on Inspection Demo {0}. "
                      "Check Error Log.").format(ins_name)
                )
        
        frappe.msgprint(
            _(
                "Rejection Evaluation Request {0} has been Accepted with decision: {1}."
            ).format(self.name, label or decision),
            alert=True,
        )
        
        return {
            "status": "Accepted",
            "decision": label or decision,
            "can_use": can_use_flag,
        }


# ============================
# Helper: copy extra fields on ACCEPT
# (kept empty — add mappings if you want specific fields copied)
# ============================
def _copy_additional_fields_from_inspection_demo(re_doc: Document, ins_doc: Document):
    """
    Copy a few fields from Inspection Demo into the Rejection Evaluation when ACCEPTED.
    Currently no automatic copies are enabled (keeps behavior minimal and non-invasive).
    """
    # Add mapping lines here if you want field copies on accept.
    return