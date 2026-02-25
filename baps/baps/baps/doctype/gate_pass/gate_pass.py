# Copyright (c) 2025, Dharmesh Rathod and contributors
# For license information, please see license.txt

# import frappe
# from frappe.model.document import Document


# class GatePass(Document):
# 	pass


############################################################
import frappe
from frappe.model.document import Document

class GatePass(Document):
    """Controller for the Gate Pass (Page) DocType"""

    def on_change(self):
        """
        This hook runs whenever the page is saved.
        """
        # We only care if the 'status' field has changed
        if self.has_value_changed("status"):
            self.update_parent_book_status()

    def update_parent_book_status(self):
        """
        When a pass is marked 'Used' (or 'Spoiled'):
        1. Recalculate and set the parent book's 'remaining_passes'.
        2. Set the parent book's 'status' to 'Finished' if 0.
        """
        
        # Only run if the status is changing TO 'Used'
        if self.status == "Used": 
            try:
                # 1. Load the parent 'Gate Pass Book' document
                parent_book = frappe.get_doc("Gate Pass Book", self.gate_pass_book_no) 
                
                # 2. Count how many passes are still "Available"
                # This is the most accurate way to get the remaining count
                available_passes = frappe.db.count("Gate Pass", {
                    "gate_pass_book_no": self.gate_pass_book_no,
                    "status": "Available"
                })
                
                # 3. Update the parent book's 'remaining_passes' field
                parent_book.remaining_passes = available_passes
                
                # 4. If no passes are 'Available', the book is finished
                if available_passes == 0:
                    parent_book.status = "Finished"
                else:
                    # If we used a pass but more are left, ensure status is 'Available'
                    parent_book.status = "Available" 
                
                # 5. Save the changes to the parent book
                parent_book.save(ignore_permissions=True) 

            except frappe.DoesNotExistError:
                frappe.log_error(f"Parent book {self.gate_pass_book_no} not found.", "Gate Pass Logic")