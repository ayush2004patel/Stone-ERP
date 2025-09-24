# Copyright (c) 2025, Kavin Dave and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.model.naming import make_autoname
from frappe.utils import cint, flt

class CuttingPlanning(Document):
    def before_insert(self):
        # Auto-generate trial number if not set
        if not self.trial_number:
            self.trial_number = make_autoname("TRIAL-NO.-.#####")

    def validate(self):
        total = 0
        for d in self.cutting_plan_details:
            if d.l1 or d.l2 or d.b1 or d.b2 or d.h1 or d.h2:
                length_in = (cint(d.l1) * 12) + cint(d.l2)
                breadth_in = (cint(d.b1) * 12) + cint(d.b2)
                height_in = (cint(d.h1) * 12) + cint(d.h2)

                # Convert cubic inches → cubic feet
                d.volume = round((length_in * breadth_in * height_in) / 1728, 2)
                total += d.volume

        # Update total stone volume
        self.total_stone_volume = round(total, 2)

        # Safely cast block_volume
        block_volume = flt(self.block_volume)

        # Calculate wastage %
        if block_volume > 0:
            wastage = ((block_volume - total) / block_volume) * 100
            self.wastage_percentage = round(wastage, 2)
