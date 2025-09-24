# Copyright (c) 2025, Amax Consultancy Pvt Ltd and contributors
# For license information, please see license.txt

# import frappe
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

    def before_insert(self):
        """Before inserting new document"""
        pass

    def after_insert(self):
        """After inserting new document"""
        pass


# Whitelisted methods for client-side calls
@frappe.whitelist()
def get_approved_stones_from_verification(form_number):
    """Get approved stones from Size List Verification for the given form_number"""
    try:
        # Find Size List Verification document with the form_number
        verification_docs = frappe.db.get_all(
            "Size List Verification",
            filters={"form_number": form_number},
            fields=["name"],
            limit=1
        )
        
        if not verification_docs:
            return {
                "success": False, 
                "message": f"No Size List Verification found for form number: {form_number}"
            }
        
        verification_doc = frappe.get_doc("Size List Verification", verification_docs[0].name)
        
        # Get main form data
        generation_data = {
            "form_number": verification_doc.form_number,
            "prep_date": verification_doc.prep_date,
            "material_type": verification_doc.material_type,
            "baps_project": verification_doc.baps_project,
            "project_name": verification_doc.project_name,
            "main_part": verification_doc.main_part,
            "sub_part": verification_doc.sub_part,
            "total_volume_cft": verification_doc.total_volume_cft,
            "cutting_region": verification_doc.cutting_region,
            "polishing_required": verification_doc.polishing_required,
            "dry_fitting_required": verification_doc.dry_fitting_required,
            "carving_required": verification_doc.carving_required,
            "chemical_required": verification_doc.chemical_required,
            "approved_date": verification_doc.approved_date,
            "checked_by": verification_doc.checked_by,
            "stone_details": []
        }
        
        # Get only approved/verified stones
        approved_count = 0
        for row in verification_doc.stone_details:
            if row.verified:  # Only include verified stones
                stone_detail = {
                    "stone_name": row.stone_name,
                    "stone_code": row.stone_code,
                    "range": row.range,
                    "l1": row.l1,
                    "l2": row.l2,
                    "b1": row.b1,
                    "b2": row.b2,
                    "h1": row.h1,
                    "h2": row.h2,
                    "volume": row.volume
                }
                generation_data["stone_details"].append(stone_detail)
                approved_count += 1
        
        return {
            "success": True,
            "data": generation_data,
            "approved_count": approved_count,
            "total_count": len(verification_doc.stone_details) if verification_doc.stone_details else 0
        }
        
    except Exception as e:
        error_msg = f"Error in get_approved_stones_from_verification: {str(e)}"
        frappe.log_error(error_msg)
        return {"success": False, "message": error_msg}

@frappe.whitelist()
def auto_populate_from_verification(form_number, generation_doc_name=None):
    """Auto-populate Size List Generation from verified stones in Size List Verification"""
    try:
        # Get approved stones data
        result = get_approved_stones_from_verification(form_number)
        
        if not result["success"]:
            return result
            
        data = result["data"]
        
        # Check if Size List Generation document already exists
        if generation_doc_name:
            try:
                generation_doc = frappe.get_doc("Size List Generation", generation_doc_name)
            except frappe.DoesNotExistError:
                generation_doc = frappe.new_doc("Size List Generation")
        else:
            # Check if document exists by form_number
            existing_docs = frappe.db.get_all(
                "Size List Generation",
                filters={"form_number": form_number},
                fields=["name"],
                limit=1
            )
            
            if existing_docs:
                generation_doc = frappe.get_doc("Size List Generation", existing_docs[0].name)
            else:
                generation_doc = frappe.new_doc("Size List Generation")
        
        # Update main fields
        generation_doc.form_number = data["form_number"]
        generation_doc.prep_date = data["prep_date"]
        generation_doc.material_type = data["material_type"]
        generation_doc.baps_project = data["baps_project"]
        generation_doc.project_name = data["project_name"]
        generation_doc.main_part = data["main_part"]
        generation_doc.sub_part = data["sub_part"]
        generation_doc.total_volume_cft = data["total_volume_cft"]
        generation_doc.cutting_region = data["cutting_region"]
        generation_doc.polishing_required = data["polishing_required"]
        generation_doc.dry_fitting_required = data["dry_fitting_required"]
        generation_doc.carving_required = data["carving_required"]
        generation_doc.chemical_required = data["chemical_required"]
        generation_doc.approved_date = data["approved_date"]
        generation_doc.checked_by = data["checked_by"]
        
        # Clear existing stone details and add approved ones
        generation_doc.stone_details = []
        
        for stone_data in data["stone_details"]:
            row = generation_doc.append("stone_details", {})
            row.stone_name = stone_data["stone_name"]
            row.stone_code = stone_data["stone_code"]
            row.range = stone_data["range"]
            row.l1 = stone_data["l1"]
            row.l2 = stone_data["l2"]
            row.b1 = stone_data["b1"]
            row.b2 = stone_data["b2"]
            row.h1 = stone_data["h1"]
            row.h2 = stone_data["h2"]
            row.volume = stone_data["volume"]
        
        # Save the document
        generation_doc.save()
        frappe.db.commit()
        
        return {
            "success": True,
            "message": f"Successfully populated {result['approved_count']} approved stones out of {result['total_count']} total stones",
            "doc_name": generation_doc.name,
            "approved_count": result["approved_count"],
            "total_count": result["total_count"]
        }
        
    except Exception as e:
        error_msg = f"Error in auto_populate_from_verification: {str(e)}"
        frappe.log_error(error_msg)
        return {"success": False, "message": error_msg}

@frappe.whitelist()
def get_verification_summary(form_number):
    """Get verification summary for a given form number"""
    try:
        # Find Size List Verification document
        verification_docs = frappe.db.get_all(
            "Size List Verification",
            filters={"form_number": form_number},
            fields=["name"],
            limit=1
        )
        
        if not verification_docs:
            return {
                "success": False,
                "message": f"No Size List Verification found for form number: {form_number}"
            }
            
        verification_doc = frappe.get_doc("Size List Verification", verification_docs[0].name)
        
        total_stones = len(verification_doc.stone_details) if verification_doc.stone_details else 0
        verified_count = 0
        incorrect_count = 0
        pending_count = 0
        
        for row in verification_doc.stone_details:
            if row.verified:
                verified_count += 1
            elif row.incorrect:
                incorrect_count += 1
            else:
                pending_count += 1
        
        return {
            "success": True,
            "data": {
                "total_stones": total_stones,
                "verified_count": verified_count,
                "incorrect_count": incorrect_count,
                "pending_count": pending_count,
                "completion_percentage": round((verified_count + incorrect_count) / total_stones * 100, 1) if total_stones > 0 else 0,
                "verification_complete": pending_count == 0
            }
        }
        
    except Exception as e:
        error_msg = f"Error in get_verification_summary: {str(e)}"
        frappe.log_error(error_msg)
        return {"success": False, "message": error_msg}

@frappe.whitelist()
def check_form_number_exists(form_number):
    """Check if form_number exists in Size List Verification and get its status"""
    try:
        verification_docs = frappe.db.get_all(
            "Size List Verification",
            filters={"form_number": form_number},
            fields=["name", "creation", "modified"],
            limit=1
        )
        
        if not verification_docs:
            # Check if Size List exists
            size_list_exists = frappe.db.exists("Size List", {"form_number": form_number}) or frappe.db.exists("Size List", form_number)
            
            return {
                "success": True,
                "verification_exists": False,
                "size_list_exists": size_list_exists,
                "message": "Size List Verification not found" + (", but Size List exists" if size_list_exists else " and Size List also not found")
            }
        
        # Get verification summary
        summary_result = get_verification_summary(form_number)
        
        return {
            "success": True,
            "verification_exists": True,
            "verification_doc": verification_docs[0].name,
            "summary": summary_result["data"] if summary_result["success"] else None,
            "message": "Size List Verification found"
        }
        
    except Exception as e:
        error_msg = f"Error in check_form_number_exists: {str(e)}"
        frappe.log_error(error_msg)
        return {"success": False, "message": error_msg}