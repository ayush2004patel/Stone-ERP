import frappe
from frappe.auth import LoginManager
from frappe.utils import today, getdate

@frappe.whitelist(allow_guest=True)
def login_with_permissions1(usr, pwd):
    """Custom login API with permissions info"""
    # Step 1: Authenticate user
    login_manager = LoginManager()
    try:
        login_manager.authenticate(usr, pwd)
        login_manager.post_login()
    except frappe.AuthenticationError:
        frappe.clear_messages()
        return {"status": "error", "message": "Invalid username or password"}

    user = frappe.get_doc("User", usr)
    
    # Check for active proxy user
    proxy_info = check_active_proxy(usr)

    # Step 2: Get roles and filter out unwanted default roles
    default_roles_to_exclude = {"All", "Guest", "Desk User"}
    roles = frappe.get_roles(usr)
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

    # Step 3: Get all modules
    all_modules = frappe.get_all("Module Def", fields=["name" ], order_by="name asc")
    all_module_names = {m.name for m in all_modules}

    # Step 4: Get blocked modules from user's settings
    blocked_modules = {row.module for row in user.block_modules}

    # Step 5: Active modules = all modules - blocked modules
    active_modules = sorted(all_module_names - blocked_modules)

    # Step 6: Fetch doctype permissions using filtered roles
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

    # Filter doctypes to only those in active modules
    if active_modules:
        doctypes_in_active_modules = frappe.get_all(
            "DocType",
            filters={"module": ["in", active_modules]},
            pluck="name"
        )
        doctype_permissions = [
            perm for perm in doctype_permissions
            if perm.doctype in doctypes_in_active_modules
        ]

    response_data = {
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
    
    # Add proxy information if active proxy exists
    if proxy_info:
        response_data["proxy"] = proxy_info
        response_data["message"] = f"Logged in with proxy user {proxy_info['proxy_user']} (Active from {proxy_info['from_date']} to {proxy_info['to_date']})"
    
    return response_data


def check_active_proxy(user):
    """Check if the user has an active proxy assignment"""
    current_date = today()
    
    # Get User Proxy document
    proxy_doc_name = frappe.db.get_value("User Proxy", {"user": user, "status": "Active"}, "name")
    
    if not proxy_doc_name:
        return None
    
    # Get active proxy assignments
    active_assignments = frappe.db.sql("""
        SELECT proxy_user, from_date, to_date
        FROM `tabUser Proxy Detail`
        WHERE parent = %s
        AND is_active = 1
        AND %s BETWEEN from_date AND to_date
        ORDER BY from_date DESC
        LIMIT 1
    """, (proxy_doc_name, current_date), as_dict=True)
    
    if active_assignments:
        return {
            "proxy_user": active_assignments[0].proxy_user,
            "from_date": str(active_assignments[0].from_date),
            "to_date": str(active_assignments[0].to_date),
            "is_proxy_active": True
        }
    
    return None


# call this way
#  const module_API_ROUTE = `/api/method/baps.api.login_api.login_with_permissions?usr=Administrator&pwd=12345`;