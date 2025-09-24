# inspection.py:-       # Copyright (c) 2025, Ayush and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document

class Inspection(Document):
    pass


def validate(doc, method):
    if not doc.block_selection:
        frappe.throw(_("Block Selection is mandatory"))
    if not doc.region:
        frappe.throw(_("Region is mandatory"))
    if not doc.table_uehl:
        frappe.throw(_("At least one Inspection Detail is required"))

    for d in doc.table_uehl:  # Block Selection Detail rows
        L = (d.l1 or 0) * 12 + (d.l2 or 0)
        B = (d.b1 or 0) * 12 + (d.b2 or 0)
        H = (d.h1 or 0) * 12 + (d.h2 or 0)

        d.volume = round((L * B * H) / 1728, 3)



# inspection server-side safety: sync from Transportation Sender -> Block Selection children

    def validate(self):
        # Try both transport fieldnames
        transport = self.get("transport_reference") or self.get("transport_ref")
        if transport:
            try:
                sender = frappe.get_doc("Transportation Sender", transport)
            except Exception:
                sender = None

            if sender and sender.get("block_selection"):
                self.block_selection = sender.block_selection

                # find which child table field exists on Inspection
                fieldnames = [f.get("fieldname") for f in (self.meta.get("fields") or [])]

                child_field = None
                if "table_uehl" in fieldnames:
                    child_field = "table_uehl"
                elif "inspection_details" in fieldnames:
                    child_field = "inspection_details"
                elif "inspection_detail" in fieldnames:
                    child_field = "inspection_detail"

                if child_field:
                    # clear existing child rows
                    self.set(child_field, [])
                    # fetch Block Selection doc and append rows
                    try:
                        block_doc = frappe.get_doc("Block Selection", sender.block_selection)
                        for r in (block_doc.block_selection_details or []):
                            self.append(child_field, {
                                "block_number": r.get("block_number"),
                                "block_custom_code": r.get("block_custom_code"),
                                "colour": r.get("colour"),
                                "grain": r.get("grain"),
                                "l1": r.get("l1"),
                                "l2": r.get("l2"),
                                "b1": r.get("b1"),
                                "b2": r.get("b2"),
                                "h1": r.get("h1"),
                                "h2": r.get("h2")
                            })
                    except Exception:
                        frappe.log_error(f"Failed to copy Block Selection details for {sender.block_selection}")