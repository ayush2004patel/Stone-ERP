# Copyright (c) 2025, Ayush Patel and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class RepaymentRecord(Document):
    def validate(self):
        loan_status = frappe.db.get_value("Loan Application", self.loan_application, "status")
        if loan_status != "Approved":
            frappe.throw("Repayment records should only allow entry if application is approved")
