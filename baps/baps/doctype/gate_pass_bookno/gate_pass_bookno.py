# Copyright (c) 2025, Tirthan Shah and contributors
# For license information, please see license.txt

# # import frappe
# from frappe.model.document import Document


# class GatePassBookNo(Document):
# 	pass


import frappe
from frappe import _
from frappe.model.document import Document

class GatePassBookNo(Document):
    def after_insert(self):
        """Called after Gate Pass BookNo is created"""
        frappe.msgprint(_("Starting to create Gate Pass No records..."))
        self.create_gate_pass_numbers()

    def create_gate_pass_numbers(self):
        # Validate that page_limit is set and is a positive integer
        if not self.page_limit or self.page_limit <= 0:
            frappe.msgprint(_("Page Limit must be a positive number to create Gate Pass No records."))
            return

        # Check if records already exist for this book to prevent duplicates
        existing = frappe.db.get_all(
            "Gate Pass No",
            filters={"gate_pass_book_no": self.name},
            limit=1
        )
        if existing:
            frappe.msgprint(_("Gate Pass No records already exist for this book. Skipping creation."))
            return

        created = 0
        failed = 0

        # Create records from 1 to page_limit (inclusive)
        for i in range(1, int(self.page_limit) + 1):
            # Construct unique name: {BookNo}-{3-digit sequence}
            # Example: GPBNO-0001-001, GPBNO-0001-002, ..., GPBNO-0001-015
            name = f"{self.name}-{str(i).zfill(3)}"

            # Skip if document already exists (even in trash)
            if frappe.db.exists("Gate Pass No", name):
                frappe.log_error(
                    f"Skipped: Gate Pass No '{name}' already exists for Book: {self.name}",
                    "Gate Pass Creation Skipped"
                )
                continue

            try:
                doc = frappe.new_doc("Gate Pass No")
                doc.name = name
                doc.gate_pass_no = str(i)  # e.g., "1", "2", ..., "15"
                doc.gate_pass_book_no = self.name  # Link to parent book
                doc.insert(ignore_permissions=True)
                created += 1
            except Exception as e:
                frappe.log_error(
                    f"Error creating Gate Pass No '{name}': {str(e)} | Book: {self.name}",
                    "Gate Pass Creation Failed"
                )
                failed += 1

        frappe.msgprint(_(
            f"Gate Pass No Creation Complete: Created={created}, Failed={failed}<br>Linked to Book: <b>{self.name}</b>"
        ))