


import frappe
from frappe import _
from frappe.model.document import Document


class BlockSelection(Document):
    
    def validate(self):
        """Ensure parent fields, block numbering, volume calculation, and validation before saving."""
        # Validate parent fields
        if not self.baps_project or not self.trade_partner:
            frappe.throw("Please select both Project and Trade Partner before saving.")

        project_code = frappe.db.get_value("Baps Project", self.baps_project, "project_code")
        trade_code = frappe.db.get_value("Trade Partner", self.trade_partner, "trade_partner_code")

        if not project_code or not trade_code:
            frappe.throw("Project or Trade Partner code missing — please save them first.")

        # >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
        # NEW: Validate block number format (9 chars: 5-letter prefix + 4 digits)
        # >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
        self.validate_block_number_format()
        # <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

        # >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
        # Validate block number uniqueness
        # >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
        self.validate_block_number_uniqueness()
        # <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

        # Process child table rows (NO auto-generation of block_number)
        total = 0.0
        for idx, row in enumerate(self.block_selection_details or [], 1):
            # ⚠️ REMOVED: Do NOT auto-generate block_number
            # User must enter full 9-digit code manually

            # Calculate volume (ft + inch conversion)
            l = (row.l1 or 0) + (row.l2 or 0) / 12.0
            b = (row.b1 or 0) + (row.b2 or 0) / 12.0
            h = (row.h1 or 0) + (row.h2 or 0) / 12.0
            row.volume = round(l * b * h, 3)

            # Validate volume is positive
            if not row.volume or row.volume <= 0:
                frappe.throw(
                    f'Block "{row.block_number or idx}" has 0 or invalid volume. '
                    'Please enter valid L, B, and H values before saving.'
                )

            total += row.volume

        # Set total volume on parent if field exists
        if hasattr(self, 'total_volume'):
            self.total_volume = round(total, 3)

    def validate_block_number_format(self):
        """Validate block_number is exactly 9 chars: [5-letter prefix][4 digits]"""
        # Get expected prefix from linked documents
        project_code = frappe.db.get_value("Baps Project", self.baps_project, "project_code") or ""
        trade_code = frappe.db.get_value("Trade Partner", self.trade_partner, "trade_partner_code") or ""
        expected_prefix = (project_code + trade_code).upper()

        for row in (self.block_selection_details or []):
            bn = (row.block_number or "").strip()
            
            # 1. Mandatory
            if not bn:
                frappe.throw(_("Row #{0}: Block Number is mandatory.").format(row.idx))
            
            # 2. Must be 9 characters
            if len(bn) != 9:
                frappe.throw(_("Row #{0}: Block Number must be exactly 9 characters long.").format(row.idx))
            
            # 3. Must start with correct prefix
            if not bn.upper().startswith(expected_prefix):
                frappe.throw(
                    _("Row #{0}: Block Number must start with '{1}'.").format(row.idx, expected_prefix)
                )
            
            # 4. Last 4 must be digits
            if not bn[-4:].isdigit():
                frappe.throw(_("Row #{0}: Last 4 characters must be digits (e.g., 0001).").format(row.idx))

    def validate_block_number_uniqueness(self):
        """Prevent duplicate block numbers within form and against existing Block records — but allow updates to existing ones."""
        block_numbers = set()
        duplicates_in_form = []

        # 1. Check duplicates within the current form
        for row in (self.block_selection_details or []):
            if row.block_number:
                bn = row.block_number.strip().upper()
                if bn:
                    if bn in block_numbers:
                        duplicates_in_form.append(bn)
                    else:
                        block_numbers.add(bn)

        if duplicates_in_form:
            frappe.throw(
                _("Duplicate block numbers in this form: {0}").format(
                    ", ".join(sorted(set(duplicates_in_form)))
                ),
                title=_("Duplicate in Form")
            )

        if not block_numbers:
            return

        # 2. Only check against existing 'Block' records if this is a NEW document (never saved before)
        if not self.name:  # self.name is None/empty only on first save
            existing_blocks = frappe.db.get_all(
                "Block",
                filters={"block_number": ["in", list(block_numbers)]},
                pluck="block_number"
            )

            existing_set = set(existing_blocks)
            duplicates_in_db = block_numbers & existing_set

            if duplicates_in_db:
                frappe.throw(
                    _("The following block numbers already exist in the system and cannot be reused:<br><br>{}").format(
                        "<br>".join([f"<b>{bn}</b>" for bn in sorted(duplicates_in_db)])
                    ),
                    title=_("Block Number Already Exists")
                )

    def on_update(self):
        """Sync (create or update) Block documents from Block Selection child rows."""
        self.sync_blocks_from_details()

    def on_update_after_submit(self):
        """Mark linked Block Stone Receipt Items as 'Selected'."""
        for d in (self.block_selection_details or []):
            frappe.db.set_value("Block Stone Receipt Item", d.block_number, "block_status", "Selected")

    def sync_blocks_from_details(self):
        """Create or update Block docs from Block Selection child rows using block_number as key."""
        if not self.block_selection_details:
            return

        for row in self.block_selection_details:
            if not row.block_number:
                continue

            # Check if Block already exists by block_number
            existing_block_name = frappe.db.exists("Block", {"block_number": row.block_number})

            block_data = {
                "date": self.date,
                "baps_project": self.baps_project,
                "project_name": self.project_name,
                "trade_partner": self.trade_partner,
                "party": self.party,
                "material_type": self.material_type,
                "status": "Ready for Inspection",
                "color": getattr(row, 'color', None),
                "grain": getattr(row, 'grain', None),
                "site": self.site,
                "region": self.region,
                "l1": getattr(row, 'l1', None),
                "l2": getattr(row, 'l2', None),
                "b1": getattr(row, 'b1', None),
                "b2": getattr(row, 'b2', None),
                "h1": getattr(row, 'h1', None),
                "h2": getattr(row, 'h2', None),
                "wt": getattr(row, 'wt', None),
                "volume": getattr(row, 'volume', None),
                "block_custom_code": getattr(row, 'block_custom_code', None)
            }

            if existing_block_name:
                # ✅ UPDATE existing Block
                block_doc = frappe.get_doc("Block", existing_block_name)
                for field, value in block_data.items():
                    setattr(block_doc, field, value)
                block_doc.save(ignore_permissions=True, ignore_version=True)
                frappe.msgprint(f"✅ Dimensions updated for Block <b>{row.block_number}</b>", alert=True)
            else:
                # ➕ CREATE new Block
                block_doc = frappe.get_doc({
                    "doctype": "Block",
                    "block_number": row.block_number,
                    **block_data
                })
                block_doc.insert(ignore_permissions=True)

    # >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
    # NEW: Auto-delete linked Block records when this form is deleted
    # >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
    def on_trash(self):
        """Delete all Block records created from this Block Selection."""
        if not self.block_selection_details:
            return

        block_numbers = [
            row.block_number for row in self.block_selection_details if row.block_number
        ]

        if not block_numbers:
            return

        # Fetch names of Block docs to delete
        blocks_to_delete = frappe.get_all(
            "Block",
            filters={"block_number": ["in", block_numbers]},
            pluck="name"
        )

        # Delete each Block
        for block_name in blocks_to_delete:
            frappe.delete_doc("Block", block_name, ignore_permissions=True)
    # <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<


@frappe.whitelist()
def get_last_block_number(trade_partner, project_name, current_docname=None):
    """Get the last generated block number for a Trade Partner + Project."""
    filters = {
        "trade_partner": trade_partner,
        "project_name": project_name,
        "docstatus": ["!=", 2]  # exclude cancelled
    }

    if current_docname:
        filters["name"] = ["!=", current_docname]

    last_block = frappe.get_all(
        "Block",
        filters=filters,
        fields=["block_number"],
        order_by="creation desc",
        limit_page_length=1
    )

    return last_block[0].block_number if last_block else None


@frappe.whitelist()
def get_next_block_number(project, trade_partner):
    """
    Return next block number for given project and trade partner.
    Called from client-side when adding a new row.
    """
    if not project or not trade_partner:
        return None

    project_code = frappe.db.get_value("Baps Project", project, "project_code")
    trade_code = frappe.db.get_value("Trade Partner", trade_partner, "trade_partner_code")

    if not project_code or not trade_code:
        return None

    prefix = f"{project_code}{trade_code}"

    last = frappe.db.sql(
        """
        SELECT block_number FROM `tabBlock Selection Detail`
        WHERE block_number LIKE %s
        ORDER BY block_number DESC
        LIMIT 1
        """,
        (f"{prefix}%",),
    )

    if last and last[0][0]:
        last_num_str = last[0][0].replace(prefix, "") or "0"
        try:
            last_num = int(last_num_str)
        except ValueError:
            last_num = 0
        next_num = last_num + 1
    else:
        next_num = 1

    return f"{prefix}{next_num:04d}"