import frappe
from frappe import _

@frappe.whitelist()
def get_installed_modules():
    """Return list of visible modules from Module Def"""
    return frappe.get_all("Module Def", filters={"app_name": ["!=", ""], "restrict_to_domain": ""}, fields=["module_name"])