# Copyright (c) 2025, Ayush Patel and contributors
# For license information, please see license.txt


import frappe
from frappe.model.document import Document

class SizeListCreation(Document):
    pass


import frappe

@frappe.whitelist()
def create_size_list_items_from_range(form_number):
    """Fetch Size List rows, expand ranges, and create item rows."""
    size_list = frappe.get_doc("Size List", form_number)

    seen_codes = set()   # to track duplicates across all rows
    items = []

    for d in size_list.stone_details:
        if not d.range or not d.stone_code:
            continue

        expanded_numbers = expand_range(d.range)
        prefix = ''.join([c for c in d.stone_code if not c.isdigit()])  # AYUSH
        for num in expanded_numbers:
            code = f"{prefix}{str(num).zfill(3)}"  # → AYUSH005

            if code in seen_codes:
                continue

            seen_codes.add(code)
            items.append({
                "stone_code": code,
                "stone_name": d.stone_name,
                "l1": d.l1,
                "l2": d.l2,
                "b1": d.b1,
                "b2": d.b2,
                "h1": d.h1,
                "h2": d.h2,
                "volume": d.volume
            })

    return {
        "items": items,
        "created_count": len(items),
        "skipped_count": len(seen_codes) - len(items)
    }


def expand_range(rng):
    """Convert string like '1-10,12,15-17' → [1,2,...,10,12,15,16,17]."""
    result = []
    parts = [x.strip() for x in rng.split(",") if x.strip()]
    for part in parts:
        if "-" in part:
            start, end = part.split("-")
            result.extend(range(int(start), int(end) + 1))
        else:
            result.append(int(part))
    return result
