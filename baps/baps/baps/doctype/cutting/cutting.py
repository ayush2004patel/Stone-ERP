# Copyright (c) 2025, Amax Consultancy Pvt Ltd and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe import _
from frappe.utils import nowdate, flt

class Cutting(Document):
	def validate(self):
		"""Validate the cutting document"""
		self.validate_required_fields()
		self.validate_stones()
		self.validate_residue_items()
		
	# def validate_required_fields(self):
	# 	"""Ensure all required fields are filled"""
	# 	if not self.block_number:
	# 		frappe.throw(_("Block Number is required"))
	# 	if not self.date:
	# 		frappe.throw(_("Date is required"))
	# 	if not self.form_number:
	# 		frappe.throw(_("Form Number is required"))
	# 	if not self.machine_no and self.site == 'BAPS':
	# 		frappe.throw(_("Machine No is required for BAPS site"))
	


	def validate_required_fields(self):
		"""Ensure all required fields are filled"""
		if not self.block_number:
			frappe.throw(_("Block Number is required"))
		if not self.date:
			frappe.throw(_("Date is required"))
		
		# ⭐ KEY: Only enforce form_number and machine_no during submission (docstatus = 1)
		# During draft (docstatus = 0), these can be empty
		if self.docstatus == 1:
			if not self.form_number:
				frappe.throw(_("Form Number is required before submission"))
			if not self.machine_no and self.site == 'BAPS':
				frappe.throw(_("Machine No is required for BAPS site before submission"))


	def validate_stones(self):
		"""Validate stones in the table"""
		if not self.stones_table or len(self.stones_table) == 0:
			frappe.throw(_("Please add at least one stone"))
	
	def validate_residue_items(self):
		"""
		Server-side validation for Residue Items
		Safe math using flt() to prevent TypeError
		"""
		if not self.residual:
			return

		for row in self.residual:
			# Use flt() to safely handle None values (None -> 0.0)
			l1, l2 = flt(row.l1), flt(row.l2)
			b1, b2 = flt(row.b1), flt(row.b2)
			h1, h2 = flt(row.h1), flt(row.h2)

			# 1. Check if L1, B1, H1 are present (must be > 0)
			if l1 <= 0 or b1 <= 0 or h1 <= 0:
				frappe.throw(_("Row {0}: Residue L1, B1, and H1 are required. Please fill them or delete the row.").format(row.idx))

			# 2. Check if inches are valid (<= 12)
			if l2 > 12:
				frappe.throw(_("Row {0}: Residue L2 cannot be greater than 12").format(row.idx))
			if b2 > 12:
				frappe.throw(_("Row {0}: Residue B2 cannot be greater than 12").format(row.idx))
			if h2 > 12:
				frappe.throw(_("Row {0}: Residue H2 cannot be greater than 12").format(row.idx))

			# 3. Calculate Volume (Feet/Inch logic)
			l_total = l1 + (l2 / 12.0)
			b_total = b1 + (b2 / 12.0)
			h_total = h1 + (h2 / 12.0)
			
			volume = l_total * b_total * h_total

			if volume <= 0:
				frappe.throw(_("Row {0}: Residue Volume cannot be 0").format(row.idx))

	def before_save(self):
		"""Actions before saving"""
		# Check if this is a direct assignment from frontend
		if hasattr(self, '_direct_assign') or getattr(self, '_direct_assign', False):
			self._direct_assign = True
			
		# Fetch site if not set
		if self.block_number and not self.site:
			block_doc = frappe.get_doc('Block', self.block_number)
			self.site = block_doc.site
			self.block_volume = block_doc.volume
	
	def on_submit(self):
		"""Mark block as cutting started when document is submitted"""
		if self.block_number:
			frappe.db.set_value('Block', self.block_number, 'cutting_started', 1)
	
	def on_cancel(self):
		"""Revert block cutting_started flag when document is cancelled"""
		if self.block_number:
			frappe.db.set_value('Block', self.block_number, 'cutting_started', 0)

	def sync_residue_block(self, row):
		"""Create OR Update Block document from residue data"""
		
		# Use flt() to prevent 'NoneType' error during math
		l1, l2 = flt(row.l1), flt(row.l2)
		b1, b2 = flt(row.b1), flt(row.b2)
		h1, h2 = flt(row.h1), flt(row.h2)

		# Safety Check: If fields are empty, stop here. 
		if l1 <= 0 or b1 <= 0 or h1 <= 0:
			return

		# 1. Calculate Volume (Feet/Inches logic)
		l_total = l1 + (l2 / 12.0)
		b_total = b1 + (b2 / 12.0)
		h_total = h1 + (h2 / 12.0)
		
		calculated_volume = l_total * b_total * h_total

		# 2. Check if Block already exists
		if frappe.db.exists("Block", row.block_number):
			# --- UPDATE MODE ---
			block_doc = frappe.get_doc("Block", row.block_number)
			
			# Update dimensions
			block_doc.l1 = l1
			block_doc.l2 = l2
			block_doc.b1 = b1
			block_doc.b2 = b2
			block_doc.h1 = h1
			block_doc.h2 = h2
			block_doc.volume = calculated_volume
			
			# Update Reference IDs
			# NOTE: Using field names exactly as provided in prompt
			block_doc.parent_residue_block_id = self.block_number
			block_doc.cutting_execution_id = self.name
			
			# Update Date
			if self.date:
				block_doc.date = self.date
			
			# Save changes
			block_doc.save(ignore_permissions=True)

		else:
			# --- CREATE MODE ---
			parent_block = frappe.get_doc("Block", self.block_number)
			
			new_block = frappe.new_doc("Block")
			new_block.name = row.block_number
			new_block.block_number = row.block_number 

			# ⭐ LINKING REFERENCE IDS HERE
			# NOTE: Using field names exactly as provided in prompt
			new_block.parent_residue_block_id = self.block_number  # The original block ID
			new_block.cutting_execution_id = self.name             # The Cutting Entry ID

			# Copy static fields from parent
			for field in [
				"material_type", "baps_project", "project_name", "colour", "grain",
				"site", "region", "party", "trade_partner"
			]:
				if parent_block.get(field):
					new_block.set(field, parent_block.get(field))

			# Set dimensions
			new_block.l1 = l1
			new_block.l2 = l2
			new_block.b1 = b1
			new_block.b2 = b2
			new_block.h1 = h1
			new_block.h2 = h2
			new_block.volume = calculated_volume
			# new_block.status = "Residue"
			
			# Set Date
			new_block.date = self.date or nowdate()
			
			new_block.insert(ignore_permissions=True)

	def delete_removed_residue_blocks(self):
		"""Check for rows deleted from the table and delete the corresponding Blocks"""
		old_doc = self.get_doc_before_save()
		if not old_doc:
			return

		current_blocks = [row.block_number for row in self.residual]

		if old_doc.residual:
			for old_row in old_doc.residual:
				if old_row.block_number and old_row.block_number not in current_blocks:
					if frappe.db.exists("Block", old_row.block_number):
						try:
							frappe.delete_doc("Block", old_row.block_number, ignore_permissions=True)
							frappe.msgprint(_("Deleted Residue Block: {0}").format(old_row.block_number))
						except Exception as e:
							frappe.log_error(f"Could not delete block {old_row.block_number}: {str(e)}")

	def on_update(self):
		"""Actions after update"""
		# Update stone statuses
		self.update_stone_statuses()

		# 1. Handle Deletions first
		self.delete_removed_residue_blocks()

		# 2. Handle Creations/Updates
		if self.residual:
			for row in self.residual:
				if row.block_number:
					# Sync (Create or Update)
					self.sync_residue_block(row)

		# Mark block as cutting started
		if self.block_number:
			frappe.db.set_value('Block', self.block_number, 'cutting_started', 1)
	
	def update_stone_statuses(self):
		"""Update is_cut status in Size List Creation Item and assign stones to block"""
		cut_stones = []
		
		# Check if this is a direct assignment
		direct_assign = getattr(self, '_direct_assign', False)
		
		for stone in self.stones_table:
			if stone.cut_ignore == 'CUT':
				if direct_assign:
					# Direct assignment - update stone with special marker
					frappe.db.sql("""
						UPDATE `tabSize List Creation Item`
						SET is_cut = %s,
							cutting_planning_id = NULL
						WHERE stone_code = %s
					""", (f"{self.name}_DIRECT", stone.stone_number))
				else:
					# Regular assignment
					frappe.db.sql("""
						UPDATE `tabSize List Creation Item`
						SET is_cut = %s
						WHERE stone_code = %s
					""", (self.name, stone.stone_number))
				
				cut_stones.append(stone.stone_number)
				
			elif stone.cut_ignore == 'IGNORE':
				# Release stone from cutting planning and remove is_cut ID
				frappe.db.sql("""
					UPDATE `tabSize List Creation Item`
					SET is_cut = NULL,
						cutting_planning_id = NULL
					WHERE stone_code = %s
				""", (stone.stone_number,))
		
		# Create block records for CUT stones
		if cut_stones:
			self.assign_stones_to_block(cut_stones)
		
		# Show appropriate message based on assignment type
		if cut_stones and self.block_number:
			if direct_assign and len(cut_stones) == 1:
				frappe.msgprint(f"✓ Stone {cut_stones[0]} directly assigned to block {self.block_number} with updated dimensions")
			else:
				frappe.msgprint(f"Processed {len(cut_stones)} stones for block {self.block_number}")
		# elif not cut_stones:
		# 	frappe.msgprint("No stones marked as CUT")


	def assign_stones_to_block(self, stone_codes):
		"""Create individual Block records for each cut stone with sequential IDs"""
		
		if not stone_codes:
			return
		
		try:
			# Get the parent block document to fetch details
			parent_block = frappe.get_doc('Block', self.block_number)
			
			# Filter out stones that already have blocks created
			# Check which stones already have stone_id assigned
			stones_to_process = []
			for stone in stone_codes:
				# Check if this stone already has a stone_id (meaning block was already created)
				existing_stone_id = frappe.db.get_value('Size List Creation Item', 
					{'stone_code': stone}, 'stone_id')
				
				if existing_stone_id:
					# Block already exists for this stone, skip it
					frappe.msgprint(f"ℹ Stone {stone} already has block: {existing_stone_id}, skipping...")
					continue
				
				stones_to_process.append(stone)
			
			# If no new stones to process, return
			if not stones_to_process:
				frappe.msgprint("✓ All CUT stones already have blocks created. No new blocks to create.")
				return
			
			# Get the next available sequential number for this block
			existing_blocks = frappe.db.sql("""
				SELECT block_number 
				FROM `tabBlock` 
				WHERE block_number LIKE %s
				AND block_number REGEXP %s
				ORDER BY block_number DESC
				LIMIT 1
			""", (f"{self.block_number}-%", f"^{self.block_number}-[0-9]+$"), as_dict=True)
			
			# Determine starting sequence number
			if existing_blocks and existing_blocks[0].block_number:
				last_block = existing_blocks[0].block_number
				try:
					last_num = int(last_block.split('-')[-1])
					next_num = last_num + 1
				except:
					next_num = 1
			else:
				next_num = 1
			
			# Process only new stones
			for stone in stones_to_process:
				# Find stone details from the cutting document
				stone_row = None
				for row in self.stones_table:
					if row.stone_number == stone:
						stone_row = row
						break
				
				if not stone_row:
					frappe.msgprint(f"⚠ Warning: Stone {stone} not found in cutting table")
					continue
				
				# Get the project name for this stone
				stone_project = stone_row.stone_project
				
				# Fetch stone dimensions from Size List Creation Item
				stone_data = frappe.db.sql("""
					SELECT sli.l1, sli.l2, sli.b1, sli.b2, sli.h1, sli.h2, 
						   sli.volume, sli.parent
					FROM `tabSize List Creation Item` sli
					INNER JOIN `tabSize List Creation` slc ON sli.parent = slc.name
					WHERE sli.stone_code = %s 
					AND slc.project_name = %s
					LIMIT 1
				""", (stone, stone_project), as_dict=True)
				
				if stone_data and len(stone_data) > 0:
					stone_data = stone_data[0]
				else:
					frappe.msgprint(f"⚠ Warning: Stone data not found for {stone} in project {stone_project}")
					stone_data = {
						'l1': 0, 'l2': 0, 'b1': 0, 'b2': 0, 'h1': 0, 'h2': 0,
						'volume': 0, 'parent': None
					}
				
				# Generate sequential block ID
				cut_stone_block_id = f"{self.block_number}-{str(next_num).zfill(3)}"
				
				# Double-check if this block ID already exists
				while frappe.db.exists('Block', cut_stone_block_id):
					next_num += 1
					cut_stone_block_id = f"{self.block_number}-{str(next_num).zfill(3)}"
				
				# Create a new Block record for this cut stone
				new_block = frappe.get_doc({
					'doctype': 'Block',
					'name': cut_stone_block_id,
					'block_number': cut_stone_block_id,
					'block_custom_code': stone,
					'colour': parent_block.colour,
					'material_type': parent_block.material_type,
					'party': parent_block.party,
					'baps_project': parent_block.baps_project,
					'project_name': stone_project,
					'grain': parent_block.grain,
					'volume': stone_data.get('volume', 0),
					'wt': 0,
					'l1': stone_data.get('l1', 0),
					'l2': stone_data.get('l2', 0),
					'b1': stone_data.get('b1', 0),
					'b2': stone_data.get('b2', 0),
					'h1': stone_data.get('h1', 0),
					'h2': stone_data.get('h2', 0),
					'site': parent_block.site,
					'trade_partner': parent_block.trade_partner,
					'region': parent_block.region,
					'date': self.date,
					'stone_id': stone,
					'cutting_execution_id': self.name,
					'cutting_started': 1,
					'status': 'Ready for Carving Inspection'
				})
				
				# Save the new block record
				new_block.insert(ignore_permissions=True)
				
				# Update stone_id in Size List Creation Item
				if stone_data.get('parent'):
					frappe.db.sql("""
						UPDATE `tabSize List Creation Item`
						SET stone_id = %s
						WHERE stone_code = %s AND parent = %s
					""", (cut_stone_block_id, stone, stone_data.get('parent')))
					
					# Update Size List status
					from baps.baps.doctype.size_list.size_list import update_size_list_status_by_code
					update_size_list_status_by_code(stone)
				else:
					frappe.db.sql("""
						UPDATE `tabSize List Creation Item` sli
						INNER JOIN `tabSize List Creation` slc ON sli.parent = slc.name
						SET sli.stone_id = %s
						WHERE sli.stone_code = %s 
						AND slc.project_name = %s
					""", (cut_stone_block_id, stone, stone_project))
				
				frappe.db.commit()
				
				frappe.msgprint(f"✓ Created block: {cut_stone_block_id} (Stone: {stone})")
				
				# Increment for next stone
				next_num += 1
				
		except Exception as e:
			error_msg = f"Error creating cut stone records: {str(e)}"
			frappe.log_error(error_msg, "Cutting - Create Stone Records")
			frappe.msgprint(f"Error: {error_msg}")
	
	def on_trash(self):
		"""Actions before deletion"""
		# Validate deletion is allowed
		self.validate_deletion()
		
		# Release stones back to available status
		self.release_stones_on_delete()
	
	def validate_deletion(self):
		"""Validate if the document can be deleted"""
		for stone in self.stones_table:
			if stone.cut_ignore == 'CUT':
				# Check if stone is transported
				is_transported = self.check_stone_transported(stone.stone_number)
				if is_transported:
					frappe.throw(_("Cannot delete: Stone {0} has been transported").format(stone.stone_number))
				
				# Check if pre-carving QC is done
				has_qc = self.check_precarving_qc_done(stone.stone_number)
				if has_qc:
					frappe.throw(_("Cannot delete: Stone {0} has Pre-Carving QC completed").format(stone.stone_number))
				
				# Check if invoice is paid
				is_paid = self.check_invoice_paid(stone.stone_number)
				if is_paid:
					frappe.throw(_("Cannot delete: Invoice for Stone {0} has been paid").format(stone.stone_number))
	
	def check_stone_transported(self, stone_number):
		"""Check if stone has been transported"""
		# Check in Stone Transportation or related doctype
		transported = frappe.db.exists('Stone Transportation Item', {
			'stone_code': stone_number,
			'docstatus': 1
		})
		return bool(transported)
	
	def check_precarving_qc_done(self, stone_number):
		"""Check if pre-carving QC is done for the stone"""
		qc_done = frappe.db.exists('Pre Carving QC', {
			'stone_number': stone_number,
			'docstatus': 1
		})
		return bool(qc_done)
	
	def check_invoice_paid(self, stone_number):
		"""Check if cutting invoice is paid"""
		# Check in Payment Entry or Invoice related to cutting
		# This depends on your payment tracking system
		# Placeholder implementation
		return False
	
	def release_stones_on_delete(self):
		"""Release stones when execution is deleted and remove stone_id assignments"""
		for stone in self.stones_table:
			# Get the stone_id before clearing
			stone_id = frappe.db.get_value('Size List Creation Item', 
				{'stone_code': stone.stone_number}, 'stone_id')
			
			# Reset is_cut flag and clear stone_id
			frappe.db.sql("""
				UPDATE `tabSize List Creation Item`
				SET is_cut = 0,
					stone_id = NULL
				WHERE stone_code = %s
			""", (stone.stone_number,))
			
			# Delete the associated Block if it exists
			if stone_id and frappe.db.exists('Block', stone_id):
				try:
					frappe.delete_doc('Block', stone_id, ignore_permissions=True, force=True)
				except Exception as e:
					frappe.log_error(f"Could not delete block {stone_id}: {str(e)}", "Cutting - Delete Block")


@frappe.whitelist()
def get_stones_for_execution(block_number, is_new=1, execution_name=None):
	"""
	Get stones for cutting based on block number
	For new execution: Show UNCUT PLANNED STONES
	For edit mode: Show CUT stones if Pre-Carving QC not done OR not transported
	"""
	is_new = int(is_new)
	
	if is_new:
		# Get stones from Final Cutting Planning for this block
		stones = frappe.db.sql("""
			SELECT 
				cpd.project_name,
				cpd.stone_no,
				'CUT' as cut_status
			FROM `tabCutting Plan Details` cpd
			INNER JOIN `tabCutting Planning` cp ON cpd.parent = cp.name
			WHERE cp.block_no = %s
				AND cp.is_final_plan = 1
				AND cp.docstatus < 2
			ORDER BY cpd.stone_no
		""", (block_number,), as_dict=True)
		
		return stones
	else:
		# Edit mode - get stones from current execution
		if not execution_name:
			return []
		
		# Get all stones from this execution
		stones = frappe.db.sql("""
			SELECT 
				stone_project as project_name,
				stone_number as stone_no,
				cut_ignore as cut_status
			FROM `tabCutting Item`
			WHERE parent = %s
			ORDER BY stone_number
		""", (execution_name,), as_dict=True)
		
		# Filter: Show only CUT stones that don't have QC or not transported
		filtered_stones = []
		for stone in stones:
			if stone.get('cut_status') == 'CUT':
				# Check if QC done or transported
				qc_done = frappe.db.exists('Pre Carving QC', {
					'stone_number': stone.get('stone_no'),
					'docstatus': 1
				})
				
				transported = frappe.db.exists('Stone Transportation Item', {
					'stone_code': stone.get('stone_no'),
					'docstatus': 1
				})
				
				# Only include if QC not done AND not transported
				if not qc_done and not transported:
					filtered_stones.append(stone)
			else:
				# Include IGNORE stones as well
				filtered_stones.append(stone)
		
		return filtered_stones


@frappe.whitelist()
def get_available_stones_for_addition(block_number, stone_type, search_text='', project_filter=''):
	"""
	Get available stones that can be added to cutting
	Criteria:
	- Same stone type as block
	- Not cut (is_cut = 0)
	- Not in final cutting plan
	- Not in cutting order list
	"""
	conditions = []
	values = {
		'stone_type': stone_type,
		'search_text': f'%{search_text}%'
	}
	
	# Build WHERE conditions
	conditions.append("slc.stone_type = %(stone_type)s")
	conditions.append("sli.is_cut = 0")
	
	if search_text:
		conditions.append("(sli.stone_code LIKE %(search_text)s OR slc.project_name LIKE %(search_text)s)")
	
	if project_filter:
		conditions.append("slc.project_name = %(project_filter)s")
		values['project_filter'] = project_filter
	
	where_clause = " AND ".join(conditions)
	
	# Query stones
	query = f"""
		SELECT 
			sli.stone_code,
			sli.stone_name,
			slc.project_name,
			sli.l1,
			sli.l2,
			sli.b1,
			sli.b2,
			sli.h1,
			sli.h2,
			sli.volume
		FROM `tabSize List Creation Item` sli
		INNER JOIN `tabSize List Creation` slc ON sli.parent = slc.name
		INNER JOIN `tabSize List Form` slf ON slc.form_number = slf.name
		LEFT JOIN (
			SELECT DISTINCT cpd.stone_no
			FROM `tabCutting Plan Details` cpd
			INNER JOIN `tabCutting Planning` cp ON cpd.parent = cp.name
			WHERE cp.is_final_plan = 1 AND cp.docstatus < 2
		) used_stones ON sli.stone_code = used_stones.stone_no
		LEFT JOIN (
			SELECT DISTINCT stone_number
			FROM `tabCutting Item`
		) execution_stones ON sli.stone_code = execution_stones.stone_number
		WHERE {where_clause}
			AND slf.workflow_state IN ('Verified', 'Published')
			AND used_stones.stone_no IS NULL
			AND execution_stones.stone_number IS NULL
			AND (sli.order_id IS NULL OR sli.order_id = '')
			AND (sli.selection_id IS NULL OR sli.selection_id = '')
			AND (sli.lot_id IS NULL OR sli.lot_id = '')
			AND (sli.stone_id IS NULL OR sli.stone_id = '')
			AND (sli.cutting_planning_id IS NULL OR sli.cutting_planning_id = '')
		ORDER BY sli.stone_code
		LIMIT 100
	"""
	
	stones = frappe.db.sql(query, values, as_dict=True)
	return stones


@frappe.whitelist()
def check_block_has_final_plan(block_number):
	"""
	Check if a block has a final cutting plan marked as is_final_plan = 1
	"""
	final_plan = frappe.db.exists('Cutting Planning', {
		'block_no': block_number,
		'is_final_plan': 1,
		'docstatus': ['<', 2]
	})
	
	return {
		'has_final_plan': bool(final_plan),
		'plan_name': final_plan if final_plan else None
	}


@frappe.whitelist()
def check_uncut_stones(block_number, execution_name, stones_table):
	"""
	Check for uncut planned stones
	Returns count of stones that are marked as IGNORE
	"""
	import json
	if isinstance(stones_table, str):
		stones_table = json.loads(stones_table)
	
	# Count IGNORE stones
	ignore_count = 0
	for stone in stones_table:
		if stone.get('cut_ignore') == 'IGNORE':
			ignore_count += 1
	
	# Get all stones from cutting planning
	planning_stones = frappe.db.sql("""
		SELECT COUNT(*) as total
		FROM `tabCutting Plan Details` cpd
		INNER JOIN `tabCutting Planning` cp ON cpd.parent = cp.name
		WHERE cp.block_no = %s
			AND cp.is_final_plan = 1
			AND cp.docstatus < 2
	""", (block_number,), as_dict=True)
	
	total_planned = planning_stones[0].total if planning_stones else 0
	
	# Calculate uncut stones
	stones_in_execution = len(stones_table)
	cut_count = sum(1 for s in stones_table if s.get('cut_ignore') == 'CUT')
	uncut_count = total_planned - cut_count
	
	return {
		'has_uncut': uncut_count > 0,
		'uncut_count': uncut_count,
		'ignore_count': ignore_count
	}


@frappe.whitelist()
def create_residue_document(execution_name, block_number):
	"""
	Create a new Cutting Residue document
	"""
	# Check if residue already exists
	existing = frappe.db.get_value('Cutting Residue', 
		{'cutting': execution_name}, 'name')
	
	if existing:
		return existing
	
	# Create new residue document
	residue = frappe.new_doc('Cutting Residue')
	residue.cutting = execution_name
	residue.suffix = ''
	residue.insert()
	
	return residue.name


@frappe.whitelist()
def release_cutting_planning(execution_name, block_number, stones_table):
	"""
	Release cutting planning for stones marked as IGNORE
	Update block status to "Consumed" after all stones are processed
	"""
	import json
	if isinstance(stones_table, str):
		stones_table = json.loads(stones_table)
	
	# Process IGNORE stones
	ignored_stones = []
	for stone in stones_table:
		if stone.get('cut_ignore') == 'IGNORE':
			# Release from cutting planning
			frappe.db.sql("""
				UPDATE `tabSize List Creation Item`
				SET cutting_planning_id = NULL
				WHERE stone_code = %s
			""", (stone.get('stone_number'),))
			
			ignored_stones.append(stone.get('stone_number'))
	
	# Check if all stones from cutting planning are now processed
	remaining_stones = frappe.db.sql("""
		SELECT COUNT(*) as count
		FROM `tabCutting Plan Details` cpd
		INNER JOIN `tabCutting Planning` cp ON cpd.parent = cp.name
		INNER JOIN `tabSize List Creation Item` sli ON cpd.stone_no = sli.stone_code
		WHERE cp.block_no = %s
			AND cp.is_final_plan = 1
			AND cp.docstatus < 2
			AND (sli.is_cut = 0 AND sli.cutting_planning_id IS NOT NULL)
	""", (block_number,), as_dict=True)
	
	# If no remaining uncut stones, mark block as consumed
	if remaining_stones and remaining_stones[0].count == 0:
		frappe.db.set_value('Block', block_number, 'status', 'Consumed')
	
	frappe.db.commit()
	
	return {
		'success': True,
		'ignored_count': len(ignored_stones),
		'message': _('Released {0} stones from cutting planning').format(len(ignored_stones))
	}


@frappe.whitelist()
def validate_before_delete(execution_name, stones_table):
	"""
	Validate if execution can be deleted
	Check if stones are transported, have QC, or invoice paid
	"""
	import json
	if isinstance(stones_table, str):
		stones_table = json.loads(stones_table)
	
	errors = []
	
	for stone in stones_table:
		if stone.get('cut_ignore') == 'CUT':
			stone_number = stone.get('stone_number')
			
			# Check transported
			transported = frappe.db.exists('Stone Transportation Item', {
				'stone_code': stone_number,
				'docstatus': 1
			})
			if transported:
				errors.append(f"Stone {stone_number} has been transported")
			
			# Check QC
			qc_done = frappe.db.exists('Pre Carving QC', {
				'stone_number': stone_number,
				'docstatus': 1
			})
			if qc_done:
				errors.append(f"Stone {stone_number} has Pre-Carving QC completed")
			
			# Check invoice (if applicable)
			# Add invoice check logic here if needed
	
	if errors:
		return {
			'can_delete': False,
			'error': '<br>'.join(errors)
		}
	
	return {
		'can_delete': True
	}


@frappe.whitelist()
@frappe.validate_and_sanitize_search_inputs
def get_blocks_with_final_plan(doctype, txt, searchfield, start, page_len, filters):
	"""
	Custom query to get only blocks that have a final cutting plan (is_final_plan = 1)
	For new documents: Exclude blocks already used in Cutting
	For existing documents: Show current block + unused blocks
	"""
	current_doc = filters.get('name') if filters else None
	
	# Build the exclusion condition
	exclusion_condition = ""
	if current_doc:
		# Editing existing doc - allow current block + unused blocks
		exclusion_condition = """
			AND (b.name NOT IN (
				SELECT DISTINCT block_number 
				FROM `tabCutting` 
				WHERE name != %(current_doc)s 
				AND block_number IS NOT NULL
			) OR b.name = (SELECT block_number FROM `tabCutting` WHERE name = %(current_doc)s))
		"""
	else:
		# New doc - exclude all used blocks
		exclusion_condition = """
			AND b.name NOT IN (
				SELECT DISTINCT block_number 
				FROM `tabCutting` 
				WHERE block_number IS NOT NULL
			)
		"""
	
	query = f"""
		SELECT DISTINCT b.name, b.material_type, b.site, b.volume
		FROM `tabBlock` b
		INNER JOIN `tabCutting Planning` cp ON b.name = cp.block_no
		WHERE cp.is_final_plan = 1
			AND cp.docstatus < 2
			AND b.job_order_reference IS NULL
			{exclusion_condition}
			AND (b.name LIKE %(txt)s 
				OR b.material_type LIKE %(txt)s 
				OR b.site LIKE %(txt)s
				OR b.project_name LIKE %(txt)s)
		ORDER BY b.modified DESC
		LIMIT %(start)s, %(page_len)s
	"""
	
	return frappe.db.sql(query, {
		'txt': f'%{txt}%',
		'start': start,
		'page_len': page_len,
		'current_doc': current_doc
	})


@frappe.whitelist()
@frappe.validate_and_sanitize_search_inputs
def get_job_order_blocks(doctype, txt, searchfield, start, page_len, filters):
	"""
	Get blocks from a specific Job Order
	These blocks are sent to vendor for cutting
	"""
	job_order = filters.get('job_order')
	current_doc = filters.get('name') if filters else None
	
	if not job_order:
		return []
	
	# Build the exclusion condition
	exclusion_condition = ""
	if current_doc:
		# Editing existing doc - allow current block + unused blocks
		exclusion_condition = """
			AND (b.name NOT IN (
				SELECT DISTINCT block_number 
				FROM `tabCutting` 
				WHERE name != %(current_doc)s 
				AND block_number IS NOT NULL
			) OR b.name = (SELECT block_number FROM `tabCutting` WHERE name = %(current_doc)s))
		"""
	else:
		# New doc - exclude all used blocks
		exclusion_condition = """
			AND b.name NOT IN (
				SELECT DISTINCT block_number 
				FROM `tabCutting` 
				WHERE block_number IS NOT NULL
			)
		"""
	
	query = f"""
		SELECT DISTINCT b.name, b.material_type, b.site, b.volume
		FROM `tabBlock` b
		INNER JOIN `tabJob Order Item` joi ON b.name = joi.block
		WHERE joi.parent = %(job_order)s
			AND b.cutting_started = 0
			{exclusion_condition}
			AND (b.name LIKE %(txt)s 
				OR b.material_type LIKE %(txt)s)
		ORDER BY b.name
		LIMIT %(start)s, %(page_len)s
	"""
	
	return frappe.db.sql(query, {
		'job_order': job_order,
		'txt': f'%{txt}%',
		'start': start,
		'page_len': page_len,
		'current_doc': current_doc
	})


@frappe.whitelist()
@frappe.validate_and_sanitize_search_inputs
def get_blocks_for_site(doctype, txt, searchfield, start, page_len, filters):
	"""
	Get blocks filtered by site (including trade partner sites)
	Shows blocks with final cutting plan or blocks from job orders at that site
	"""
	site_filter = filters.get('site')
	current_doc = filters.get('name') if filters else None
	
	# Build the exclusion condition
	exclusion_condition = ""
	if current_doc:
		# Editing existing doc - allow current block + unused blocks
		exclusion_condition = """
			AND (b.name NOT IN (
				SELECT DISTINCT block_number 
				FROM `tabCutting` 
				WHERE name != %(current_doc)s 
				AND block_number IS NOT NULL
			) OR b.name = (SELECT block_number FROM `tabCutting` WHERE name = %(current_doc)s))
		"""
	else:
		# New doc - exclude all used blocks
		exclusion_condition = """
			AND b.name NOT IN (
				SELECT DISTINCT block_number 
				FROM `tabCutting` 
				WHERE block_number IS NOT NULL
			)
		"""
	
	# Site filter condition
	site_condition = ""
	if site_filter:
		site_condition = "AND b.site = %(site)s"
	
	# Query to get blocks available for cutting at this site
	# Shows: blocks with status "Ready for Cutting" (with final plan) OR "Ready for Cutting Planning" (ready for planning)
	# Excludes blocks at earlier stages like "Ready for Inspection"
	query = f"""
		SELECT DISTINCT b.name, b.material_type, b.site, b.volume
		FROM `tabBlock` b
		LEFT JOIN `tabCutting Planning` cp ON b.name = cp.block_no AND cp.is_final_plan = 1 AND cp.docstatus < 2
		WHERE b.cutting_started = 0
		AND (b.status = 'Ready for Cutting' OR b.status = 'Ready for Cutting Planning')
		{site_condition}
		{exclusion_condition}
		AND (b.name LIKE %(txt)s 
			OR b.material_type LIKE %(txt)s 
			OR b.site LIKE %(txt)s
			OR b.project_name LIKE %(txt)s)
		ORDER BY b.modified DESC
		LIMIT %(start)s, %(page_len)s
	"""
	
	return frappe.db.sql(query, {
		'site': site_filter,
		'txt': f'%{txt}%',
		'start': start,
		'page_len': page_len,
		'current_doc': current_doc
	})




#ayush cutting code
# def assign_stones_to_block(self, stone_codes):
# 	"""Create individual Block records for each cut stone with sequential IDs"""
	
# 	if not stone_codes:
# 		return
	
# 	try:
# 		# Get the parent block document to fetch details
# 		parent_block = frappe.get_doc('Block', self.block_number)
		
# 		# ⭐ Filter out stones that already have blocks created
# 		# Check which stones already have stone_id assigned
# 		stones_to_process = []
# 		for stone in stone_codes:
# 			# Check if this stone already has a stone_id (meaning block was already created)
# 			existing_stone_id = frappe.db.get_value('Size List Creation Item', 
# 				{'stone_code': stone}, 'stone_id')
			
# 			if existing_stone_id:
# 				# Block already exists for this stone, skip it
# 				frappe.msgprint(f"ℹ Stone {stone} already has block: {existing_stone_id}, skipping...")
# 				continue
			
# 			stones_to_process.append(stone)
		
# 		# If no new stones to process, return
# 		if not stones_to_process:
# 			frappe.msgprint("✓ All CUT stones already have blocks created. No new blocks to create.")
# 			return
		
# 		# ⭐ Get the next available sequential number for this block
# 		existing_blocks = frappe.db.sql("""
# 			SELECT block_number 
# 			FROM `tabBlock` 
# 			WHERE block_number LIKE %s
# 			AND block_number REGEXP %s
# 			ORDER BY block_number DESC
# 			LIMIT 1
# 		""", (f"{self.block_number}-%", f"^{self.block_number}-[0-9]+$"), as_dict=True)
		
# 		# Determine starting sequence number
# 		if existing_blocks and existing_blocks[0].block_number:
# 			last_block = existing_blocks[0].block_number
# 			try:
# 				last_num = int(last_block.split('-')[-1])
# 				next_num = last_num + 1
# 			except:
# 				next_num = 1
# 		else:
# 			next_num = 1
		
# 		# Process only new stones
# 		for stone in stones_to_process:
# 			# Find stone details from the cutting document
# 			stone_row = None
# 			for row in self.stones_table:
# 				if row.stone_number == stone:
# 					stone_row = row
# 					break
			
# 			if not stone_row:
# 				frappe.msgprint(f"⚠ Warning: Stone {stone} not found in cutting table")
# 				continue
			
# 			# Get the project name for this stone
# 			stone_project = stone_row.stone_project
			
# 			# Fetch stone dimensions from Size List Creation Item
# 			stone_data = frappe.db.sql("""
# 				SELECT sli.l1, sli.l2, sli.b1, sli.b2, sli.h1, sli.h2, 
# 				       sli.volume, sli.parent
# 				FROM `tabSize List Creation Item` sli
# 				INNER JOIN `tabSize List Creation` slc ON sli.parent = slc.name
# 				WHERE sli.stone_code = %s 
# 				AND slc.project_name = %s
# 				LIMIT 1
# 			""", (stone, stone_project), as_dict=True)
			
# 			if stone_data and len(stone_data) > 0:
# 				stone_data = stone_data[0]
# 			else:
# 				frappe.msgprint(f"⚠ Warning: Stone data not found for {stone} in project {stone_project}")
# 				stone_data = {
# 					'l1': 0, 'l2': 0, 'b1': 0, 'b2': 0, 'h1': 0, 'h2': 0,
# 					'volume': 0, 'parent': None
# 				}
			
# 			# Generate sequential block ID
# 			cut_stone_block_id = f"{self.block_number}-{str(next_num).zfill(3)}"
			
# 			# Double-check if this block ID already exists
# 			while frappe.db.exists('Block', cut_stone_block_id):
# 				next_num += 1
# 				cut_stone_block_id = f"{self.block_number}-{str(next_num).zfill(3)}"
			
# 			# Create a new Block record for this cut stone
# 			new_block = frappe.get_doc({
# 				'doctype': 'Block',
# 				'name': cut_stone_block_id,
# 				'block_number': cut_stone_block_id,
# 				'block_custom_code': stone,
# 				'colour': parent_block.colour,
# 				'material_type': parent_block.material_type,
# 				'party': parent_block.party,
# 				'baps_project': parent_block.baps_project,
# 				'project_name': stone_project,
# 				'grain': parent_block.grain,
# 				'volume': stone_data.get('volume', 0),
# 				'wt': 0,
# 				'l1': stone_data.get('l1', 0),
# 				'l2': stone_data.get('l2', 0),
# 				'b1': stone_data.get('b1', 0),
# 				'b2': stone_data.get('b2', 0),
# 				'h1': stone_data.get('h1', 0),
# 				'h2': stone_data.get('h2', 0),
# 				'site': parent_block.site,
# 				'trade_partner': parent_block.trade_partner,
# 				'region': parent_block.region,
# 				'date': self.date,
# 				'stone_id': stone,
# 				'cutting_execution_id': self.name,
# 				'cutting_started': 1
# 			})
			
# 			# Save the new block record
# 			new_block.insert(ignore_permissions=True)
			
# 			# Update stone_id in Size List Creation Item
# 			if stone_data.get('parent'):
# 				frappe.db.sql("""
# 					UPDATE `tabSize List Creation Item`
# 					SET stone_id = %s
# 					WHERE stone_code = %s AND parent = %s
# 				""", (cut_stone_block_id, stone, stone_data.get('parent')))
				
# 				# Update Size List status
# 				from baps.baps.doctype.size_list.size_list import update_size_list_status_by_code
# 				update_size_list_status_by_code(stone)
# 			else:
# 				frappe.db.sql("""
# 					UPDATE `tabSize List Creation Item` sli
# 					INNER JOIN `tabSize List Creation` slc ON sli.parent = slc.name
# 					SET sli.stone_id = %s
# 					WHERE sli.stone_code = %s 
# 					AND slc.project_name = %s
# 				""", (cut_stone_block_id, stone, stone_project))
			
# 			frappe.db.commit()
			
# 			frappe.msgprint(f"✓ Created block: {cut_stone_block_id} (Stone: {stone})")
			
# 			# Increment for next stone
# 			next_num += 1
			
# 	except Exception as e:
# 		error_msg = f"Error creating cut stone records: {str(e)}"
# 		frappe.log_error(error_msg, "Cutting - Create Stone Records")
# 		frappe.msgprint(f"Error: {error_msg}")