import frappe

@frappe.whitelist()
def get_user_permissions(user_id):
    """Get modules and doctype permissions for a specific user, respecting blocked modules and filtering default roles."""
    
    # Check if user exists
    if not frappe.db.exists("User", user_id):
        return {"status": "error", "message": f"User '{user_id}' not found"}

    # Get user doc
    user = frappe.get_doc("User", user_id)

    # Step 1: Get roles and filter out unwanted default roles
    default_roles_to_exclude = {"All", "Guest", "Desk User"}
    roles = frappe.get_roles(user_id)
    filtered_roles = [role for role in roles if role not in default_roles_to_exclude]

    if not filtered_roles:
        return {
            "status": "success",
            "user": {
                "id": user.name,
                "full_name": user.full_name,
                "email": user.email,
                "roles": []
            },
            "modules": [],
            "doctypes": []
        }

    # Step 2: Get all modules
    all_modules = frappe.get_all("Module Def", fields=["name"], order_by="name asc")
    all_module_names = {m.name for m in all_modules}

    # Step 3: Get blocked modules from user's settings
    blocked_modules = {row.module for row in user.block_modules}

    # Step 4: Active modules = all modules - blocked modules
    active_modules = sorted(all_module_names - blocked_modules)

    # Step 5: Fetch doctype permissions using filtered roles
    doctype_permissions = frappe.db.sql("""
        SELECT DISTINCT
            dp.parent AS doctype,
            dp.permlevel,
            MAX(dp.`read`) AS `read`,
            MAX(dp.`write`) AS `write`,
            MAX(dp.`create`) AS `create`,
            MAX(dp.`delete`) AS `delete`,
            MAX(dp.`submit`) AS `submit`,
            MAX(dp.`cancel`) AS `cancel`,
            MAX(dp.`amend`) AS `amend`
        FROM `tabDocPerm` dp
        WHERE dp.role IN %(roles)s
        GROUP BY dp.parent, dp.permlevel
        ORDER BY dp.parent
    """, {"roles": tuple(filtered_roles)}, as_dict=True)

    # Optional: Further filter doctypes to only those belonging to active modules
    # This ensures we don't return doctypes from blocked modules
    if active_modules:
        # Get doctypes that belong to active modules
        doctypes_in_active_modules = frappe.get_all(
            "DocType",
            filters={"module": ["in", active_modules]},
            pluck="name"
        )
        doctype_permissions = [
            perm for perm in doctype_permissions
            if perm.doctype in doctypes_in_active_modules
        ]

    return {
        "status": "success",
        "user": {
            "id": user.name,
            "full_name": user.full_name,
            "email": user.email,
            "roles": filtered_roles
        },
        "modules": active_modules,
        "doctypes": doctype_permissions
    }