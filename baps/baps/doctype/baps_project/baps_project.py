# Copyright (c) 2025, Dharmesh Rathod and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

# Default process → sub-process mapping
PROCESS_MAP = {
    # "Carving": [
    #     "Nakashikam",
    #     "Additional Nakashikam",
    #     "Roopkam",
    #     "Additional Roopkam",
    #     "Machining"
    # ],
    # "Cutting": [
    #     "Cutting"
    # ],
    # "Fixing": [
    #     "Dry Fixing",
    #     "Final Fixing"
    # ],
    # "Packing": [
    #     "Packing"
    # ],
    # "Polishing": [
    #     "Polishing"
    # ],
    # "Shipping": [
    #     "Shipping"
    # ],
    # "Machining": [
    #     "Roughing",
    #     "Finishing"
    # ]
}

class BapsProject(Document):
    def after_insert(self):
        """
        Auto-populate process_details child table right after a new
        Baps Project document is created (inserted).
        """
        # Avoid double-populating (defensive) — only populate if empty
        if self.get("process_details"):
            return

        for process, sub_processes in PROCESS_MAP.items():
            for sub in sub_processes:
                self.append("process_details", {
                    "process": process,
                    "sub_process": sub,
                    "completed": 0
                })

        # Save changes (only updates the existing doc)
        self.save(ignore_permissions=True)