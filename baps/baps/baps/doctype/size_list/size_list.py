# Copyright (c) 2025, Amax Consultancy Pvt Ltd and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from baps.utils.stone_log import create_stone_log

class SizeList(Document):
	pass


# Copyright (c) 2025, Ayush Patel and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
import string

class SizeList(Document):
    def after_insert(self):
        """Set initial status to 'Not Started' when a new Size List is created"""
        self.update_status()
    
    def validate(self):
        """Validate and calculate volume, then update status"""
        # Validate inches (must be ≤ 12)
        if (self.l2 or 0) > 12:
            frappe.throw("L2 (inches) cannot be greater than 12")
        if (self.b2 or 0) > 12:
            frappe.throw("B2 (inches) cannot be greater than 12")
        if (self.h2 or 0) > 12:
            frappe.throw("H2 (inches) cannot be greater than 12")
        
        # Calculate volume if not set
        if not self.volume:
            self.volume = self.calculate_volume()
        
        # Validate volume is not 0
        if self.volume == 0:
            frappe.throw("Volume cannot be 0. Please enter valid dimensions.")
        
        # Update status based on related fields
        self.update_status()
    
    def update_status(self):
        """
        Automatically update status based on Size List Creation Item fields:
        - If nothing set (no cutting_planning_id, no order_id, no stone_id): Not Started
        - If cutting_planning_id is set and stone_id is NOT set: Under Cutting
        - If order_id is set and stone_id is NOT set: Under Order
        - If stone_id is set: Under Pre Carving Inspection 
        """
        try:
            # Use direct SQL query for reliable results
            if self.creation_item:
                item = frappe.db.sql("""
                    SELECT cutting_planning_id, order_id, stone_id
                    FROM `tabSize List Creation Item`
                    WHERE name = %s
                """, (self.creation_item,), as_dict=True)
            else:
                # Fallback to stone_code
                item = frappe.db.sql("""
                    SELECT cutting_planning_id, order_id, stone_id
                    FROM `tabSize List Creation Item`
                    WHERE stone_code = %s
                """, (self.stone_code,), as_dict=True)
            
            if not item or len(item) == 0:
                # No Size List Creation Item found, set to Not Started
                self.status = "Not Started"
                return
            
            # Get the first result
            item = item[0]
            cutting_planning_id = item.get("cutting_planning_id")
            order_id = item.get("order_id")
            stone_id = item.get("stone_id")
            
            # Helper function to check if field has a real value (not None, '', or 'None' string)
            def has_value(field):
                return field and field not in [None, '', 'None']
            
            # Determine status based on the conditions
            if has_value(stone_id):
                # Stone has been assigned (Under Pre Carving Inspection )
                self.status = "Under Pre Carving Inspection "
            elif has_value(cutting_planning_id) and not has_value(stone_id):
                # Cutting assigned but no stone yet (Under Cutting)
                self.status = "Under Cutting"
            elif has_value(order_id) and not has_value(stone_id):
                # Order placed but no stone yet (Under Order)
                self.status = "Under Order"
            else:
                # Nothing assigned yet (Not Started)
                self.status = "Not Started"
        
        except Exception as e:
            frappe.log_error(f"Error updating status for {self.stone_code}: {str(e)}", "Size List Status Update")
            self.status = "Not Started"
    
    def calculate_volume(self):
        """Calculate volume using formula: (l1 + l2/12) * (b1 + b2/12) * (h1 + h2/12)"""
        l = (self.l1 or 0) + (self.l2 or 0) / 12
        b = (self.b1 or 0) + (self.b2 or 0) / 12
        h = (self.h1 or 0) + (self.h2 or 0) / 12
        return round(l * b * h, 3)
    
    def before_save(self):
        """Check if split rows are cleared - if so, restore original"""
        if self.has_value_changed('split_rows'):
            if not self.split_rows or len(self.split_rows) == 0:
                # Split rows were cleared - trigger undo split
                self.handle_undo_split()
    
    def handle_undo_split(self):
        """Handle undo split operation when split_rows are cleared"""
        # This will be called automatically when split_rows are deleted
        # The restoration logic is handled in the undo_split_records method
        pass


def update_size_list_status_by_code(stone_code):
    """
    Update the status of a Size List record by stone code.
    This is a helper function called from other doctypes when they update
    cutting_planning_id, order_id, or stone_id fields.
    
    Args:
        stone_code: The stone code to update status for
    """
    try:
        # Get the Size List record
        if not frappe.db.exists("Size List", stone_code):
            return
        
        # Use direct SQL query to get Size List Creation Item data
        item = frappe.db.sql("""
            SELECT cutting_planning_id, order_id, stone_id
            FROM `tabSize List Creation Item`
            WHERE stone_code = %s
            LIMIT 1
        """, (stone_code,), as_dict=True)
        
        if not item or len(item) == 0:
            # No Size List Creation Item found, set to Not Started
            frappe.db.set_value("Size List", stone_code, "status", "Not Started", update_modified=False)
            return
        
        # Get the first result
        item = item[0]
        cutting_planning_id = item.get("cutting_planning_id")
        order_id = item.get("order_id")
        stone_id = item.get("stone_id")
        
        # Helper function to check if field has a real value
        def has_value(field):
            return field and field not in [None, '', 'None']
        
        # Determine status based on the conditions
        if has_value(stone_id):
            status = "Under Pre Carving Inspection "
        elif has_value(cutting_planning_id) and not has_value(stone_id):
            status = "Under Cutting"
        elif has_value(order_id) and not has_value(stone_id):
            status = "Under Order"
        else:
            status = "Not Started"
        
        # Update the status using db_set for efficiency
        frappe.db.set_value("Size List", stone_code, "status", status, update_modified=False)
        frappe.db.commit()
        
    except Exception as e:
        frappe.log_error(f"Error updating Size List status for {stone_code}: {str(e)}", "Update Size List Status By Code")


@frappe.whitelist()
def create_split_records(size_list_name, parts):
    """
    Split a Size List stone into multiple pieces.
    
    Args:
        size_list_name: Name of the Size List record to split
        parts: List of dictionaries containing dimensions for each split piece
    
    Returns:
        Dictionary with success status and message
    """
    try:
        # Parse parts if it's a JSON string
        if isinstance(parts, str):
            parts = frappe.parse_json(parts)
        
        # Get the original Size List document
        original_stone = frappe.get_doc("Size List", size_list_name)
        
        # Validation 1: Check if already split
        if original_stone.split_rows and len(original_stone.split_rows) > 0:
            return {
                "success": False,
                "error": "This stone has already been split. Please clear existing splits first."
            }
        
        # Validation 2: Minimum 2 parts
        if len(parts) < 2:
            return {
                "success": False,
                "error": "Minimum 2 split pieces required"
            }
        
        # Validation 3: Calculate volumes and validate total
        original_volume = calculate_volume_from_dict(original_stone)
        total_split_volume = 0
        
        for i, part in enumerate(parts):
            # Validate inches
            if (part.get('l2', 0) or 0) > 12:
                return {
                    "success": False,
                    "error": f"Row {i+1}: L2 (inches) cannot be greater than 12"
                }
            if (part.get('b2', 0) or 0) > 12:
                return {
                    "success": False,
                    "error": f"Row {i+1}: B2 (inches) cannot be greater than 12"
                }
            if (part.get('h2', 0) or 0) > 12:
                return {
                    "success": False,
                    "error": f"Row {i+1}: H2 (inches) cannot be greater than 12"
                }
            
            # Calculate volume
            part_volume = calculate_volume_from_dict(part)
            
            # Validate volume is not 0
            if part_volume == 0:
                return {
                    "success": False,
                    "error": f"Row {i+1}: Volume cannot be 0. Please enter valid dimensions."
                }
            
            part['volume'] = part_volume
            total_split_volume += part_volume
        
        # Round to 3 decimal places for comparison
        original_volume = round(original_volume, 3)
        total_split_volume = round(total_split_volume, 3)
        volume_difference = abs(original_volume - total_split_volume)
        
        # Calculate percentage difference
        if original_volume > 0:
            percentage_difference = (volume_difference / original_volume) * 100
        else:
            percentage_difference = 0
        
        # Allow up to 10% difference
        if percentage_difference > 10:
            return {
                "success": False,
                "error": f"Volume difference too large: Original={original_volume:.3f} cft, Total Split={total_split_volume:.3f} cft, Difference={volume_difference:.3f} cft ({percentage_difference:.2f}%). Maximum allowed: 10%"
            }
        
        # Generate stone codes with letter suffixes
        # Remove any existing letter suffix from the stone code
        base_stone_code = original_stone.stone_code
        
        # Strip trailing uppercase letters (existing suffixes like A, B, C, etc.)
        while base_stone_code and base_stone_code[-1].isupper() and base_stone_code[-1].isalpha():
            base_stone_code = base_stone_code[:-1]
        
        letter_suffixes = list(string.ascii_uppercase)
        
        if len(parts) > 26:
            return {
                "success": False,
                "error": "Maximum 26 split pieces allowed (A-Z)"
            }
        
        # Store split data in the original stone's split_rows
        # Clear existing split_rows completely
        original_stone.split_rows = []
        
        # Add new split rows with fresh data
        for part in parts:
            original_stone.append('split_rows', {
                'l1': part.get('l1', 0),
                'l2': part.get('l2', 0),
                'b1': part.get('b1', 0),
                'b2': part.get('b2', 0),
                'h1': part.get('h1', 0),
                'h2': part.get('h2', 0),
                'volume': part.get('volume', 0)
            })
        
        original_stone.flags.ignore_validate_update_after_submit = True
        original_stone.save(ignore_permissions=True)
        
        # Create new Size List records for each split piece
        new_stone_codes = []
        
        for i, part in enumerate(parts):
            new_code = f"{base_stone_code}{letter_suffixes[i]}"
            new_stone_codes.append(new_code)
            
            # Create new Size List entry
            new_stone = frappe.new_doc("Size List")
            new_stone.stone_code = new_code
            new_stone.stone_name = original_stone.stone_name
            new_stone.l1 = part.get('l1', 0)
            new_stone.l2 = part.get('l2', 0)
            new_stone.b1 = part.get('b1', 0)
            new_stone.b2 = part.get('b2', 0)
            new_stone.h1 = part.get('h1', 0)
            new_stone.h2 = part.get('h2', 0)
            new_stone.volume = part.get('volume', 0)
            
            # Copy reference fields from original
            new_stone.baps_project = original_stone.baps_project
            new_stone.main_part = original_stone.main_part
            new_stone.sub_part = original_stone.sub_part
            new_stone.cutting_region = original_stone.cutting_region
            new_stone.creation_ref = original_stone.creation_ref
            
            
            # IMPORTANT: Store parent stone reference
            # This links the split piece back to the original stone
            new_stone.parent_stone = original_stone.name
            
            # Mark as split piece
            new_stone.flags.ignore_permissions = True
            new_stone.insert(ignore_permissions=True)
        
        # Update Size List Creation Item table
        if original_stone.creation_ref and original_stone.creation_item:
            update_size_list_creation(
                original_stone.creation_ref,
                original_stone.creation_item,
                original_stone,
                parts,
                new_stone_codes
            )
        
        frappe.db.commit()
        
        return {
            "success": True,
            "message": f"Successfully split {base_stone_code} into {len(parts)} pieces",
            "new_codes": new_stone_codes
        }
        
    except Exception as e:
        frappe.log_error(f"Error in create_split_records: {str(e)}", "Split Stone Error")
        frappe.db.rollback()
        return {
            "success": False,
            "error": str(e)
        }


def update_size_list_creation(creation_ref, creation_item, original_stone, parts, new_stone_codes):
    """
    Update Size List Creation Item table with split pieces.
    Remove original row and add new split rows.
    
    Args:
        creation_ref: Size List Creation document name
        creation_item: Original Size List Creation Item row name
        original_stone: Original Size List document
        parts: List of split parts
        new_stone_codes: List of new stone codes
    """
    try:
        # Get Size List Creation document
        creation_doc = frappe.get_doc("Size List Creation", creation_ref)
        
        # Find the original item row index and store its data
        original_row_idx = None
        original_row_data = None
        
        for i, row in enumerate(creation_doc.stone_details):
            if row.name == creation_item:
                original_row_idx = i
                original_row_data = row
                break
        
        if original_row_idx is None:
            frappe.log_error(f"Original row not found: {creation_item}", "Split Update Error")
            return
        
        # Remove the original row
        creation_doc.remove(original_row_data)
        
        # Add new split rows using append (NOT insert)
        for i, (part, new_code) in enumerate(zip(parts, new_stone_codes)):
            creation_doc.append('stone_details', {
                'stone_code': new_code,
                'stone_name': original_stone.stone_name,
                'l1': part.get('l1', 0),
                'l2': part.get('l2', 0),
                'b1': part.get('b1', 0),
                'b2': part.get('b2', 0),
                'h1': part.get('h1', 0),
                'h2': part.get('h2', 0),
                'volume': part.get('volume', 0)
            })
        
        # Save the creation document
        creation_doc.save(ignore_permissions=True)
        
        frappe.msgprint(f"✅ Updated Size List Creation: {creation_ref} - Replaced 1 row with {len(parts)} split pieces")
        
    except Exception as e:
        frappe.log_error(f"Error updating Size List Creation: {str(e)}", "Split Update Error")
        # Don't throw error - split was successful, this is just sync issue
        frappe.msgprint(f"⚠️ Warning: Split completed but Size List Creation sync had an issue: {str(e)}", indicator='orange')


@frappe.whitelist()
def undo_split_records(size_list_name):
    """
    Undo a split operation - restore original stone and remove split pieces.
    
    Args:
        size_list_name: Name of the original Size List record
    
    Returns:
        Dictionary with success status and message
    """
    try:
        # Get the original Size List document
        original_stone = frappe.get_doc("Size List", size_list_name)
        
        if not original_stone.split_rows or len(original_stone.split_rows) == 0:
            return {
                "success": False,
                "error": "This stone has not been split"
            }
        
        # Generate list of split stone codes to delete
        base_code = original_stone.stone_code
        letter_suffixes = list(string.ascii_uppercase)
        
        split_count = len(original_stone.split_rows)
        split_codes = [f"{base_code}{letter_suffixes[i]}" for i in range(split_count)]
        
        # Delete all split Size List records
        deleted_count = 0
        for code in split_codes:
            if frappe.db.exists("Size List", {"stone_code": code}):
                frappe.delete_doc("Size List", {"stone_code": code}, force=True)
                deleted_count += 1
        
        # Clear split_rows from original stone
        original_stone.split_rows = []
        original_stone.save(ignore_permissions=True)
        
        # Restore original row in Size List Creation
        if original_stone.creation_ref and original_stone.creation_item:
            restore_size_list_creation(
                original_stone.creation_ref,
                original_stone,
                split_codes
            )
        
        frappe.db.commit()
        
        return {
            "success": True,
            "message": f"Successfully undid split - deleted {deleted_count} split pieces and restored original stone"
        }
        
    except Exception as e:
        frappe.log_error(f"Error in undo_split_records: {str(e)}", "Undo Split Error")
        frappe.db.rollback()
        return {
            "success": False,
            "error": str(e)
        }


def restore_size_list_creation(creation_ref, original_stone, split_codes):
    """
    Restore original row in Size List Creation and remove split rows.
    
    Args:
        creation_ref: Size List Creation document name
        original_stone: Original Size List document
        split_codes: List of split stone codes to remove
    """
    try:
        creation_doc = frappe.get_doc("Size List Creation", creation_ref)
        
        # Find and remove all split rows
        rows_to_remove = []
        
        for row in creation_doc.stone_details:
            if row.stone_code in split_codes:
                rows_to_remove.append(row)
        
        # Remove split rows using remove() method
        for row in rows_to_remove:
            creation_doc.remove(row)
        
        # Add back original row using append()
        creation_doc.append('stone_details', {
            'stone_code': original_stone.stone_code,
            'stone_name': original_stone.stone_name,
            'l1': original_stone.l1,
            'l2': original_stone.l2,
            'b1': original_stone.b1,
            'b2': original_stone.b2,
            'h1': original_stone.h1,
            'h2': original_stone.h2,
            'volume': original_stone.volume
        })
        
        creation_doc.save(ignore_permissions=True)
        
    except Exception as e:
        frappe.log_error(f"Error restoring Size List Creation: {str(e)}", "Restore Error")


def calculate_volume_from_dict(data):
    """
    Calculate volume from a dictionary or document object.
    Formula: (l1 + l2/12) * (b1 + b2/12) * (h1 + h2/12)
    l2, b2, h2 are in inches (must be divided by 12)
    """
    if isinstance(data, dict):
        l1 = data.get('l1', 0) or 0
        l2 = data.get('l2', 0) or 0
        b1 = data.get('b1', 0) or 0
        b2 = data.get('b2', 0) or 0
        h1 = data.get('h1', 0) or 0
        h2 = data.get('h2', 0) or 0
    else:
        l1 = getattr(data, 'l1', 0) or 0
        l2 = getattr(data, 'l2', 0) or 0
        b1 = getattr(data, 'b1', 0) or 0
        b2 = getattr(data, 'b2', 0) or 0
        h1 = getattr(data, 'h1', 0) or 0
        h2 = getattr(data, 'h2', 0) or 0
    
    length = l1 + l2 / 12
    breadth = b1 + b2 / 12
    height = h1 + h2 / 12
    
    return round(length * breadth * height, 3)