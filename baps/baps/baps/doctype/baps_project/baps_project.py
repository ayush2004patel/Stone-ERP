import frappe
from frappe.model.document import Document
import re  # 👈 Added for validation

# Keep your existing PROCESS_MAP (fill in your actual processes)
PROCESS_MAP = {
    # Example:
    # "Planning": ["Site Survey", "Design Approval"],
    # "Construction": ["Foundation", "Structure", "Finishing"]
}

class BapsProject(Document):
    def validate(self):
        """Validate project_code format: exactly 2 uppercase letters."""
        self.validate_project_code()

    def validate_project_code(self):
        if not self.project_code:
            frappe.throw("Project Code is mandatory.")
        
        # Normalize: trim and uppercase
        self.project_code = self.project_code.strip().upper()
        
        # Must be exactly 2 uppercase letters (A-Z only)
        if not re.match(r"^[A-Z]{2}$", self.project_code):
            frappe.throw("Project Code must be exactly 2 uppercase letters (e.g.AB).")

    def after_insert(self):
        """Automatically populate process details after a new project is created."""
        if self.get("process_details"):
            return

        for process, sub_processes in PROCESS_MAP.items():
            for sub in sub_processes:
                self.append("process_details", {
                    "process": process,
                    "sub_process": sub,
                    "completed": 0
                })

        self.save(ignore_permissions=True)