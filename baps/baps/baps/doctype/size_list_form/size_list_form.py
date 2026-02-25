# baps/baps/doctype/size_list/size_list.py
import frappe
from frappe.model.document import Document
from baps.utils.stone_log import create_stone_log


class SizeListForm(Document):

    # --------------------------
    # VALIDATION & TRIGGERS
    # --------------------------
    def validate(self):
        """Before saving — always calculate total volume"""
        self.calculate_total_volume()
        self.validate_zero_volume()
        self.validate_main_part_sub_part_relationship()
        
        # Update duplicate flags BEFORE checking (so flags are set even if validation fails)
        self.update_duplicate_flags()
        
        # Now check for duplicates (this may throw error)
        self.check_internal_duplicates()

    def validate_main_part_sub_part_relationship(self):
        """Validate that Sub Part belongs to the selected Main Part"""
        if self.sub_part and self.main_part:
            # Get the main_part value from the Sub Part doctype
            sub_part_main_part = frappe.db.get_value("Sub Part", self.sub_part, "main_part")
            
            if sub_part_main_part and sub_part_main_part != self.main_part:
                frappe.throw(
                    f"Invalid Sub Part selection. '{self.sub_part}' belongs to '{sub_part_main_part}', "
                    f"not to the selected Main Part '{self.main_part}'. Please select a valid Sub Part."
                )
        
        # If Sub Part is selected but Main Part is not, throw error
        if self.sub_part and not self.main_part:
            frappe.throw("Cannot select Sub Part without selecting Main Part first.")

    def check_internal_duplicates(self):
        """Check for duplicate stone codes within the current form while entering data"""
        if not self.stone_details or len(self.stone_details) == 0:
            return
        
        local_stone_codes = {}  # Track stone codes: {code: [row_numbers]}
        duplicate_info = []
        
        for idx, row in enumerate(self.stone_details):
            stone_range = getattr(row, 'range', '') or ''
            stone_code_prefix = getattr(row, 'stone_code', '') or ''
            
            if not stone_range or not stone_range.strip() or not stone_code_prefix:
                continue
            
            # Use the entire stone code as prefix (supports alphanumeric like FFTAB1, ABC123, etc.)
            prefix = stone_code_prefix.strip().upper()
            
            # Expand the range to get individual numbers
            range_numbers = expand_range(stone_range.strip())
            
            # Generate stone codes by appending zero-padded range numbers
            for num in range_numbers:
                potential_code = f"{prefix}{str(num).zfill(3)}"
                
                # Check if this code already exists in our tracking
                if potential_code in local_stone_codes:
                    duplicate_info.append({
                        'code': potential_code,
                        'current_row': idx + 1,
                        'duplicate_rows': local_stone_codes[potential_code],
                        'stone_name': row.stone_name or 'N/A',
                        'range': stone_range
                    })
                else:
                    local_stone_codes[potential_code] = []
                
                local_stone_codes[potential_code].append(idx + 1)
        
        # Show error if internal duplicates found
        if duplicate_info:
            # Group by code to avoid repetition
            seen_codes = {}
            for dup in duplicate_info:
                code = dup['code']
                if code not in seen_codes:
                    seen_codes[code] = set(dup['duplicate_rows'])
                else:
                    seen_codes[code].update(dup['duplicate_rows'])
            
            # Build short message
            total = len(seen_codes)
            sample_code = list(seen_codes.keys())[0] if seen_codes else ""
            sample_rows = seen_codes[sample_code] if sample_code else set()
            
    def update_duplicate_flags(self):
        """Update duplicate flags based on overlapping expanded stone codes (internal + cross-form duplicates)"""
        if not self.stone_details or len(self.stone_details) == 0:
            return
        
        # First, reset all flags to 0
        for row in self.stone_details:
            row.duplicate_flag = 0
        
        # Track expanded stone codes: {stone_code: [row_indices]}
        local_stone_codes = {}
        
        # Build a map of all stone codes and which rows they appear in
        for idx, row in enumerate(self.stone_details):
            stone_range = getattr(row, 'range', '') or ''
            stone_code_prefix = getattr(row, 'stone_code', '') or ''
            
            if not stone_range or not stone_range.strip() or not stone_code_prefix:
                continue
            
            # Use the entire stone code as prefix (supports alphanumeric like FFTAB1, ABC123, etc.)
            prefix = stone_code_prefix.strip().upper()
            
            # Expand the range to get individual numbers
            range_numbers = expand_range(stone_range.strip())
            
            # Generate stone codes and track them by row index
            for num in range_numbers:
                potential_code = f"{prefix}{str(num).zfill(3)}"
                
                if potential_code not in local_stone_codes:
                    local_stone_codes[potential_code] = []
                
                # Store the row index instead of row.name
                local_stone_codes[potential_code].append(idx)
        
        # Mark internal duplicates only (code appears in multiple rows within same form)
        for code, row_indices in local_stone_codes.items():
            if len(row_indices) > 1:  # Code appears in multiple rows
                # Mark all rows with this code as duplicate
                for idx in row_indices:
                    self.stone_details[idx].duplicate_flag = 1

    def update_cross_form_duplicate_flags(self):
        """Update duplicate flags for cross-form duplicates - only called during verification"""
        if not self.baps_project or not self.name:
            return
        
        # Get cross-form duplicates
        cross_form_duplicates = self.check_cross_form_duplicates_silent()
        
        if cross_form_duplicates:
            # Mark rows that have cross-form duplicates
            for idx, row in enumerate(self.stone_details):
                stone_range = getattr(row, 'range', '') or ''
                stone_code_prefix = getattr(row, 'stone_code', '') or ''
                
                if not stone_range or not stone_range.strip() or not stone_code_prefix:
                    continue
                
                prefix = stone_code_prefix.strip().upper()
                range_numbers = expand_range(stone_range.strip())
                
                # Check if any code from this row exists in cross_form_duplicates
                for num in range_numbers:
                    potential_code = f"{prefix}{str(num).zfill(3)}"
                    if potential_code in cross_form_duplicates:
                        self.stone_details[idx].duplicate_flag = 1
                        break  # No need to check other codes in this row

    def check_internal_duplicates_silent(self):
        """Check for duplicate stone codes within the current form - returns True/False without showing message
        Note: Checks for overlapping expanded stone codes (e.g., FFTAB001)"""
        if not self.stone_details or len(self.stone_details) == 0:
            return False

        local_stone_codes = set()
        for row in self.stone_details:
            stone_range = getattr(row, 'range', '') or ''
            stone_code_prefix = getattr(row, 'stone_code', '') or ''

            # Skip if range or stone_code is empty
            if not stone_range or not stone_range.strip() or not stone_code_prefix:
                continue

            # Get the alphabetic prefix
            prefix = stone_code_prefix.strip().upper()
            
            # Expand the range to get individual numbers
            range_numbers = expand_range(stone_range.strip())
            
            # Generate stone codes and check for duplicates
            for num in range_numbers:
                potential_code = f"{prefix}{str(num).zfill(3)}"
                
                # Check if this code already exists
                if potential_code in local_stone_codes:
                    return True  # Duplicate stone code found
                    
                local_stone_codes.add(potential_code)

        return False

    def check_cross_form_duplicates_silent(self):
        """Check if stone codes already exist in other Size List Forms - returns dict of duplicates"""
        if not self.stone_details or not self.baps_project:
            return {}
        
        # Build set of all expanded stone codes from current form
        current_codes = set()
        for row in self.stone_details:
            stone_range = getattr(row, 'range', '') or ''
            stone_code_prefix = getattr(row, 'stone_code', '') or ''
            
            if not stone_range or not stone_range.strip() or not stone_code_prefix:
                continue
            
            prefix = stone_code_prefix.strip().upper()
            range_numbers = expand_range(stone_range.strip())
            
            for num in range_numbers:
                potential_code = f"{prefix}{str(num).zfill(3)}"
                current_codes.add(potential_code)
        
        if not current_codes:
            return {}
        
        # Query other forms in the same project
        other_forms = frappe.db.sql("""
            SELECT d.stone_code, d.`range`, p.name as form_name, p.workflow_state
            FROM `tabSize List Details` d
            JOIN `tabSize List Form` p ON p.name = d.parent
            WHERE p.baps_project = %s
              AND p.name != %s
              AND p.docstatus != 2
              AND d.stone_code IS NOT NULL
              AND d.stone_code != ''
        """, (self.baps_project, self.name or "NEW"), as_dict=True)
        
        # Check for overlapping codes
        duplicates_found = {}  # {code: [(form, state)]}
        
        for other_row in other_forms:
            if not other_row.stone_code or not other_row.range:
                continue
            
            prefix = other_row.stone_code.strip().upper()
            range_numbers = expand_range(other_row.range)
            
            for num in range_numbers:
                code = f"{prefix}{str(num).zfill(3)}"
                if code in current_codes:
                    if code not in duplicates_found:
                        duplicates_found[code] = []
                    duplicates_found[code].append((other_row.form_name, other_row.workflow_state or 'Draft'))
        
        return duplicates_found

    def check_creation_duplicates_silent(self):
        """Check if stone codes already exist in Size List Creation items - returns list of duplicates"""
        if not self.stone_details or not self.baps_project:
            return []
        
        # Build list of all expanded stone codes from current form
        current_codes = []
        for row in self.stone_details:
            stone_range = getattr(row, 'range', '') or ''
            stone_code_prefix = getattr(row, 'stone_code', '') or ''
            
            if not stone_range or not stone_range.strip() or not stone_code_prefix:
                continue
            
            prefix = stone_code_prefix.strip().upper()
            range_numbers = expand_range(stone_range.strip())
            
            for num in range_numbers:
                potential_code = f"{prefix}{str(num).zfill(3)}"
                current_codes.append(potential_code)
        
        if not current_codes:
            return []
        
        # Query Size List Creation Items (use batching for large lists)
        batch_size = 100
        all_existing = []
        
        for i in range(0, len(current_codes), batch_size):
            batch = current_codes[i:i + batch_size]
            placeholders = ",".join(["%s"] * len(batch))
            
            existing = frappe.db.sql(f"""
                SELECT DISTINCT c.stone_code, p.name as creation_name, p.form_number
                FROM `tabSize List Creation Item` c
                JOIN `tabSize List Creation` p ON p.name = c.parent
                WHERE p.baps_project = %s
                  AND p.form_number != %s
                  AND c.stone_code IN ({placeholders})
                  AND p.docstatus != 2
                ORDER BY c.stone_code
            """, tuple([self.baps_project, self.name or "NEW"] + batch), as_dict=True)
            
            all_existing.extend(existing)
        
        return all_existing

    def check_cross_form_duplicates(self):
        """Check if stone codes already exist in other Size List Forms in the same project"""
        if not self.stone_details or not self.baps_project:
            return
        
        # Build set of all expanded stone codes from current form
        current_codes = set()
        for row in self.stone_details:
            stone_range = getattr(row, 'range', '') or ''
            stone_code_prefix = getattr(row, 'stone_code', '') or ''
            
            if not stone_range or not stone_range.strip() or not stone_code_prefix:
                continue
            
            prefix = stone_code_prefix.strip().upper()
            range_numbers = expand_range(stone_range.strip())
            
            for num in range_numbers:
                potential_code = f"{prefix}{str(num).zfill(3)}"
                current_codes.add(potential_code)
        
        if not current_codes:
            return
        
        # Query other forms in the same project
        other_forms = frappe.db.sql("""
            SELECT d.stone_code, d.`range`, p.name as form_name, p.workflow_state
            FROM `tabSize List Details` d
            JOIN `tabSize List Form` p ON p.name = d.parent
            WHERE p.baps_project = %s
              AND p.name != %s
              AND p.docstatus != 2
              AND d.stone_code IS NOT NULL
              AND d.stone_code != ''
        """, (self.baps_project, self.name or "NEW"), as_dict=True)
        
        # Check for overlapping codes
        duplicates_found = {}  # {code: [(form, state)]}
        
        for other_row in other_forms:
            if not other_row.stone_code or not other_row.range:
                continue
            
            prefix = other_row.stone_code.strip().upper()
            range_numbers = expand_range(other_row.range)
            
            for num in range_numbers:
                code = f"{prefix}{str(num).zfill(3)}"
                if code in current_codes:
                    if code not in duplicates_found:
                        duplicates_found[code] = []
                    duplicates_found[code].append((other_row.form_name, other_row.workflow_state or 'Draft'))
        
        # If duplicates found, throw error
        if duplicates_found:
            msg = "<b>🚫 Cross-Form Duplicate Stone Codes Detected!</b><br><br>"
            msg += f"The following stone codes already exist in other forms within project <b>{self.baps_project}</b>:<br><br>"
            
            # Show first 15 duplicates
            for idx, (code, forms) in enumerate(list(duplicates_found.items())[:15]):
                form_info = forms[0]  # Show first occurrence
                msg += f"• <b>{code}</b> exists in <b>{form_info[0]}</b> (Status: {form_info[1]})<br>"
            
            if len(duplicates_found) > 15:
                msg += f"<br>...and {len(duplicates_found) - 15} more duplicate codes."
            
            msg += "<br><br>Please use different stone codes or ranges to avoid conflicts."
            
            frappe.throw(msg, title="Duplicate Stone Codes Across Forms")

    def check_creation_duplicates(self):
        """Check if stone codes already exist in Size List Creation items"""
        if not self.stone_details or not self.baps_project:
            return
        
        # Build list of all expanded stone codes from current form
        current_codes = []
        for row in self.stone_details:
            stone_range = getattr(row, 'range', '') or ''
            stone_code_prefix = getattr(row, 'stone_code', '') or ''
            
            if not stone_range or not stone_range.strip() or not stone_code_prefix:
                continue
            
            prefix = stone_code_prefix.strip().upper()
            range_numbers = expand_range(stone_range.strip())
            
            for num in range_numbers:
                potential_code = f"{prefix}{str(num).zfill(3)}"
                current_codes.append(potential_code)
        
        if not current_codes:
            return
        
        # Query Size List Creation Items
        # Use batching for large lists to avoid SQL query size limits
        batch_size = 100
        all_existing = []
        
        for i in range(0, len(current_codes), batch_size):
            batch = current_codes[i:i + batch_size]
            placeholders = ",".join(["%s"] * len(batch))
            
            existing = frappe.db.sql(f"""
                SELECT DISTINCT c.stone_code, p.name as creation_name, p.form_number
                FROM `tabSize List Creation Item` c
                JOIN `tabSize List Creation` p ON p.name = c.parent
                WHERE p.baps_project = %s
                  AND p.form_number != %s
                  AND c.stone_code IN ({placeholders})
                  AND p.docstatus != 2
                ORDER BY c.stone_code
            """, tuple([self.baps_project, self.name or "NEW"] + batch), as_dict=True)
            
            all_existing.extend(existing)
        
        # If duplicates found, throw error
        if all_existing:
            msg = "<b>🚫 Stone Codes Already Exist in Generated Size Lists!</b><br><br>"
            msg += f"The following stone codes are already in Size List Creation records for project <b>{self.baps_project}</b>:<br><br>"
            
            # Show first 15 duplicates
            for idx, dup in enumerate(all_existing[:15]):
                msg += f"• <b>{dup.stone_code}</b> in <b>{dup.creation_name}</b> (Form: {dup.form_number})<br>"
            
            if len(all_existing) > 15:
                msg += f"<br>...and {len(all_existing) - 15} more duplicate codes."
            
            msg += "<br><br>These stone codes have already been generated and cannot be reused.<br>"
            msg += "Please use different stone codes or ranges."
            
            frappe.throw(msg, title="Stone Codes Already Generated")

    def before_save(self):
        """Before saving - check workflow transitions and handle duplicates automatically"""
        # Get the current workflow state from DB
        if self.name:  # If document exists (not new)
            current_state = frappe.db.get_value("Size List Form", self.name, "workflow_state")
            new_state = getattr(self, "workflow_state", None)
            
            # If trying to move to Verified from Under Verification
            if current_state == "Under Verification" and new_state == "Verified":
                # Update cross-form duplicate flags during verification
                self.update_cross_form_duplicate_flags()
                
                # Check for internal duplicates within this form only
                has_internal_duplicates = self.check_internal_duplicates_silent()
                
                # Check for cross-form duplicates (other forms in same project)
                cross_form_duplicates = self.check_cross_form_duplicates_silent()
                has_cross_form_duplicates = len(cross_form_duplicates) > 0
                
                # Check for creation duplicates (already generated items)
                creation_duplicates = self.check_creation_duplicates_silent()
                has_creation_duplicates = len(creation_duplicates) > 0
                
                # If any duplicates exist, prevent verification
                if has_internal_duplicates or has_cross_form_duplicates or has_creation_duplicates:
                    # Store flag to handle after save
                    self._has_duplicates_to_rechange = True
                    # Store which type of duplicates were found
                    self._has_internal_dup = has_internal_duplicates
                    self._has_cross_form_dup = has_cross_form_duplicates
                    self._has_creation_dup = has_creation_duplicates
                    # Store duplicate details for message
                    if has_cross_form_duplicates:
                        self._cross_form_details = cross_form_duplicates
                    if has_creation_duplicates:
                        self._creation_details = creation_duplicates
                    # Prevent the verification by keeping it in Under Verification
                    self.workflow_state = "Under Verification"

    def auto_send_for_rechange_due_to_duplicates(self):
        """Automatically send document back to Under Rechange when duplicates found during verification"""
        try:
            # Uncheck verification checkboxes for rows with duplicates first
            self.uncheck_verification_for_duplicate_rows()
            
            # Update the workflow state directly in database (after document is saved)
            frappe.db.set_value("Size List Form", self.name, "workflow_state", "Under Rechange")
            frappe.db.commit()
            
            # Reload the document to reflect changes
            self.reload()
            
            # Build short message based on which duplicates were found
            msg_parts = []
            
            if getattr(self, '_has_internal_dup', False):
                msg_parts.append("Internal overlapping ranges")
            
            if getattr(self, '_has_cross_form_dup', False):
                if hasattr(self, '_cross_form_details'):
                    cross_dups = self._cross_form_details
                    dup_count = len(cross_dups)
                    sample_code = list(cross_dups.keys())[0] if cross_dups else ""
                    sample_form = cross_dups[sample_code][0][0] if cross_dups and sample_code else ""
                    
                    if dup_count == 1:
                        msg_parts.append(f"{sample_code} exists in {sample_form}")
                    else:
                        msg_parts.append(f"{dup_count} codes exist in other forms (e.g. {sample_code})")
            
            if getattr(self, '_has_creation_dup', False):
                if hasattr(self, '_creation_details'):
                    creation_dups = self._creation_details
                    dup_count = len(creation_dups)
                    sample_code = creation_dups[0].stone_code if creation_dups else ""
                    
                    if dup_count == 1:
                        msg_parts.append(f"{sample_code} already generated")
                    else:
                        msg_parts.append(f"{dup_count} codes already generated (e.g. {sample_code})")
            
            msg = "<b>Verification Failed - Duplicate Detected</b><br><br>"
            msg += "<br>".join([f"• {part}" for part in msg_parts])
            msg += "<br><br>Status changed to <b>Under Rechange</b>. Please correct and resubmit."
            
            # Show message to user
            frappe.msgprint(
                msg,
                indicator="red",
                title="Verification Failed"
            )
            
            # Clear the flags
            self._has_duplicates_to_rechange = False
            self._has_internal_dup = False
            self._has_cross_form_dup = False
            self._has_creation_dup = False
            if hasattr(self, '_cross_form_details'):
                delattr(self, '_cross_form_details')
            if hasattr(self, '_creation_details'):
                delattr(self, '_creation_details')
            
        except Exception as e:
            frappe.log_error(f"Error in auto_send_for_rechange_due_to_duplicates: {str(e)}")
            # Show message to user about manual action needed
            frappe.msgprint(
                f"⚠️ Duplicates found. Please manually use 'Send for Rechange' action. Error: {str(e)}",
                indicator="red",
                title="Manual Action Required"
            )

    def uncheck_verification_for_duplicate_rows(self):
        """Uncheck only range verification checkboxes for rows that have duplicates"""
        if not self.stone_details:
            return
            
        for row in self.stone_details:
            if getattr(row, 'duplicate_flag', 0) == 1:
                # Only uncheck range verification field for duplicate rows
                row.range_verified = 0
                
                # Update in database immediately (only range_verified)
                frappe.db.set_value("Size List Details", row.name, {
                    "range_verified": 0
                })

    def on_update(self):
        """When updated — if Verified, auto generate Size List Creation"""





        # =====================================================
        # 🔵 ACTIVITY LOG — SIZE LIST FORM PUBLISHED
        # =====================================================
        try:
            if self.has_value_changed("workflow_state"):

                old_doc = self.get_doc_before_save()
                old_state = old_doc.workflow_state if old_doc else None

                if self.workflow_state == "Published":

                    create_stone_log(
                        stone_code=None,
                        parent_stone=None,
                        block_number=None,
                        size_list=None,

                        activity_type="SIZELIST_PUBLISHED",
                        description=f"Size List Form {self.name} Published",

                        old_status=old_state,
                        new_status=self.workflow_state,

                        reference_doctype=self.doctype,
                        reference_docname=self.name
                    )

        except Exception:
            frappe.log_error(frappe.get_traceback(), "Size List Publish Log Error")






        # Handle duplicate rechange after save
        if hasattr(self, '_has_duplicates_to_rechange') and self._has_duplicates_to_rechange:
            self.auto_send_for_rechange_due_to_duplicates()
            return
            
        if getattr(self, "workflow_state", None) == "Verified":
            existing = frappe.db.get_value(
                "Size List Form", {"form_number": self.name}, "name"
            )
            if not existing:
                create_size_list_creation_from_verified(self.name)
    
    def onload(self):
        """Load verified Size List Creation Items into Tab 2"""
        self.load_verified_items()
    
    def load_verified_items(self):
        """Fetch and populate verified Size List Creation Items in table_item"""
        # Clear existing items in Tab 2
        self.table_item = []
        
        # Find Size List Creation record linked to this form
        size_list_creation = frappe.db.get_value(
            "Size List Creation",
            {"form_number": self.name},
            "name"
        )
        
        if not size_list_creation:
            return
        
        # Fetch all items from Size List Creation
        items = frappe.get_all(
            "Size List Creation Item",
            filters={"parent": size_list_creation},
            fields=["stone_code", "stone_name", "range", "l1", "l2", "b1", "b2", "h1", "h2", "volume"],
            order_by="idx"
        )
        
        # Populate table_item with fetched data
        for item in items:
            self.append("table_item", {
                "stone_code": item.stone_code,
                "stone_name": item.stone_name,
                "range": item.range,
                "l1": item.l1,
                "l2": item.l2,
                "b1": item.b1,
                "b2": item.b2,
                "h1": item.h1,
                "h2": item.h2,
                "volume": item.volume
            })

    def calculate_total_volume(self):
        """Sum up total volume from child table"""
        total = 0
        if hasattr(self, "stone_details") and self.stone_details:
            for row in self.stone_details:
                if row.volume:
                    total += row.volume
        self.total_volume = round(total, 3)


    def validate_zero_volume(self):
        """Reject saving if any stone detail has 0 or missing volume."""
        invalid_rows = []
        for row in getattr(self, "stone_details", []):
            if not row.volume or float(row.volume) == 0:
                invalid_rows.append(row.stone_name or row.stone_code or f"Row {row.idx}")

        if invalid_rows:
            msg = (
                "Stone data with 0 volume should not be accepted.<br>"
                "Please correct the following rows:<br><ul>"
            )
            for name in invalid_rows:
                msg += f"<li>{frappe.utils.escape_html(name)}</li>"
            msg += "</ul>"
            frappe.throw(msg, title="Invalid Volume Entries")

# =============================================================================
# PERMISSION CONTROL
# =============================================================================

def get_permission_query_conditions(user):
    if not user:
        user = frappe.session.user
    roles = frappe.get_roles(user)

    if "System Manager" in roles or user == "Administrator":
        return ""

    conditions = []

    if "Size List Data Entry Operator" in roles:
        conditions.append(
            "(`tabSize List Form`.`workflow_state` IN ('Draft','Submitted','Under Verification','Under Rechange','Verified','Published'))"
        )

    if "Size List Data Checker" in roles:
        conditions.append(
            "(`tabSize List Form`.`workflow_state` IN ('Submitted','Under Verification','Under Rechange','Verified','Published'))"
        )

    if "Project Manager" in roles:
        conditions.append("(`tabSize List Form`.`workflow_state` IN ('Verified','Published'))")

    return " OR ".join(conditions) if conditions else "1=0"


def has_permission(doc, ptype, user):
    if not user:
        user = frappe.session.user
    roles = frappe.get_roles(user)

    if "System Manager" in roles or user == "Administrator":
        return True

    state = doc.workflow_state
    owner = doc.owner

    if "Size List Data Entry Operator" in roles and state in [
        "Draft",
        "Submitted",
        "Under Verification",
        "Under Rechange",
        "Verified",
        "Published",
    ]:
        return True

    if "Size List Data Checker" in roles and state in [
        "Submitted",
        "Under Verification",
        "Under Rechange",
        "Verified",
    ]:
        return True

    if "Size List Project Manager" in roles and state in ["Verified", "Published"]:
        return True

    return False


# =============================================================================
# MAIN AUTO-GENERATION LOGIC (Phase 1 + Phase 2 Combined)
# =============================================================================

@frappe.whitelist()
def create_size_list_creation_from_verified(size_list_name):
    """Create Size List Creation after Size List is verified."""
    if not frappe.db.exists("Size List Form", size_list_name):
        frappe.throw("Size List Form not found.")

    size_list = frappe.get_doc("Size List Form", size_list_name)
    project = getattr(size_list, "baps_project", None)

    # --- Proceed to generate Size List Creation ---
    creation = frappe.new_doc("Size List Creation")
    creation.form_number = size_list.name
    creation.baps_project = project
    creation.baps_project = getattr(size_list, "baps_project", None)
    creation.prep_date = getattr(size_list, "prep_date", None)
    creation.stone_type = getattr(size_list, "stone_type", None)
    creation.main_part = getattr(size_list, "main_part", None)
    creation.sub_part = getattr(size_list, "sub_part", None)
    creation.cutting_region = getattr(size_list, "cutting_region", None)
    creation.status = "In Progress"

    total = 0
    for row in size_list.stone_details:
        codes = expand_range(row.range) if row.range else []
        prefix = "".join([c for c in (row.stone_code or "") if not c.isdigit()])
        for n in codes:
            code = f"{prefix}{str(n).zfill(3)}"
            creation.append(
                "stone_details",
                {
                    "stone_code": code,
                    "stone_name": row.stone_name,
                    "l1": row.l1,
                    "l2": row.l2,
                    "b1": row.b1,
                    "b2": row.b2,
                    "h1": row.h1,
                    "h2": row.h2,
                    "volume": row.volume,
                    "duplicate_flag": 0,
                },
            )
            total += 1

    creation.insert(ignore_permissions=True)
    frappe.db.commit()

    frappe.msgprint(
        f"✅ Size List generated successfully ({total} Records).",
        indicator="green",
    )
    return {"success": True, "creation": creation.name}


# =============================================================================
# DUPLICATE CHECKER (Phase 2)
# =============================================================================

@frappe.whitelist()
def check_global_duplicates(size_list_name):
    """
    Check for duplicate stone codes within the same Size List Form only.
    Checks for overlapping expanded stone codes (e.g., FFTAB001).
    """
    if not frappe.db.exists("Size List Form", size_list_name):
        return {"has_duplicates": False}

    doc = frappe.get_doc("Size List Form", size_list_name)
    
    # Check if document has any stone details
    if not doc.stone_details or len(doc.stone_details) == 0:
        return {"has_duplicates": False}
    
    # Check for duplicate stone codes within this document only
    has_duplicates = False
    local_stone_codes = {}  # Track stone codes: {code: row_name}

    for row in doc.stone_details:
        stone_range = getattr(row, 'range', '') or ''
        stone_code_prefix = getattr(row, 'stone_code', '') or ''
        row_has_dup = False
        
        # Check for overlapping stone codes
        if stone_range and stone_range.strip() and stone_code_prefix:
            # Get the alphabetic prefix
            prefix = stone_code_prefix.strip().upper()
            
            # Expand the range to get individual numbers
            range_numbers = expand_range(stone_range.strip())
            
            # Generate stone codes and check for duplicates
            for num in range_numbers:
                potential_code = f"{prefix}{str(num).zfill(3)}"
                
                # Check if this code already exists
                if potential_code in local_stone_codes:
                    row_has_dup = True
                    has_duplicates = True
                    # Mark the previous row as duplicate too
                    prev_row_name = local_stone_codes[potential_code]
                    frappe.db.set_value("Size List Details", prev_row_name, "duplicate_flag", 1)
                    break
                
                local_stone_codes[potential_code] = row.name

        # Update duplicate flag
        new_flag = 1 if row_has_dup else 0
        frappe.db.set_value("Size List Details", row.name, "duplicate_flag", new_flag)

    frappe.db.commit()
    return {"has_duplicates": has_duplicates}


# =============================================================================
# UTILITY
# =============================================================================



@frappe.whitelist()
def get_all_existing_stone_codes():
    """Get all stone codes from all Size List Creation items."""
    existing_codes = set()
    try:
        codes = frappe.db.sql_list("""
            SELECT stone_code 
            FROM `tabSize List Creation Item`
            WHERE stone_code IS NOT NULL AND stone_code != ''
        """)
        existing_codes.update([c.strip().upper() for c in codes if c])
    except Exception:
        frappe.log_error(frappe.get_traceback(), "Error fetching global codes")
    return existing_codes

def expand_range(rng):
    """Convert '1-5,8,10-12' → [1,2,3,4,5,8,10,11,12]."""
    result = []
    parts = [x.strip() for x in rng.split(",") if x.strip()]
    for p in parts:
        if "-" in p:
            try:
                s, e = map(int, p.split("-"))
                result.extend(range(s, e + 1))
            except Exception:
                pass
        else:
            try:
                result.append(int(p))
            except Exception:
                pass
    return result

def get_all_existing_stone_codes():
    """Get all stone codes from all Size List Creation items."""
    existing_codes = set()
    try:
        codes = frappe.db.sql_list("""
            SELECT stone_code 
            FROM `tabSize List Creation Item`
            WHERE stone_code IS NOT NULL AND stone_code != ''
        """)
        existing_codes.update([c.strip().upper() for c in codes if c])
    except Exception:
        frappe.log_error(frappe.get_traceback(), "Error fetching global codes")
    return existing_codes

@frappe.whitelist()
def get_duplicate_records_for_row(row_data, current_size_list):
    """
    Get duplicate records for a specific row.
    Checks across:
      ✅ Size List Creation
      ✅ Other Size List Forms
      ✅ Same Size List Form (internal duplicates)
    """
    try:
        row_data = frappe.parse_json(row_data) if isinstance(row_data, str) else row_data or {}

        if not row_data.get("baps_project"):
            return []

        all_duplicates = []
        
        # --- Build expanded stone codes ---
        expanded_codes = set()
        stone_code_raw = (row_data.get("stone_code") or "").strip()
        base_code = ''.join([ch for ch in stone_code_raw if not ch.isdigit()]).strip() if stone_code_raw else ""

        if row_data.get("range"):
            nums = expand_range(row_data.get("range") or "")
            for n in nums:
                code = f"{base_code}{str(n).zfill(3)}".upper() if base_code else str(n).zfill(3).upper()
                expanded_codes.add(code)
        else:
            if stone_code_raw:
                expanded_codes.add(stone_code_raw.upper())

        # Convert to list for SQL query
        codes_list = list(expanded_codes) if expanded_codes else []
        
        # --- Query 1: Duplicates in Size List Creation Items (expanded codes) ---
        if codes_list:
            placeholders = ",".join(["%s"] * len(codes_list))
            creation_sql = f"""
                SELECT
                    p.name AS source_document,
                    'Size List Creation' AS source_type,
                    'Created' AS workflow_state,
                    c.stone_name,
                    c.stone_code,
                    '' AS `range`,
                    c.l1, c.l2, c.b1, c.b2, c.h1, c.h2
                FROM `tabSize List Creation Item` c
                JOIN `tabSize List Creation` p ON c.parent = p.name
                WHERE p.baps_project = %s
                  AND c.stone_code IN ({placeholders})
                  AND p.docstatus != 2
                ORDER BY p.creation DESC
            """
            params_creation = [row_data["baps_project"]] + codes_list
            creation_duplicates = frappe.db.sql(creation_sql, tuple(params_creation), as_dict=True)
            all_duplicates.extend(creation_duplicates or [])

        # --- Query 2: Duplicates in Other Size List Forms (check expanded stone codes) ---
        if codes_list:
            placeholders2 = ",".join(["%s"] * len(codes_list))
            size_list_sql = f"""
                SELECT
                    p.name AS source_document,
                    'Size List Form' AS source_type,
                    COALESCE(p.workflow_state, 'Draft') AS workflow_state,
                    d.stone_name,
                    d.stone_code,
                    d.`range`,
                    d.l1, d.l2, d.b1, d.b2, d.h1, d.h2
                FROM `tabSize List Details` d
                JOIN `tabSize List Form` p ON p.name = d.parent
                WHERE p.baps_project = %s
                  AND p.name != %s
                  AND p.docstatus != 2
                  AND d.stone_code IS NOT NULL AND d.stone_code != ''
                ORDER BY p.creation DESC
            """
            
            params_size_list = [row_data["baps_project"], current_size_list]
            other_form_rows = frappe.db.sql(size_list_sql, tuple(params_size_list), as_dict=True)
            
            # Check each row for overlapping expanded codes
            for other_row in other_form_rows:
                if not other_row.get('range') or not other_row.get('stone_code'):
                    continue
                    
                # Expand the other row's range
                other_prefix = other_row['stone_code'].strip().upper()
                other_range_nums = expand_range(other_row['range'])
                
                # Generate other row's stone codes
                for num in other_range_nums:
                    other_code = f"{other_prefix}{str(num).zfill(3)}"
                    if other_code in expanded_codes:
                        # Found a match - add this row to duplicates
                        all_duplicates.append(other_row)
                        break  # Only add once per row

        # --- Query 3: Duplicates within Same Size List Form (internal duplicates) ---
        internal_duplicates = []
        overlapping_codes = {}  # Track which codes overlap: {code: [row_names]}
        
        try:
            internal_rows = frappe.get_all(
                "Size List Details",
                filters={"parent": current_size_list},
                fields=["name", "stone_name", "stone_code", "range", "l1", "l2", "b1", "b2", "h1", "h2", "idx"]
            )

            for r in internal_rows:
                # Skip same row if name matches
                if r.name == row_data.get("name"):
                    continue

                # Check for overlapping expanded stone codes
                if not r.stone_code or not r.range:
                    continue
                    
                try:
                    # Expand the internal row's range
                    r_prefix = r.stone_code.strip().upper()
                    r_range_nums = expand_range(r.range)
                    
                    # Generate internal row's stone codes and check for overlaps
                    overlapping_codes_for_this_row = []
                    for num in r_range_nums:
                        r_code = f"{r_prefix}{str(num).zfill(3)}"
                        if r_code in expanded_codes:
                            overlapping_codes_for_this_row.append(r_code)
                            # Track which rows have this code
                            if r_code not in overlapping_codes:
                                overlapping_codes[r_code] = []
                            overlapping_codes[r_code].append(r.idx)
                    
                    if overlapping_codes_for_this_row:
                        internal_duplicates.append({
                            "source_document": current_size_list,
                            "source_type": "Size List Form",
                            "workflow_state": "Same Form (Internal Duplicate)",
                            "stone_name": r.stone_name,
                            "stone_code": r.stone_code,
                            "range": r.range,
                            "l1": r.l1,
                            "l2": r.l2,
                            "b1": r.b1,
                            "b2": r.b2,
                            "h1": r.h1,
                            "h2": r.h2,
                            "idx": r.idx,
                            "overlapping_codes": overlapping_codes_for_this_row
                        })
                except Exception:
                    pass
            
            all_duplicates.extend(internal_duplicates or [])
            
        except Exception as e:
            frappe.log_error(frappe.get_traceback(), "Internal Duplicate Detection Error")

        # Add overlapping codes summary to response
        result = {
            "duplicates": all_duplicates,
            "overlapping_codes": overlapping_codes
        }
        
        return result

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "get_duplicate_records_for_row")
        frappe.throw(f"Error fetching duplicates: {str(e)}")