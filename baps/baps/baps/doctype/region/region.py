# Copyright (c) 2025, Dharmesh Rathod and contributors
# For license information, please see license.txt

# import frappe
# from frappe.model.document import Document


# class Region(Document):
# 	pass

# import frappe
# from frappe.model.document import Document

# class Region(Document):
#     def validate(self):
#         # Update the main_site checkbox in the selected site
#         self.update_main_site_in_selected_site()
    
#     def update_main_site_in_selected_site(self):
#         """Update the main_site checkbox in the selected site to True,
#         and set other sites in the same region to False."""
        
#         if self.main_site:
#             # Get the currently selected site
#             selected_site = frappe.get_doc("Site", self.main_site)
            
#             # Only update if it's not already set
#             if not selected_site.main_site:
#                 selected_site.main_site = 1
#                 selected_site.save(ignore_permissions=True)
            
#             # Optional: Unset main_site for other sites in the same region
#             # This ensures only one main site per region
#             other_sites = frappe.get_all(
#                 "Site",
#                 filters={
#                     "name": ["!=", self.main_site],
#                     "region": self.name,
#                     "main_site": 1
#                 },
#                 pluck="name"
#             )
            
#             for site_name in other_sites:
#                 site_doc = frappe.get_doc("Site", site_name)
#                 site_doc.main_site = 0
#                 site_doc.save(ignore_permissions=True)

import frappe
from frappe.model.document import Document

class Region(Document):
    def on_update(self):
        """This runs after the document is saved"""
        self.update_main_site_in_selected_site()
    
    def update_main_site_in_selected_site(self):
        """Update the main_site checkbox in the selected site and ensure only one main site per region"""
        if self.main_site:
            # Get the currently selected site
            selected_site = frappe.get_doc("Site", self.main_site)
            
            # Only update if it's not already set
            if not selected_site.main_site:
                selected_site.main_site = 1
                selected_site.save(ignore_permissions=True)
                frappe.msgprint(f"Main Site set to {selected_site.site_name}")
            
            # Unset main_site for ALL other sites in the same region
            other_sites = frappe.get_all(
                "Site",
                filters={
                    "name": ["!=", self.main_site],
                    "region": self.name
                },
                pluck="name"
            )
            
            for site_name in other_sites:
                site_doc = frappe.get_doc("Site", site_name)
                if site_doc.main_site:  # Only update if it's currently checked
                    site_doc.main_site = 0
                    site_doc.save(ignore_permissions=True)
        else:
            # If no main site is selected, uncheck all sites in this region
            all_sites = frappe.get_all(
                "Site",
                filters={"region": self.name},
                pluck="name"
            )
            
            for site_name in all_sites:
                site_doc = frappe.get_doc("Site", site_name)
                if site_doc.main_site:
                    site_doc.main_site = 0
                    site_doc.save(ignore_permissions=True)