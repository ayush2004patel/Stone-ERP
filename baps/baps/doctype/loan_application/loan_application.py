# Copyright (c) 2025, Ayush Patel and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class LoanApplication(Document):
	pass






import frappe
from frappe.model.document import Document

class LoanApplication(Document):
    def validate(self):
        self.validate_installments()
        # self.validate_guarantors()
        self.validate_collaterals()

    def validate_installments(self):
        total_installments = sum([d.amount for d in self.installments])
        if total_installments < self.loan_amount * 1.05:
            frappe.throw("Total installments must always be at least 5% more than principal (Loan Amount), ")

    # def validate_guarantors(self):
    #     names = [d.guarantor_name for d in self.guarantors]
    #     if len(names) != len(set(names)):
    #         frappe.msgprint("No guarantor name should repeat,(sirf ek hi naam aata hai kya?)")

    def validate_collaterals(self):
        if self.loan_amount > 100000:
            for c in self.collaterals:
                if c.value < (self.loan_amount / 2):
                    frappe.throw(f"Collateral value '{c.value}' cannot be less than half of principle (Loan Amount).")

