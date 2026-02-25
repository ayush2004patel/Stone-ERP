# Copyright (c) 2025, Dharmesh Rathod and contributors
# For license information, please see license.txt

import frappe  # 👈 Uncommented and used
from frappe.model.document import Document
import re  # 👈 Added for validation


class TradePartner(Document):
    def validate(self):
        """Validate trade_partner_code: exactly 3 uppercase letters."""
        self.validate_trade_partner_code()

    def validate_trade_partner_code(self):
        if not self.trade_partner_code:
            frappe.throw("Trade Partner Code is mandatory.")
        
        # Normalize: trim and uppercase
        self.trade_partner_code = self.trade_partner_code.strip().upper()
        
        # Must be exactly 3 uppercase letters (A-Z only)
        if not re.match(r"^[A-Z]{3}$", self.trade_partner_code):
            frappe.throw("Trade Partner Code must be exactly 3 uppercase letters (e.g. ABC).")