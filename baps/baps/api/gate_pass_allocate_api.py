##############################################################
#last working code
##############################################################
# import json
# import frappe
# from frappe.desk.form import assign_to

# TRANSPORT_ROLES = [
#     "Transportation Sender",
#     "Transportation Receiver",
#     "Transportation Manager",
# ]

# @frappe.whitelist()
# def get_transportation_users():
#     """Return users that have any of the transport roles."""
#     user_ids = {
#         r.parent
#         for r in frappe.get_all(
#             "Has Role",
#             filters={"role": ["in", TRANSPORT_ROLES]},
#             fields=["parent"],
#             distinct=True,
#         )
#     }
#     if not user_ids:
#         return []

#     users = frappe.get_all(
#         "User",
#         filters={"name": ["in", list(user_ids)], "enabled": 1},
#         fields=["name", "full_name"],
#         distinct=True,
#     )
#     # exclude system users
#     users = [u for u in users if u["name"] not in ("Guest", "Administrator")]
#     return users

# @frappe.whitelist()
# def assign_gate_passes(docnames, user):
#     """Assign selected Gate Pass Book docs to a single user."""
#     if isinstance(docnames, str):
#         docnames = json.loads(docnames)

#     # simple validation: ensure user is in allowed set
#     allowed = {u["name"] for u in get_transportation_users()}
#     if user not in allowed:
#         frappe.throw("User is not allowed for transportation assignment.")

#     for name in docnames:
#         assign_to.add(
#             {
#                 "doctype": "Gate Pass Book",
#                 "name": name,
#                 "assign_to": [user],
#             }
#         )
#     return {"assigned": len(docnames)}


############################################
#last working code without ownership check
############################################
#19Nov_4:24Pm
# import json
# import frappe
# from frappe.desk.form import assign_to

# TRANSPORT_ROLES = [
#     "Transportation Sender",
#     "Transportation Receiver", 
#     "Transportation Manager",
# ]

# @frappe.whitelist()
# def get_transportation_users():
#     """Return users that have any of the transport roles."""
#     user_ids = {
#         r.parent
#         for r in frappe.get_all(
#             "Has Role",
#             filters={"role": ["in", TRANSPORT_ROLES]},
#             fields=["parent"],
#             distinct=True,
#         )
#     }
#     if not user_ids:
#         return []

#     users = frappe.get_all(
#         "User",
#         filters={"name": ["in", list(user_ids)], "enabled": 1},
#         fields=["name", "full_name"],
#         distinct=True,
#     )
#     # exclude system users
#     users = [u for u in users if u["name"] not in ("Guest", "Administrator")]
#     return users

# @frappe.whitelist()
# def assign_gate_passes(docnames, user):
#     """Assign selected Gate Pass Book docs to a single user, removing previous assignments."""
#     if isinstance(docnames, str):
#         docnames = json.loads(docnames)

#     # simple validation: ensure user is in allowed set
#     allowed = {u["name"] for u in get_transportation_users()}
#     if user not in allowed:
#         frappe.throw("User is not allowed for transportation assignment.")

#     for name in docnames:
#         # Remove all existing assignments for this document
#         existing_assignments = frappe.get_all(
#             "ToDo",
#             filters={
#                 "reference_type": "Gate Pass Book",
#                 "reference_name": name,
#                 "status": "Open"
#             },
#             fields=["name", "allocated_to"]
#         )
        
#         # Cancel all existing assignments
#         for assignment in existing_assignments:
#             # Mark existing assignment as cancelled
#             todo_doc = frappe.get_doc("ToDo", assignment.name)
#             todo_doc.status = "Cancelled"
#             todo_doc.save(ignore_permissions=True)
        
#         # Create new assignment to the specified user
#         assign_to.add(
#             {
#                 "doctype": "Gate Pass Book",
#                 "name": name,
#                 "assign_to": [user],
#                 "description": f"Assigned to {user} by {frappe.session.user}"
#             }
#         )
    
#     return {"assigned": len(docnames)}


##############################################################
##last working code with ownership check
##############################################################
#19Nov_5:12Pm
# import json
# import frappe
# from frappe.desk.form import assign_to

# TRANSPORT_ROLES = [
#     "Transportation Sender",
#     "Transportation Receiver", 
#     "Transportation Manager",
# ]

# @frappe.whitelist()
# def get_transportation_users():
#     """Return users that have any of the transport roles."""
#     user_ids = {
#         r.parent
#         for r in frappe.get_all(
#             "Has Role",
#             filters={"role": ["in", TRANSPORT_ROLES]},
#             fields=["parent"],
#             distinct=True,
#         )
#     }
#     if not user_ids:
#         return []

#     users = frappe.get_all(
#         "User",
#         filters={"name": ["in", list(user_ids)], "enabled": 1},
#         fields=["name", "full_name"],
#         distinct=True,
#     )
#     # exclude system users
#     users = [u for u in users if u["name"] not in ("Guest", "Administrator")]
#     return users

# @frappe.whitelist()
# def assign_gate_passes(docnames, user):
#     """Assign selected Gate Pass Book docs to a single user, with ownership validation."""
#     if isinstance(docnames, str):
#         docnames = json.loads(docnames)

#     # simple validation: ensure user is in allowed set
#     allowed = {u["name"] for u in get_transportation_users()}
#     if user not in allowed:
#         frappe.throw("User is not allowed for transportation assignment.")

#     current_user = frappe.session.user
#     successfully_assigned = []
#     failed_assignments = []
    
#     for name in docnames:
#         try:
#             # Check ownership - verify the current user owns this document
#             doc = frappe.get_doc("Gate Pass Book", name)
            
#             if doc.assigned_to != current_user:
#                 failed_assignments.append({
#                     "name": name,
#                     "reason": f"Current user {current_user} does not own this book. Owner: {doc.assigned_to or 'Unassigned'}"
#                 })
#                 continue
            
#             # Remove all existing assignments for this document
#             existing_assignments = frappe.get_all(
#                 "ToDo",
#                 filters={
#                     "reference_type": "Gate Pass Book",
#                     "reference_name": name,
#                     "status": "Open"
#                 },
#                 fields=["name", "allocated_to"]
#             )
            
#             # Cancel all existing assignments
#             for assignment in existing_assignments:
#                 # Mark existing assignment as cancelled
#                 todo_doc = frappe.get_doc("ToDo", assignment.name)
#                 todo_doc.status = "Cancelled"
#                 todo_doc.save(ignore_permissions=True)
            
#             # Create new assignment to the specified user
#             assign_to.add(
#                 {
#                     "doctype": "Gate Pass Book",
#                     "name": name,
#                     "assign_to": [user],
#                     "description": f"Assigned to {user} by {current_user}"
#                 }
#             )
            
#             # Update the assigned_to field in the document directly using SQL to avoid conflicts
#             frappe.db.set_value("Gate Pass Book", name, "assigned_to", user)
            
#             successfully_assigned.append(name)
            
#         except Exception as e:
#             failed_assignments.append({
#                 "name": name,
#                 "reason": str(e)
#             })
    
#     # Prepare the result message
#     total_selected = len(docnames)
#     success_count = len(successfully_assigned)
#     failed_count = len(failed_assignments)
    
#     if success_count == 0:
#         # All assignments failed
#         frappe.throw(f"You are not the owner of any of the selected Gate Pass Books. Assignment failed for all {total_selected} records.")
#     elif failed_count > 0:
#         # Some assignments failed
#         frappe.msgprint(f"Partially assigned: {success_count} record(s) assigned to {user}, {failed_count} record(s) failed due to ownership restrictions.")
#     else:
#         # All assignments successful
#         frappe.msgprint(f"Successfully assigned {success_count} record(s) to {user}")
    
#     return {
#         "assigned": success_count,
#         "failed": failed_count,
#         "total_selected": total_selected,
#         "failed_assignments": failed_assignments
#     }

import json
import frappe
from frappe.desk.form import assign_to

TRANSPORT_ROLES = [
    "Transportation Sender",
    "Transportation Receiver", 
    "Transportation Manager",
]

@frappe.whitelist()
def get_transportation_users():
    """Return users that have any of the transport roles."""
    user_ids = {
        r.parent
        for r in frappe.get_all(
            "Has Role",
            filters={"role": ["in", TRANSPORT_ROLES]},
            fields=["parent"],
            distinct=True,
        )
    }
    if not user_ids:
        return []

    users = frappe.get_all(
        "User",
        filters={"name": ["in", list(user_ids)], "enabled": 1},
        fields=["name", "full_name"],
        distinct=True,
    )
    # exclude system users
    users = [u for u in users if u["name"] not in ("Guest", "Administrator")]
    return users

@frappe.whitelist()
def assign_gate_passes(docnames, user):
    """Assign selected Gate Pass Book docs to a single user, with ownership and remaining passes validation."""
    if isinstance(docnames, str):
        docnames = json.loads(docnames)

    # simple validation: ensure user is in allowed set
    allowed = {u["name"] for u in get_transportation_users()}
    if user not in allowed:
        frappe.throw("User is not allowed for transportation assignment.")

    current_user = frappe.session.user
    successfully_assigned = []
    failed_assignments = []
    
    for name in docnames:
        try:
            # Get the document to check ownership and remaining passes
            doc = frappe.get_doc("Gate Pass Book", name)
            
            # Check ownership - verify the current user owns this document
            if doc.assigned_to != current_user:
                failed_assignments.append({
                    "name": name,
                    "reason": f"Current user {current_user} does not own this book. Owner: {doc.assigned_to or 'Unassigned'}"
                })
                continue
            
            # Check remaining passes - ensure there are passes left
            remaining_passes = doc.remaining_passes
            # Convert to integer if it's a string
            if isinstance(remaining_passes, str):
                try:
                    remaining_passes = int(remaining_passes)
                except ValueError:
                    remaining_passes = 0
            
            if remaining_passes == 0:
                failed_assignments.append({
                    "name": name,
                    "reason": f"Assignment failed due to no passes left into {doc.gate_pass_book_display_no}"
                })
                continue
            
            # Remove all existing assignments for this document
            existing_assignments = frappe.get_all(
                "ToDo",
                filters={
                    "reference_type": "Gate Pass Book",
                    "reference_name": name,
                    "status": "Open"
                },
                fields=["name", "allocated_to"]
            )
            
            # Cancel all existing assignments
            for assignment in existing_assignments:
                # Mark existing assignment as cancelled
                todo_doc = frappe.get_doc("ToDo", assignment.name)
                todo_doc.status = "Cancelled"
                todo_doc.save(ignore_permissions=True)
            
            # Create new assignment to the specified user
            assign_to.add(
                {
                    "doctype": "Gate Pass Book",
                    "name": name,
                    "assign_to": [user],
                    "description": f"Assigned to {user} by {current_user}"
                }
            )
            
            # Update the assigned_to field in the document directly using SQL to avoid conflicts
            frappe.db.set_value("Gate Pass Book", name, "assigned_to", user)
            
            successfully_assigned.append(name)
            
        except Exception as e:
            failed_assignments.append({
                "name": name,
                "reason": str(e)
            })
    
    # Prepare the result message
    total_selected = len(docnames)
    success_count = len(successfully_assigned)
    failed_count = len(failed_assignments)
    
    if success_count == 0:
        # All assignments failed
        if failed_count > 0 and all("no passes left" in f.get("reason", "") for f in failed_assignments):
            # All failures were due to no passes left
            frappe.throw(f"All selected Gate Pass Books have no passes left. Assignment failed for all {total_selected} records.")
        else:
            # Mixed failures (ownership + other issues)
            frappe.throw(f"You are not the owner of any of the selected Gate Pass Books. Assignment failed for all {total_selected} records.")
    elif failed_count > 0:
        # Some assignments failed
        # Check if some failures were due to no passes left
        no_passes_failures = [f for f in failed_assignments if "no passes left" in f.get("reason", "")]
        ownership_failures = [f for f in failed_assignments if "does not own" in f.get("reason", "")]
        
        message_parts = []
        if success_count > 0:
            message_parts.append(f"Partially assigned: {success_count} record(s) assigned to {user}")
        if ownership_failures:
            message_parts.append(f"{len(ownership_failures)} record(s) failed due to ownership restrictions")
        if no_passes_failures:
            message_parts.append(f"{len(no_passes_failures)} record(s) failed due to no passes left")
        
        frappe.msgprint(" | ".join(message_parts))
    else:
        # All assignments successful
        frappe.msgprint(f"Successfully assigned {success_count} record(s) to {user}")
    
    return {
        "assigned": success_count,
        "failed": failed_count,
        "total_selected": total_selected,
        "failed_assignments": failed_assignments
    }