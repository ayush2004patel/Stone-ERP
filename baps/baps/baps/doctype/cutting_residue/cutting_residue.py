# Copyright (c) 2025, Amax Consultancy Pvt Ltd and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe import _


class CuttingResidue(Document):
	def validate(self):
		"""Validate residue document"""
		if not self.cutting_execution:
			frappe.throw(_("Cutting is required"))
	
	def calculate_volume(self):
		"""Calculate volume from dimensions"""
		if self.l1 and self.b1 and self.h1:
			l_avg = (float(self.l1 or 0) + float(self.l2 or 0)) / 2
			b_avg = (float(self.b1 or 0) + float(self.b2 or 0)) / 2
			h_avg = (float(self.h1 or 0) + float(self.h2 or 0)) / 2
			
			# Volume in cubic meters (dimensions are in cm)
			volume = (l_avg * b_avg * h_avg) / 1000000
			return volume
		return 0


@frappe.whitelist()
def create_new_block(residue_name, cutting_execution, suffix, dimensions):
	"""
	Create a new Block document for residue with alphabetic suffix
	"""
	import json
	if isinstance(dimensions, str):
		dimensions = json.loads(dimensions)
	
	try:
		# Get original block details
		exec_doc = frappe.get_doc('Cutting', cutting_execution)
		original_block = frappe.get_doc('Block', exec_doc.block_number)
		
		# Create new block name with suffix
		new_block_name = f"{exec_doc.block_number}-{suffix}"
		
		# Check if block already exists
		if frappe.db.exists('Block', new_block_name):
			return {
				'success': False,
				'error': _('Block {0} already exists').format(new_block_name)
			}
		
		# Calculate volume
		l_avg = (float(dimensions.get('l1', 0)) + float(dimensions.get('l2', 0))) / 2
		b_avg = (float(dimensions.get('b1', 0)) + float(dimensions.get('b2', 0))) / 2
		h_avg = (float(dimensions.get('h1', 0)) + float(dimensions.get('h2', 0))) / 2
		volume = (l_avg * b_avg * h_avg) / 1000000  # Convert to cubic meters
		
		# Create new block
		new_block = frappe.new_doc('Block')
		new_block.name = new_block_name
		new_block.material_type = original_block.material_type
		new_block.site = original_block.site
		new_block.region = original_block.region
		new_block.l1 = dimensions.get('l1', 0)
		new_block.l2 = dimensions.get('l2', 0)
		new_block.b1 = dimensions.get('b1', 0)
		new_block.b2 = dimensions.get('b2', 0)
		new_block.h1 = dimensions.get('h1', 0)
		new_block.h2 = dimensions.get('h2', 0)
		new_block.volume = volume
		new_block.status = 'Ready for Cutting Planning'
		new_block.is_residue = 1
		new_block.source_block = exec_doc.block_number
		new_block.cutting_residue = residue_name
		
		new_block.insert()
		frappe.db.commit()
		
		return {
			'success': True,
			'block_name': new_block_name,
			'message': _('Residue block created successfully')
		}
		
	except Exception as e:
		frappe.log_error(f"Error creating residue block: {str(e)}")
		return {
			'success': False,
			'error': str(e)
		}


@frappe.whitelist()
def get_residue_blocks(residue_name, cutting_execution):
	"""
	Get all residue blocks for a Cutting
	"""
	try:
		# Get the original block number
		exec_doc = frappe.get_doc('Cutting', cutting_execution)
		original_block = exec_doc.block_number
		
		# Query blocks that are residue from this Cutting
		blocks = frappe.db.sql("""
			SELECT 
				name,
				l1, l2, b1, b2, h1, h2,
				volume
			FROM `tabBlock`
			WHERE source_block = %s
				AND is_residue = 1
				AND cutting_residue = %s
			ORDER BY name
		""", (original_block, residue_name), as_dict=True)
		
		return blocks
		
	except Exception as e:
		frappe.log_error(f"Error getting residue blocks: {str(e)}")
		return []


@frappe.whitelist()
def update_residue_blocks(updates):
	"""
	Update dimensions of residue blocks
	"""
	import json
	if isinstance(updates, str):
		updates = json.loads(updates)
	
	try:
		for update in updates:
			block_name = update.get('block_name')
			dimensions = update.get('dimensions', {})
			
			# Calculate new volume
			l_avg = (float(dimensions.get('l1', 0)) + float(dimensions.get('l2', 0))) / 2
			b_avg = (float(dimensions.get('b1', 0)) + float(dimensions.get('b2', 0))) / 2
			h_avg = (float(dimensions.get('h1', 0)) + float(dimensions.get('h2', 0))) / 2
			volume = (l_avg * b_avg * h_avg) / 1000000
			
			# Update block
			frappe.db.set_value('Block', block_name, {
				'l1': dimensions.get('l1', 0),
				'l2': dimensions.get('l2', 0),
				'b1': dimensions.get('b1', 0),
				'b2': dimensions.get('b2', 0),
				'h1': dimensions.get('h1', 0),
				'h2': dimensions.get('h2', 0),
				'volume': volume
			})
		
		frappe.db.commit()
		
		return {
			'success': True,
			'message': _('Residue blocks updated successfully')
		}
		
	except Exception as e:
		frappe.log_error(f"Error updating residue blocks: {str(e)}")
		return {
			'success': False,
			'error': str(e)
		}
