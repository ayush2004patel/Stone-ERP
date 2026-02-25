import frappe
from frappe.model.document import Document

class StoneName(Document):

    def autoname(self):
        # keep the document name as stone_name (because Autoname = field:stone_name in DocType)
        pass  
    
    # def validate(self):
    #     """Validate uniqueness constraints"""
    #     # Only validate the full combination - this is the actual unique constraint
    #     self.validate_full_combination_uniqueness()
    
    # def validate_full_combination_uniqueness(self):
    #     """Ensure Main Part + Sub Part + Stone Name combination is unique"""
    #     if not self.main_part or not self.sub_part or not self.stone_name:
    #         frappe.throw("Main Part, Sub Part, and Stone Name are all required.")
    #         return
        
    #     # Check if another Stone Name document exists with the same full combination
    #     filters = {
    #         "main_part": self.main_part,
    #         "sub_part": self.sub_part,
    #         "stone_name": self.stone_name,
    #         "name": ["!=", self.name] if not self.is_new() else None  # Exclude current document if editing
    #     }
        
    #     # Remove None values from filters
    #     filters = {k: v for k, v in filters.items() if v is not None}
        
    #     existing = frappe.db.get_value("Stone Name", filters, "name")
    #     if existing:
    #         frappe.throw(
    #             f"Duplicate Entry: The combination of Main Part '{self.main_part}', "
    #             f"Sub Part '{self.sub_part}', and Stone Name '{self.stone_name}' already exists "
    #             f"in record '{existing}'. This combination must be unique."
    #         )  


