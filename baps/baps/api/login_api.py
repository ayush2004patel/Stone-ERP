# import frappe


# def format_route(name: str) -> str:
#     """Format workspace name into clean route: lowercase, spaces → dashes"""
#     return name.strip().lower().replace(" ", "-")


# @frappe.whitelist(allow_guest=True)
# def login_with_permissions():
#     """Return current session user's roles and active workspaces (modules) with icons & routes"""

#     usr = frappe.session.user
#     if usr in ("Guest", None):
#         return {"status": "error", "message": "Not logged in"}

#     user = frappe.get_doc("User", usr)

#     default_roles_to_exclude = {"All", "Guest", "Desk User"}
#     roles = frappe.get_roles(usr)
#     filtered_roles = [role for role in roles if role not in default_roles_to_exclude]

#     if not filtered_roles:
#         return {
#             "status": "success",
#             "user": {
#                 "id": user.name,
#                 "full_name": user.full_name,
#                 "email": user.email,
#                 "roles": []
#             },
#             "modules": []
#         }

#     # 🔑 Fetch public workspaces (visible in sidebar)
#     workspaces = frappe.get_all(
#         "Workspace",
#         fields=["name", "label", "icon", "parent_page", "public"],
#           filters={
#         "public": 1,
#         "parent_page": ["is", "not set"]   # only fetch parents
#     },
#         order_by="label asc",
#         # ignore_permissions=True
#     )

#     active_modules = []
#     for ws in workspaces:
#         active_modules.append({
#             "name": ws.name,
#             "label": ws.label,
#             "icon": ws.icon or "cube",   # return just icon key
#             "route": f"/{format_route(ws.name)}"
#         })

#     return {
#         "status": "success",
#         "user": {
#             "id": user.name,
#             "full_name": user.full_name,
#             "email": user.email,
#             "roles": filtered_roles
#         },
#         "modules": active_modules
#     }


# role shows


# shows our modules.page
import frappe


def format_route(name: str) -> str:
    """Format workspace name into clean route: lowercase, spaces → dashes"""
    return name.strip().lower().replace(" ", "-")


@frappe.whitelist(allow_guest=True)
def login_with_permissions():
    """Return current session user's roles and accessible workspaces (including child pages)"""
    
    usr = frappe.session.user
    if usr in ("Guest", None):
        return {"status": "error", "message": "Not logged in"}

    user = frappe.get_doc("User", usr)

    # ✅ Filter out default roles
    default_roles_to_exclude = {"All", "Guest", "Desk User"}
    user_roles = set(frappe.get_roles(usr)) - default_roles_to_exclude

    # ✅ Get blocked modules (from user settings)
    blocked_modules = {bm.module for bm in (user.block_modules or [])}

    # ✅ Get all modules from Module Def
    all_modules = {m.name for m in frappe.get_all("Module Def", fields=["name"])}

    # ✅ Allowed modules = all - blocked
    allowed_modules = all_modules - blocked_modules

    # 🔑 Fetch ALL workspaces (including child pages) in allowed modules
    workspace_list = frappe.get_all(
        "Workspace",
        fields=["name", "label", "icon", "module", "parent_page"],
        filters={
            "module": ["in", list(allowed_modules)],
        },
        order_by="module, label asc",
    )

    active_modules = []

    for ws in workspace_list:
        # Double-check module is still allowed
        if ws.module not in allowed_modules:
            continue

        try:
            doc = frappe.get_doc("Workspace", ws.name)
        except frappe.DoesNotExistError:
            continue

        # Get roles assigned to this workspace
        ws_roles = {r.role for r in doc.roles}

        # ✅ Allow if:
        # - No roles set (public), OR
        # - User has at least one role in the workspace's allowed roles
        if not ws_roles or (user_roles & ws_roles):
            active_modules.append({
                "name": ws.name,
                "label": ws.label,
                "icon": ws.icon or "box",  # Fallback icon
                "route": f"/app/{format_route(ws.name)}",  # Standard Frappe route
                "module": ws.module,
                "parent_page": ws.parent_page,  # Useful for UI nesting
            })

    # ✅ Sort by module, then by label
    active_modules.sort(key=lambda x: (x["module"], x["label"]))

    return {
        "status": "success",
        "user": {
            "id": user.name,
            "full_name": user.full_name,
            "email": user.email,
            "roles": list(user_roles),
            "allowed_modules": list(allowed_modules),
        },
        "modules": active_modules,
    }
# ======================== 