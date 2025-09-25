# Copyright (c) 2025, Amax Consultancy Pvt Ltd and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class SIzeListGeneration(Document):
	pass



# Copyright (c) 2025, Ayush Patel and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe import _

class SizeListGeneration(Document):
    def validate(self):
        """Validate the document before saving"""
        pass

@frappe.whitelist()
def get_approved_stones_from_verification(form_number):
    """Get only approved stones from Size List Verification - using same search pattern as verification"""
    try:
        # Use the same search strategy as Size List Verification
        # Strategy 1: Search by form_number field
        verification_records = frappe.db.get_all(
            "Size List Verification", 
            filters={"form_number": form_number}, 
            fields=["name", "form_number"],
            limit=1
        )
        
        if verification_records:
            verification_doc = frappe.get_doc("Size List Verification", verification_records[0].name)
        else:
            # Strategy 2: Search by name field directly (fallback)
            if frappe.db.exists("Size List Verification", form_number):
                verification_doc = frappe.get_doc("Size List Verification", form_number)
            else:
                # Strategy 3: Search with LIKE pattern
                verification_lists = frappe.db.sql("""
                    SELECT name, form_number FROM `tabSize List Verification` 
                    WHERE form_number LIKE %s OR name LIKE %s
                    ORDER BY creation DESC
                    LIMIT 5
                """, (f"%{form_number}%", f"%{form_number}%"), as_dict=True)
                
                if verification_lists:
                    if len(verification_lists) == 1:
                        verification_doc = frappe.get_doc("Size List Verification", verification_lists[0].name)
                    else:
                        # Multiple matches
                        matches_info = "\n".join([
                            f"• {vl.name} (Form: {vl.form_number})" 
                            for vl in verification_lists
                        ])
                        return {
                            "success": False, 
                            "message": f"Multiple Size List Verification matches found for '{form_number}':\n{matches_info}\n\nPlease use the exact form number."
                        }
                else:
                    # Strategy 4: Show available verification documents
                    available_verifications = frappe.db.sql("""
                        SELECT name, form_number FROM `tabSize List Verification` 
                        WHERE form_number IS NOT NULL AND form_number != ''
                        ORDER BY creation DESC 
                        LIMIT 10
                    """, as_dict=True)
                    
                    if available_verifications:
                        available_msg = "Available Size List Verifications:\n" + "\n".join([
                            f"• Form Number: {sv.form_number} (Document: {sv.name})" 
                            for sv in available_verifications
                        ])
                    else:
                        available_msg = "No Size List Verifications found. Please create and complete verification first."
                    
                    return {
                        "success": False, 
                        "message": f"Size List Verification not found with form number: '{form_number}'\n\n{available_msg}"
                    }
        
        # Now we have the verification document, extract data using same field mapping as verification
        generation_data = {
            "name": verification_doc.name,
            "form_number": verification_doc.form_number,
            "stone_details": []
        }
        
        # Map fields with same fallback logic as verification
        field_mappings = [
            ('prep_date', 'prep_date'),
            ('material_type', 'material_type'),
            ('baps_project', 'baps_project'),
            ('project_name', 'project_name'),
            ('main_part', 'main_part'),
            ('sub_part', 'sub_part'),
            ('total_volume_cft', 'total_volume_cft'),
            ('cutting_region', 'cutting_region'),
            ('polishing_required', 'polishing_required'),
            ('dry_fitting_required', 'dry_fitting_required'),
            ('carving_required', 'carving_required'),
            ('chemical_required', 'chemical_required'),
            ('approved_date', 'approved_date'),
            ('checked_by', 'checked_by')
        ]
        
        for target_field, source_field in field_mappings:
            if hasattr(verification_doc, source_field):
                generation_data[target_field] = getattr(verification_doc, source_field)
        
        # Get only VERIFIED/APPROVED stones from verification child table
        approved_count = 0
        total_count = len(verification_doc.stone_details) if verification_doc.stone_details else 0
        
        if verification_doc.stone_details:
            for row in verification_doc.stone_details:
                # Only include stones that are marked as VERIFIED
                if getattr(row, 'verified', 0):
                    approved_stone = {}
                    
                    # Map stone detail fields with same fallback logic
                    stone_field_mappings = [
                        ('stone_name', 'stone_name'),
                        ('stone_code', 'stone_code'),
                        ('range', 'range'),
                        ('l1', 'l1'),
                        ('l2', 'l2'),
                        ('b1', 'b1'),
                        ('b2', 'b2'),
                        ('h1', 'h1'),
                        ('h2', 'h2'),
                        ('volume', 'volume')
                    ]
                    
                    for target_field, source_field in stone_field_mappings:
                        if hasattr(row, source_field):
                            approved_stone[target_field] = getattr(row, source_field)
                        else:
                            approved_stone[target_field] = None
                    
                    generation_data["stone_details"].append(approved_stone)
                    approved_count += 1
        
        return {
            "success": True,
            "data": generation_data,
            "approved_count": approved_count,
            "total_count": total_count,
            "message": f"Found {approved_count} approved stones out of {total_count} total stones"
        }
        
    except Exception as e:
        error_msg = f"Error getting approved stones: {str(e)}"
        frappe.log_error(error_msg)
        return {"success": False, "message": error_msg}

@frappe.whitelist()
def debug_verification_search(form_number):
    """Debug function to check what verification documents exist"""
    try:
        results = {
            "search_term": form_number,
            "exact_form_number_match": None,
            "exact_name_match": None,
            "like_matches": [],
            "all_verifications": []
        }
        
        # Test 1: Exact form_number match
        exact_match = frappe.db.get_all(
            "Size List Verification", 
            filters={"form_number": form_number}, 
            fields=["name", "form_number", "creation"]
        )
        if exact_match:
            results["exact_form_number_match"] = exact_match[0]
        
        # Test 2: Exact name match
        if frappe.db.exists("Size List Verification", form_number):
            results["exact_name_match"] = {"name": form_number, "exists": True}
        
        # Test 3: LIKE matches
        like_matches = frappe.db.sql("""
            SELECT name, form_number, creation FROM `tabSize List Verification`
            WHERE form_number LIKE %s OR name LIKE %s
            LIMIT 5
        """, (f"%{form_number}%", f"%{form_number}%"), as_dict=True)
        results["like_matches"] = like_matches
        
        # Test 4: All verifications for reference
        all_verifications = frappe.db.sql("""
            SELECT name, form_number, creation FROM `tabSize List Verification`
            ORDER BY creation DESC
            LIMIT 10
        """, as_dict=True)
        results["all_verifications"] = all_verifications
        
        return {"success": True, "results": results}
        
    except Exception as e:
        return {"success": False, "message": str(e), "error": str(e)}