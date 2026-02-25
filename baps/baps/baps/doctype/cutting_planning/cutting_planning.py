# Copyright (c) 2025, Amax Consultancy Pvt Ltd and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe import _
from frappe.utils import nowdate


class CuttingPlanning(Document):
	def validate(self):
		
		"""Validate the cutting planning document"""
		self.validate_cutting_not_started()
		# self.validate_block_inspection()
		self.validate_unique_trial_no()
		#   self.validate_block_type()
		self.validate_only_one_final_per_block()
		if self.is_final_plan:
			self.validate_stones_availability()
		self.calculate_totals()
		# Set not_final as opposite of is_final_plan
		self.not_final = 0 if self.is_final_plan else 1
		# Set status based on is_final_plan
		self.status = "Final" if self.is_final_plan else "Not Final"
	
	def before_save(self):
		"""Actions to perform before saving"""
		# Only update stone assignments if is_final_plan has changed
		if self.has_value_changed('is_final_plan'):
			self.update_stone_cutting_planning_assignment()
			# ⭐ NEW: Update Block status when marking/unmarking as final
			self.update_block_status_on_final_change()
		elif self.is_final_plan and not self.is_new():
			# For existing final plans, check if stones need assignment
			if self.details:
				stone_codes = [row.stone_no for row in self.details if row.stone_no]
				if stone_codes:
					placeholders = ', '.join(['%s'] * len(stone_codes))
					unassigned = frappe.db.sql(f"""
						SELECT COUNT(*) as count
						FROM `tabSize List Creation Item`
						WHERE stone_code IN ({placeholders})
						AND (cutting_planning_id IS NULL OR cutting_planning_id != %s)
					""", tuple(stone_codes) + (self.name,), as_dict=True)[0].count
					
					if unassigned > 0:
						self.update_stone_cutting_planning_assignment()

	def update_block_status_on_final_change(self):
		"""
		Update Block status when cutting planning is marked/unmarked as final
		- When marked as final: Change status from 'Ready for Cutting Planning' to 'Ready for Cutting'
		- When unmarked: Change status back to 'Ready for Cutting Planning'
		"""
		if not self.block_no:
			return
		
		try:
			# Get the Block document
			block_doc = frappe.get_doc("Block", self.block_no)
			
			# Get current status
			current_status = block_doc.status
			
			if self.is_final_plan:
				# Marking as final - change to Ready for Cutting
				if current_status == "Ready for Cutting Planning":
					# Check if "Ready for Cutting" workflow state exists (optional check)
					if frappe.db.exists("Workflow State", "Ready for Cutting"):
						block_doc.status = "Ready for Cutting"
						block_doc.save(ignore_permissions=True)
						# frappe.db.commit() # Avoid commit in before_save to prevent transaction issues
						
						frappe.msgprint(
							_("Block {0} status changed to 'Ready for Cutting'").format(self.block_no),
							indicator='green',
							alert=True
						)
			else:
				# Unmarking as final - revert to Ready for Cutting Planning
				if current_status == "Ready for Cutting":
					# Check if there are any other final plans for this block
					other_final_plans = frappe.db.count("Cutting Planning", {
						"block_no": self.block_no,
						"is_final_plan": 1,
						"name": ["!=", self.name],
						"docstatus": ["<", 2]
					})
					
					# Only revert if no other final plans exist
					if other_final_plans == 0:
						block_doc.status = "Ready for Cutting Planning"
						block_doc.save(ignore_permissions=True)
						# frappe.db.commit() # Avoid commit in before_save
						
						frappe.msgprint(
							_("Block {0} status reverted to 'Ready for Cutting Planning'").format(self.block_no),
							indicator='orange',
							alert=True
						)
		
		except Exception as e:
			frappe.log_error(
				f"Error updating block status for {self.block_no}: {str(e)}",
				"Block Status Update Error"
			)

	
	def validate_only_one_final_per_block(self):
		"""Ensure only one plan per block can be marked as final"""
		if self.is_final_plan and self.block_no:
			# Check if another plan for the same block is already marked as final
			existing_final = frappe.db.get_value("Cutting Planning", {
				"block_no": self.block_no,
				"is_final_plan": 1,
				"name": ["!=", self.name],
				"docstatus": ["<", 2]
			}, ["name", "trial_no"], as_dict=True)
			
			if existing_final:
				frappe.throw(_("Cannot mark this plan as final. Plan {0} (Trial: {1}) is already marked as final for Block {2}. Please unmark it first.").format(
					existing_final.name, existing_final.trial_no, self.block_no
				))

	def validate_cutting_not_started(self):
		"""Prevent editing if cutting has started on the block"""
		if not self.is_new() and self.block_no:
			block = frappe.get_doc("Block", self.block_no)
			if block.cutting_started:
				frappe.throw(_("Cannot edit Cutting Planning. Cutting has already started for Block {0}").format(self.block_no))


	def validate_unique_trial_no(self):
		"""Ensure trial_no is unique for the given block_no"""
		if not self.block_no or not self.trial_no:
			return
		
		# Check if another Cutting Planning exists with same block_no and trial_no
		existing = frappe.db.exists('Cutting Planning', {
			'block_no': self.block_no,
			'trial_no': self.trial_no,
			'name': ['!=', self.name]
		})
		
		if existing:
			frappe.throw(_("Trial No {0} already exists for Block {1}. Please use a different trial number.").format(
				self.trial_no, self.block_no
			))
	
	def validate_stones_availability(self):
		"""Validate stones are not cut and not in other final plans"""
		if not self.details:
			return
		
		for detail in self.details:
			stone_no = detail.stone_no
			if not stone_no:
				continue
			
			# Check if stone is already cut
			is_cut = frappe.db.get_value("Size List Creation Item", 
				{"stone_code": stone_no}, "is_cut")
			if is_cut:
				frappe.throw(_("Stone {0} has already been in Final Plan").format(stone_no))
			
			# Check if stone is in another final plan
			existing_final = frappe.db.sql("""
				SELECT cp.name, cp.block_no, cp.trial_no
				FROM `tabCutting Plan Details` cpd
				INNER JOIN `tabCutting Planning` cp ON cpd.parent = cp.name
				WHERE cpd.stone_no = %s 
					AND cp.name != %s
					AND cp.is_final_plan = 1
					AND cp.docstatus < 2
				LIMIT 1
			""", (stone_no, self.name), as_dict=True)
			
			if existing_final:
				frappe.throw(_("Stone {0} is already used in Final Plan {1} (Block: {2}, Trial: {3})").format(
					stone_no, existing_final[0].name, existing_final[0].block_no, existing_final[0].trial_no
				))
	
	def after_insert(self):
		"""Update plan count and stone assignments after insert"""
		# Update stone assignments if marked as final
		if self.is_final_plan:
			self.update_stone_cutting_planning_assignment()
		# Update plan count
		self.update_all_plan_counts()
	
	def on_update(self):
		"""Update plan count and stone assignments after update"""
		# Update stone assignments if is_final_plan changed
		if self.has_value_changed('is_final_plan'):
			frappe.db.set_value('Cutting Planning', self.name, 'not_final', 0 if self.is_final_plan else 1, update_modified=False)
			self.update_stone_cutting_planning_assignment()
		
		# Check if block_no has changed
		if self.has_value_changed('block_no'):
			# Update counts for both old and new block
			old_block = self.get_doc_before_save()
			if old_block and old_block.block_no:
				self.update_plan_count_for_block(old_block.block_no)
			self.update_all_plan_counts()
		else:
			self.update_all_plan_counts()
	
	def on_trash(self):
		"""Update plan count for all records with same block after delete"""
		# Prevent deletion if cutting has started
		if self.block_no:
			block = frappe.get_doc("Block", self.block_no)
			if block.cutting_started:
				frappe.throw(_("Cannot delete Cutting Planning. Cutting has already started for Block {0}").format(self.block_no))
	
	def after_delete(self):
		"""Update plan count after record is deleted"""
		if self.block_no:
			# Update plan count immediately after deletion
			update_plan_count_for_block(self.block_no)
	
	def update_all_plan_counts(self):
		"""Update plan count for all records with the same block_no"""
		if self.block_no:
			update_plan_count_for_block(self.block_no)
	
	def calculate_totals(self):
		"""Calculate total stone volume and wastage percentage"""
		total_volume = 0
		
		for row in self.details:
			# Calculate volume for each stone if not set
			if not row.volume:
				l_avg = (row.l1 + row.l2) / 2 if row.l1 and row.l2 else 0
				b_avg = (row.b1 + row.b2) / 2 if row.b1 and row.b2 else 0
				h_avg = (row.h1 + row.h2) / 2 if row.h1 and row.h2 else 0
				row.volume = l_avg * b_avg * h_avg
			
			total_volume += row.volume
		
		self.total_stone_volume = total_volume
		
		# Calculate wastage
		if self.block_volume:
			block_vol = float(self.block_volume)
			if block_vol > 0:
				self.waste = ((block_vol - total_volume) / block_vol) * 100
				
	def create_cutting_entry(self):
		"""
		Create a Cutting document automatically when plan is marked as final
		"""
		try:
			# Check if Cutting entry already exists for this block
			existing_cutting = frappe.db.exists('Cutting', {
				'block_number': self.block_no
			})
			
			if existing_cutting:
				return existing_cutting
			
			# Validate that stones exist in the plan
			if not self.details or len(self.details) == 0:
				frappe.throw(_("Cannot create Cutting Entry. No stones found in the cutting plan."))
			
			# Get Block details
			block_doc = frappe.get_doc('Block', self.block_no)
			
			# Create new Cutting document
			cutting_doc = frappe.new_doc('Cutting')
			
			# Set basic fields
			cutting_doc.block_number = self.block_no
			cutting_doc.date = nowdate()
			cutting_doc.site = block_doc.site or ''
			cutting_doc.block_volume = block_doc.volume or 0
			cutting_doc.form_number = ''
			cutting_doc.machine_no = ''
			
			# Add stones from cutting planning to stones_table
			for stone_row in self.details:
				cutting_doc.append('stones_table', {
					'stone_number': stone_row.stone_no,
					'stone_project': stone_row.project_name or '',
					# 'cut_ignore': 'CUT',  # Removed as requested
					'l1': stone_row.l1 or 0,
					'l2': stone_row.l2 or 0,
					'b1': stone_row.b1 or 0,
					'b2': stone_row.b2 or 0,
					'h1': stone_row.h1 or 0,
					'h2': stone_row.h2 or 0,
					'volume': stone_row.volume or 0
				})
			
			# Insert the document (draft state)
			cutting_doc.insert(ignore_permissions=True)
			frappe.db.commit()
			
			return cutting_doc.name
			
		except Exception as e:
			frappe.log_error(frappe.get_traceback(), "Create Cutting Entry Error")
			frappe.throw(_("Error creating Cutting Entry: {0}").format(str(e)))
			
	def update_stone_cutting_planning_assignment(self):
		"""
		Update cutting_planning_id in Size List Creation Item (individual stone level) based on is_final_plan status
		- When marked as final: Assign this plan's name to cutting_planning_id for each stone in the plan
		- When unmarked: Remove cutting_planning_id from those specific stones
		"""
		if not self.details:
			return
		
		# Get all stone codes from this cutting plan
		stone_codes = [row.stone_no for row in self.details if row.stone_no]
		
		if not stone_codes:
			return
		
		if self.is_final_plan:
			# Assign cutting_planning_id to individual stones (at item level)
			placeholders = ', '.join(['%s'] * len(stone_codes))
			frappe.db.sql(f"""
				UPDATE `tabSize List Creation Item`
				SET cutting_planning_id = %s
				WHERE stone_code IN ({placeholders})
			""", (self.name,) + tuple(stone_codes))
			
			# Commit the cutting_planning_id changes first
			frappe.db.commit()
			
			# UPDATE Size List status for all affected stones
			from baps.baps.doctype.size_list.size_list import update_size_list_status_by_code
			for stone_code in stone_codes:
				update_size_list_status_by_code(stone_code)
			
			# Also assign at parent level if ALL stones from a Size List Creation are in this plan
			size_list_parents = frappe.db.sql(f"""
				SELECT DISTINCT slc.name
				FROM `tabSize List Creation` slc
				INNER JOIN `tabSize List Creation Item` sli ON sli.parent = slc.name
				WHERE sli.stone_code IN ({placeholders})
			""", tuple(stone_codes), as_dict=True)
			
			for parent in size_list_parents:
				parent_name = parent.name
				total_stones = frappe.db.count('Size List Creation Item', {'parent': parent_name})
				stones_in_plan = frappe.db.sql(f"""
					SELECT COUNT(*) as count
					FROM `tabSize List Creation Item` sli
					WHERE sli.parent = %s
					AND sli.stone_code IN ({placeholders})
				""", (parent_name,) + tuple(stone_codes), as_dict=True)[0].count
				
				if stones_in_plan == total_stones:
					frappe.db.set_value('Size List Creation', parent_name, 'cutting_planning_id', self.name, update_modified=False)
			
			frappe.msgprint(_("Assigned cutting plan {0} to {1} stone(s)").format(self.name, len(stone_codes)), 
				indicator='green', alert=True)
		else:
			# Remove cutting_planning_id from individual stones
			placeholders = ', '.join(['%s'] * len(stone_codes))
			frappe.db.sql(f"""
				UPDATE `tabSize List Creation Item`
				SET cutting_planning_id = NULL
				WHERE stone_code IN ({placeholders})
				AND cutting_planning_id = %s
			""", tuple(stone_codes) + (self.name,))
			
			# Commit the cutting_planning_id changes first
			frappe.db.commit()
			
			# UPDATE Size List status for all affected stones
			from baps.baps.doctype.size_list.size_list import update_size_list_status_by_code
			for stone_code in stone_codes:
				update_size_list_status_by_code(stone_code)
			
			# Also remove from parent level if it was assigned
			frappe.db.sql("""
				UPDATE `tabSize List Creation`
				SET cutting_planning_id = NULL
				WHERE cutting_planning_id = %s
			""", (self.name,))
			
			# frappe.msgprint(_("Removed cutting plan assignment from {0} stone(s). They are now available for other plans.").format(len(stone_codes)), 
			# 	indicator='orange', alert=True)


def update_plan_count_for_block(block_no):
	"""Update plan_count for all Cutting Planning records with the given block_no"""
	if not block_no:
		return
	
	# Get count of all active records for this block
	count = frappe.db.count('Cutting Planning', {
		'block_no': block_no,
		'docstatus': ['<', 2]  # Exclude cancelled records
	})
	
	# Update all records with this block_no
	frappe.db.sql("""
		UPDATE `tabCutting Planning`
		SET plan_count = %s
		WHERE block_no = %s AND docstatus < 2
	""", (str(count), block_no))
	
	frappe.db.commit()


# @frappe.whitelist()
# def get_filtered_stones(filters, block_no, current_plan=None):
# 	"""
# 	Get stones from Size List Creation based on filter criteria
# 	Exclude stones already in final plans (except the current plan being edited)
# 	Returns stones sorted by dimensions (L1, B1, H1) in ascending order
# 	"""
# 	filters = frappe.parse_json(filters)
	
# 	# Debug logging
# 	frappe.log_error(f"Filters received: {filters}\nBlock No: {block_no}", "Stone Filter Debug")
	
# 	# Build WHERE conditions
# 	conditions = []
# 	values = {}
	
# 	# Project filter
# 	if filters.get('project'):
# 		# The filter sends project name directly, use it for both parent and field lookup
# 		conditions.append("(slc.baps_project = %(project)s OR slc.project_name = %(project)s)")
# 		values['project'] = filters['project']
	
# 	# Main Part filter
# 	if filters.get('main_part'):
# 		conditions.append("slc.main_part = %(main_part)s")
# 		values['main_part'] = filters['main_part']
	
# 	# Sub Part filter - support multiple values (comma-separated from MultiSelect)
# 	if filters.get('sub_part'):
# 		sub_part_value = filters['sub_part']
		
# 		# MultiSelect returns comma-separated string, JSON array, or single value
# 		if isinstance(sub_part_value, str) and ',' in sub_part_value:
# 			# Comma-separated values from MultiSelect
# 			sub_parts = [sp.strip() for sp in sub_part_value.split(',') if sp.strip()]
# 			if sub_parts and len(sub_parts) > 0:
# 				placeholders = ', '.join([f'%(sub_part_{i})s' for i in range(len(sub_parts))])
# 				conditions.append(f"slc.sub_part IN ({placeholders})")
# 				for i, sp in enumerate(sub_parts):
# 					values[f'sub_part_{i}'] = sp
# 		elif isinstance(sub_part_value, str) and sub_part_value.startswith('['):
# 			# JSON array string
# 			import json
# 			try:
# 				sub_parts = json.loads(sub_part_value)
# 				if sub_parts and len(sub_parts) > 0:
# 					placeholders = ', '.join([f'%(sub_part_{i})s' for i in range(len(sub_parts))])
# 					conditions.append(f"slc.sub_part IN ({placeholders})")
# 					for i, sp in enumerate(sub_parts):
# 						values[f'sub_part_{i}'] = sp
# 			except:
# 				# If parsing fails, treat as single value
# 				conditions.append("slc.sub_part = %(sub_part)s")
# 				values['sub_part'] = sub_part_value
# 		elif isinstance(sub_part_value, list):
# 			# Already a list
# 			if len(sub_part_value) > 0:
# 				placeholders = ', '.join([f'%(sub_part_{i})s' for i in range(len(sub_part_value))])
# 				conditions.append(f"slc.sub_part IN ({placeholders})")
# 				for i, sp in enumerate(sub_part_value):
# 					values[f'sub_part_{i}'] = sp
# 		else:
# 			# Single value
# 			conditions.append("slc.sub_part = %(sub_part)s")
# 			values['sub_part'] = sub_part_value
	
# 	# Material Type filter
# 	if filters.get('stone_type'):
# 		conditions.append("slc.stone_type = %(stone_type)s")
# 		values['stone_type'] = filters['stone_type']
	
# 	# Stone Name filter
# 	if filters.get('stone_name'):
# 		conditions.append("sli.stone_name LIKE %(stone_name)s")
# 		values['stone_name'] = f"%{filters['stone_name']}%"
	
# 	# L1 dimension filters
# 	if filters.get('l1_below'):
# 		conditions.append("sli.l1 <= %(l1_below)s")
# 		values['l1_below'] = filters['l1_below']
# 	elif filters.get('l1_between_from') and filters.get('l1_between_to'):
# 		conditions.append("sli.l1 BETWEEN %(l1_from)s AND %(l1_to)s")
# 		values['l1_from'] = filters['l1_between_from']
# 		values['l1_to'] = filters['l1_between_to']
	
# 	# B1 dimension filters
# 	if filters.get('b1_below'):
# 		conditions.append("sli.b1 <= %(b1_below)s")
# 		values['b1_below'] = filters['b1_below']
# 	elif filters.get('b1_between_from') and filters.get('b1_between_to'):
# 		conditions.append("sli.b1 BETWEEN %(b1_from)s AND %(b1_to)s")
# 		values['b1_from'] = filters['b1_between_from']
# 		values['b1_to'] = filters['b1_between_to']
	
# 	# H1 dimension filters
# 	if filters.get('h1_below'):
# 		conditions.append("sli.h1 <= %(h1_below)s")
# 		values['h1_below'] = filters['h1_below']
# 	elif filters.get('h1_between_from') and filters.get('h1_between_to'):
# 		conditions.append("sli.h1 BETWEEN %(h1_from)s AND %(h1_to)s")
# 		values['h1_from'] = filters['h1_between_from']
# 		values['h1_to'] = filters['h1_between_to']
	
# 	# Get block's cutting region and material type for filtering
# 	block_region = None
# 	block_material_type = None
# 	if block_no:
# 		block_data = frappe.db.get_value("Block", block_no, ["site", "material_type"], as_dict=True)
# 		if block_data:
# 			block_region = block_data.site
# 			block_material_type = block_data.material_type
	
# 	# Add cutting region filter if block has site/region
# 	if block_region:
# 		conditions.append("slc.cutting_region = %(block_region)s")
# 		values['block_region'] = block_region
	
# 	# Add material type filter - only show stones matching block's material type
# 	if block_material_type:
# 		conditions.append("slc.stone_type = %(block_material_type)s")
# 		values['block_material_type'] = block_material_type
	
# 	# If no conditions, show all verified stones (but still exclude used ones)
# 	where_clause = " AND ".join(conditions) if conditions else "1=1"
	
# 	# Handle current plan exclusion - allow seeing stones from current plan being edited
# 	exclude_current_plan = ""
# 	or_current_plan = ""
# 	if current_plan:
# 		exclude_current_plan = f"AND cp.name != '{current_plan}'"
# 		or_current_plan = f"OR sli.cutting_planning_id = '{current_plan}'"
	
# 	# Query to get stones from Size List Creation Item
# 	# Using LEFT JOIN instead of NOT IN for better performance
# 	# Exclude stones that are: cut, in final plans, have order_id (direct ordered), or assigned to any cutting plan
# 	# BUT allow seeing stones from the current plan being edited
# 	# DEFAULT SORTING: L1 ASC, B1 ASC, H1 ASC (can be changed by user in frontend)
# 	query = f"""
# 		SELECT 
# 			sli.stone_code as stone_no,
# 			sli.stone_name,
# 			slc.project_name,
# 			slc.main_part,
# 			slc.sub_part,
# 			slc.stone_type,
# 			slc.cutting_region,
# 			sli.l1,
# 			sli.l2,
# 			sli.b1,
# 			sli.b2,
# 			sli.h1,
# 			sli.h2,
# 			sli.volume,
# 			0 as is_altered,
# 			slc.name as size_list_parent,
# 			sli.order_id
# 		FROM 
# 			`tabSize List Creation Item` sli
# 		INNER JOIN 
# 			`tabSize List Creation` slc ON sli.parent = slc.name
# 		INNER JOIN
# 			`tabSize List Form` slf ON slc.form_number = slf.name
# 		LEFT JOIN (
# 			SELECT DISTINCT cpd.stone_no
# 			FROM `tabCutting Plan Details` cpd
# 			INNER JOIN `tabCutting Planning` cp ON cpd.parent = cp.name
# 			WHERE cp.is_final_plan = 1
# 			{exclude_current_plan}
# 		) used_stones ON sli.stone_code = used_stones.stone_no
# 		WHERE 
# 			slf.workflow_state IN ('Verified', 'Published')
# 			AND ({where_clause})
# 			AND used_stones.stone_no IS NULL
# 			AND (sli.order_id IS NULL OR sli.order_id = '')
# 			AND (sli.cutting_planning_id IS NULL OR sli.cutting_planning_id = '' {or_current_plan})
# 			AND (sli.is_cut = 0 OR sli.is_cut IS NULL)
# 		ORDER BY 
# 			sli.l1 ASC, 
# 			sli.b1 ASC, 
# 			sli.h1 ASC,
# 			sli.stone_code ASC
# 		LIMIT 500
# 	"""
	
# 	stones = frappe.db.sql(query, values=values, as_dict=True)
	
# 	# Calculate volume if not present
# 	for stone in stones:
# 		if not stone.volume:
# 			l_avg = (stone.l1 + stone.l2) / 2 if stone.l1 and stone.l2 else 0
# 			b_avg = (stone.b1 + stone.b2) / 2 if stone.b1 and stone.b2 else 0
# 			h_avg = (stone.h1 + stone.h2) / 2 if stone.h1 and stone.h2 else 0
# 			stone.volume = l_avg * b_avg * h_avg
	
# 	return stones





# @frappe.whitelist()
# def get_filtered_stones(filters, block_no, current_plan=None):
# 	"""
# 	Get stones from Size List Creation based on filter criteria
# 	Exclude stones already in final plans (except the current plan being edited)
# 	Returns stones sorted by dimensions (L1, B1, H1) in ascending order
# 	NO LIMIT - pagination handled by frontend
# 	"""
# 	filters = frappe.parse_json(filters)
	
# 	# Build WHERE conditions
# 	conditions = []
# 	values = {}
	
# 	# Project filter
# 	if filters.get('project'):
# 		conditions.append("(slc.baps_project = %(project)s OR slc.project_name = %(project)s)")
# 		values['project'] = filters['project']
	
# 	# Main Part filter
# 	if filters.get('main_part'):
# 		conditions.append("slc.main_part = %(main_part)s")
# 		values['main_part'] = filters['main_part']
	
# 	# Sub Part filter - support multiple values
# 	if filters.get('sub_part'):
# 		sub_part_value = filters['sub_part']
		
# 		if isinstance(sub_part_value, str) and ',' in sub_part_value:
# 			sub_parts = [sp.strip() for sp in sub_part_value.split(',') if sp.strip()]
# 			if sub_parts and len(sub_parts) > 0:
# 				placeholders = ', '.join([f'%(sub_part_{i})s' for i in range(len(sub_parts))])
# 				conditions.append(f"slc.sub_part IN ({placeholders})")
# 				for i, sp in enumerate(sub_parts):
# 					values[f'sub_part_{i}'] = sp
# 		elif isinstance(sub_part_value, str) and sub_part_value.startswith('['):
# 			import json
# 			try:
# 				sub_parts = json.loads(sub_part_value)
# 				if sub_parts and len(sub_parts) > 0:
# 					placeholders = ', '.join([f'%(sub_part_{i})s' for i in range(len(sub_parts))])
# 					conditions.append(f"slc.sub_part IN ({placeholders})")
# 					for i, sp in enumerate(sub_parts):
# 						values[f'sub_part_{i}'] = sp
# 			except:
# 				conditions.append("slc.sub_part = %(sub_part)s")
# 				values['sub_part'] = sub_part_value
# 		elif isinstance(sub_part_value, list):
# 			if len(sub_part_value) > 0:
# 				placeholders = ', '.join([f'%(sub_part_{i})s' for i in range(len(sub_part_value))])
# 				conditions.append(f"slc.sub_part IN ({placeholders})")
# 				for i, sp in enumerate(sub_part_value):
# 					values[f'sub_part_{i}'] = sp
# 		else:
# 			conditions.append("slc.sub_part = %(sub_part)s")
# 			values['sub_part'] = sub_part_value
	
# 	# Material Type filter
# 	if filters.get('stone_type'):
# 		conditions.append("slc.stone_type = %(stone_type)s")
# 		values['stone_type'] = filters['stone_type']
	
# 	# Stone Name filter
# 	if filters.get('stone_name'):
# 		conditions.append("sli.stone_name LIKE %(stone_name)s")
# 		values['stone_name'] = f"%{filters['stone_name']}%"
	
# 	# L1 dimension filters
# 	if filters.get('l1_below'):
# 		conditions.append("sli.l1 <= %(l1_below)s")
# 		values['l1_below'] = filters['l1_below']
# 	elif filters.get('l1_between_from') and filters.get('l1_between_to'):
# 		conditions.append("sli.l1 BETWEEN %(l1_from)s AND %(l1_to)s")
# 		values['l1_from'] = filters['l1_between_from']
# 		values['l1_to'] = filters['l1_between_to']
	
# 	# B1 dimension filters
# 	if filters.get('b1_below'):
# 		conditions.append("sli.b1 <= %(b1_below)s")
# 		values['b1_below'] = filters['b1_below']
# 	elif filters.get('b1_between_from') and filters.get('b1_between_to'):
# 		conditions.append("sli.b1 BETWEEN %(b1_from)s AND %(b1_to)s")
# 		values['b1_from'] = filters['b1_between_from']
# 		values['b1_to'] = filters['b1_between_to']
	
# 	# H1 dimension filters
# 	if filters.get('h1_below'):
# 		conditions.append("sli.h1 <= %(h1_below)s")
# 		values['h1_below'] = filters['h1_below']
# 	elif filters.get('h1_between_from') and filters.get('h1_between_to'):
# 		conditions.append("sli.h1 BETWEEN %(h1_from)s AND %(h1_to)s")
# 		values['h1_from'] = filters['h1_between_from']
# 		values['h1_to'] = filters['h1_between_to']
	
# 	# Get block's cutting region and material type for filtering
# 	block_region = None
# 	block_material_type = None
# 	if block_no:
# 		block_data = frappe.db.get_value("Block", block_no, ["site", "material_type"], as_dict=True)
# 		if block_data:
# 			block_region = block_data.site
# 			block_material_type = block_data.material_type
	
# 	# Add cutting region filter if block has site/region --block and size list 
# 	# if block_region:
# 	# 	conditions.append("slc.cutting_region = %(block_region)s")
# 	# 	values['block_region'] = block_region
	
# 	# Add material type filter
# 	if block_material_type:
# 		conditions.append("slc.stone_type = %(block_material_type)s")
# 		values['block_material_type'] = block_material_type
	
# 	# Build WHERE clause
# 	where_clause = " AND ".join(conditions) if conditions else "1=1"
	
# 	# Handle current plan exclusion
# 	exclude_current_plan = ""
# 	or_current_plan = ""
# 	if current_plan:
# 		exclude_current_plan = f"AND cp.name != '{current_plan}'"
# 		or_current_plan = f"OR sli.cutting_planning_id = '{current_plan}'"
	
# 	# Query stones - NO LIMIT, pagination handled by frontend
# 	# Default sorting: L1, B1, H1, Stone Code (all ascending)
# 	query = f"""
# 		SELECT 
# 			sli.stone_code as stone_no,
# 			sli.stone_name,
# 			slc.project_name,
# 			slc.main_part,
# 			slc.sub_part,
# 			slc.stone_type,
# 			slc.cutting_region,
# 			sli.l1,
# 			sli.l2,
# 			sli.b1,
# 			sli.b2,
# 			sli.h1,
# 			sli.h2,
# 			sli.volume,
# 			0 as is_altered,
# 			slc.name as size_list_parent,
# 			sli.order_id
# 		FROM 
# 			`tabSize List Creation Item` sli
# 		INNER JOIN 
# 			`tabSize List Creation` slc ON sli.parent = slc.name
# 		INNER JOIN
# 			`tabSize List Form` slf ON slc.form_number = slf.name
# 		LEFT JOIN (
# 			SELECT DISTINCT cpd.stone_no
# 			FROM `tabCutting Plan Details` cpd
# 			INNER JOIN `tabCutting Planning` cp ON cpd.parent = cp.name
# 			WHERE cp.is_final_plan = 1
# 			{exclude_current_plan}
# 		) used_stones ON sli.stone_code = used_stones.stone_no
# 		WHERE 
# 			slf.workflow_state IN ('Verified', 'Published')
# 			AND ({where_clause})
# 			AND used_stones.stone_no IS NULL
# 			AND (sli.order_id IS NULL OR sli.order_id = '')
# 			AND (sli.cutting_planning_id IS NULL OR sli.cutting_planning_id = '' {or_current_plan})
# 			AND (sli.is_cut = 0 OR sli.is_cut IS NULL)
# 		ORDER BY 
# 			sli.l1 ASC, 
# 			sli.b1 ASC, 
# 			sli.h1 ASC,
# 			sli.stone_code ASC
# 	"""
	
# 	stones = frappe.db.sql(query, values=values, as_dict=True)
	
# 	# Calculate volume if not present
# 	for stone in stones:
# 		if not stone.volume:
# 			l_avg = (stone.l1 + stone.l2) / 2 if stone.l1 and stone.l2 else 0
# 			b_avg = (stone.b1 + stone.b2) / 2 if stone.b1 and stone.b2 else 0
# 			h_avg = (stone.h1 + stone.h2) / 2 if stone.h1 and stone.h2 else 0
# 			stone.volume = l_avg * b_avg * h_avg
	
# 	# Log result count for debugging
# 	frappe.log_error(f"Returned {len(stones)} stones for block {block_no}", "Stone Filter Result Count")
	
# 	return stones




# ENHANCED get_filtered_stones function with Above filter support

@frappe.whitelist()
def get_filtered_stones(filters, block_no, current_plan=None):
	"""
	ENHANCED: Get stones with Above, Below, Between filter support for L1, B1, H1
	Added proper stone_name dropdown support
	"""
	filters = frappe.parse_json(filters)
	
	conditions = []
	values = {}
	
	# Project filter
	if filters.get('project'):
		conditions.append("(slc.baps_project = %(project)s OR slc.project_name = %(project)s)")
		values['project'] = filters['project']
	
	# Main Part filter
	if filters.get('main_part'):
		conditions.append("slc.main_part = %(main_part)s")
		values['main_part'] = filters['main_part']
	
	# Sub Part filter - ENHANCED: Multiple selection support
	if filters.get('sub_part'):
		sub_part_value = filters['sub_part']
		
		if isinstance(sub_part_value, str) and ',' in sub_part_value:
			sub_parts = [sp.strip() for sp in sub_part_value.split(',') if sp.strip()]
			if sub_parts and len(sub_parts) > 0:
				placeholders = ', '.join([f'%(sub_part_{i})s' for i in range(len(sub_parts))])
				conditions.append(f"slc.sub_part IN ({placeholders})")
				for i, sp in enumerate(sub_parts):
					values[f'sub_part_{i}'] = sp
		elif isinstance(sub_part_value, str) and sub_part_value.startswith('['):
			import json
			try:
				sub_parts = json.loads(sub_part_value)
				if sub_parts and len(sub_parts) > 0:
					placeholders = ', '.join([f'%(sub_part_{i})s' for i in range(len(sub_parts))])
					conditions.append(f"slc.sub_part IN ({placeholders})")
					for i, sp in enumerate(sub_parts):
						values[f'sub_part_{i}'] = sp
			except:
				conditions.append("slc.sub_part = %(sub_part)s")
				values['sub_part'] = sub_part_value
		elif isinstance(sub_part_value, list):
			if len(sub_part_value) > 0:
				placeholders = ', '.join([f'%(sub_part_{i})s' for i in range(len(sub_part_value))])
				conditions.append(f"slc.sub_part IN ({placeholders})")
				for i, sp in enumerate(sub_part_value):
					values[f'sub_part_{i}'] = sp
		else:
			conditions.append("slc.sub_part = %(sub_part)s")
			values['sub_part'] = sub_part_value
	
	# Material Type filter
	if filters.get('stone_type'):
		conditions.append("slc.stone_type = %(stone_type)s")
		values['stone_type'] = filters['stone_type']
	
	# Stone Name filter - FIXED: Use Link field for exact match
	if filters.get('stone_name'):
		conditions.append("sli.stone_name = %(stone_name)s")
		values['stone_name'] = filters['stone_name']
	
	# =====================================================================
	# ENHANCED L1 DIMENSION FILTERS - NOW WITH "ABOVE" SUPPORT
	# =====================================================================
	l1_filter_type = filters.get('l1_filter_type', 'None')
	
	if l1_filter_type == 'Below' and filters.get('l1_below'):
		conditions.append("sli.l1 <= %(l1_below)s")
		values['l1_below'] = filters['l1_below']
	
	elif l1_filter_type == 'Above' and filters.get('l1_above'):
		conditions.append("sli.l1 >= %(l1_above)s")
		values['l1_above'] = filters['l1_above']
	
	elif l1_filter_type == 'Between' and filters.get('l1_between_from') and filters.get('l1_between_to'):
		conditions.append("sli.l1 BETWEEN %(l1_from)s AND %(l1_to)s")
		values['l1_from'] = filters['l1_between_from']
		values['l1_to'] = filters['l1_between_to']
	
	# =====================================================================
	# ENHANCED B1 DIMENSION FILTERS - NOW WITH "ABOVE" SUPPORT
	# =====================================================================
	b1_filter_type = filters.get('b1_filter_type', 'None')
	
	if b1_filter_type == 'Below' and filters.get('b1_below'):
		conditions.append("sli.b1 <= %(b1_below)s")
		values['b1_below'] = filters['b1_below']
	
	elif b1_filter_type == 'Above' and filters.get('b1_above'):
		conditions.append("sli.b1 >= %(b1_above)s")
		values['b1_above'] = filters['b1_above']
	
	elif b1_filter_type == 'Between' and filters.get('b1_between_from') and filters.get('b1_between_to'):
		conditions.append("sli.b1 BETWEEN %(b1_from)s AND %(b1_to)s")
		values['b1_from'] = filters['b1_between_from']
		values['b1_to'] = filters['b1_between_to']
	
	# =====================================================================
	# ENHANCED H1 DIMENSION FILTERS - NOW WITH "ABOVE" SUPPORT
	# =====================================================================
	h1_filter_type = filters.get('h1_filter_type', 'None')
	
	if h1_filter_type == 'Below' and filters.get('h1_below'):
		conditions.append("sli.h1 <= %(h1_below)s")
		values['h1_below'] = filters['h1_below']
	
	elif h1_filter_type == 'Above' and filters.get('h1_above'):
		conditions.append("sli.h1 >= %(h1_above)s")
		values['h1_above'] = filters['h1_above']
	
	elif h1_filter_type == 'Between' and filters.get('h1_between_from') and filters.get('h1_between_to'):
		conditions.append("sli.h1 BETWEEN %(h1_from)s AND %(h1_to)s")
		values['h1_from'] = filters['h1_between_from']
		values['h1_to'] = filters['h1_between_to']
	
	# Get block details for region and material type filtering
	block_region = None
	block_material_type = None
	if block_no:
		block_data = frappe.db.get_value("Block", block_no, ["site", "material_type"], as_dict=True)
		if block_data:
			block_region = block_data.site
			block_material_type = block_data.material_type
	
	if block_region:
		conditions.append("slc.cutting_region = %(block_region)s")
		values['block_region'] = block_region
	
	if block_material_type:
		conditions.append("slc.stone_type = %(block_material_type)s")
		values['block_material_type'] = block_material_type
	
	where_clause = " AND ".join(conditions) if conditions else "1=1"
	
	# Handle current plan exclusion
	exclude_current_plan = ""
	or_current_plan = ""
	if current_plan:
		exclude_current_plan = f"AND cp.name != '{current_plan}'"
		or_current_plan = f"OR sli.cutting_planning_id = '{current_plan}'"
	
	# Query stones
	query = f"""
		SELECT 
			sli.stone_code as stone_no,
			sli.stone_name,
			slc.project_name,
			slc.main_part,
			slc.sub_part,
			slc.stone_type,
			slc.cutting_region,
			sli.l1,
			sli.l2,
			sli.b1,
			sli.b2,
			sli.h1,
			sli.h2,
			sli.volume,
			0 as is_altered,
			slc.name as size_list_parent,
			sli.order_id
		FROM 
			`tabSize List Creation Item` sli
		INNER JOIN 
			`tabSize List Creation` slc ON sli.parent = slc.name
		INNER JOIN
			`tabSize List Form` slf ON slc.form_number = slf.name
		LEFT JOIN (
			SELECT DISTINCT cpd.stone_no
			FROM `tabCutting Plan Details` cpd
			INNER JOIN `tabCutting Planning` cp ON cpd.parent = cp.name
			WHERE cp.is_final_plan = 1
			{exclude_current_plan}
		) used_stones ON sli.stone_code = used_stones.stone_no
		WHERE 
			slf.workflow_state IN ('Verified', 'Published')
			AND ({where_clause})
			AND used_stones.stone_no IS NULL
			AND (sli.order_id IS NULL OR sli.order_id = '')
			AND (sli.cutting_planning_id IS NULL OR sli.cutting_planning_id = '' {or_current_plan})
			AND (sli.is_cut = 0 OR sli.is_cut IS NULL)
		ORDER BY 
			sli.l1 ASC, 
			sli.b1 ASC, 
			sli.h1 ASC,
			sli.stone_code ASC
		LIMIT 500
	"""
	
	stones = frappe.db.sql(query, values=values, as_dict=True)
	
	# Calculate volume if missing
	for stone in stones:
		if not stone.volume:
			l_avg = (stone.l1 + stone.l2) / 2 if stone.l1 and stone.l2 else 0
			b_avg = (stone.b1 + stone.b2) / 2 if stone.b1 and stone.b2 else 0
			h_avg = (stone.h1 + stone.h2) / 2 if stone.h1 and stone.h2 else 0
			stone.volume = l_avg * b_avg * h_avg
	
	return stones

	
@frappe.whitelist()
def create_cutting_from_final_plan(cutting_plan_name):
	"""
	Server method to create Cutting entry from a final Cutting Planning
	Called from client-side when is_final_plan is checked
	"""
	try:
		# Get the Cutting Planning document
		plan_doc = frappe.get_doc('Cutting Planning', cutting_plan_name)
		
		# Validate it's marked as final
		if not plan_doc.is_final_plan:
			return {
				'success': False,
				'error': _('This plan is not marked as final')
			}
		
		# Check if Cutting entry already exists
		existing_cutting = frappe.db.exists('Cutting', {
			'block_number': plan_doc.block_no
		})
		
		if existing_cutting:
			return {
				'success': True,
				'cutting_name': existing_cutting,
				'already_exists': True,
				'message': _('Cutting entry already exists for this block')
			}
		
		# Create the cutting entry
		cutting_name = plan_doc.create_cutting_entry()
		
		return {
			'success': True,
			'cutting_name': cutting_name,
			'already_exists': False,
			'message': _('Cutting entry created successfully')
		}
		
	except Exception as e:
		frappe.log_error(frappe.get_traceback(), "Create Cutting from Final Plan Error")
		return {
			'success': False,
			'error': str(e)
		}



@frappe.whitelist()
def finalize_plan(cutting_plan_name, trial_no):
	"""
	Mark a trial as final selected plan
	Validate stones are not already used
	"""
	try:
		doc = frappe.get_doc("Cutting Planning", cutting_plan_name)
		
		# Check if another trial is already marked as final
		for trial in doc.final_plan:
			if trial.trial_no != trial_no and hasattr(trial, 'is_final') and trial.is_final:
				return {
					"success": False,
					"error": _("Trial {0} is already marked as final. Please unmark it first.").format(trial.trial_no)
				}
		
		# Validate stones in this trial
		stones_in_trial = [d.stone_no for d in doc.details if doc.trial_no == trial_no]
		
		for stone_no in stones_in_trial:
			# Check if stone already in another final plan
			existing = frappe.db.sql("""
				SELECT cp.name, cp.block_no
				FROM `tabCutting Plan Details` cpd
				INNER JOIN `tabCutting Planning` cp ON cpd.parent = cp.name
				INNER JOIN `tabCutting Plan Final` cpf ON cpf.parent = cp.name
				WHERE cpd.stone_no = %s 
					AND cp.name != %s
					AND cp.docstatus < 2
					AND cpf.is_final = 1
			""", (stone_no, cutting_plan_name), as_dict=True)
			
			if existing:
				return {
					"success": False,
					"error": _("Stone {0} is already assigned in Cutting Planning {1} for Block {2}").format(
						stone_no, existing[0].name, existing[0].block_no
					)
				}
		
		# Mark trial as final
		for trial in doc.final_plan:
			if trial.trial_no == trial_no:
				trial.is_final = 1
			else:
				trial.is_final = 0
		
		doc.save()
		frappe.db.commit()
		
		return {
			"success": True,
			"message": _("Trial {0} marked as Final Selected Plan").format(trial_no)
		}
		
	except Exception as e:
		frappe.log_error(frappe.get_traceback(), "Finalize Cutting Plan Error")
		return {
			"success": False,
			"error": str(e)
		}

@frappe.whitelist()
def get_stone_names():
	"""Get unique stone names for autocomplete"""
	try:
		stone_names = frappe.db.sql("""
			SELECT DISTINCT stone_name
			FROM `tabSize List Creation Item`
			WHERE stone_name IS NOT NULL AND stone_name != ''
			ORDER BY stone_name
		""", as_dict=False)
		
		# Return as flat list
		return [name[0] for name in stone_names if name[0]]
	except Exception as e:
		frappe.log_error(frappe.get_traceback(), "Get Stone Names Error")
		return []


@frappe.whitelist()
def get_all_trial_versions(trial_no):
    """
    Fetch all Cutting Planning documents that have a given trial_no in final_plan
    Used for cross-document trial comparison in List View
    """
    if not trial_no:
        return []

    # Query all Cutting Planning docs with this trial_no in final_plan child table
    trials = frappe.db.sql("""
        SELECT 
            cp.name as docname,
            cp.block_no,
            cpf.trial_no,
            cpf.block_volume,
            cpf.stone_volume,
            cpf.waste_percent
        FROM 
            `tabCutting Planning` cp
        INNER JOIN 
            `tabCutting Plan Final` cpf ON cpf.parent = cp.name
        WHERE 
            cpf.trial_no = %s
            AND cp.docstatus < 2
        ORDER BY 
            cpf.waste_percent ASC, cp.creation DESC
    """, (trial_no,), as_dict=True)

    return trials


@frappe.whitelist()
def get_all_final_plans():
    """
    Get all Cutting Planning documents that are marked as final
    Returns list of documents with their details
    """
    try:
        final_plans = frappe.db.sql("""
            SELECT 
                name,
                block_no,
                trial_no,
                block_volume,
                total_stone_volume,
                waste,
                is_final_plan
            FROM 
                `tabCutting Planning`
            WHERE 
                is_final_plan = 1
                AND docstatus < 2
            ORDER BY 
                modified DESC
        """, as_dict=True)
        
        return final_plans
    except Exception as e:
        frappe.log_error(f"Error fetching final plans: {str(e)}")
        return []


@frappe.whitelist()
def get_all_not_final_plans():
    """
    Get all Cutting Planning documents that are NOT marked as final
    Returns list of all non-finalized cutting plans
    """
    try:
        not_final_plans = frappe.db.sql("""
            SELECT 
                name,
                block_no,
                trial_no,
                block_volume,
                total_stone_volume,
                waste,
                is_final_plan
            FROM 
                `tabCutting Planning`
            WHERE 
                (is_final_plan = 0 OR is_final_plan IS NULL)
                AND docstatus < 2
            ORDER BY 
                modified DESC
        """, as_dict=True)
        
        return not_final_plans
    except Exception as e:
        frappe.log_error(f"Error fetching not final plans: {str(e)}")
        return []


@frappe.whitelist()
def get_plans_for_comparison(plan_names, block_no=None):
    """
    Get full details of specified plans for comparison
    Validates that all plans are from the same block
    """
    import json
    if isinstance(plan_names, str):
        plan_names = json.loads(plan_names)
    
    if not plan_names:
        return []
    
    try:
        placeholders = ','.join(['%s'] * len(plan_names))
        
        # Build query with optional block_no filter
        query = f"""
            SELECT 
                name,
                block_no,
                trial_no,
                block_volume,
                total_stone_volume,
                waste,
                is_final_plan
            FROM 
                `tabCutting Planning`
            WHERE 
                name IN ({placeholders})
                AND docstatus < 2
        """
        
        params = list(plan_names)
        
        # Add block_no filter if provided
        if block_no:
            query += " AND block_no = %s"
            params.append(block_no)
        
        query += " ORDER BY waste ASC, total_stone_volume DESC"
        
        plans = frappe.db.sql(query, tuple(params), as_dict=True)
        
        # Validate all plans are from same block
        if plans:
            unique_blocks = set(plan.block_no for plan in plans)
            if len(unique_blocks) > 1:
                frappe.throw(_("All plans must be from the same block. Found blocks: {0}").format(', '.join(unique_blocks)))
        
        return plans
    except Exception as e:
        frappe.log_error(f"Error fetching plans for comparison: {str(e)}")
        return []


@frappe.whitelist()
def mark_plan_as_final(plan_name, all_plan_names):
	"""
	Mark a specific plan as final and unmark all others from the same block
	Auto-create Cutting entry and update Block status
	"""
	import json
	
	if isinstance(all_plan_names, str):
		all_plan_names = json.loads(all_plan_names)
	
	try:
		# Get the details of the plan being marked as final
		selected_plan = frappe.db.get_value("Cutting Planning", plan_name, 
			["block_no", "trial_no", "block_volume", "total_stone_volume", "waste"], as_dict=True)
		
		if not selected_plan:
			return {
				"success": False,
				"error": _("Could not find plan {0}").format(plan_name)
			}
		
		block_no = selected_plan.block_no
		
		# Check if another plan from the same block is already marked as final
		existing_final = frappe.db.get_value("Cutting Planning", {
			"block_no": block_no,
			"is_final_plan": 1,
			"name": ["!=", plan_name],
			"docstatus": ["<", 2]
		}, ["name", "trial_no"], as_dict=True)
		
		if existing_final:
			return {
				"success": False,
				"error": _("Plan {0} (Trial: {1}) is already marked as final for Block {2}. Please unmark it first.").format(
					existing_final.name, existing_final.trial_no, block_no
				)
			}
		
		# Validate stones are not already used in other final plans
		stones_in_plan = frappe.get_all("Cutting Plan Details", 
			filters={"parent": plan_name},
			pluck="stone_no")
		
		if stones_in_plan:
			placeholders = ', '.join(['%s'] * len(stones_in_plan))
			conflicting = frappe.db.sql(f"""
				SELECT DISTINCT cpd.stone_no, cp.name, cp.block_no
				FROM `tabCutting Plan Details` cpd
				INNER JOIN `tabCutting Planning` cp ON cpd.parent = cp.name
				WHERE cpd.stone_no IN ({placeholders})
				AND cp.is_final_plan = 1
				AND cp.name != %s
				LIMIT 3
			""", tuple(stones_in_plan) + (plan_name,), as_dict=True)
			
			if conflicting:
				stone_nos = ", ".join([c.stone_no for c in conflicting])
				return {
					"success": False,
					"error": _("Stone(s) {0} are already used in final plan {1} for Block {2}. Please unmark that plan first.").format(
						stone_nos, conflicting[0].name, conflicting[0].block_no
					)
				}
		
		# First, unmark all plans from the same block
		frappe.db.sql("""
			UPDATE `tabCutting Planning`
			SET is_final_plan = 0, not_final = 1
			WHERE block_no = %s
			AND docstatus < 2
		""", (block_no,))
		
		# Mark the selected plan as final
		frappe.db.sql("""
			UPDATE `tabCutting Planning`
			SET is_final_plan = 1, not_final = 0
			WHERE name = %s
		""", (plan_name,))
		
		# Update Size List Creation Item records
		if stones_in_plan:
			placeholders = ', '.join(['%s'] * len(stones_in_plan))
			frappe.db.sql(f"""
				UPDATE `tabSize List Creation Item`
				SET cutting_planning_id = %s
				WHERE stone_code IN ({placeholders})
			""", (plan_name,) + tuple(stones_in_plan))
			
			frappe.db.sql(f"""
				UPDATE `tabSize List Creation` slc
				INNER JOIN `tabSize List Creation Item` sli ON sli.parent = slc.name
				SET slc.cutting_planning_id = %s
				WHERE sli.stone_code IN ({placeholders})
			""", (plan_name,) + tuple(stones_in_plan))
		
		# Commit the changes
		frappe.db.commit()
		
		# ⭐ UPDATE BLOCK STATUS TO 'Ready for Cutting'
		try:
			block_doc = frappe.get_doc("Block", block_no)
			if block_doc.status == "Ready for Cutting Planning":
				block_doc.status = "Ready for Cutting"
				block_doc.save(ignore_permissions=True)
				frappe.db.commit()
		except Exception as e:
			frappe.log_error(f"Error updating block status: {str(e)}", "Mark Plan Final - Block Status")
		
		# ⭐ AUTO-CREATE CUTTING ENTRY
		cutting_name = None
		cutting_already_exists = False
		
		try:
			# Get the planning document
			plan_doc = frappe.get_doc('Cutting Planning', plan_name)
			
			# Check if Cutting already exists
			existing_cutting = frappe.db.exists('Cutting', {
				'block_number': block_no
			})
			
			if existing_cutting:
				cutting_name = existing_cutting
				cutting_already_exists = True
			else:
				# Create new cutting entry
				cutting_name = plan_doc.create_cutting_entry()
				cutting_already_exists = False
				
		except Exception as e:
			frappe.log_error(f"ERROR creating cutting: {str(e)}\n{frappe.get_traceback()}", "Mark Plan Final - Cutting Creation")
			cutting_name = None
		
		return {
			"success": True,
			"message": _("Plan {0} (Trial: {1}) marked as final for Block {2}. Block status updated to 'Ready for Cutting'.").format(
				plan_name, selected_plan.trial_no, block_no),
			"cutting_name": cutting_name,
			"cutting_already_exists": cutting_already_exists
		}
		
	except Exception as e:
		frappe.log_error(f"OUTER ERROR: {str(e)}\n{frappe.get_traceback()}", "Mark Plan Final - Outer Error")
		frappe.db.rollback()
		return {
			"success": False,
			"error": str(e)
		}


# ==============================================================================
# STEP 4: UPDATE THE unmark_plan_as_final() FUNCTION
# Replace your existing unmark_plan_as_final() function with this:
# ==============================================================================

@frappe.whitelist()
def unmark_plan_as_final(plan_name):
	"""
	Unmark a plan from being final
	Delete Cutting entry if no stones have been marked as CUT yet
	Revert Block status to 'Ready for Cutting Planning'
	"""
	try:
		# Get the plan details
		plan = frappe.db.get_value("Cutting Planning", plan_name, 
			["block_no", "trial_no", "is_final_plan"], as_dict=True)
		
		if not plan:
			return {
				"success": False,
				"error": _("Could not find plan {0}").format(plan_name)
			}
		
		if not plan.is_final_plan:
			return {
				"success": False,
				"error": _("Plan {0} is not marked as final").format(plan_name)
			}
		
		# Get stones used in this plan
		stones_in_plan = frappe.get_all("Cutting Plan Details", 
			filters={"parent": plan_name},
			pluck="stone_no")
		
		# Check if Cutting entry exists for this block
		cutting_entry = frappe.db.exists('Cutting', {
			'block_number': plan.block_no
		})
		
		if cutting_entry and stones_in_plan:
			placeholders = ', '.join(['%s'] * len(stones_in_plan))
			
			# Check if any stone is marked as CUT in Cutting document
			cut_stones = frappe.db.sql(f"""
				SELECT DISTINCT ci.stone_number, ci.cut_ignore
				FROM `tabCutting Item` ci
				INNER JOIN `tabCutting` c ON ci.parent = c.name
				WHERE c.name = %s
				AND ci.stone_number IN ({placeholders})
				AND ci.cut_ignore = 'CUT'
				LIMIT 3
			""", (cutting_entry,) + tuple(stones_in_plan), as_dict=True)
			
			if cut_stones:
				stone_list = ", ".join([s.stone_number for s in cut_stones])
				return {
					"success": False,
					"error": _("Cannot unmark as final. Stone(s) {0} have already been marked as CUT in Cutting entry {1}.").format(
						stone_list, cutting_entry
					)
				}
		
		# Delete Cutting entry if exists and no stones are CUT
		if cutting_entry:
			try:
				frappe.delete_doc('Cutting', cutting_entry, ignore_permissions=True)
				frappe.db.commit()
				frappe.msgprint(_("Cutting entry {0} deleted as no stones were marked as CUT").format(cutting_entry), 
					indicator='orange', alert=True)
			except Exception as e:
				frappe.log_error(f"Error deleting Cutting entry: {str(e)}", "Unmark Final Plan - Delete Cutting")
		
		# Unmark the plan as final
		frappe.db.sql("""
			UPDATE `tabCutting Planning`
			SET is_final_plan = 0, not_final = 1
			WHERE name = %s
		""", (plan_name,))
		
		# Remove cutting_planning_id from stones
		if stones_in_plan:
			placeholders = ', '.join(['%s'] * len(stones_in_plan))
			frappe.db.sql(f"""
				UPDATE `tabSize List Creation Item`
				SET cutting_planning_id = NULL
				WHERE cutting_planning_id = %s
				AND stone_code IN ({placeholders})
			""", (plan_name,) + tuple(stones_in_plan))
			
			frappe.db.sql(f"""
				UPDATE `tabSize List Creation` slc
				INNER JOIN `tabSize List Creation Item` sli ON sli.parent = slc.name
				SET slc.cutting_planning_id = NULL
				WHERE slc.cutting_planning_id = %s
				AND sli.stone_code IN ({placeholders})
			""", (plan_name,) + tuple(stones_in_plan))
			
			frappe.db.commit()
			
			from baps.baps.doctype.size_list.size_list import update_size_list_status_by_code
			for stone_code in stones_in_plan:
				update_size_list_status_by_code(stone_code)
		else:
			frappe.db.commit()
		
		# ⭐ REVERT BLOCK STATUS IF NO OTHER FINAL PLANS EXIST
		try:
			other_final_plans = frappe.db.count("Cutting Planning", {
				"block_no": plan.block_no,
				"is_final_plan": 1,
				"docstatus": ["<", 2]
			})
			
			if other_final_plans == 0:
				block_doc = frappe.get_doc("Block", plan.block_no)
				if block_doc.status == "Ready for Cutting":
					block_doc.status = "Ready for Cutting Planning"
					block_doc.save(ignore_permissions=True)
					frappe.db.commit()
					
					frappe.msgprint(
						_("Block status reverted to 'Ready for Cutting Planning'"),
						indicator='orange',
						alert=True
					)
		except Exception as e:
			frappe.log_error(f"Error reverting block status: {str(e)}", "Unmark Plan Final - Block Status")
		
		return {
			"success": True,
			"message": _("Plan {0} (Trial: {1}) unmarked from Block {2}").format(
				plan_name, plan.trial_no, plan.block_no)
		}
		
	except Exception as e:
		frappe.log_error(frappe.get_traceback(), "Unmark Plan as Final Error")
		frappe.db.rollback()
		return {
			"success": False,
			"error": str(e)
		}

@frappe.whitelist()
def get_next_trial_number(block_no):
    """
    Returns the next sequential trial number (as string, e.g. '001') 
    for the given block_no.
    """
    if not block_no:
        frappe.throw(_("Block No is required to generate Trial No"))

    # Find the highest trial_no for this block_no
    latest = frappe.db.sql("""
        SELECT trial_no
        FROM `tabCutting Planning`
        WHERE block_no = %s 
        AND trial_no REGEXP '^[0-9]+$'
        ORDER BY CAST(trial_no AS UNSIGNED) DESC
        LIMIT 1
    """, (block_no,), as_dict=True)

    if latest:
        next_num = int(latest[0].trial_no) + 1
    else:
        next_num = 1

    # Format as 3-digit string: 1 → "001", 12 → "012", 123 → "123"
    return str(next_num).zfill(3)

@frappe.whitelist()
def get_plan_counts_by_blocks(block_nos):
    """
    Given a list of block_nos, returns { block_no: count } for Cutting Planning docs.
    """
    if not block_nos:
        return {}

    # Ensure it's a list
    if isinstance(block_nos, str):
        import json
        block_nos = json.loads(block_nos)

    # Build SQL-safe IN clause
    placeholders = ','.join(['%s'] * len(block_nos))
    query = f"""
        SELECT block_no, COUNT(*) as count
        FROM `tabCutting Planning`
        WHERE block_no IN ({placeholders})
        GROUP BY block_no
    """
    
    result = frappe.db.sql(query, block_nos, as_dict=True)
    
    # Return as dict: { "BLK-001": 3, ... }
    return { row.block_no: row.count for row in result }


@frappe.whitelist()
def get_plan_count_for_block(block_no):
    """
    Returns total number of Cutting Planning documents (trials) for a specific block.
    """
    if not block_no:
        return 0
    
    count = frappe.db.count("Cutting Planning", {"block_no": block_no, "docstatus": ["<", 2]})
    return count


def update_all_plan_counts():
    """
    Update plan_count field for all existing Cutting Planning records
    """
    # Get all unique block numbers
    blocks = frappe.db.sql("""
        SELECT DISTINCT block_no 
        FROM `tabCutting Planning`
        WHERE docstatus < 2
    """, as_dict=True)
    
    for block in blocks:
        block_no = block.block_no
        # Get count for this block
        count = frappe.db.count('Cutting Planning', {
            'block_no': block_no,
            'docstatus': ['<', 2]
        })
        
        # Update all records for this block
        frappe.db.sql("""
            UPDATE `tabCutting Planning`
            SET plan_count = %s
            WHERE block_no = %s
        """, (str(count), block_no))
        
        frappe.msgprint(f"Updated {block_no}: {count} plans")
    
    frappe.db.commit()
    frappe.msgprint("All records updated successfully!")


# #-----------------filter-------------
# #------------------------------------
# #------------------------------------


# @frappe.whitelist()
# def save_stone_filter(filter_name, filter_data, existing_filter=None):
#     """
#     Save or update a stone filter.
#     Ensures filter_no is unique and numbering resets based on saved filters.
#     """

#     import json

#     if isinstance(filter_data, str):
#         filter_data = json.loads(filter_data)

#     requested_filter_no = filter_data.get("filter_no")

#     # -----------------------------
#     # 1. VALIDATION FOR NEW FILTER
#     # -----------------------------
#     if not existing_filter:  # new filter
#         # Prevent duplicate filter_no
#         if frappe.db.exists("Cutting Filter", requested_filter_no):
#             frappe.throw(
#                 _(f"Filter No {requested_filter_no} already exists. Please change the number.")
#             )

#         # Always assign next available clean number
#         filter_no = generate_filter_no()
#     else:
#         # -----------------------------
#         # 2. UPDATE MODE
#         # -----------------------------
#         doc = frappe.get_doc("Cutting Filter", existing_filter)

#         # If user changes filter_no manually → prevent duplicates
#         if doc.filter_no != requested_filter_no:
#             if frappe.db.exists("Cutting Filter", requested_filter_no):
#                 frappe.throw(
#                     _(f"Filter No {requested_filter_no} already exists. Please use another number.")
#                 )

#         filter_no = requested_filter_no

#     # -----------------------------
#     # 3. SAVE OR UPDATE DOCUMENT
#     # -----------------------------

#     if existing_filter:
#         doc = frappe.get_doc("Cutting Filter", existing_filter)
#     else:
#         doc = frappe.new_doc("Cutting Filter")

#     doc.filter_no = filter_no
#     doc.project = filter_data.get("project", "")
#     doc.main_part = filter_data.get("main_part", "")
#     doc.sub_part = filter_data.get("sub_part", "")
#     doc.stone_name = filter_data.get("stone_name", "")
#     doc.l1_filter_type = filter_data.get("l1_filter_type", "")
#     doc.b1_filter_type = filter_data.get("b1_filter_type", "")
#     doc.h1_filter_type = filter_data.get("h1_filter_type", "")

#     doc.save(ignore_permissions=True)
#     frappe.db.commit()

#     frappe.msgprint(_(f"Filter '{doc.filter_no}' saved successfully"))
#     return doc.filter_no




# =====================================================================
# ENHANCED FILTER SAVING - SUPPORT NEW FIELDS
# =====================================================================

@frappe.whitelist()
def save_stone_filter(filter_name, filter_data, existing_filter=None):
    """
    Save or update a stone filter with enhanced dimension support
    """
    import json

    if isinstance(filter_data, str):
        filter_data = json.loads(filter_data)

    requested_filter_no = filter_data.get("filter_no")

    if not existing_filter:
        if frappe.db.exists("Cutting Filter", requested_filter_no):
            frappe.throw(
                _(f"Filter No {requested_filter_no} already exists. Please change the number.")
            )
        filter_no = generate_filter_no()
    else:
        doc = frappe.get_doc("Cutting Filter", existing_filter)
        if doc.filter_no != requested_filter_no:
            if frappe.db.exists("Cutting Filter", requested_filter_no):
                frappe.throw(
                    _(f"Filter No {requested_filter_no} already exists. Please use another number.")
                )
        filter_no = requested_filter_no

    if existing_filter:
        doc = frappe.get_doc("Cutting Filter", existing_filter)
    else:
        doc = frappe.new_doc("Cutting Filter")

    # Basic fields
    doc.filter_no = filter_no
    doc.project = filter_data.get("project", "")
    doc.main_part = filter_data.get("main_part", "")
    doc.sub_part = filter_data.get("sub_part", "")
    doc.stone_name = filter_data.get("stone_name", "")
    
    # Dimension filter types
    doc.l1_filter_type = filter_data.get("l1_filter_type", "None")
    doc.b1_filter_type = filter_data.get("b1_filter_type", "None")
    doc.h1_filter_type = filter_data.get("h1_filter_type", "None")
    
    # NEW: Store dimension values for Above/Below/Between
    doc.l1_below = filter_data.get("l1_below", 0)
    doc.l1_above = filter_data.get("l1_above", 0)
    doc.l1_between_from = filter_data.get("l1_between_from", 0)
    doc.l1_between_to = filter_data.get("l1_between_to", 0)
    
    doc.b1_below = filter_data.get("b1_below", 0)
    doc.b1_above = filter_data.get("b1_above", 0)
    doc.b1_between_from = filter_data.get("b1_between_from", 0)
    doc.b1_between_to = filter_data.get("b1_between_to", 0)
    
    doc.h1_below = filter_data.get("h1_below", 0)
    doc.h1_above = filter_data.get("h1_above", 0)
    doc.h1_between_from = filter_data.get("h1_between_from", 0)
    doc.h1_between_to = filter_data.get("h1_between_to", 0)

    doc.save(ignore_permissions=True)
    frappe.db.commit()

    frappe.msgprint(_(f"Filter '{doc.filter_no}' saved successfully"))
    return doc.filter_no

# @frappe.whitelist()
# def load_stone_filter(filter_name):
#     """
#     Load a saved filter by name from Cutting Filter doctype.
#     """
#     if not filter_name:
#         return None
    
#     try:
#         doc = frappe.get_doc("Cutting Filter", filter_name)
        
#         # Return filter data as dictionary
#         filter_data = {
#             'filter_no': doc.filter_no,
#             'project': doc.project or '',
#             'main_part': doc.main_part or '',
#             'sub_part': doc.sub_part or '',
#             'stone_name': doc.stone_name or '',
#             'l1_filter_type': doc.l1_filter_type or 'None',
#             'b1_filter_type': doc.b1_filter_type or 'None',
#             'h1_filter_type': doc.h1_filter_type or 'None'
#         }
        
#         return filter_data
        
#     except Exception as e:
#         frappe.log_error(f"Error loading filter: {str(e)}", "Load Stone Filter Error")
#         return None


@frappe.whitelist()
def load_stone_filter(filter_name):
    """
    Load a saved filter with all dimension values
    """
    if not filter_name:
        return None
    
    try:
        doc = frappe.get_doc("Cutting Filter", filter_name)
        
        filter_data = {
            'filter_no': doc.filter_no,
            'project': doc.project or '',
            'main_part': doc.main_part or '',
            'sub_part': doc.sub_part or '',
            'stone_name': doc.stone_name or '',
            
            'l1_filter_type': doc.l1_filter_type or 'None',
            'l1_below': doc.l1_below or 0,
            'l1_above': doc.l1_above or 0,
            'l1_between_from': doc.l1_between_from or 0,
            'l1_between_to': doc.l1_between_to or 0,
            
            'b1_filter_type': doc.b1_filter_type or 'None',
            'b1_below': doc.b1_below or 0,
            'b1_above': doc.b1_above or 0,
            'b1_between_from': doc.b1_between_from or 0,
            'b1_between_to': doc.b1_between_to or 0,
            
            'h1_filter_type': doc.h1_filter_type or 'None',
            'h1_below': doc.h1_below or 0,
            'h1_above': doc.h1_above or 0,
            'h1_between_from': doc.h1_between_from or 0,
            'h1_between_to': doc.h1_between_to or 0
        }
        
        return filter_data
        
    except Exception as e:
        frappe.log_error(f"Error loading filter: {str(e)}", "Load Stone Filter Error")
        return None


@frappe.whitelist()
def get_saved_filters():
    """
    Get list of all saved filter names from Cutting Filter doctype.
    """
    filters = frappe.get_all("Cutting Filter", fields=['filter_no'], order_by='modified desc')
    return [f.filter_no for f in filters] if filters else []


@frappe.whitelist()
def get_saved_filters_with_data():
    """
    Get list of all filters with their data from Cutting Filter doctype.
    Returns list with filter_name and extracted project info.
    """
    filters = frappe.get_all("Cutting Filter", 
                            fields=['name', 'filter_no', 'project', 'main_part', 'sub_part', 'stone_name'],
                            order_by='modified desc')
    
    result = []
    for filter_doc in filters:
        result.append({
            "filter_name": filter_doc.filter_no or filter_doc.name,
            "project": filter_doc.project or '',
            "data": {
                'filter_no': filter_doc.filter_no,
                'project': filter_doc.project,
                'main_part': filter_doc.main_part,
                'sub_part': filter_doc.sub_part,
                'stone_name': filter_doc.stone_name
            }
        })
    
    return result


@frappe.whitelist()
def delete_stone_filter(filter_name):
    """
    Delete a saved filter from Cutting Filter doctype.
    """
    if not filter_name:
        return False
    
    try:
        frappe.delete_doc("Cutting Filter", filter_name, ignore_permissions=True)
        frappe.db.commit()
        return True
    except Exception as e:
        frappe.log_error(f"Error deleting filter: {str(e)}", "Delete Stone Filter Error")
        return False


@frappe.whitelist()
def generate_filter_no():
    """
    Generate next filter number WITHOUT increasing any DB series.
    Only checks saved Cutting Filter records.
    """

    last = frappe.db.sql("""
        SELECT filter_no
        FROM `tabCutting Filter`
        WHERE filter_no LIKE 'FILTER-%'
        ORDER BY CAST(SUBSTRING_INDEX(filter_no, '-', -1) AS UNSIGNED) DESC
        LIMIT 1
    """, as_dict=True)

    if not last:
        return "FILTER-1"

    try:
        num = int(last[0].filter_no.split('-')[1])
    except:
        num = 0

    return f"FILTER-{num + 1}"

@frappe.whitelist()
@frappe.validate_and_sanitize_search_inputs
def get_available_blocks(doctype, txt, searchfield, start, page_len, filters):
    """
    Get blocks that are ready for cutting planning and don't have a final plan yet.
    Excludes blocks where is_final_plan = 1 in any Cutting Planning record.
    Excludes blocks where cutting_started = 1 (used in Job Order).
    """
    return frappe.db.sql("""
        SELECT b.name, b.material_type, b.site, b.volume
        FROM `tabBlock` b
        WHERE b.status = 'Ready for Cutting Planning'
        AND (b.cutting_started IS NULL OR b.cutting_started = 0)
        AND b.name NOT IN (
            SELECT DISTINCT block_no 
            FROM `tabCutting Planning` 
            WHERE is_final_plan = 1 
            AND docstatus != 2
        )
        AND (b.name LIKE %(txt)s 
            OR b.material_type LIKE %(txt)s 
            OR b.site LIKE %(txt)s
            OR b.project_name LIKE %(txt)s)
        ORDER BY b.modified DESC
        LIMIT %(start)s, %(page_len)s
    """, {
        'txt': '%' + txt + '%',
        'start': start,
        'page_len': page_len
    })


@frappe.whitelist()
def get_plans_by_block(block_no):
    """
    Get all cutting plans for a specific block
    Returns plan details sorted by: final plan status (desc), wastage (asc), modified date (desc)
    """
    if not block_no:
        return []
    
    plans = frappe.db.sql("""
        SELECT 
            name,
            block_no,
            trial_no,
            block_volume,
            total_stone_volume,
            waste,
            is_final_plan,
            modified
        FROM `tabCutting Planning`
        WHERE block_no = %(block_no)s
        AND docstatus < 2
        ORDER BY is_final_plan DESC, waste ASC, modified DESC
    """, {'block_no': block_no}, as_dict=True)
    
    return plans


@frappe.whitelist()
def get_representative_plans():
    """
    Get one representative plan per block for list view
    Priority: 1) Final plan, 2) Lowest wastage, 3) Latest modified
    This ensures each block appears only once in the list view
    """
    plans = frappe.db.sql("""
        SELECT 
            cp1.name,
            cp1.block_no,
            cp1.trial_no,
            cp1.is_final_plan,
            cp1.waste,
            cp1.modified
        FROM `tabCutting Planning` cp1
        INNER JOIN (
            SELECT 
                block_no,
                CASE 
                    -- If there's a final plan, select it
                    WHEN MAX(CASE WHEN is_final_plan = 1 THEN name END) IS NOT NULL 
                    THEN MAX(CASE WHEN is_final_plan = 1 THEN name END)
                    -- Otherwise, select the plan with lowest wastage (and latest if tie)
                    ELSE (
                        SELECT name 
                        FROM `tabCutting Planning` cp2 
                        WHERE cp2.block_no = cp_sub.block_no 
                        AND cp2.docstatus < 2
                        ORDER BY cp2.waste ASC, cp2.modified DESC 
                        LIMIT 1
                    )
                END as representative_plan
            FROM `tabCutting Planning` cp_sub
            WHERE cp_sub.docstatus < 2
            GROUP BY block_no
        ) representatives ON cp1.name = representatives.representative_plan
        WHERE cp1.docstatus < 2
        ORDER BY cp1.modified DESC
    """, as_dict=True)
    
    return plans