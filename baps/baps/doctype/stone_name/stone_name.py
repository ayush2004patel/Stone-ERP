# Copyright (c) 2025, Tirthan Shah and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class StoneName(Document):
	pass







import frappe
from frappe.model.document import Document

class StoneName(Document):
    def autoname(self):
        self.stone_code = self.generate_stone_code()
        self.name = self.stone_code  

    def generate_stone_code(self):
        def abbrev_main_part(text):
            if not text:
                return ""
            words = text.split()
            if words[0].lower() == "ground":
                return "B" + words[-1][0].upper()  # Ground Floor = BM
            return words[0][0].upper() + words[-1][0].upper()  # First Floor Column = FC

        def abbrev_sub_part(text):
            if not text:
                return ""
            if text.lower().startswith("type "):
                return text.replace("Type ", "").upper()  # keep numbers too (A6)
            return text[:3].upper()  # Kharo -> KHR, Kumbho -> KMR

        def abbrev_stone_name(text):
            if not text:
                return ""
            words = text.split()
            if len(words) == 1:
                return text[:2].upper()  # single word = first 2 chars
            return "".join([w[0].upper() if not w.isdigit() else w for w in words])  # Layer 1 -> L1, Pillar Theko -> PT

        main_code = abbrev_main_part(self.main_part)
        sub_code = abbrev_sub_part(self.sub_part)
        stone_code = abbrev_stone_name(self.stone_name)

        return (main_code + sub_code + stone_code).upper()

    def before_save(self):
        if self.stone_name and self.stone_code:
            self.stone_display = f"{self.stone_name} ({self.stone_code})"
        elif self.stone_name:
            self.stone_display = self.stone_name
        else:
            self.stone_display = ""