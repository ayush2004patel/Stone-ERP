# Copyright (c) 2025, Dhruvi and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document


class JobOrder(Document):
	def validate(self):
		"""Validate the job order before saving"""
		self.validate_blocks()
		self.calculate_totals()
		self.update_pending_count()
	
	def validate_blocks(self):
		"""Validate that blocks are available for job order"""
		if not self.blocks:
			frappe.throw(_("Please add at least one block to the job order"))
		
		# Check for duplicate blocks
		block_list = []
		for item in self.blocks:
			if item.block in block_list:
				frappe.throw(_("Duplicate block {0} found in row {1}").format(item.block, item.idx))
			block_list.append(item.block)
			
			# Validate block status
			if self.is_new():
				block_doc = frappe.get_doc("Block", item.block)
				if block_doc.internal_status not in ["Available", "In Use"]:
					frappe.throw(_("Block {0} is not available for job order. Current status: {1}").format(
						item.block, block_doc.internal_status))
	
	def calculate_totals(self):
		"""Calculate total blocks and volume"""
		self.total_blocks = len(self.blocks)
		self.total_volume = sum([item.volume or 0 for item in self.blocks])
	
	def update_pending_count(self):
		"""Update blocks received and pending count"""
		self.blocks_received = sum([1 for item in self.blocks if item.received])
		self.blocks_pending = self.total_blocks - self.blocks_received
		# Set actual return date when all blocks received
		if self.blocks_received == self.total_blocks and not self.actual_return_date:
			self.actual_return_date = frappe.utils.today()
	
	def on_submit(self):
		"""On submit, update block status to 'Sent to Trade Partner' and link to job order"""
		self.update_block_status("Sent to Trade Partner")
	
	def on_cancel(self):
		"""On cancel, revert block status to 'Available'"""
		self.update_block_status("Available")
	
	def update_block_status(self, status):
		"""Update the internal status of all blocks in the job order"""
		for item in self.blocks:
			if status == "Sent to Trade Partner":
				# Store original site before changing
				block_doc = frappe.get_doc("Block", item.block)
				original_site = block_doc.site
				
				# Update block to trade partner site and set job order reference
				frappe.db.set_value("Block", item.block, {
					"internal_status": status,
					"job_order_reference": self.name,
					"site": self.trade_partner_site if self.trade_partner_site else original_site,
					"original_site": original_site  # Store original site for return
				}, update_modified=False)
			else:
				# Restore original site when returned/cancelled
				block_doc = frappe.get_doc("Block", item.block)
				original_site = block_doc.get("original_site") or block_doc.site
				
				frappe.db.set_value("Block", item.block, {
					"internal_status": status,
					"job_order_reference": None,
					"site": original_site,
					"original_site": None
				}, update_modified=False)
		frappe.db.commit()
	
	def mark_block_received(self, block_name):
		"""Mark a specific block as received"""
		for item in self.blocks:
			if item.block == block_name and not item.received:
				item.received = 1
				item.received_date = frappe.utils.today()
				self.save()
				
				# Restore original site when block is received back
				block_doc = frappe.get_doc("Block", block_name)
				original_site = block_doc.get("original_site") or block_doc.site
				
				# Update block status back to Available and restore original site
				frappe.db.set_value("Block", block_name, {
					"internal_status": "Available",
					"job_order_reference": None,
					"site": original_site,
					"original_site": None
				}, update_modified=False)
				frappe.db.commit()
				
				frappe.msgprint(_("Block {0} marked as received and returned to site {1}").format(block_name, original_site))
				return
		
		frappe.throw(_("Block {0} not found in this job order or already received").format(block_name))


@frappe.whitelist()
def mark_block_received(job_order, block_name):
	"""API method to mark a block as received"""
	doc = frappe.get_doc("Job Order", job_order)
	doc.mark_block_received(block_name)
	return doc


@frappe.whitelist()
def get_available_blocks(filters=None):
	"""Get list of available blocks for job order - only blocks with planning done or unplanned"""
	filters_dict = frappe.parse_json(filters) if filters else {}
	
	conditions = [
		"internal_status IN ('Available', 'In Use')",
		"(parent_residue_block_id IS NULL OR parent_residue_block_id = '')",
		"(cutting_started = 0 OR cutting_started IS NULL)"
	]
	values = []
	
	if filters_dict.get("baps_project"):
		conditions.append("baps_project = %s")
		values.append(filters_dict.get("baps_project"))
	
	if filters_dict.get("region"):
		conditions.append("region = %s")
		values.append(filters_dict.get("region"))
	
	if filters_dict.get("material_type"):
		conditions.append("material_type = %s")
		values.append(filters_dict.get("material_type"))
	
	if filters_dict.get("site"):
		conditions.append("site = %s")
		values.append(filters_dict.get("site"))
	
	query = f"""
		SELECT 
			name as block_number,
			block_custom_code,
			material_type,
			colour,
			volume,
			wt as weight,
			internal_status,
			baps_project,
			site,
			region,
			stone_id,
			parent_residue_block_id
		FROM `tabBlock`
		WHERE {' AND '.join(conditions)}
		ORDER BY block_number
	"""
	
	return frappe.db.sql(query, values, as_dict=1)


@frappe.whitelist()
@frappe.validate_and_sanitize_search_inputs
def get_trade_partner_sites(doctype, txt, searchfield, start, page_len, filters):
	"""Get sites where site_type = Trade Partner Site and trade_partner matches"""
	trade_partner = filters.get('trade_partner')
	
	if not trade_partner:
		return []
	
	return frappe.db.sql("""
		SELECT name
		FROM `tabSite`
		WHERE site_type = 'Trade Partner Site'
			AND trade_partner = %(trade_partner)s
			AND name LIKE %(txt)s
		ORDER BY name
		LIMIT %(start)s, %(page_len)s
	""", {
		'trade_partner': trade_partner,
		'txt': '%{0}%'.format(txt),
		'start': start,
		'page_len': page_len
	})
