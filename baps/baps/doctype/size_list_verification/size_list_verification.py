# Copyright (c) 2025, Ayush Patel and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class SizeListVerification(Document):
	pass








# Copyright (c) 2025, Ayush Patel and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe import _

class SizeListVerification(Document):
    def validate(self):
        """Validate the document before saving"""
        # Ensure only one status is checked per row
        self.validate_verification_status()
        
    def validate_verification_status(self):
        """Ensure only verified OR incorrect is checked, not both"""
        for row in self.stone_details:
            if row.verified and row.incorrect:
                frappe.throw(_("Row {0}: Cannot mark both 'Verified' and 'Incorrect' for stone {1}").format(
                    row.idx, row.stone_name or row.stone_code
                ))

    def on_update(self):
        """Handle workflow after document is saved"""
        self.process_verification_changes()
        
    def process_verification_changes(self):
        """Process approved/rejected stones and move them to appropriate doctypes"""
        # Check if Size List Generation DocType exists before processing
        generation_doctype_exists = frappe.db.exists("DocType", "Size List Generation")
        
        if not generation_doctype_exists:
            frappe.msgprint(
                title=_("Size List Generation Not Available"),
                msg=_("Size List Generation DocType is not installed. Only Size List status will be updated."),
                indicator="orange"
            )
        
        for row in self.stone_details:
            if row.verified:
                # Always update Size List status
                self.mark_size_list_row_approved(row)
                
                # Only move to generation if DocType exists
                if generation_doctype_exists:
                    self.move_to_generation(row)
                    
            elif row.incorrect:
                self.mark_size_list_row_incorrect(row)

    def move_to_generation(self, verification_row):
        """Move approved row to Size List Generation"""
        try:
            # Check if Size List Generation DocType exists
            if not frappe.db.exists("DocType", "Size List Generation"):
                frappe.log_error(f"Size List Generation DocType not found. Cannot move stone: {verification_row.stone_name}")
                return
            
            # Check if Size List Generation already exists for this form_number
            try:
                existing_docs = frappe.db.get_all(
                    "Size List Generation",
                    filters={"form_number": self.form_number},
                    fields=["name"],
                    limit=1
                )
                
                if existing_docs:
                    generation_doc = frappe.get_doc("Size List Generation", existing_docs[0].name)
                else:
                    # Create new Size List Generation document
                    generation_doc = frappe.new_doc("Size List Generation")
                    generation_doc.form_number = self.form_number
                    generation_doc.prep_date = self.prep_date
                    generation_doc.material_type = self.material_type
                    generation_doc.baps_project = self.baps_project
                    generation_doc.project_name = self.project_name
                    generation_doc.main_part = self.main_part
                    generation_doc.sub_part = self.sub_part
                    generation_doc.total_volume_cft = self.total_volume_cft
                    generation_doc.cutting_region = self.cutting_region
                    generation_doc.polishing_required = self.polishing_required
                    generation_doc.dry_fitting_required = self.dry_fitting_required
                    generation_doc.carving_required = self.carving_required
                    generation_doc.chemical_required = self.chemical_required
                    generation_doc.approved_date = self.approved_date
                    generation_doc.checked_by = self.checked_by
                    
            except frappe.DoesNotExistError:
                # Create new Size List Generation document
                generation_doc = frappe.new_doc("Size List Generation")
                generation_doc.form_number = self.form_number
                generation_doc.prep_date = self.prep_date
                generation_doc.material_type = self.material_type
                generation_doc.baps_project = self.baps_project
                generation_doc.project_name = self.project_name
                generation_doc.main_part = self.main_part
                generation_doc.sub_part = self.sub_part
                generation_doc.total_volume_cft = self.total_volume_cft
                generation_doc.cutting_region = self.cutting_region
                generation_doc.polishing_required = self.polishing_required
                generation_doc.dry_fitting_required = self.dry_fitting_required
                generation_doc.carving_required = self.carving_required
                generation_doc.chemical_required = self.chemical_required
                generation_doc.approved_date = self.approved_date
                generation_doc.checked_by = self.checked_by
            
            # Check if this stone already exists in generation doc
            existing_row = None
            if hasattr(generation_doc, 'stone_details') and generation_doc.stone_details:
                for gen_row in generation_doc.stone_details:
                    if (gen_row.stone_code == verification_row.stone_code and 
                        gen_row.stone_name == verification_row.stone_name):
                        existing_row = gen_row
                        break
                    
            if not existing_row:
                # Add new row to Size List Generation
                gen_row = generation_doc.append("stone_details", {})
                gen_row.stone_name = verification_row.stone_name
                gen_row.stone_code = verification_row.stone_code
                gen_row.range = verification_row.range
                gen_row.l1 = verification_row.l1
                gen_row.l2 = verification_row.l2
                gen_row.b1 = verification_row.b1
                gen_row.b2 = verification_row.b2
                gen_row.h1 = verification_row.h1
                gen_row.h2 = verification_row.h2
                gen_row.volume = verification_row.volume
                
            generation_doc.save(ignore_permissions=True)
            frappe.db.commit()
            
        except Exception as e:
            error_msg = f"Error moving stone to generation: {str(e)}"
            frappe.log_error(error_msg)
            # Don't raise the error, just log it so the verification can still save

    def mark_size_list_row_approved(self, verification_row):
        """Mark corresponding row in Size List as approved"""
        try:
            # Find Size List by form_number
            size_list_records = frappe.db.get_all(
                "Size List",
                filters={"form_number": self.form_number},
                fields=["name"],
                limit=1
            )
            
            if not size_list_records:
                frappe.log_error(f"Size List not found for form_number: {self.form_number}")
                return
                
            size_list_doc = frappe.get_doc("Size List", size_list_records[0].name)
            
            # Update verification status
            for size_row in size_list_doc.stone_details:
                if (size_row.stone_code == verification_row.stone_code and 
                    size_row.stone_name == verification_row.stone_name):
                    if hasattr(size_row, 'verification_status'):
                        size_row.verification_status = "Approved"
                    break
                    
            size_list_doc.save(ignore_permissions=True)
            frappe.db.commit()
            
        except Exception as e:
            error_msg = f"Error marking size list row as approved: {str(e)}"
            frappe.log_error(error_msg)
            # Don't raise the error, just log it

    def mark_size_list_row_incorrect(self, verification_row):
        """Mark corresponding row in Size List as incorrect and make it editable"""
        try:
            # Find Size List by form_number
            size_list_records = frappe.db.get_all(
                "Size List",
                filters={"form_number": self.form_number},
                fields=["name"],
                limit=1
            )
            
            if not size_list_records:
                frappe.log_error(f"Size List not found for form_number: {self.form_number}")
                return
                
            size_list_doc = frappe.get_doc("Size List", size_list_records[0].name)
            
            # Update verification status
            for size_row in size_list_doc.stone_details:
                if (size_row.stone_code == verification_row.stone_code and 
                    size_row.stone_name == verification_row.stone_name):
                    if hasattr(size_row, 'verification_status'):
                        size_row.verification_status = "Incorrect"
                    # Remove from Size List Generation if it exists
                    self.remove_from_generation(verification_row)
                    break
                    
            size_list_doc.save(ignore_permissions=True)
            frappe.db.commit()
            
        except Exception as e:
            error_msg = f"Error marking size list row as incorrect: {str(e)}"
            frappe.log_error(error_msg)
            # Don't raise the error, just log it
            
    def remove_from_generation(self, verification_row):
        """Remove stone from Size List Generation if it was previously approved"""
        try:
            # Check if Size List Generation DocType exists
            if not frappe.db.exists("DocType", "Size List Generation"):
                return
                
            # Find generation document
            existing_docs = frappe.db.get_all(
                "Size List Generation",
                filters={"form_number": self.form_number},
                fields=["name"],
                limit=1
            )
            
            if not existing_docs:
                return  # No generation document exists
                
            generation_doc = frappe.get_doc("Size List Generation", existing_docs[0].name)
            rows_to_remove = []
            
            if hasattr(generation_doc, 'stone_details') and generation_doc.stone_details:
                for idx, gen_row in enumerate(generation_doc.stone_details):
                    if (gen_row.stone_code == verification_row.stone_code and 
                        gen_row.stone_name == verification_row.stone_name):
                        rows_to_remove.append(idx)
                        
                # Remove rows in reverse order to maintain indices
                for idx in reversed(rows_to_remove):
                    generation_doc.remove(generation_doc.stone_details[idx])
                    
                generation_doc.save(ignore_permissions=True)
                frappe.db.commit()
                
        except Exception as e:
            error_msg = f"Error removing from generation: {str(e)}"
            frappe.log_error(error_msg)
            # Don't raise the error, just log it


# Whitelisted methods for client-side calls
@frappe.whitelist()
def get_size_list_with_details(size_list_name):
    """Get Size List document with stone details using elevated permissions"""
    try:
        # This function expects a document name, not form_number
        if frappe.db.exists("Size List", size_list_name):
            size_list = frappe.get_doc("Size List", size_list_name)
        else:
            return {"success": False, "message": f"Size List document not found: {size_list_name}"}

        # Get all available fields from the document
        data = {
            "name": size_list.name,
            "form_number": getattr(size_list, 'form_number', None) or size_list.name,
            "stone_details": []
        }
        
        # Map common fields with fallbacks
        field_mappings = [
            ('prep_date', ['prep_date', 'preparation_date', 'date']),
            ('stone_type', ['material_type', 'stone_type', 'material']),
            ('baps_project', ['baps_project', 'project']),
            ('project_name', ['project_name', 'project_title']),
            ('main_part', ['main_part', 'main_section']),
            ('sub_part', ['sub_part', 'sub_section']),
            ('total_volume', ['total_volume_cft', 'total_volume', 'volume']),
            ('cutting_region', ['cutting_region', 'region']),
            ('polishing', ['polishing_required', 'polishing']),
            ('dry_fitting', ['dry_fitting_required', 'dry_fitting']),
            ('carving', ['carving_required', 'carving']),
            ('chemical', ['chemical_required', 'chemical']),
            ('approved_date', ['approved_date', 'approval_date']),
            ('checked_by', ['checked_by', 'checker'])
        ]
        
        for target_field, source_fields in field_mappings:
            for source_field in source_fields:
                if hasattr(size_list, source_field):
                    data[target_field] = getattr(size_list, source_field)
                    break
                    
        # Handle stone details (child table)
        child_table_name = None
        for fieldname in ['stone_details', 'details', 'items', 'stones']:
            if hasattr(size_list, fieldname):
                child_table_name = fieldname
                break
                
        if child_table_name:
            child_table = getattr(size_list, child_table_name)
            for row in child_table:
                stone_detail = {}
                
                # Map stone detail fields with fallbacks
                stone_field_mappings = [
                    ('stone_name', ['stone_name', 'name', 'title']),
                    ('stone_code', ['stone_code', 'code', 'item_code']),
                    ('range', ['range', 'stone_range']),
                    ('l1', ['l1', 'length1', 'length_1']),
                    ('l2', ['l2', 'length2', 'length_2']),
                    ('b1', ['b1', 'breadth1', 'breadth_1', 'width1']),
                    ('b2', ['b2', 'breadth2', 'breadth_2', 'width2']),
                    ('h1', ['h1', 'height1', 'height_1']),
                    ('h2', ['h2', 'height2', 'height_2']),
                    ('volume', ['volume', 'total_volume', 'cubic_feet'])
                ]
                
                for target_field, source_fields in stone_field_mappings:
                    for source_field in source_fields:
                        if hasattr(row, source_field):
                            stone_detail[target_field] = getattr(row, source_field)
                            break
                    
                    # Set default if not found
                    if target_field not in stone_detail:
                        stone_detail[target_field] = None
                        
                data["stone_details"].append(stone_detail)

        return {
            "success": True,
            "data": data
        }
        
    except frappe.DoesNotExistError:
        return {"success": False, "message": f"Size List document not found: {size_list_name}"}
    except Exception as e:
        error_msg = f"Error in get_size_list_with_details: {str(e)}"
        frappe.log_error(error_msg)
        return {"success": False, "message": error_msg}

@frappe.whitelist()
def search_size_list_by_form_number(form_number):
    """Search Size List by form_number field - this is the main search function"""
    try:
        # Strategy 1: Search by form_number field (this is the correct approach)
        size_list_records = frappe.db.get_all(
            "Size List", 
            filters={"form_number": form_number}, 
            fields=["name", "form_number"],
            limit=1
        )
        
        if size_list_records:
            # Found by form_number field - use the document name to get full details
            return get_size_list_with_details(size_list_records[0].name)
        
        # Strategy 2: Search by name field directly (fallback)
        if frappe.db.exists("Size List", form_number):
            return get_size_list_with_details(form_number)
                
        # Strategy 3: Search with LIKE pattern for partial matches
        size_lists = frappe.db.sql("""
            SELECT name, form_number FROM `tabSize List` 
            WHERE form_number LIKE %s OR name LIKE %s
            ORDER BY creation DESC
            LIMIT 5
        """, (f"%{form_number}%", f"%{form_number}%"), as_dict=True)
        
        if size_lists:
            if len(size_lists) == 1:
                # Found exactly one match
                return get_size_list_with_details(size_lists[0].name)
            else:
                # Multiple matches found
                matches_info = "\n".join([
                    f"• {sl.name} (Form: {sl.form_number})" 
                    for sl in size_lists
                ])
                return {
                    "success": False, 
                    "message": f"Multiple matches found for '{form_number}':\n{matches_info}\n\nPlease use the exact form number."
                }
        
        # Strategy 4: Show available Size Lists
        available_lists = frappe.db.sql("""
            SELECT name, form_number FROM `tabSize List` 
            WHERE form_number IS NOT NULL AND form_number != ''
            ORDER BY creation DESC 
            LIMIT 10
        """, as_dict=True)
        
        if available_lists:
            available_msg = "Available Size Lists with Form Numbers:\n" + "\n".join([
                f"• Form Number: {sl.form_number} (Document: {sl.name})" 
                for sl in available_lists
            ])
        else:
            available_msg = "No Size Lists found with form numbers. Please create a Size List first."
        
        return {
            "success": False, 
            "message": f"Size List not found with form number: '{form_number}'\n\n{available_msg}"
        }
        
    except Exception as e:
        error_msg = f"Error in search_size_list_by_form_number: {str(e)}"
        frappe.log_error(error_msg)
        return {"success": False, "message": error_msg}

@frappe.whitelist()
def debug_size_list_structure():
    """Debug method to check Size List structure"""
    try:
        # Get the doctype meta
        meta = frappe.get_meta("Size List")
        fields = [f.fieldname for f in meta.fields]
        
        # Get a sample document
        sample_doc = frappe.db.get_all("Size List", limit=1)
        sample_data = {}
        
        if sample_doc:
            doc = frappe.get_doc("Size List", sample_doc[0].name)
            sample_data = {
                "name": doc.name,
                "available_fields": [f for f in fields if hasattr(doc, f) and getattr(doc, f) is not None]
            }
            
            # Check child tables
            for field in meta.fields:
                if field.fieldtype == "Table":
                    child_table = getattr(doc, field.fieldname, [])
                    if child_table:
                        sample_row = child_table[0]
                        child_meta = frappe.get_meta(field.options)
                        sample_data[f"{field.fieldname}_fields"] = [
                            f.fieldname for f in child_meta.fields 
                            if hasattr(sample_row, f.fieldname)
                        ]
        
        return {
            "success": True,
            "data": {
                "doctype_fields": fields,
                "sample_document": sample_data
            }
        }
        
    except Exception as e:
        return {"success": False, "message": str(e)}

@frappe.whitelist()
def list_size_lists_with_form_numbers():
    """List all Size Lists with their form numbers for debugging"""
    try:
        size_lists = frappe.db.sql("""
            SELECT name, form_number, creation, modified
            FROM `tabSize List`
            ORDER BY creation DESC
            LIMIT 20
        """, as_dict=True)
        
        return {
            "success": True,
            "count": len(size_lists),
            "size_lists": size_lists
        }
        
    except Exception as e:
        return {"success": False, "message": str(e)}

@frappe.whitelist()
def test_form_number_search(form_number):
    """Test function to debug form_number search"""
    try:
        results = {
            "search_term": form_number,
            "exact_form_number_match": None,
            "exact_name_match": None,
            "like_matches": [],
            "all_size_lists": []
        }
        
        # Test 1: Exact form_number match
        exact_match = frappe.db.get_all(
            "Size List", 
            filters={"form_number": form_number}, 
            fields=["name", "form_number"]
        )
        if exact_match:
            results["exact_form_number_match"] = exact_match[0]
        
        # Test 2: Exact name match
        if frappe.db.exists("Size List", form_number):
            results["exact_name_match"] = {"name": form_number, "exists": True}
        
        # Test 3: LIKE matches
        like_matches = frappe.db.sql("""
            SELECT name, form_number FROM `tabSize List`
            WHERE form_number LIKE %s OR name LIKE %s
            LIMIT 5
        """, (f"%{form_number}%", f"%{form_number}%"), as_dict=True)
        results["like_matches"] = like_matches
        
        # Test 4: All size lists for reference
        all_lists = frappe.db.sql("""
            SELECT name, form_number FROM `tabSize List`
            ORDER BY creation DESC
            LIMIT 10
        """, as_dict=True)
        results["all_size_lists"] = all_lists
        
        return {"success": True, "results": results}
        
    except Exception as e:
        return {"success": False, "message": str(e), "error": str(e)}

@frappe.whitelist()
def check_doctypes_status():
    """Check if all required DocTypes exist"""
    try:
        doctypes_status = {
            "Size List": frappe.db.exists("DocType", "Size List"),
            "Size List Verification": frappe.db.exists("DocType", "Size List Verification"),
            "Size List Generation": frappe.db.exists("DocType", "Size List Generation"),
            "Size List Details": frappe.db.exists("DocType", "Size List Details"),
            "Size List Verification Details": frappe.db.exists("DocType", "Size List Verification Details")
        }
        
        missing_doctypes = [dt for dt, exists in doctypes_status.items() if not exists]
        
        return {
            "success": True,
            "doctypes_status": doctypes_status,
            "all_exist": len(missing_doctypes) == 0,
            "missing_doctypes": missing_doctypes,
            "workflow_available": doctypes_status.get("Size List") and doctypes_status.get("Size List Verification")
        }
        
    except Exception as e:
        return {"success": False, "message": str(e)}

@frappe.whitelist()
def safe_verification_save(doc_name):
    """Safely save verification document with error handling"""
    try:
        doc = frappe.get_doc("Size List Verification", doc_name)
        
        # Check DocType status first
        status_check = check_doctypes_status()
        
        if not status_check.get("success"):
            return {"success": False, "message": "Error checking DocTypes"}
            
        # Save with appropriate workflow based on available DocTypes
        doc.save(ignore_permissions=True)
        
        return {
            "success": True,
            "message": "Verification saved successfully",
            "workflow_status": {
                "generation_available": status_check["doctypes_status"].get("Size List Generation", False),
                "missing_doctypes": status_check.get("missing_doctypes", [])
            }
        }
        
    except Exception as e:
        error_msg = f"Error saving verification: {str(e)}"
        frappe.log_error(error_msg)
        return {"success": False, "message": error_msg}

@frappe.whitelist()
def update_verification_status(docname, row_name, field_name, value):
    """Update verification status and handle mutual exclusion of checkboxes"""
    try:
        doc = frappe.get_doc("Size List Verification", docname)
        
        # Find the row
        target_row = None
        for row in doc.stone_details:
            if row.name == row_name:
                target_row = row
                break
                
        if not target_row:
            return {"success": False, "message": "Row not found"}
            
        # Update the field
        setattr(target_row, field_name, int(value))
        
        # Ensure mutual exclusion
        if field_name == "verified" and int(value):
            target_row.incorrect = 0
        elif field_name == "incorrect" and int(value):
            target_row.verified = 0
            
        doc.save()
        frappe.db.commit()
        
        return {"success": True, "message": "Status updated successfully"}
        
    except Exception as e:
        frappe.log_error(f"Error updating verification status: {str(e)}")
        return {"success": False, "message": str(e)}