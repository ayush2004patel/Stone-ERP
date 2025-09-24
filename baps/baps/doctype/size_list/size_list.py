# import frappe
# from frappe import _
# from frappe.model.document import Document

# class SizeList(Document):
#     pass


# def autoname(doc, method):
#     if frappe.db.exists("Size List Creation", {"form_number": doc.form_number}):
#         frappe.throw(_("Form No must be unique"))
#     doc.name = doc.form_number


# def validate(doc, method):
#     total = 0
#     new_stone_details = []

#     # 🔹 Fetch linked Baps Project (if any)
#     project_chemical = 0
#     project_dry_fitting = 0
#     if doc.baps_project:
#         project = frappe.get_doc("Baps Project", doc.baps_project)
#         project_chemical = 1 if project.chemical else 0
#         project_dry_fitting = 1 if project.dry_fitting else 0

#     for d in doc.stone_details:
#         # --- Validation: l2, b2, h2 must be less than 12 ---
#         if (d.l2 or 0) >= 12:
#             frappe.throw(_("L2 (inches) must be less than 12 in row {0}").format(d.idx))
#         if (d.b2 or 0) >= 12:
#             frappe.throw(_("B2 (inches) must be less than 12 in row {0}").format(d.idx))
#         if (d.h2 or 0) >= 12:
#             frappe.throw(_("H2 (inches) must be less than 12 in row {0}").format(d.idx))

#         # --- Apply project checkboxes to child rows ---
#         if project_chemical:
#             d.chemical = 1
#         # else: keep whatever user set

#         if project_dry_fitting:
#             d.dry_fitting = 1
#         # else: keep whatever user set

#         # --- Handle Range Expansion ---
#         if d.range:
#             numbers = []

#             if "-" in d.range:
#                 try:
#                     start, end = d.range.split("-")
#                     start, end = int(start), int(end)
#                 except Exception:
#                     frappe.throw(_("Invalid range format in row {0}. Use like 001-003").format(d.idx))

#                 if start > end:
#                     frappe.throw(_("Range start cannot be greater than end in row {0}").format(d.idx))

#                 numbers = [i for i in range(start, end + 1)]

#             elif "," in d.range:
#                 try:
#                     numbers = [int(x.strip()) for x in d.range.split(",") if x.strip()]
#                 except Exception:
#                     frappe.throw(_("Invalid list format in row {0}. Use like 001,002,005").format(d.idx))

#             else:
#                 frappe.throw(_("Invalid range/list format in row {0}. Use like 001-003 or 001,002,005").format(d.idx))

#             prefix = d.stone_code or (d.stone_name or "").upper()

#             for i in numbers:
#                 new_row = {
#                     "stone_name": d.stone_name,
#                     "stone_code": f"{prefix}{i:03d}",
#                     "l1": d.l1, "l2": d.l2,
#                     "b1": d.b1, "b2": d.b2,
#                     "h1": d.h1, "h2": d.h2,
#                     "chemical": d.chemical,
#                     "dry_fitting": d.dry_fitting
#                 }

#                 # Calculate volume
#                 l = (new_row["l1"] or 0) + (new_row["l2"] or 0) / 12
#                 b = (new_row["b1"] or 0) + (new_row["b2"] or 0) / 12
#                 h = (new_row["h1"] or 0) + (new_row["h2"] or 0) / 12
#                 new_row["volume"] = round(l * b * h, 3)

#                 total += new_row["volume"]
#                 new_stone_details.append(new_row)

#         else:
#             # --- Normal row ---
#             l = (d.l1 or 0) + (d.l2 or 0) / 12
#             b = (d.b1 or 0) + (d.b2 or 0) / 12
#             h = (d.h1 or 0) + (d.h2 or 0) / 12
#             d.volume = round(l * b * h, 3)
#             total += d.volume
#             new_stone_details.append(d.as_dict())

#     # --- Replace child table with expanded rows ---
#     doc.stone_details = []
#     for row in new_stone_details:
#         doc.append("stone_details", row)

#     doc.total_volume = round(total, 3)













# import frappe
# from frappe import _
# from frappe.model.document import Document

# class SizeList(Document):
#     pass


# def autoname(doc, method):
#     if frappe.db.exists("Size List Creation", {"form_number": doc.form_number}):
#         frappe.throw(_("Form No must be unique"))
#     doc.name = doc.form_number


# def validate(doc, method):
#     total = 0
#     new_stone_details = []

#     # 🔹 Fetch linked Baps Project (if any)
#     project_chemical = 0
#     project_dry_fitting = 0
#     if doc.baps_project:
#         project = frappe.get_doc("Baps Project", doc.baps_project)
#         project_chemical = 1 if project.chemical else 0
#         project_dry_fitting = 1 if project.dry_fitting else 0

#     for d in doc.stone_details:
#         # --- Validation: l2, b2, h2 must be less than 12 ---
#         if (d.l2 or 0) >= 12:
#             frappe.throw(_("L2 (inches) must be less than 12 in row {0}").format(d.idx))
#         if (d.b2 or 0) >= 12:
#             frappe.throw(_("B2 (inches) must be less than 12 in row {0}").format(d.idx))
#         if (d.h2 or 0) >= 12:
#             frappe.throw(_("H2 (inches) must be less than 12 in row {0}").format(d.idx))

#         # --- Apply project checkboxes to child rows (always override) ---
#         if project_chemical:
#             d.chemical = 1
#         if project_dry_fitting:
#             d.dry_fitting = 1

#         # --- Handle Range Expansion ---
#         if d.range:
#             numbers = []

#             if "-" in d.range:
#                 try:
#                     start, end = d.range.split("-")
#                     start, end = int(start), int(end)
#                 except Exception:
#                     frappe.throw(_("Invalid range format in row {0}. Use like 001-003").format(d.idx))

#                 if start > end:
#                     frappe.throw(_("Range start cannot be greater than end in row {0}").format(d.idx))

#                 numbers = [i for i in range(start, end + 1)]

#             elif "," in d.range:
#                 try:
#                     numbers = [int(x.strip()) for x in d.range.split(",") if x.strip()]
#                 except Exception:
#                     frappe.throw(_("Invalid list format in row {0}. Use like 001,002,005").format(d.idx))

#             else:
#                 frappe.throw(_("Invalid range/list format in row {0}. Use like 001-003 or 001,002,005").format(d.idx))

#             prefix = d.stone_code or (d.stone_name or "").upper()

#             for i in numbers:
#                 new_row = {
#                     "stone_name": d.stone_name,
#                     "stone_code": f"{prefix}{i:03d}",
#                     "l1": d.l1, "l2": d.l2,
#                     "b1": d.b1, "b2": d.b2,
#                     "h1": d.h1, "h2": d.h2,
#                     "chemical": 1 if project_chemical else d.chemical,
#                     "dry_fitting": 1 if project_dry_fitting else d.dry_fitting
#                 }

#                 # Calculate volume
#                 l = (new_row["l1"] or 0) + (new_row["l2"] or 0) / 12
#                 b = (new_row["b1"] or 0) + (new_row["b2"] or 0) / 12
#                 h = (new_row["h1"] or 0) + (new_row["h2"] or 0) / 12
#                 new_row["volume"] = round(l * b * h, 3)

#                 total += new_row["volume"]
#                 new_stone_details.append(new_row)

#         else:
#             # --- Normal row ---
#             l = (d.l1 or 0) + (d.l2 or 0) / 12
#             b = (d.b1 or 0) + (d.b2 or 0) / 12
#             h = (d.h1 or 0) + (d.h2 or 0) / 12
#             d.volume = round(l * b * h, 3)
#             total += d.volume
#             new_stone_details.append(d.as_dict())

#     # --- Replace child table with expanded rows ---
#     doc.stone_details = []
#     for row in new_stone_details:
#         doc.append("stone_details", row)

#     doc.total_volume = round(total, 3)









# Copyright (c) 2025, Ayush Patel and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe import _

class SizeList(Document):
    def validate(self):
        """Validate the document before saving"""
        # Auto-generate form_number if not provided
        if not self.form_number:
            self.form_number = self.name
            
    def before_save(self):
        """Before saving the document"""
        # Update verification status for stones that have been processed
        self.update_stone_verification_status()
        
    def update_stone_verification_status(self):
        """Update verification status for stones based on verification results"""
        if not self.stone_details:
            return
            
        # Check if there's a verification document for this size list
        verification_docs = frappe.db.get_all(
            "Size List Verification",
            filters={"form_number": self.form_number},
            fields=["name"]
        )
        
        if verification_docs:
            verification_doc = frappe.get_doc("Size List Verification", verification_docs[0].name)
            
            # Update status based on verification results
            for size_row in self.stone_details:
                for ver_row in verification_doc.stone_details:
                    if (size_row.stone_code == ver_row.stone_code and 
                        size_row.stone_name == ver_row.stone_name):
                        
                        if ver_row.verified:
                            size_row.verification_status = "Approved"
                        elif ver_row.incorrect:
                            size_row.verification_status = "Incorrect"
                        else:
                            size_row.verification_status = "Pending"
                        break


# Whitelisted methods for client-side calls
@frappe.whitelist()
def get_stone_verification_status(size_list_name, stone_code, stone_name):
    """Get verification status for a specific stone"""
    try:
        size_list = frappe.get_doc("Size List", size_list_name)
        
        # Find verification document
        verification_docs = frappe.db.get_all(
            "Size List Verification",
            filters={"form_number": size_list.form_number},
            fields=["name"]
        )
        
        if not verification_docs:
            return {"status": "Not Verified", "verification_exists": False}
            
        verification_doc = frappe.get_doc("Size List Verification", verification_docs[0].name)
        
        # Find the stone in verification
        for row in verification_doc.stone_details:
            if row.stone_code == stone_code and row.stone_name == stone_name:
                if row.verified:
                    return {"status": "Approved", "verification_exists": True}
                elif row.incorrect:
                    return {"status": "Incorrect", "verification_exists": True}
                else:
                    return {"status": "Pending", "verification_exists": True}
        
        return {"status": "Not Found in Verification", "verification_exists": True}
        
    except Exception as e:
        frappe.log_error(f"Error getting stone verification status: {str(e)}")
        return {"status": "Error", "verification_exists": False}

@frappe.whitelist()
def update_stone_from_incorrect_verification(size_list_name, stone_code, stone_name, updated_data):
    """Update stone data when it's marked as incorrect in verification"""
    try:
        size_list = frappe.get_doc("Size List", size_list_name)
        
        # Find and update the stone
        for row in size_list.stone_details:
            if row.stone_code == stone_code and row.stone_name == stone_name:
                # Update the stone data
                for field, value in updated_data.items():
                    if hasattr(row, field):
                        setattr(row, field, value)
                
                # Reset verification status
                row.verification_status = "Pending"
                break
        
        size_list.save()
        frappe.db.commit()
        
        return {"success": True, "message": "Stone updated successfully"}
        
    except Exception as e:
        error_msg = f"Error updating stone data: {str(e)}"
        frappe.log_error(error_msg)
        return {"success": False, "message": error_msg}

@frappe.whitelist()
def get_verification_summary_for_size_list(size_list_name):
    """Get verification summary for stones in this size list"""
    try:
        size_list = frappe.get_doc("Size List", size_list_name)
        
        # Find verification document
        verification_docs = frappe.db.get_all(
            "Size List Verification",
            filters={"form_number": size_list.form_number},
            fields=["name"]
        )
        
        if not verification_docs:
            return {
                "success": True,
                "verification_exists": False,
                "message": "No verification document found"
            }
            
        verification_doc = frappe.get_doc("Size List Verification", verification_docs[0].name)
        
        total_stones = len(size_list.stone_details) if size_list.stone_details else 0
        verified_count = 0
        incorrect_count = 0
        pending_count = 0
        
        # Count verification status
        for size_row in size_list.stone_details:
            found_in_verification = False
            for ver_row in verification_doc.stone_details:
                if (size_row.stone_code == ver_row.stone_code and 
                    size_row.stone_name == ver_row.stone_name):
                    found_in_verification = True
                    if ver_row.verified:
                        verified_count += 1
                    elif ver_row.incorrect:
                        incorrect_count += 1
                    else:
                        pending_count += 1
                    break
            
            if not found_in_verification:
                pending_count += 1
        
        return {
            "success": True,
            "verification_exists": True,
            "data": {
                "total_stones": total_stones,
                "verified_count": verified_count,
                "incorrect_count": incorrect_count,
                "pending_count": pending_count,
                "completion_percentage": round((verified_count + incorrect_count) / total_stones * 100, 1) if total_stones > 0 else 0,
                "verification_complete": pending_count == 0,
                "verification_doc": verification_docs[0].name
            }
        }
        
    except Exception as e:
        error_msg = f"Error getting verification summary: {str(e)}"
        frappe.log_error(error_msg)
        return {"success": False, "message": error_msg}

@frappe.whitelist()
def create_verification_document(size_list_name):
    """Create Size List Verification document from Size List"""
    try:
        size_list = frappe.get_doc("Size List", size_list_name)
        
        # Check if verification already exists
        existing_verification = frappe.db.get_all(
            "Size List Verification",
            filters={"form_number": size_list.form_number},
            fields=["name"]
        )
        
        if existing_verification:
            return {
                "success": False,
                "message": f"Verification document already exists: {existing_verification[0].name}",
                "existing_doc": existing_verification[0].name
            }
        
        # Create new verification document
        verification_doc = frappe.new_doc("Size List Verification")
        verification_doc.form_number = size_list.form_number
        verification_doc.prep_date = size_list.prep_date
        verification_doc.material_type = getattr(size_list, 'material_type', None)
        verification_doc.baps_project = getattr(size_list, 'baps_project', None)
        verification_doc.project_name = getattr(size_list, 'project_name', None)
        verification_doc.main_part = getattr(size_list, 'main_part', None)
        verification_doc.sub_part = getattr(size_list, 'sub_part', None)
        verification_doc.total_volume_cft = getattr(size_list, 'total_volume_cft', None)
        verification_doc.cutting_region = getattr(size_list, 'cutting_region', None)
        verification_doc.polishing_required = getattr(size_list, 'polishing_required', 0)
        verification_doc.dry_fitting_required = getattr(size_list, 'dry_fitting_required', 0)
        verification_doc.carving_required = getattr(size_list, 'carving_required', 0)
        verification_doc.chemical_required = getattr(size_list, 'chemical_required', 0)
        verification_doc.approved_date = getattr(size_list, 'approved_date', None)
        verification_doc.checked_by = getattr(size_list, 'checked_by', None)
        
        # Copy stone details
        for stone in size_list.stone_details:
            verification_row = verification_doc.append("stone_details", {})
            verification_row.stone_name = stone.stone_name
            verification_row.stone_code = stone.stone_code
            verification_row.range = getattr(stone, 'range', None)
            verification_row.l1 = getattr(stone, 'l1', None)
            verification_row.l2 = getattr(stone, 'l2', None)
            verification_row.b1 = getattr(stone, 'b1', None)
            verification_row.b2 = getattr(stone, 'b2', None)
            verification_row.h1 = getattr(stone, 'h1', None)
            verification_row.h2 = getattr(stone, 'h2', None)
            verification_row.volume = getattr(stone, 'volume', None)
            verification_row.verified = 0
            verification_row.incorrect = 0
        
        verification_doc.save()
        frappe.db.commit()
        
        return {
            "success": True,
            "message": f"Verification document created successfully",
            "doc_name": verification_doc.name,
            "stone_count": len(size_list.stone_details) if size_list.stone_details else 0
        }
        
    except Exception as e:
        error_msg = f"Error creating verification document: {str(e)}"
        frappe.log_error(error_msg)
        return {"success": False, "message": error_msg}

@frappe.whitelist()
def get_stones_by_status(size_list_name, status):
    """Get stones filtered by verification status"""
    try:
        size_list = frappe.get_doc("Size List", size_list_name)
        
        # Find verification document
        verification_docs = frappe.db.get_all(
            "Size List Verification",
            filters={"form_number": size_list.form_number},
            fields=["name"]
        )
        
        if not verification_docs:
            return {"success": False, "message": "No verification document found"}
            
        verification_doc = frappe.get_doc("Size List Verification", verification_docs[0].name)
        
        stones = []
        
        for size_row in size_list.stone_details:
            stone_status = "Pending"  # Default status
            
            # Find status in verification
            for ver_row in verification_doc.stone_details:
                if (size_row.stone_code == ver_row.stone_code and 
                    size_row.stone_name == ver_row.stone_name):
                    if ver_row.verified:
                        stone_status = "Approved"
                    elif ver_row.incorrect:
                        stone_status = "Incorrect"
                    break
            
            # Filter by requested status
            if status == "All" or stone_status == status:
                stones.append({
                    "stone_name": size_row.stone_name,
                    "stone_code": size_row.stone_code,
                    "range": getattr(size_row, 'range', ''),
                    "volume": getattr(size_row, 'volume', 0),
                    "status": stone_status,
                    "l1": getattr(size_row, 'l1', ''),
                    "l2": getattr(size_row, 'l2', ''),
                    "b1": getattr(size_row, 'b1', ''),
                    "b2": getattr(size_row, 'b2', ''),
                    "h1": getattr(size_row, 'h1', ''),
                    "h2": getattr(size_row, 'h2', '')
                })
        
        return {
            "success": True,
            "stones": stones,
            "count": len(stones),
            "status_filter": status
        }
        
    except Exception as e:
        error_msg = f"Error getting stones by status: {str(e)}"
        frappe.log_error(error_msg)
        return {"success": False, "message": error_msg}

@frappe.whitelist()
def bulk_update_stone_status(size_list_name, stone_codes, new_status):
    """Bulk update verification status for multiple stones"""
    try:
        # Find verification document
        size_list = frappe.get_doc("Size List", size_list_name)
        verification_docs = frappe.db.get_all(
            "Size List Verification",
            filters={"form_number": size_list.form_number},
            fields=["name"]
        )
        
        if not verification_docs:
            return {"success": False, "message": "No verification document found"}
            
        verification_doc = frappe.get_doc("Size List Verification", verification_docs[0].name)
        
        updated_count = 0
        
        for stone_code in stone_codes:
            for ver_row in verification_doc.stone_details:
                if ver_row.stone_code == stone_code:
                    if new_status == "Approved":
                        ver_row.verified = 1
                        ver_row.incorrect = 0
                    elif new_status == "Incorrect":
                        ver_row.verified = 0
                        ver_row.incorrect = 1
                    else:  # Reset to pending
                        ver_row.verified = 0
                        ver_row.incorrect = 0
                    updated_count += 1
                    break
        
        verification_doc.save()
        frappe.db.commit()
        
        return {
            "success": True,
            "message": f"Updated {updated_count} stones to {new_status}",
            "updated_count": updated_count
        }
        
    except Exception as e:
        error_msg = f"Error bulk updating stone status: {str(e)}"
        frappe.log_error(error_msg)
        return {"success": False, "message": error_msg}

@frappe.whitelist()
def get_size_list_stats(size_list_name):
    """Get comprehensive statistics for a size list"""
    try:
        size_list = frappe.get_doc("Size List", size_list_name)
        
        # Basic stats
        total_stones = len(size_list.stone_details) if size_list.stone_details else 0
        total_volume = 0
        stone_types = {}
        range_distribution = {}
        
        if size_list.stone_details:
            for row in size_list.stone_details:
                # Volume calculation
                if hasattr(row, 'volume') and row.volume:
                    total_volume += float(row.volume)
                
                # Stone types
                if row.stone_name:
                    stone_types[row.stone_name] = stone_types.get(row.stone_name, 0) + 1
                
                # Range distribution
                if hasattr(row, 'range') and row.range:
                    range_distribution[row.range] = range_distribution.get(row.range, 0) + 1
        
        # Get verification stats
        verification_summary = get_verification_summary_for_size_list(size_list_name)
        
        return {
            "success": True,
            "stats": {
                "basic": {
                    "total_stones": total_stones,
                    "total_volume": round(total_volume, 2),
                    "average_volume": round(total_volume / total_stones, 2) if total_stones > 0 else 0,
                    "form_number": size_list.form_number,
                    "project_name": getattr(size_list, 'project_name', ''),
                    "prep_date": getattr(size_list, 'prep_date', ''),
                    "cutting_region": getattr(size_list, 'cutting_region', '')
                },
                "stone_types": stone_types,
                "range_distribution": range_distribution,
                "verification": verification_summary.get("data", {}) if verification_summary.get("success") else {}
            }
        }
        
    except Exception as e:
        error_msg = f"Error getting size list stats: {str(e)}"
        frappe.log_error(error_msg)
        return {"success": False, "message": error_msg}