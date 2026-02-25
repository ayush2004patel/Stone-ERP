import frappe
from frappe.utils import now


def create_stone_log(
    stone_code=None,
    parent_stone=None,
    block_number=None,
    size_list=None,

    activity_type=None,
    description=None,
    remarks=None,

    old_status=None,
    new_status=None,

    reference_doctype=None,
    reference_docname=None
):
    """
    Central Stone Activity Log function
    Use this everywhere in the system
    """

    try:
        log = frappe.new_doc("Stone Activity Log")

        # ---- Stone Info ----
        log.stone_code = stone_code
        log.parent_stone = parent_stone
        log.block_number = block_number
        log.size_list = size_list

        # ---- Activity ----
        log.activity_type = activity_type
        log.description = description
        log.remarks = remarks

        # ---- Status ----
        log.old_status = old_status
        log.new_status = new_status
        log.status_changed = 1 if old_status != new_status else 0

        # ---- Reference ----
        log.reference_doctype = reference_doctype
        log.reference_docname = reference_docname

        # ---- Audit ----
        log.performed_by = frappe.session.user
        log.performed_on = now()
        log.system_generated = 1

        log.insert(ignore_permissions=True)

    except Exception:
        # logging must never break business flow
        frappe.log_error(
            title="Stone Activity Log Error",
            message=frappe.get_traceback()
        )