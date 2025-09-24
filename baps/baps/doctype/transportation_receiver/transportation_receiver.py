
import frappe
from frappe import _
from frappe.model.document import Document

class TransportationReceiver(Document):
    def validate(self):
        self.validate_gate_pass_no_usage()

    def validate_gate_pass_no_usage(self):
        if not self.gate_pass_no:
            return

        # Check if this Gate Pass No is already used in any submitted Transportation Receiver (excluding self)
        existing_receiver = frappe.db.exists(
            "Transportation Receiver",
            {
                "gate_pass_no": self.gate_pass_no,
                "name": ["!=", self.name],
                "docstatus": 1
            }
        )

        if existing_receiver:
            frappe.throw(
                _("Gate Pass No {0} is already used in Transportation Receiver {1}. Please select a different one.").format(
                    self.gate_pass_no, existing_receiver
                )
            )

        # Check if used in any submitted Transportation Sender
        existing_sender = frappe.db.exists(
            "Transportation Sender",
            {
                "gate_pass_no": self.gate_pass_no,
                "docstatus": 1
            }
        )

        if existing_sender:
            frappe.throw(
                _("Gate Pass No {0} is already used in Transportation Sender {1}. Please select a different one.").format(
                    self.gate_pass_no, existing_sender
                )
            )