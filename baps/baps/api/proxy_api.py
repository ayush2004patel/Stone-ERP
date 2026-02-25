"""
User Proxy Management API
"""
import frappe
from frappe.utils import today, getdate


@frappe.whitelist()
def get_available_users_for_proxy():
    """Get list of users who can be assigned as proxy (exclude system users like Administrator, Guest)"""
    users = frappe.get_all(
        "User",
        filters={
            "enabled": 1,
            "name": ["not in", ["Administrator", "Guest"]]
        },
        fields=["name", "full_name", "email"],
        order_by="full_name asc"
    )
    return users


@frappe.whitelist()
def create_proxy_assignment(user, proxy_user, from_date, to_date):
    """
    Create a new proxy assignment for a user
    
    Args:
        user: The user who is assigning proxy
        proxy_user: The user who will act as proxy
        from_date: Start date of proxy period
        to_date: End date of proxy period
    """
    # Validate dates
    if getdate(from_date) > getdate(to_date):
        frappe.throw("From Date cannot be after To Date")
    
    # Check if User Proxy document exists
    existing = frappe.db.get_value("User Proxy", {"user": user}, "name")
    
    if existing:
        doc = frappe.get_doc("User Proxy", existing)
    else:
        doc = frappe.new_doc("User Proxy")
        doc.user = user
        doc.status = "Active"
    
    # Add new proxy assignment
    doc.append("proxy_assignments", {
        "proxy_user": proxy_user,
        "from_date": from_date,
        "to_date": to_date,
        "is_active": 0  # Will be auto-calculated on save
    })
    
    doc.save()
    frappe.db.commit()
    
    return {
        "status": "success",
        "message": f"Proxy assigned to {proxy_user} from {from_date} to {to_date}"
    }


@frappe.whitelist()
def get_my_proxy_assignments(user=None):
    """Get all proxy assignments for the current user or specified user"""
    if not user:
        user = frappe.session.user
    
    proxy_doc_name = frappe.db.get_value("User Proxy", {"user": user}, "name")
    
    if not proxy_doc_name:
        return []
    
    doc = frappe.get_doc("User Proxy", proxy_doc_name)
    
    assignments = []
    current_date = getdate(today())
    
    for assignment in doc.proxy_assignments:
        from_date = getdate(assignment.from_date)
        to_date = getdate(assignment.to_date)
        
        # Get proxy user details
        proxy_user_doc = frappe.get_doc("User", assignment.proxy_user)
        
        status = "Active" if assignment.is_active and from_date <= current_date <= to_date else "Inactive"
        if current_date < from_date:
            status = "Upcoming"
        elif current_date > to_date:
            status = "Expired"
        
        assignments.append({
            "proxy_user": assignment.proxy_user,
            "proxy_user_full_name": proxy_user_doc.full_name,
            "from_date": str(assignment.from_date),
            "to_date": str(assignment.to_date),
            "is_active": assignment.is_active,
            "status": status
        })
    
    # Sort by from_date descending
    assignments.sort(key=lambda x: x["from_date"], reverse=True)
    
    return assignments


@frappe.whitelist()
def delete_proxy_assignment(user, proxy_user, from_date):
    """Delete a proxy assignment"""
    proxy_doc_name = frappe.db.get_value("User Proxy", {"user": user}, "name")
    
    if not proxy_doc_name:
        frappe.throw("No proxy assignments found for this user")
    
    doc = frappe.get_doc("User Proxy", proxy_doc_name)
    
    # Find and remove the assignment
    for assignment in doc.proxy_assignments:
        if (assignment.proxy_user == proxy_user and 
            str(assignment.from_date) == str(from_date)):
            doc.remove(assignment)
            doc.save()
            frappe.db.commit()
            return {"status": "success", "message": "Proxy assignment removed successfully"}
    
    frappe.throw("Proxy assignment not found")


@frappe.whitelist()
def get_active_proxy_info(user=None):
    """Get information about currently active proxy for a user"""
    if not user:
        user = frappe.session.user
    
    current_date = today()
    
    proxy_doc_name = frappe.db.get_value("User Proxy", {"user": user, "status": "Active"}, "name")
    
    if not proxy_doc_name:
        return None
    
    # Get active proxy assignments
    active_assignments = frappe.db.sql("""
        SELECT upd.proxy_user, upd.from_date, upd.to_date, u.full_name
        FROM `tabUser Proxy Detail` upd
        LEFT JOIN `tabUser` u ON u.name = upd.proxy_user
        WHERE upd.parent = %s
        AND upd.is_active = 1
        AND %s BETWEEN upd.from_date AND upd.to_date
        ORDER BY upd.from_date DESC
        LIMIT 1
    """, (proxy_doc_name, current_date), as_dict=True)
    
    if active_assignments:
        return {
            "proxy_user": active_assignments[0].proxy_user,
            "proxy_user_full_name": active_assignments[0].full_name,
            "from_date": str(active_assignments[0].from_date),
            "to_date": str(active_assignments[0].to_date),
            "is_active": True
        }
    
    return None
