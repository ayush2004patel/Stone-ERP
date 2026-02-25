# Copyright (c) 2025, Baps and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import today, getdate


class UserProxy(Document):
	def validate(self):
		"""Validate proxy assignments"""
		self.validate_proxy_assignments()
		self.auto_update_status()

	def validate_proxy_assignments(self):
		"""Ensure no overlapping date ranges for the same proxy user"""
		if not self.proxy_assignments:
			return

		# Check for overlapping dates
		for i, assignment in enumerate(self.proxy_assignments):
			if not assignment.from_date or not assignment.to_date:
				frappe.throw(f"Row {i+1}: Both From Date and To Date are required")
			
			if getdate(assignment.from_date) > getdate(assignment.to_date):
				frappe.throw(f"Row {i+1}: From Date cannot be after To Date")

			# Check for overlaps with other assignments
			for j, other in enumerate(self.proxy_assignments):
				if i >= j:  # Skip self and already checked pairs
					continue
				
				if assignment.proxy_user == other.proxy_user:
					# Check if date ranges overlap
					if (getdate(assignment.from_date) <= getdate(other.to_date) and 
						getdate(assignment.to_date) >= getdate(other.from_date)):
						frappe.throw(
							f"Row {i+1} and Row {j+1}: Overlapping date ranges for proxy user {assignment.proxy_user}"
						)

	def auto_update_status(self):
		"""Auto-update active status based on current date"""
		current_date = getdate(today())
		
		for assignment in self.proxy_assignments:
			from_date = getdate(assignment.from_date)
			to_date = getdate(assignment.to_date)
			
			# Auto activate/deactivate based on current date
			if from_date <= current_date <= to_date:
				assignment.is_active = 1
			else:
				assignment.is_active = 0


@frappe.whitelist()
def get_active_proxy(user):
	"""Get the currently active proxy user for a given user"""
	current_date = today()
	
	proxy_doc = frappe.db.get_value("User Proxy", {"user": user, "status": "Active"}, "name")
	
	if not proxy_doc:
		return None
	
	doc = frappe.get_doc("User Proxy", proxy_doc)
	
	for assignment in doc.proxy_assignments:
		if assignment.is_active and getdate(assignment.from_date) <= getdate(current_date) <= getdate(assignment.to_date):
			return {
				"proxy_user": assignment.proxy_user,
				"from_date": assignment.from_date,
				"to_date": assignment.to_date
			}
	
	return None


@frappe.whitelist()
def add_proxy_assignment(user, proxy_user, from_date, to_date):
	"""Add a new proxy assignment for a user"""
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
	
	return {"status": "success", "message": f"Proxy assigned to {proxy_user} from {from_date} to {to_date}"}


@frappe.whitelist()
def remove_proxy_assignment(user, proxy_user, from_date):
	"""Remove a proxy assignment"""
	proxy_doc = frappe.db.get_value("User Proxy", {"user": user}, "name")
	
	if not proxy_doc:
		frappe.throw("No proxy assignments found for this user")
	
	doc = frappe.get_doc("User Proxy", proxy_doc)
	
	# Find and remove the assignment
	for i, assignment in enumerate(doc.proxy_assignments):
		if (assignment.proxy_user == proxy_user and 
			str(assignment.from_date) == str(from_date)):
			doc.remove(assignment)
			doc.save()
			frappe.db.commit()
			return {"status": "success", "message": "Proxy assignment removed"}
	
	frappe.throw("Proxy assignment not found")


@frappe.whitelist()
def get_user_proxy_assignments(user):
	"""Get all proxy assignments for a user"""
	proxy_doc = frappe.db.get_value("User Proxy", {"user": user}, "name")
	
	if not proxy_doc:
		return []
	
	doc = frappe.get_doc("User Proxy", proxy_doc)
	
	assignments = []
	for assignment in doc.proxy_assignments:
		assignments.append({
			"proxy_user": assignment.proxy_user,
			"from_date": str(assignment.from_date),
			"to_date": str(assignment.to_date),
			"is_active": assignment.is_active
		})
	
	return assignments
