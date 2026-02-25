import frappe
from frappe.model.document import Document
from frappe import _
from frappe.utils import cint, flt   # kept as-is, even if not used now
import json


class InspectionDemo(Document):
    def validate(self):
        # ----------------------------------------
        # CONDITIONAL MANDATORY FIELDS (only for Block Inspection)
        # ----------------------------------------
        if self.inspection_type == "Block Inspection":
            self._require_fields(
                [
                    "current_site",
                    "block_number",
                    "color",
                    "grain",
                    "l1",
                    "b1",
                    "h1",
                    "l2",
                    "b2",
                    "h2",
                    "wt",
                ],
                "Block Inspection",
            )
        # ----------------------------------------
        # CONDITIONAL MANDATORY FIELDS (Pre Carving Inspection)
        # ----------------------------------------
        if self.inspection_typee in ("Pre Carving", "Pre Carving Inspection"):
           self._require_fields(
        [
            "current_sitee",
            "projectt",
        ],
        "Pre Carving Inspection",
    )

        # ----------------------------------------
        # Validate inch fields (l2, b2, h2) ≤ 12
        # ----------------------------------------
        for field in ["l2", "b2", "h2"]:
            if (self.get(field) or 0) > 12:
                frappe.throw(_("{0} cannot be greater than 12 inches").format(field.upper()))
        
        # ----------------------------------------
        # Recalculate volume
        # ----------------------------------------
        L = (self.l1 or 0) + ((self.l2 or 0) / 12)
        B = (self.b1 or 0) + ((self.b2 or 0) / 12)
        H = (self.h1 or 0) + ((self.h2 or 0) / 12)
        self.volume = round(L * B * H, 3) if (L > 0 and B > 0 and H > 0) else 0.0

        # === CONDITIONAL QUESTION VALIDATION: only check sections that are active ===
        # Validate questions only for the inspection sections that are actually set on the doc.
        # Mapping is kept consistent with how questions are loaded in client JS.
        if self.inspection_type:  # Block Inspection
            self._validate_questions(self.ques, "Block Inspection")

        if self.inspection_typee:  # Pre Carving Inspection
            # Pre Carving uses child table 'ques' in client load mapping
            self._validate_questions(self.ques, "Pre Carving")

        if self.inspection_typeee:  # Post Carving Inspection
            # Post Carving uses child table 'que'
            self._validate_questions(self.que, "Post Carving")

        if self.inspection_typeeee:  # Post Polishing Inspection
            # Post Polishing uses child table 'quess'
            self._validate_questions(self.quess, "Post Polishing")

        # Direct inspection types (direct post) - validate their child tables if present
        if getattr(self, 'direct_inspection_typeeeeeee', None) == "Direct Post Carving":
            self._validate_questions(self.quesssssss, "Direct Post Carving")

        if getattr(self, 'direct_inspection_typeeeeeeee', None) == "Direct Post Polishing":
            self._validate_questions(self.quessssssss, "Direct Post Polishing")

        # === Block/Stone validations (unchanged) ===
        if self.block_number and self.current_site:
            self._validate_block(self.block_number, self.current_site, "Ready for Inspection")

        if self.stone_number and self.current_sitee:
            self._validate_block(self.stone_number, self.current_sitee, "Ready for Cutting Planning")

        if self.stone_numberr and self.current_siteee:
            self._validate_block(self.stone_numberr, self.current_siteee, "Ready for Carving Inspection")

        if self.stone_numberrrr and self.current_siteeee:
            self._validate_block(self.stone_numberrrr, self.current_siteeee, "Ready for Polishing Inspection")

    # ---------- helpers ----------

    def _require_fields(self, fields, context_label):
        """Raise error if any field in list is empty."""
        missing = []
        for fieldname in fields:
            if not self.get(fieldname):
                df = self.meta.get_field(fieldname)
                label = df.label if df else fieldname
                missing.append(label)

        if missing:
            msg = _("Please fill the following mandatory fields for {0}:<br>{1}").format(
                context_label,
                "<br>".join(f"- {m}" for m in missing)
            )
            frappe.throw(msg)

    def _validate_questions(self, table, inspection_name):
        """
        Validate that all loaded questions in the given table:
        - are answered
        - answer is strictly 'yes' or 'no' (case-insensitive)
        """
        if not table:
            return

        for row in table:
            # Each 'row' expected to have 'questions' and 'yes_or_no' fields
            if not row.questions:
                continue

            answer = getattr(row, "yes_or_no", None)

            # 1) must not be empty
            if not answer:
                frappe.throw(
                    _("Please answer all questions for {0} before saving.").format(inspection_name)
                )

            # 2) must be exactly yes / no (case-insensitive, ignoring spaces)
            normalized = str(answer).strip().lower()
            if normalized not in ("yes", "no"):
                frappe.throw(
                    _("Answer for question '{0}' in {1} must be 'yes' or 'no'. You entered: {2}")
                    .format(row.questions, inspection_name, answer)
                )

    def _validate_block(self, block_name, expected_site, expected_status):
        # safer check if Block exists before reading its fields
        if not frappe.db.exists("Block", block_name):
            frappe.throw(_("Block '{0}' not found.").format(block_name))
        block_doc = frappe.get_doc("Block", block_name)
        if block_doc.site != expected_site:
            frappe.throw(_("Block '{0}' belongs to site '{1}', but current site is '{2}'.").format(
                block_name, block_doc.site, expected_site
            ))
        if block_doc.status != expected_status:
            frappe.throw(_("Block '{0}' has status '{1}'. Expected: '{2}'.").format(
                block_name, block_doc.status, expected_status
            ))

    def on_update(self):
        """Show update message after saving an existing inspection."""
        if not self.is_new():
            if self.inspection_type == "Block Inspection" and self.block_number:
                frappe.msgprint(
                    _("Block Inspection for Block {0} updated successfully!").format(self.block_number),
                    alert=True,
                )
            elif self.inspection_typee == "Pre Carving" and self.stone_number:
                frappe.msgprint(
                    _("Pre Carving Inspection for Stone {0} updated successfully!").format(self.stone_number),
                    alert=True,
                )
            elif self.inspection_typeee == "Post Carving" and self.stone_numberr:
                frappe.msgprint(
                    _("Post Carving Inspection for Stone {0} updated successfully!").format(self.stone_numberr),
                    alert=True,
                )
            elif self.inspection_typeeee == "Post Polishing" and self.stone_numberrrr:
                frappe.msgprint(
                    _("Post Polishing Inspection for Stone {0} updated successfully!").format(self.stone_numberrrr),
                    alert=True,
                )

            # ==========================================================
            # NEW: When Block Inspection is COMPLETED,
            # copy dimensions into Block.actual_* fields
            # ==========================================================
            if (
                self.inspection_type == "Block Inspection"
                and self.block_number
                and getattr(self, "inspection_status", "") == "Completed"
            ):
                try:
                    frappe.db.set_value(
                        "Block",
                        self.block_number,
                        {
                            "actual_l1": self.l1 or 0,
                            "actual_l2": self.l2 or 0,
                            "actual_b1": self.b1 or 0,
                            "actual_b2": self.b2 or 0,
                            "actual_h1": self.h1 or 0,
                            "actual_h2": self.h2 or 0,
                            "actual_volume": self.volume or 0.0,
                        },
                    )
                except Exception:
                    frappe.log_error(
                        frappe.get_traceback(),
                        f"InspectionDemo.on_update: failed to update actual dimensions "
                        f"for Block {self.block_number} from Inspection {self.name}",
                    )

            # ==========================================================
            # NEW: When Block Inspection workflow_state is COMPLETED,
            # change Block.status → "Ready for Cutting Planning"
            # (ADDED WITHOUT CHANGING ANY EXISTING LOGIC)
            # ==========================================================
            if (
                self.inspection_type == "Block Inspection"
                and self.block_number
                and getattr(self, "workflow_state", "") == "Completed"
            ):
                try:
                    frappe.db.set_value(
                        "Block",
                        self.block_number,
                        "status",
                        "Ready for Cutting Planning",
                    )
                except Exception:
                    frappe.log_error(
                        frappe.get_traceback(),
                        f"InspectionDemo.on_update: failed to set status "
                        f"to 'Ready for Cutting Planning' for Block {self.block_number} "
                        f"from Inspection {self.name}",
                    )


@frappe.whitelist()
def get_existing_inspection_for_block(block_number):
    """Returns existing Block Inspection for given block, if any."""
    existing = frappe.db.exists(
        "Inspection Demo",
        {
            "block_number": block_number,
            "inspection_type": "Block Inspection",
            "docstatus": ("!=", 2)  # Not cancelled
        }
    )
    if existing:
        return existing
    return None


@frappe.whitelist()
def get_existing_inspection_for_stone(stone_number, inspection_type):
    """Returns existing stone inspection for given stone and type."""
    # explicit mapping to the inspection_type field name on the document
    inspection_field_map = {
        "Pre Carving": "inspection_typee",
        "Post Carving": "inspection_typeee",
        "Post Polishing": "inspection_typeeee"
    }
    inspection_field = inspection_field_map.get(inspection_type)
    if not inspection_field:
        return None

    docs = frappe.get_all(
        "Inspection Demo",
        filters={
            inspection_field: inspection_type,
            "docstatus": ("!=", 2)
        },
        fields=[
            "name",
            "stone_number",
            "stone_numberr",
            "stone_numberrrr",
            "direct_stone_numberrrrrrrr",
            "direct_stone_numberrrrrrrrrr",
        ],
        limit_page_length=200,
    )

    for d in docs:
        if stone_number and any(
            d.get(k) == stone_number
            for k in [
                "stone_number",
                "stone_numberr",
                "stone_numberrrr",
                "direct_stone_numberrrrrrrr",
                "direct_stone_numberrrrrrrrrr",
            ]
        ):
            return d.name

    return None


# =======================
# APPENDED: Rejection Evaluation creator (non-invasive addition)
# =======================
@frappe.whitelist()
def create_rejection_evaluation(payload=None):
    """
    Creates a Rejection Evaluation doc from an Inspection Demo payload.
    - Avoids duplicates by checking 'inspection_demo' link on Rejection Evaluation.
    - Returns { success, name } or { success: False, error }
    """
    try:
        if not payload:
            frappe.throw(_("Missing payload"))

        if isinstance(payload, str):
            payload = json.loads(payload)

        inspection_demo_name = payload.get("inspection_demo")
        if not inspection_demo_name:
            frappe.throw(_("Missing inspection demo document reference"))

        # If a Rejection Evaluation already exists for this Inspection Demo, return that name
        existing = frappe.get_all(
            "Rejection Evaluation",
            filters={"inspection_demo": inspection_demo_name},
            fields=["name"],
            limit_page_length=1,
        )
        if existing:
            return {"success": True, "exists": existing[0].name}

        # Build new Rejection Evaluation doc
        re_doc = frappe.new_doc("Rejection Evaluation")
        if payload.get("date"):
            re_doc.date = payload.get("date")
        else:
            re_doc.date = frappe.utils.nowdate()

        re_doc.number = payload.get("number") or ""
        re_doc.inspection_type = payload.get("inspection_type") or ""
        re_doc.rejected_by = payload.get("rejected_by") or frappe.session.user or ""
        re_doc.from_status = payload.get("from_status")

        if payload.get("current_site"):
            re_doc.current_site = payload.get("current_site")

        re_doc.inspection_demo = inspection_demo_name
        re_doc.request_status = "Pending"

        re_doc.insert(ignore_permissions=True)
        frappe.db.commit()

        # ensure linked Inspection Demo shows EMPTY status
        try:
            frappe.db.set_value(
                "Inspection Demo",
                inspection_demo_name,
                "status",
                "",
                update_modified=False,
            )
        except Exception:
            frappe.log_error(
                frappe.get_traceback(),
                "create_rejection_evaluation: failed to clear Inspection Demo.status for {0}".format(
                    inspection_demo_name
                ),
            )

        return {"success": True, "name": re_doc.name}

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "create_rejection_evaluation failed")
        return {"success": False, "error": str(e)}


# =======================
# NEW: Filter for Block / Stone dropdowns (non-breaking)
# =======================
@frappe.whitelist()
@frappe.validate_and_sanitize_search_inputs
def get_available_block_or_stone(doctype, txt, searchfield, start, page_len, filters=None):
    """
    Used in link field set_query to hide blocks / stones whose inspection
    is already 'Completed' for that *specific* inspection form.

    Expected filters from JS:
      - usage: one of
            "block_inspection",
            "pre_carving",
            "post_carving",
            "post_polishing",
            "direct_post_carving",
            "direct_post_polishing"
      - site: current_site / current_sitee / ...
      - project: (optional) project / projectt / ...
      - status: required Block.status for that form
    """
    if filters is None:
        filters = {}

    usage = filters.get("usage")
    site = filters.get("site")
    project = filters.get("project")
    status = filters.get("status")

    # mapping: which Inspection Demo field & type to check per usage
    usage_map = {
        "block_inspection": {
            "link_field": "block_number",
            "inspection_type_field": "inspection_type",
            "inspection_type_value": "Block Inspection",
        },
        "pre_carving": {
            "link_field": "stone_number",
            "inspection_type_field": "inspection_typee",
            "inspection_type_value": "Pre Carving",
        },
        "post_carving": {
            "link_field": "stone_numberr",
            "inspection_type_field": "inspection_typeee",
            "inspection_type_value": "Post Carving",
        },
        "post_polishing": {
            "link_field": "stone_numberrrr",
            "inspection_type_field": "inspection_typeeee",
            "inspection_type_value": "Post Polishing",
        },
        "direct_post_carving": {
            "link_field": "direct_stone_numberrrrrrrr",
            "inspection_type_field": "direct_inspection_typeeeeeee",
            "inspection_type_value": "Direct Post Carving",
        },
        "direct_post_polishing": {
            "link_field": "direct_stone_numberrrrrrrrrr",
            "inspection_type_field": "direct_inspection_typeeeeeeee",
            "inspection_type_value": "Direct Post Polishing",
        },
    }

    conditions = ["b.docstatus < 2"]
    params = {
        "txt": f"%{txt}%" if txt else "%%",
        "start": cint(start) if start is not None else 0,
        "page_len": cint(page_len) if page_len is not None else 20,
    }

    if site:
        conditions.append("b.site = %(site)s")
        params["site"] = site

    if project:
        # only if your Block doctype has baps_project or similar
        conditions.append("b.baps_project = %(project)s")
        params["project"] = project

    if status:
        conditions.append("b.status = %(status)s")
        params["status"] = status
    else:
        # If no status provided, exclude all blocks (safety measure)
        conditions.append("1 = 0")

    # Exclude blocks / stones already Completed in that inspection form
    if usage in usage_map:
        m = usage_map[usage]
        link_field = m["link_field"]
        inspection_type_field = m["inspection_type_field"]
        inspection_type_value = m["inspection_type_value"]

        conditions.append(f"""
            b.name NOT IN (
                SELECT {link_field}
                FROM `tabInspection Demo`
                WHERE docstatus < 2
                  AND {inspection_type_field} = %(inspection_type_value)s
                  AND IFNULL(inspection_status, '') = 'Completed'
            )
        """)
        params["inspection_type_value"] = inspection_type_value

    where_clause = " AND ".join(conditions)

    query = f"""
        SELECT
            b.name
        FROM `tabBlock` b
        WHERE
            {where_clause}
            AND (b.{searchfield} LIKE %(txt)s OR b.name LIKE %(txt)s)
        ORDER BY b.name
        LIMIT %(start)s, %(page_len)s
    """

    return frappe.db.sql(query, params)