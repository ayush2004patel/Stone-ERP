import frappe
from frappe import _
from frappe.model.document import Document

class Transportation(Document):
    def validate(self):
        """
        Runs before save.
        """
        # --- NEW LOGIC ---
        # This function runs first. It checks if the gate_pass_no has
        # changed and updates the status of the "Gate Pass" doc itself.
        self.handle_gate_pass_status_update()
        # --- END NEW LOGIC ---

        self.validate_gate_pass_usage()
        self.validate_sites()
        
        # NEW: Validate additional items before saving
        self.validate_additional_items()

        # Updated workflow logic
        self.update_child_block_statuses()
        self.update_parent_transportation_status()

    # ---
    #--- NEW FUNCTION TO VALIDATE ADDITIONAL ITEMS ---
    # def validate_additional_items(self):
    #     """
    #     Validates all rows in the 'additional_items' child table before saving.
    #     """
    #     if not self.additional_items:
    #         return  # Nothing to validate

    #     if not self.from_site:
    #         # This check is crucial, as all rows depend on it
    #         frappe.throw(_("Please set 'From Site' before adding additional items."))

    #     # Loop through each row in the child table
    #     for i, row in enumerate(self.additional_items):
    #         # Get row data, skip if empty
    #         item_type = (row.item_type or "").strip()
    #         item_number = (row.item_number or "").strip()

    #         if not item_type or not item_number:
    #             frappe.throw(
    #                 _("Row {0} in 'Additional Item Received': Please provide both Item Type and Item Number.")
    #                 .format(i + 1)
    #             )

    #         # Define your conditions
    #         doctype_to_check = item_type
    #         item_name_to_check = item_number
    #         required_site = self.from_site
    #         required_status = "Can Transit"

    #         try:
    #             # Check if a document exists that matches ALL 3 conditions
    #             item_is_valid = frappe.db.exists(
    #                 doctype_to_check,
    #                 {
    #                     "name": item_name_to_check,         # Condition 1 (Item must exist)
    #                     "site": required_site,             # Condition 2 (Site must match 'from_site')
    #                     "transportation_status": required_status  # Condition 3 (Status must be 'Can Transit')
    #                 }
    #             )

    #             if not item_is_valid:
    #                 # If it doesn't exist, block the save
    #                 frappe.throw(
    #                     _("Row {0}: Item {1} ({2}) Was not exist at site '{3}'.")
    #                     .format(i + 1, item_name_to_check, doctype_to_check, required_site)
    #                 )
                
    #             # OPTIONAL: Auto-fill baps_project if it's empty
    #             if not row.baps_project:
    #                 project = frappe.db.get_value(doctype_to_check, item_name_to_check, "baps_project")
    #                 if project:
    #                     row.baps_project = project

    #         except frappe.db.ProgrammingError:
    #             # This catches errors if 'item_type' is not a real DocType
    #             # or if the DocType is missing 'site' or 'transportation_status' fields.
    #             frappe.throw(
    #                 _("Row {0}: Cannot validate Item Type '{1}'. Check if it is a valid DocType with 'site' and 'transportation_status' fields.")
    #                 .format(i + 1, item_type)
    #             )
    def validate_additional_items(self):
    # """
    # Validates rows in the 'additional_items' child table before saving:
    #   1) item_number must exist in the selected item_type
    #   2) the Block (block list) for that item_number must exist and have:
    #        - transportation_status == "Can Transit"
    #        - site == self.from_site
    # Also auto-fills baps_project if empty.
    # """
        if not self.additional_items:
            return

        if not self.from_site:
            frappe.throw(_("Please set 'From Site' before adding additional items."))

        for idx, row in enumerate(self.additional_items, start=1):
            item_type = (row.item_type or "").strip()
            item_number = (row.item_number or "").strip()

            if not item_type or not item_number:
                frappe.throw(
                    _("Row {0}: Please provide both Item Type and Item Number.").format(idx)
                )

        # 1) Check item exists in the chosen DocType
            try:
                item_exists = frappe.db.exists(item_type, item_number)
            except frappe.db.ProgrammingError:
            # invalid doctype name or DB error
                frappe.throw(
                    _("Row {0}: Item Type '{1}' is not a valid.").format(idx, item_type)
                )

            if not item_exists:
                frappe.throw(
                    _("Row {0}: Additional Item '{1}' does not exist in '{2}'.")
                    .format(idx, item_number, item_type)
                )

        # 2) Check Block (block_list) status and site
        # We check the Block doctype specifically using the item_number as Block name.
            try:
                block = frappe.db.get_value(
                    "Block",
                    item_number,
                    ["site", "transportation_status"],
                    as_dict=True
                )
            except frappe.db.ProgrammingError:
                frappe.throw(
                    _("Row {0}: Unable to validate against 'Block'. Check that 'Block' DocType exists with fields 'site' and 'transportation_status'.")
                    .format(idx)
                )

            if not block:
                frappe.throw(
                    _("Row {0}: Block '{1}' not found in Block list.").format(idx, item_number)
                )

        # Compare status and site
            if (block.transportation_status or "").strip() != "Can Transit":
                frappe.throw(
                    _("Row {0}: Block '{1}' transportation_status is not 'Can Transit'. Current: '{2}'.")
                    .format(idx, item_number, block.transportation_status)
                )

            # if (block.site or "").strip() != (self.from_site or "").strip():
            #     frappe.throw(
            #         _("Row {0}: Block '{1}' is at site '{2}', not at From Site '{3}'.")
            #         .format(idx, item_number, block.site, self.from_site)
            #     )

        # Optional: auto-fill baps_project if empty
            if not row.baps_project:
                try:
                    project = frappe.db.get_value(item_type, item_number, "baps_project")
                    if project:
                        row.baps_project = project
                except frappe.db.ProgrammingError:
                # ignore if baps_project field missing on the doctype
                    pass

    
    # --- NEW FUNCTION TO HANDLE DELETION ---
    def on_trash(self):
        """
        Runs when the document is deleted.
        Releases the associated Gate Pass.
        """
        # This calls your existing "release_gate_pass" function,
        # which sets the Gate Pass to "Available" and updates the book's count.
        if self.gate_pass_no:
            self.release_gate_pass(self.gate_pass_no)

    # --- NEW FUNCTIONS TO UPDATE GATE PASS STATUS ---
    # ---
    
    def handle_gate_pass_status_update(self):
        """
        Compares the document before and after save to see
        if the Gate Pass has been added, changed, or removed.
        """
        # Get the document's state *before* this save
        doc_before_save = self.get_doc_before_save()
        
        current_pass = self.gate_pass_no
        old_pass = doc_before_save.gate_pass_no if doc_before_save else None

        # If the pass hasn't changed, do nothing.
        if current_pass == old_pass:
            return

        # Case 1: A new pass is being set (old was blank)
        if current_pass and not old_pass:
            self.use_gate_pass(current_pass)
        
        # Case 2: The pass is being changed from A to B
        elif current_pass and old_pass and current_pass != old_pass:
            self.use_gate_pass(current_pass)
            self.release_gate_pass(old_pass) # Make the old one available again
        
        # Case 3: The pass is being removed (set to blank)
        elif not current_pass and old_pass:
            self.release_gate_pass(old_pass) # Make the old one available again

    def use_gate_pass(self, gate_pass_id):
        """
        Sets a specific Gate Pass to 'Used' and stops the save if it's already taken.
        """
        if not gate_pass_id: 
            return
            
        try:
            # Load the 'Gate Pass' document
            gate_pass_doc = frappe.get_doc("Gate Pass", gate_pass_id)
            
            if gate_pass_doc.status == "Available":
                # Mark as "Used" and save.
                gate_pass_doc.status = "Used"
                gate_pass_doc.save(ignore_permissions=True) 
                
                # This save triggers your 'gate_pass.py' script,
                # which updates the 'Remaining Passes' on the book.
                # frappe.msgprint(_("Gate Pass {0} has been marked as Used.").format(gate_pass_id))
            
            elif gate_pass_doc.status == "Used":
                # The pass is already used. Stop this 'Transportation' from saving.
                frappe.throw(
                    _("<b>Gate Pass {0} has already been used.</b> Please select an 'Available' pass.")
                    .format(gate_pass_id)
                )
        
        except frappe.DoesNotExistError:
            frappe.throw(_("Gate Pass {0} not found. Please check the ID.").format(gate_pass_id))
    
    def release_gate_pass(self, gate_pass_id):
        """
        Sets a previously used Gate Pass back to 'Available'.
        """
        if not gate_pass_id: 
            return
            
        try:
            gate_pass_doc = frappe.get_doc("Gate Pass", gate_pass_id)
            
            # Only release it if it was 'Used'
            if gate_pass_doc.status == "Used": 
                gate_pass_doc.status = "Available"
                gate_pass_doc.save(ignore_permissions=True)
                
                # This save also triggers your 'gate_pass.py' script,
                # which will re-calculate 'Remaining Passes' and fix the count.
                frappe.msgprint(_("Old Gate Pass {0} released and set back to Available.").format(gate_pass_id))
                
        except Exception as e:
            # Don't stop the save, just log the error
            frappe.log_error("Could not release old gate pass", str(e))

    # ---
    # --- END OF NEW FUNCTIONS ---
    # ---

    def validate_sites(self):
        """
        Prevent From Site and To Site being the same.
        """
        if self.from_site and self.to_site and self.from_site == self.to_site:
            frappe.throw(_("From Site and To Site cannot be the same."))

    def validate_gate_pass_usage(self):
        """
        Prevent duplicate Gate Pass No and Gate Pass Book No combination.
        (This is your existing duplicate check)
        """
        if not self.gate_pass_no or not self.gate_pass_bookno:
            return

        existing_sender = frappe.db.exists("Transportation", {
            "gate_pass_bookno": self.gate_pass_bookno,
            "gate_pass_no": self.gate_pass_no,
            "name": ["!=", self.name]
        })

        if existing_sender:
            frappe.throw(
                _("The combination of Gate Pass Book '{0}' and Gate Pass No '{1}' has already been used in document {2}.")
                .format(self.gate_pass_bookno, self.gate_pass_no, existing_sender),
                title=_("Duplicate Combination")
            )

    def update_child_block_statuses(self):
        """
        MODIFIED: Now also updates the 'site' field for received blocks.
        """
        if not self.transport_item:
            return

        block_names_to_update = {
            "in_transit": [],
            "can_transit": [],
            "update_site_location": []
        }
        
        for row in self.transport_item:
            if not row.item_no:
                continue
            
            if not row.status:
                # New item, set to In Transit
                block_names_to_update["in_transit"].append(row.item_no)
                
            elif row.status == "Received":
                # Item is received, set to Can Transit
                block_names_to_update["can_transit"].append(row.item_no)
                
                # If status is "Received", add this block to the list
                # of blocks that need their site updated.
                block_names_to_update["update_site_location"].append(row.item_no)
                
            elif row.status in ["Not in this", "Send to site"]:
                # Item is not received but processed, set/keep as In Transit
                block_names_to_update["in_transit"].append(row.item_no)
        
        
        # --- Perform bulk updates for 'transportation_status' (Existing Logic) ---
        if block_names_to_update["in_transit"]:
            frappe.db.set_value(
                "Block", 
                {"name": ["in", list(set(block_names_to_update["in_transit"])) ]}, 
                "transportation_status", 
                "In Transit"
            )

        if block_names_to_update["can_transit"]:
            frappe.db.set_value(
                "Block", 
                {"name": ["in", list(set(block_names_to_update["can_transit"])) ]}, 
                "transportation_status", 
                "Can Transit"
            )
            
        # --- NEW LOGIC: Perform bulk update for 'site' ---
        # Only run if the 'to_site' field is set and we have blocks to update.
        if self.to_site and block_names_to_update["update_site_location"]:
            frappe.db.set_value(
                "Block",  # Doctype to update
                {"name": ["in", list(set(block_names_to_update["update_site_location"])) ]}, # Filters
                "site",  # Field to update
                self.to_site  # The new value
            )

    def update_parent_transportation_status(self):
        """
        Calculates the master 'status' of this Transportation doc
        based on the precise "Full Received" vs "Partially Received" logic.
        """
        if not self.transport_item:
            self.status = "Pending To Receive"
            return

        total_rows = len(self.transport_item)
        received_count = 0
        processed_count = 0

        for row in self.transport_item:
            if row.status == "Received":
                received_count += 1
                processed_count += 1
            elif row.status in ["Not in this", "Send to site"]:
                processed_count += 1
            
        if processed_count == 0:
            self.status = "Pending To Receive"
        elif processed_count < total_rows:
            self.status = "Partially Received"
        elif processed_count == total_rows:
            if received_count == total_rows:
                self.status = "Full Received"
            else:
                self.status = "Partially Received"


# ==============================================================================
# WHITELISTED FUNCTIONS (Called from Client Script)
# ==============================================================================
# (Your existing whitelisted functions are unchanged)

@frappe.whitelist()
@frappe.validate_and_sanitize_search_inputs
def get_available_gate_passes(doctype, txt, searchfield, start, page_len, filters):
    used_gate_passes = frappe.get_all(
        "Transportation",
        fields=["gate_pass_no"],
        filters={"docstatus": ["!=", 2]},
        pluck="gate_pass_no"
    )

    conditions = [
        ["gate_pass_book_no", "=", filters.get("gate_pass_bookno")],
        ["name", "not in", used_gate_passes or ['']]
    ]

    return frappe.db.get_list(
        "Gate Pass",
        fields=["name", "gate_pass_display_no"],
        filters=conditions,
        or_filters=[["name", "like", f"%{txt}%"], ["gate_pass_display_no", "like", f"%{txt}%"]],
        start=start,
        page_length=page_len,
        as_list=True,
    )

@frappe.whitelist()
@frappe.validate_and_sanitize_search_inputs
def get_available_gate_pass_books(doctype, txt, searchfield, start, page_len, filters):
    used_passes = frappe.get_all(
        "Transportation",
        fields=["gate_pass_no"],
        filters={"docstatus": ["!=", 2]},
        pluck="gate_pass_no"
    )

    available_books = frappe.get_all(
        "Gate Pass",
        fields=["gate_pass_book_no"],
        filters=[
            ["name", "not in", used_passes or ['']]
        ],
        pluck="gate_pass_book_no",
        distinct=True
    )

    book_filters = [
        ["name", "in", available_books or ['']],
        ["name", "like", f"%{txt}%"]
    ]

    # --- THIS IS THE FIX ---
    # This line applies the 'assigned_to' filter that your client script sends.
    if filters and filters.get('assigned_to'):
        book_filters.append(["assigned_to", "=", filters.get('assigned_to')])
    # --- END OF FIX ---

    return frappe.db.get_list(
        "Gate Pass Book",
        fields=["name"],
        filters=book_filters,
        start=start,
        page_length=page_len,
        as_list=True,
    )

################################################################################
# WHITELISTED FUNCTIONS FOR ADDITIONAL ITEMS HANDLING
################################################################################
@frappe.whitelist()
def accept_additional_item(transportation: str, row_name: str):
    """Sender accepts an additional item:
    - Move item's site to Transportation.to_site
    - Mark row as Accepted
    - Notify receiver (and/or doc owner) via Notification Log
    """
    user_roles = frappe.get_roles()
    if "Transportation Sender" not in user_roles and "Administrator" not in user_roles:
        raise frappe.PermissionError(_("Only Transportation Sender or Administrator can accept items."))

    doc = frappe.get_doc("Transportation", transportation)

    # Find child row
    target = None
    for row in doc.additional_items:
        if row.name == row_name:
            target = row
            break

    if not target:
        frappe.throw(_("Additional item row not found."))

    # Already processed?
    if getattr(target, "decision_status", None) in ("Accepted", "Rejected"):
        frappe.throw(_("This additional item is already {0}.").format(target.decision_status))

    if not doc.to_site:
        frappe.throw(_("Please set 'To Site' on Transportation before accepting the item."))

    if not target.item_type or not target.item_number:
        frappe.throw(_("Item Type and Item Number are required on the additional item row."))

    # Load the actual item (e.g. Block)
    item_doctype = target.item_type
    item_name = target.item_number

    item_doc = frappe.get_doc(item_doctype, item_name)
    old_site = item_doc.get("site")
    item_doc.site = doc.to_site
    item_doc.save(ignore_permissions=True)

    # Mark child row as Accepted
    target.decision_status = "Accepted"
    doc.save(ignore_permissions=True)

    # Create system notification(s) for receiver side
    _notify_receiver_on_additional_item(
        doc=doc,
        target=target,
        action="accepted",
        old_site=old_site,
        new_site=doc.to_site,
    )

    frappe.msgprint(
        _("Additional item {0} has been accepted and moved from site {1} to {2}.")
        .format(item_name, old_site or "-", doc.to_site),
        alert=True,
    )

    # Return minimal info to client to update UI
    return {
        "decision_status": target.decision_status,
        "item_name": item_name,
        "new_site": doc.to_site,
    }


@frappe.whitelist()
def reject_additional_item(transportation: str, row_name: str):
    """Sender rejects an additional item:
    - Mark row as Rejected
    - Notify receiver
    """
    user_roles = frappe.get_roles()
    if "Transportation Sender" not in user_roles and "Administrator" not in user_roles:
        raise frappe.PermissionError(_("Only Transportation Sender or Administrator can reject items."))

    doc = frappe.get_doc("Transportation", transportation)

    # Find child row
    target = None
    for row in doc.additional_items:
        if row.name == row_name:
            target = row
            break

    if not target:
        frappe.throw(_("Additional item row not found."))

    if getattr(target, "decision_status", None) in ("Accepted", "Rejected"):
        frappe.throw(_("This additional item is already {0}.").format(target.decision_status))

    target.decision_status = "Rejected"
    doc.save(ignore_permissions=True)

    _notify_receiver_on_additional_item(
        doc=doc,
        target=target,
        action="rejected",
        old_site=None,
        new_site=None,
    )

    frappe.msgprint(
        _("Additional item {0} has been rejected.").format(target.item_number),
        alert=True,
    )

    return {
        "decision_status": target.decision_status,
        "item_name": target.item_number,
    }


# def _notify_receiver_on_additional_item(doc, target, action: str, old_site=None, new_site=None):
#     """Create Notification Log so receiver (and/or doc owner) sees a system notification."""
#     # Who to notify?
#     users_to_notify = set()

#     # At minimum, notify doc.owner (who likely created it)
#     if doc.owner:
#         users_to_notify.add(doc.owner)

#     # Optionally: notify all users with role "Transportation Receiver"
#     receiver_users = frappe.db.get_all(
#         "Has Role",
#         filters={"role": "Transportation Receiver"},
#         pluck="parent",
#     )
#     for u in receiver_users:
#         users_to_notify.add(u)

#     subject = _("Additional item {0} {1}").format(target.item_number, action)
#     if action == "accepted":
#         email_content = _(
#             "Additional item {0} ({1}) has been accepted in Transportation {2}. "
#             "Site changed from {3} to {4}."
#         ).format(
#             target.item_number,
#             target.item_type,
#             doc.name,
#             old_site or "-",
#             new_site or "-",
#         )
#     else:  # rejected
#         email_content = _(
#             "Additional item {0} ({1}) has been rejected in Transportation {2}."
#         ).format(
#             target.item_number,
#             target.item_type,
#             doc.name,
#         )

#     for user in users_to_notify:
#         notif = frappe.get_doc({
#             "doctype": "Notification Log",
#             "subject": subject,
#             "email_content": email_content,
#             "document_type": doc.doctype,
#             "document_name": doc.name,
#             "for_user": user,
#             "type": "Alert",
#         })
#         notif.insert(ignore_permissions=True)

def _notify_receiver_on_additional_item(doc, target, action: str, old_site=None, new_site=None):
    """Create Notification Log so receiver (and/or doc owner) sees a system notification."""
    users_to_notify = set()

    # 1) Always notify doc.owner (creator of Transportation)
    if doc.owner:
        users_to_notify.add(doc.owner)

    # 2) Optionally: notify all USERS (not role profiles) having role "Transportation Receiver"
    receiver_users = frappe.db.get_all(
        "Has Role",
        filters={
            "role": "Transportation Receiver",
            "parenttype": "User",      # <---- IMPORTANT FIX
        },
        pluck="parent",
    )
    for u in receiver_users:
        if u:
            users_to_notify.add(u)

    if not users_to_notify:
        # No users found; just bail out silently
        return

    subject = _("Additional item {0} {1}").format(target.item_number, action)

    if action == "accepted":
        email_content = _(
            "Additional item {0} ({1}) has been accepted in Transportation {2}. "
            "Site changed from {3} to {4}."
        ).format(
            target.item_number,
            target.item_type,
            doc.name,
            old_site or "-",
            new_site or "-",
        )
    else:  # rejected
        email_content = _(
            "Additional item {0} ({1}) has been rejected in Transportation {2}."
        ).format(
            target.item_number,
            target.item_type,
            doc.name,
        )

    for user in users_to_notify:
        # Extra safety: only create logs for real User records
        if not frappe.db.exists("User", user):
            continue

        notif = frappe.get_doc({
            "doctype": "Notification Log",
            "subject": subject,
            "email_content": email_content,
            "document_type": doc.doctype,
            "document_name": doc.name,
            "for_user": user,
            "type": "Alert",
        })
        notif.insert(ignore_permissions=True)


@frappe.whitelist()
def get_available_stones(project, site):
    """
    Get available stones from Size List Creation Item that:
    1. Match the project
    2. Are at the specified site (via cutting_region field in parent)
    3. Include all stones regardless of cutting_planning_id (including cut stones)
    4. Exclude stones already added to any Transportation document
    5. The parent Size List Creation is submitted OR draft (for flexibility)
    
    Note: stone_id format is like "BLOCK001-001" where first part is block number
    """
    
    # Get all stones that match the project and site (including cut stones)
    # Exclude stones that are already in any Transportation document
    stones = frappe.db.sql("""
        SELECT 
            slci.stone_id,
            slci.stone_name,
            slc.cutting_region as site,
            SUBSTRING_INDEX(slci.stone_id, '-', 1) as block_no,
            slci.cutting_planning_id
        FROM 
            `tabSize List Creation Item` slci
        INNER JOIN 
            `tabSize List Creation` slc ON slc.name = slci.parent
        WHERE 
            slc.project_name = %(project)s
            AND slc.cutting_region = %(site)s
            AND slci.stone_id IS NOT NULL
            AND slci.stone_id != ''
            AND slci.stone_id NOT IN (
                SELECT item_no 
                FROM `tabTransportation Status R` 
                WHERE item_type = 'Stone'
            )
        ORDER BY 
            slci.stone_id
    """, {
        'project': project,
        'site': site
    }, as_dict=True)
    
    return stones


################################################################################
# (Your commented-out code is unchanged)

# my_app/my_app/doctype/transportation/transportation.py
# import frappe
# from baps.api.transport_sites import get_user_sites

# def validate(doc, method=None):
#     allowed = set(get_user_sites())
#     fields_to_check = [f for f in ['site','from_site','to_site'] if getattr(doc, f, None)]
#     for f in fields_to_check:
#         if getattr(doc, f) not in allowed:
#             frappe.throw(f"Not allowed to operate on site: {getattr(doc, f)}")
###upper code is version 1(not working)
##############
# import frappe
from baps.api.transport_sites import get_user_sites

def validate(doc, method=None):
    allowed = set(get_user_sites() or [])
    fields_to_check = [f for f in ['site','from_site','to_site'] if getattr(doc, f, None)]
    for f in fields_to_check:
        if getattr(doc, f) not in allowed:
            frappe.throw(f"Not allowed to operate on site: {getattr(doc, f)}")

# ###upper code is version 2 (Not working)
# import frappe
from baps.api.transport_sites import get_user_sites

def validate(doc, method=None):
    allowed = set(get_user_sites() or [])
    for f in [f for f in ['site','from_site','to_site'] if getattr(doc, f, None)]:
        if getattr(doc, f) not in allowed:
            frappe.throw(f"Not allowed to operate on site: {getattr(doc, f)}")