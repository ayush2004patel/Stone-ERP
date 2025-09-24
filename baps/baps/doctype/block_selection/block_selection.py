# # Copyright (c) 2025, Dharmesh Rathod and contributors
# # For license information, please see license.txt




# import frappe
# from frappe.model.document import Document


# class BlockSelection(Document):
# 	pass



# class BlockSelection(Document):
#     # def autoname(self):
#     #     self.name = frappe.db.get_next_sequence_val('BKSL')
#     #     if self.name:
#     #         self.name = f"BKSL-{int(self.name):04d}"

#     def validate(self):
#         # if not self.date:
#         #     frappe.throw(_("Date is mandatory"))
#         # if not self.trade_partner:
#         #     frappe.throw(_("Trade Partner is mandatory"))
#         # if not self.region:
#         #     frappe.throw(_("Region is mandatory"))
#         # if not self.block_selection_details:
#         #     frappe.throw(_("At least one block must be selected"))

#         # Prevent edit after processing
#         before = self.get_doc_before_save()
#         if before:
#             if hasattr(before, "trade_partner_site") and before.trade_partner_site:
#                 if self.trade_partner_site != before.trade_partner_site:
#                     frappe.throw(_("Trade Partner Site cannot be changed after first save"))
#             if hasattr(before, "party") and before.party:
#                 if self.party != before.party:
#                     frappe.throw(_("Party cannot be changed after first save"))
#             if hasattr(before, "date") and before.date:
#                 if self.date != before.date:
#                     frappe.throw(_("Date cannot be changed after first save"))


#         total = 0.0
#         for d in (self.block_selection_details or []):
#             l = (d.l1 or 0) + (d.l2 or 0) / 12.0
#             b = (d.b1 or 0) + (d.b2 or 0) / 12.0
#             h = (d.h1 or 0) + (d.h2 or 0) / 12.0
#             d.volume = round(l * b * h, 3)
#             total += d.volume

#         # If you later add a parent field called 'total_volume' in Block Selection, this will populate it.
#         for fieldname in [f.fieldname for f in self.meta.get("fields")]:
#             self.total_volume = round(total, 3)

#     def on_update_after_submit(self):
#         for d in (self.block_selection_details or []):
#             frappe.db.set_value("Block Stone Receipt Item", d.block_number, "block_status", "Selected")

#     def on_trash(self):
#         if frappe.db.exists("Inspection", {"block_selection": self.name}) or \
#            frappe.db.exists("Transportation Sender", {"block_selection": self.name}) or \
#            frappe.db.exists("Billing Type", {"block_procurement_items.block_number": ["in", [d.block_number for d in (self.block_selection_details or [])]]}):
#             frappe.throw(_("Cannot delete: block is already inspected, transported, or billed"))

#     def validate(self):
#         """Ensure numbering is consistent before saving"""
#         seq = 1
#         for row in self.block_selection_details:
#             if not row.block_number:
#                 row.block_number = str(seq).zfill(3)

#             if not row.block_custom_code:
#                 project_code = (self.baps_project or "")[:3].upper()
#                 party_code = (self.party or "")[:3].upper()
#                 row.block_custom_code = f"{project_code}{party_code}{str(seq).zfill(3)}"

#             seq += 1





# Copyright (c) 2025, Ayush and contributors
# For license information, please see license.txt

# Copyright (c) 2025, Ayush and contributors
# For license information, please see license.txt





import frappe
from frappe.model.document import Document


class BlockSelection(Document):
	pass



class BlockSelection(Document):
    # def autoname(self):
    #     self.name = frappe.db.get_next_sequence_val('BKSL')
    #     if self.name:
    #         self.name = f"BKSL-{int(self.name):04d}"

    def validate(self):
        # if not self.date:
        #     frappe.throw(_("Date is mandatory"))
        # if not self.trade_partner:
        #     frappe.throw(_("Trade Partner is mandatory"))
        # if not self.region:
        #     frappe.throw(_("Region is mandatory"))
        # if not self.block_selection_details:
        #     frappe.throw(_("At least one block must be selected"))

        # Prevent edit after processing
        before = self.get_doc_before_save()
        if before:
            if hasattr(before, "trade_partner_site") and before.trade_partner_site:
                if self.trade_partner_site != before.trade_partner_site:
                    frappe.throw(_("Trade Partner Site cannot be changed after first save"))
            if hasattr(before, "party") and before.party:
                if self.party != before.party:
                    frappe.throw(_("Party cannot be changed after first save"))
            if hasattr(before, "date") and before.date:
                if self.date != before.date:
                    frappe.throw(_("Date cannot be changed after first save"))


        total = 0.0
        for d in (self.block_selection_details or []):
            l = (d.l1 or 0) + (d.l2 or 0) / 12.0
            b = (d.b1 or 0) + (d.b2 or 0) / 12.0
            h = (d.h1 or 0) + (d.h2 or 0) / 12.0
            d.volume = round(l * b * h, 3)
            total += d.volume

        # If you later add a parent field called 'total_volume' in Block Selection, this will populate it.
        for fieldname in [f.fieldname for f in self.meta.get("fields")]:
            self.total_volume = round(total, 3)

    def on_update_after_submit(self):
        for d in (self.block_selection_details or []):
            frappe.db.set_value("Block Stone Receipt Item", d.block_number, "block_status", "Selected")

    def on_trash(self):
        if frappe.db.exists("Inspection", {"block_selection": self.name}) or \
           frappe.db.exists("Transportation Sender", {"block_selection": self.name}) or \
           frappe.db.exists("Billing Type", {"block_procurement_items.block_number": ["in", [d.block_number for d in (self.block_selection_details or [])]]}):
            frappe.throw(_("Cannot delete: block is already inspected, transported, or billed"))

    def validate(self):
        """Ensure numbering is consistent before saving"""
        seq = 1
        for row in self.block_selection_details:
            if not row.block_number:
                row.block_number = str(seq).zfill(3)

            if not row.block_custom_code:
                project_code = (self.baps_project or "")[:3].upper()
                party_code = (self.party or "")[:3].upper()
                row.block_custom_code = f"{project_code}{party_code}{str(seq).zfill(3)}"

            seq += 1