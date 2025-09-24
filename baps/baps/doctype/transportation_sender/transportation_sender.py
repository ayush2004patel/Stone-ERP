
import frappe
import json
from frappe import _
from frappe.model.document import Document

class TransportationSender(Document):
    def validate(self):
        self.validate_gate_pass_no_usage()

    def validate_gate_pass_no_usage(self):
        if not self.gate_pass_no:
            return

        # Check if this Gate Pass No is already used in any submitted Transportation Sender (excluding self)
        existing_sender = frappe.db.exists(
            "Transportation Sender",
            {
                "gate_pass_no": self.gate_pass_no,
                "name": ["!=", self.name],
                "docstatus": 1
            }
        )

        if existing_sender:
            frappe.throw(
                _("Gate Pass No {0} is already used in Transportation Sender {1}. Please select a different one.").format(
                    self.gate_pass_no, existing_sender
                )
            )

        # Check if used in any submitted Transportation Receiver
        existing_receiver = frappe.db.exists(
            "Transportation Receiver",
            {
                "gate_pass_no": self.gate_pass_no,
                "docstatus": 1
            }
        )

        if existing_receiver:
            frappe.throw(
                _("Gate Pass No {0} is already used in Transportation Receiver {1}. Please select a different one.").format(
                    self.gate_pass_no, existing_receiver
                )
            )

@frappe.whitelist()
def get_blocks_for_project(project):
    block_numbers = []
    block_selections = frappe.get_all("Block Selection", filters={"baps_project": project}, fields=["name"])
    for bs in block_selections:
        details = frappe.get_all("Block Selection Detail", filters={"parent": bs.name}, fields=["block_number"])
        for d in details:
            if d.block_number:
                block_numbers.append({"block_number": d.block_number})

    # Deduplicate
    seen = set()
    unique_blocks = []
    for block in block_numbers:
        if block["block_number"] not in seen:
            seen.add(block["block_number"])
            unique_blocks.append(block)

    return unique_blocks

@frappe.whitelist()
def add_blocks_to_table(sender_name, blocks):
    if isinstance(blocks, str):
        try:
            blocks = json.loads(blocks)
        except json.JSONDecodeError:
            frappe.throw(_("Invalid format for blocks. Expected a valid JSON list."))

    if not isinstance(blocks, list):
        frappe.throw(_("Blocks must be a list of block data."))

    doc = frappe.get_doc("Transportation Sender", sender_name)
    existing = [row.block_number for row in doc.transport_material_type]

    added_count = 0
    for block_data in blocks:
        block_num = block_data.get("block_number")
        if not block_num or block_num in existing:
            continue

        doc.append("transport_material_type", {
            "project": block_data.get("project"),
            "material_type": block_data.get("material_type"),
            "block_number": block_num,
            "material_number": block_num
        })
        added_count += 1

    doc.save(ignore_permissions=True)
    frappe.msgprint(_(f"{added_count} block(s) added to material table."))