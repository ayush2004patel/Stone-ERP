# Copyright (c) 2025, rushabh@gmail.com and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class Block(Document):
	def validate(self):
		"""Validate and calculate internal status"""
		self.calculate_internal_status()
	
	def calculate_internal_status(self):
		"""
		Calculate internal status based on cutting execution and planning
		
		Status Logic:
		1. Consumed - Block has been cut and stone_id is assigned in Block table
		2. In Use - Block has cutting_execution_id (assigned to cutting execution)
		3. Available - Block has no cutting execution but is ready
		4. Wastage - Marked as wastage or residue
		"""
		if not self.block_number:
			return
		
		# Priority 1: If block has stone_id assigned, it's Consumed
		if self.stone_id:
			self.internal_status = "Consumed"
			return
		
		# Priority 2: If block has cutting_execution_id, it's In Use
		if self.cutting_execution_id:
			self.internal_status = "In Use"
			return
		
		# Priority 3: Check if block has been used in any cutting planning
		# Check if any Size List Creation Item with this block's stone_id has cutting_planning_id
		planning_check = frappe.db.sql("""
			SELECT COUNT(*) as count
			FROM `tabSize List Creation Item`
			WHERE (stone_id LIKE %s OR stone_id = %s)
			AND cutting_planning_id IS NOT NULL 
			AND cutting_planning_id != ''
		""", (f"{self.block_number}-%", self.stone_id if self.stone_id else ""), as_dict=True)
		
		if planning_check and planning_check[0].count > 0:
			self.internal_status = "In Use"
			return
		
		# Priority 4: Check if block exists in Size List (Available for planning)
		# Check by looking at cutting planning details or size list creation
		size_list_check = frappe.db.sql("""
			SELECT COUNT(*) as count
			FROM `tabSize List Creation Item`
			WHERE stone_id LIKE %s
		""", (f"{self.block_number}-%",), as_dict=True)
		
		if size_list_check and size_list_check[0].count > 0:
			self.internal_status = "Available"
			return
		
		# Check if it's a residue block
		if self.parent_residue_block_id:
			self.internal_status = "Wastage"
			return
		
		# Default: Available (ready for use)
		self.internal_status = "Available"


@frappe.whitelist()
def update_all_block_statuses():
	"""
	Update internal_status for all blocks in the system
	Can be called from console or as a server script
	"""
	blocks = frappe.get_all("Block", fields=["name"])
	updated_count = 0
	
	for block in blocks:
		try:
			block_doc = frappe.get_doc("Block", block.name)
			old_status = block_doc.internal_status
			block_doc.calculate_internal_status()
			
			if old_status != block_doc.internal_status:
				block_doc.db_set('internal_status', block_doc.internal_status, update_modified=False)
				updated_count += 1
		except Exception as e:
			frappe.log_error(f"Error updating block {block.name}: {str(e)}", "Block Status Update Error")
	
	frappe.db.commit()
	return {
		"success": True,
		"message": f"Updated {updated_count} out of {len(blocks)} blocks",
		"total_blocks": len(blocks),
		"updated_blocks": updated_count
	}
