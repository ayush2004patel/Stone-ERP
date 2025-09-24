  # Copyright (c) 2025, Dharmesh Rathod and contributors
# For license information, please see license.txt

# import frappe
# from frappe.model.document import Document


# class SizeListDetails(Document):
# 	pass

import frappe
from frappe import _
from frappe.model.document import Document

class SizeListDetails(Document):
    def validate(self):
        # Check inch fields (must be less than 12)
        if (self.l2 or 0) >= 12:
            frappe.throw(_("L2 must be less than 12 (inches). You entered {0}").format(self.l2))

        if (self.b2 or 0) >= 12:
            frappe.throw(_("B2 must be less than 12 (inches). You entered {0}").format(self.b2))

        if (self.h2 or 0) >= 12:
            frappe.throw(_("H2 must be less than 12 (inches). You entered {0}").format(self.h2))

        # Volume calculation
        l = (self.l1 or 0) + (self.l2 or 0) / 12.0
        b = (self.b1 or 0) + (self.b2 or 0) / 12.0
        h = (self.h1 or 0) + (self.h2 or 0) / 12.0

        self.volume = round(l * b * h, 3)