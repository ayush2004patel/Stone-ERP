"""
Scheduled tasks for User Proxy management
"""
import frappe
from frappe.utils import today, getdate


def update_proxy_statuses():
	"""
	Daily scheduled task to update proxy assignment statuses
	This ensures that is_active flag is correctly set based on current date
	"""
	try:
		# Get all User Proxy documents
		proxy_docs = frappe.get_all("User Proxy", filters={"status": "Active"}, pluck="name")
		
		current_date = getdate(today())
		updated_count = 0
		
		for proxy_name in proxy_docs:
			doc = frappe.get_doc("User Proxy", proxy_name)
			
			# Check each proxy assignment
			for assignment in doc.proxy_assignments:
				from_date = getdate(assignment.from_date)
				to_date = getdate(assignment.to_date)
				
				# Update is_active based on current date
				should_be_active = from_date <= current_date <= to_date
				
				if assignment.is_active != should_be_active:
					assignment.is_active = should_be_active
					updated_count += 1
			
			# Save if any changes were made
			if doc.has_value_changed("proxy_assignments"):
				doc.save(ignore_permissions=True)
		
		if updated_count > 0:
			frappe.logger().info(f"Updated {updated_count} proxy assignment statuses")
		
		frappe.db.commit()
		
	except Exception as e:
		frappe.logger().error(f"Error updating proxy statuses: {str(e)}")
		frappe.db.rollback()
