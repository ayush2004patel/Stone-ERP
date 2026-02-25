# Copyright (c) 2025, Ayush Patel and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class SizeListCreationItem(Document):
	def after_update(self):
		"""Update the Size List status when this item's fields change"""
		self.update_size_list_status()
	
	def on_change(self):
		"""Update Size List status whenever item data changes"""
		self.update_size_list_status()
	
	def update_size_list_status(self):
		"""
		Update the related Size List record's status based on current field values.
		Called whenever cutting_planning_id, order_id, or stone_id fields change.
		"""
		try:
			# Find the Size List record with matching stone_code
			if not self.stone_code:
				return
			
			size_list = frappe.get_doc("Size List", self.stone_code)
			
			# Helper function to check if field has a real value (not None, '', or 'None' string)
			def has_value(field):
				return field and field not in [None, '', 'None']
			
			# Determine status based on the conditions
			if has_value(self.stone_id):
				# Stone has been assigned (Under Pre Carving Inspection )
				status = "Under Pre Carving Inspection "
			elif has_value(self.cutting_planning_id) and not has_value(self.stone_id):
				# Cutting assigned but no stone yet (Under Cutting)
				status = "Under Cutting"
			elif has_value(self.order_id) and not has_value(self.stone_id):
				# Order placed but no stone yet (Under Order)
				status = "Under Order"
			else:
				# Nothing assigned yet (Not Started)
				status = "Not Started"
			
			# Update the Size List status field
			if size_list.status != status:
				size_list.db_set("status", status)
				frappe.db.commit()
		
		except frappe.DoesNotExistError:
			# Size List doesn't exist yet, skip update
			pass
		except Exception as e:
			frappe.log_error(f"Error updating Size List status for {self.stone_code}: {str(e)}", "Size List Creation Item Status Update")

