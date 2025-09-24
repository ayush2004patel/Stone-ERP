
# Copyright (c) 2025, Ayush and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document

class DirectCutStonePurchase(Document):
  def validate(self):
    total = 0.0
    for d in (self.stone_details or []):
      l = (d.l1 or 0) + (d.l2 or 0) / 12.0
      b = (d.b1 or 0) + (d.b2 or 0) / 12.0
      h = (d.h1 or 0) + (d.h2 or 0) / 12.0

      d.volume = round(l * b * h, 3)
      total += d.volume

    for fieldname in [f.fieldname for f in self.meta.get("fields")]:
      self.total_volume = round(total, 3)
