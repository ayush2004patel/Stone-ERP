// ============================
// Size List - Field-Level Approval System with Persistent Storage
// ============================

// Child Table Handler - Size List Details
frappe.ui.form.on('Size List Details', {
    // Stone Name handler with approval check
    stone_name: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        if (is_field_approved(frm, row, 'stone_name')) {
            frappe.show_alert({message: __('Stone Name is approved and locked'), indicator: 'red'});
            return;
        }
        // Original stone_name logic
        if (row && row.stone_name) {
            frappe.db.get_value('Stone Name', row.stone_name, 'stone_code', (r) => {
                if (r && r.stone_code) {
                    frappe.model.set_value(cdt, cdn, 'stone_code', r.stone_code);
                }
            });
        }
        setTimeout(() => setup_approval_and_publish_buttons(frm), 100);
    },

    stone_code: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        if (is_field_approved(frm, row, 'stone_code')) {
            frappe.show_alert({message: __('Stone Code is approved and locked'), indicator: 'red'});
            return;
        }
        setTimeout(() => setup_approval_and_publish_buttons(frm), 100);
    },

    // Dimension fields with approval checks
    l1: function(frm, cdt, cdn) { 
        let row = locals[cdt][cdn];
        if (is_field_approved(frm, row, 'l1')) {
            frappe.show_alert({message: __('L1 field is approved and locked'), indicator: 'red'});
            return;
        }
        calculate_volume(frm, cdt, cdn); 
        setTimeout(() => setup_approval_and_publish_buttons(frm), 100);
    },
    
    l2: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        if (is_field_approved(frm, row, 'l2')) {
            frappe.show_alert({message: __('L2 field is approved and locked'), indicator: 'red'});
            return;
        }
        if (row && row.l2 >= 12) {
            frappe.msgprint(__('L2 must be less than 12 inches'));
            frappe.model.set_value(cdt, cdn, 'l2', 0);
        }
        calculate_volume(frm, cdt, cdn);
        setTimeout(() => setup_approval_and_publish_buttons(frm), 100);
    },
    
    b1: function(frm, cdt, cdn) { 
        let row = locals[cdt][cdn];
        if (is_field_approved(frm, row, 'b1')) {
            frappe.show_alert({message: __('B1 field is approved and locked'), indicator: 'red'});
            return;
        }
        calculate_volume(frm, cdt, cdn); 
        setTimeout(() => setup_approval_and_publish_buttons(frm), 100);
    },
    
    b2: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        if (is_field_approved(frm, row, 'b2')) {
            frappe.show_alert({message: __('B2 field is approved and locked'), indicator: 'red'});
            return;
        }
        if (row && row.b2 >= 12) {
            frappe.msgprint(__('B2 must be less than 12 inches'));
            frappe.model.set_value(cdt, cdn, 'b2', 0);
        }
        calculate_volume(frm, cdt, cdn);
        setTimeout(() => setup_approval_and_publish_buttons(frm), 100);
    },
    
    h1: function(frm, cdt, cdn) { 
        let row = locals[cdt][cdn];
        if (is_field_approved(frm, row, 'h1')) {
            frappe.show_alert({message: __('H1 field is approved and locked'), indicator: 'red'});
            return;
        }
        calculate_volume(frm, cdt, cdn); 
        setTimeout(() => setup_approval_and_publish_buttons(frm), 100);
    },
    
    h2: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        if (is_field_approved(frm, row, 'h2')) {
            frappe.show_alert({message: __('H2 field is approved and locked'), indicator: 'red'});
            return;
        }
        if (row && row.h2 >= 12) {
            frappe.msgprint(__('H2 must be less than 12 inches'));
            frappe.model.set_value(cdt, cdn, 'h2', 0);
        }
        calculate_volume(frm, cdt, cdn);
        setTimeout(() => setup_approval_and_publish_buttons(frm), 100);
    },

    stone_details_remove: function(frm) {
        update_total_volume(frm);
        setTimeout(() => setup_approval_and_publish_buttons(frm), 100);
    }
});

// Parent Form Handler - Size List
frappe.ui.form.on('Size List', {
    refresh: function(frm) {
        setup_approval_and_publish_buttons(frm);
        
        // Restore approval states from saved data
        restore_approval_states(frm);
        
        // Apply field-level approval styling when form loads
        setTimeout(() => {
            apply_all_field_approval_states(frm);
        }, 500);
    },

    baps_project: function(frm) {
        if (frm.doc.baps_project) {
            load_project_flags(frm);
        }
    }
});

// ============================
// PERSISTENT STORAGE FUNCTIONS
// ============================

// Check if a field is approved (with persistent storage)
function is_field_approved(frm, row, field_name) {
    if (!frm.doc.approval_data) {
        return false;
    }
    
    try {
        let approval_data = JSON.parse(frm.doc.approval_data);
        return approval_data[row.name] && approval_data[row.name][field_name];
    } catch (e) {
        return false;
    }
}

// Save approval state to document
function save_approval_state(frm, row_name, field_name, is_approved) {
    let approval_data = {};
    
    // Load existing approval data
    if (frm.doc.approval_data) {
        try {
            approval_data = JSON.parse(frm.doc.approval_data);
        } catch (e) {
            approval_data = {};
        }
    }
    
    // Initialize row data if not exists
    if (!approval_data[row_name]) {
        approval_data[row_name] = {};
    }
    
    // Set approval state
    approval_data[row_name][field_name] = is_approved;
    
    // Save back to document
    frm.set_value('approval_data', JSON.stringify(approval_data));
}

// Restore approval states from saved data
function restore_approval_states(frm) {
    if (!frm.doc.approval_data || !frm.doc.stone_details) {
        return;
    }
    
    try {
        let approval_data = JSON.parse(frm.doc.approval_data);
        
        frm.doc.stone_details.forEach(row => {
            if (approval_data[row.name]) {
                // Restore client-side approval data for immediate use
                row._approved_fields = approval_data[row.name];
            }
        });
    } catch (e) {
        console.log('Error restoring approval states:', e);
    }
}

// ============================
// CORE FUNCTIONS
// ============================

// Volume calculation for a single row
function calculate_volume(frm, cdt, cdn) {
    let row = locals[cdt][cdn];
    if (!row) return;
    
    let L = ((row.l1 || 0) * 12) + (row.l2 || 0);
    let B = ((row.b1 || 0) * 12) + (row.b2 || 0);
    let H = ((row.h1 || 0) * 12) + (row.h2 || 0);
    
    row.volume = ((L * B * H) / 1728).toFixed(2);
    frm.refresh_field('stone_details');
    update_total_volume(frm);
}

// Total volume across all rows
function update_total_volume(frm) {
    let total = 0;
    (frm.doc.stone_details || []).forEach(r => {
        total += flt(r.volume);
    });
    frm.set_value('total_volume', total.toFixed(2));
}

// Load project flags from BAPS Project
function load_project_flags(frm) {
    if (!frm.doc.baps_project) return;
    
    frappe.db.get_doc('BAPS Project', frm.doc.baps_project).then(project_doc => {
        if (project_doc) {
            ['chemical', 'dry_fitting', 'polishing'].forEach(field => {
                if (project_doc[field] !== undefined) {
                    frm.set_value(field, project_doc[field]);
                }
            });
        }
    });
}

// ============================
// APPROVAL SYSTEM FUNCTIONS
// ============================

// Setup approval and publish buttons
function setup_approval_and_publish_buttons(frm) {
    // Remove existing buttons
    if (frm.custom_buttons['Approve Selected Fields']) {
        frm.custom_buttons['Approve Selected Fields'].remove();
        delete frm.custom_buttons['Approve Selected Fields'];
    }
    if (frm.custom_buttons['Approve All Filled Fields']) {
        frm.custom_buttons['Approve All Filled Fields'].remove();
        delete frm.custom_buttons['Approve All Filled Fields'];
    }
    if (frm.custom_buttons['Publish']) {
        frm.custom_buttons['Publish'].remove();
        delete frm.custom_buttons['Publish'];
    }

    // Primary button - Approve Selected Fields (with multiple fallback methods)
    frm.add_custom_button(__('Approve Selected Fields'), () => approve_selected_fields(frm))
        .addClass('btn-primary');
    
    // Alternative button - Approve All Filled Fields (simpler approach)
    frm.add_custom_button(__('Approve All Filled Fields'), () => approve_all_filled_fields(frm))
        .addClass('btn-info');

    // Check if all fields in all rows are filled and approved
    let all_complete = check_all_fields_complete(frm);
    
    if (all_complete) {
        // Show Publish button only when everything is complete
        frm.add_custom_button(__('Publish'), () => publish_data(frm))
            .addClass('btn-success');
    } else {
        // Show progress message
        let progress = get_completion_progress(frm);
        frm.add_custom_button(__(`Progress: ${progress.filled}/${progress.total} fields`), () => {
            frappe.msgprint(__('Complete all fields to enable publishing.'));
        }).addClass('btn-secondary');
    }
}

// Check if all fields in all rows are completely filled
function check_all_fields_complete(frm) {
    if (!frm.doc.stone_details || frm.doc.stone_details.length === 0) return false;
    
    let required_fields = ['stone_name', 'stone_code', 'l1', 'b1', 'h1', 'l2', 'b2', 'h2', 'volume'];
    
    for (let row of frm.doc.stone_details) {
        for (let field of required_fields) {
            let value = row[field];
            if (value === undefined || value === null || value === '' || value === 0) {
                return false; // Found empty field
            }
        }
        
        // Also check if all fields are approved
        for (let field of required_fields) {
            if (!is_field_approved(frm, row, field)) return false;
        }
    }
    return true; // All fields filled and approved
}

// Get completion progress
function get_completion_progress(frm) {
    if (!frm.doc.stone_details) return {filled: 0, total: 0};
    
    let required_fields = ['stone_name', 'stone_code', 'l1', 'b1', 'h1', 'l2', 'b2', 'h2', 'volume'];
    let total_fields = frm.doc.stone_details.length * required_fields.length;
    let filled_fields = 0;
    
    frm.doc.stone_details.forEach(row => {
        required_fields.forEach(field => {
            let value = row[field];
            if (value !== undefined && value !== null && value !== '' && value !== 0) {
                filled_fields++;
            }
        });
    });
    
    return {filled: filled_fields, total: total_fields};
}

// Approve selected fields in selected rows
function approve_selected_fields(frm) {
    if (!frm.doc.stone_details || frm.doc.stone_details.length === 0) {
        frappe.msgprint(__('No rows to approve'));
        return;
    }
    
    // Method 1: Try to get selected rows from grid
    let selected_rows = [];
    
    // Check if grid exists and has selected rows
    let grid = frm.get_field('stone_details').grid;
    if (grid && grid.get_selected_children) {
        selected_rows = grid.get_selected_children();
    }
    
    // Method 2: Fallback - use jQuery to find selected checkboxes
    if (selected_rows.length === 0) {
        $('.grid-row').each(function() {
            let $row = $(this);
            let checkbox = $row.find('.grid-row-check input[type="checkbox"]');
            if (checkbox.is(':checked')) {
                let row_index = $row.attr('data-idx');
                if (row_index !== undefined) {
                    let row_doc = frm.doc.stone_details[parseInt(row_index)];
                    if (row_doc) {
                        selected_rows.push(row_doc);
                    }
                }
            }
        });
    }
    
    // Method 3: If still no selection, try alternative grid approach
    if (selected_rows.length === 0) {
        try {
            selected_rows = frm.fields_dict.stone_details.grid.get_selected();
        } catch (e) {
            console.log('Grid selection method failed:', e);
        }
    }
    
    // Method 4: If no rows selected, show dialog to select specific rows
    if (selected_rows.length === 0) {
        show_row_selection_dialog(frm);
        return;
    }
    
    let approved_count = 0;
    let required_fields = ['stone_name', 'stone_code', 'l1', 'b1', 'h1', 'l2', 'b2', 'h2', 'volume'];
    
    selected_rows.forEach(row => {
        approved_count += approve_filled_fields_in_row(frm, row, required_fields);
    });
    
    if (approved_count > 0) {
        frappe.show_alert({
            message: __('Approved {0} fields in {1} selected rows', [approved_count, selected_rows.length]),
            indicator: 'gray'
        });
        
        // Apply visual styling
        apply_all_field_approval_states(frm);
        
        // Update buttons
        setup_approval_and_publish_buttons(frm);
    } else {
        frappe.msgprint(__('No filled fields found to approve in selected rows'));
    }
}

// Show dialog to select rows when no rows are selected
function show_row_selection_dialog(frm) {
    if (!frm.doc.stone_details || frm.doc.stone_details.length === 0) {
        frappe.msgprint(__('No rows available'));
        return;
    }
    
    let row_options = frm.doc.stone_details.map((row, index) => {
        let stone_info = row.stone_name || `Row ${index + 1}`;
        let filled_count = count_filled_fields(row);
        return {
            label: `${stone_info} (${filled_count} fields filled)`,
            value: index
        };
    });
    
    frappe.prompt([
        {
            label: 'Select Rows to Approve',
            fieldname: 'selected_rows',
            fieldtype: 'MultiSelectPills',
            options: row_options,
            reqd: 1
        }
    ], function(values) {
        let selected_indices = values.selected_rows;
        if (!selected_indices || selected_indices.length === 0) {
            frappe.msgprint(__('No rows selected'));
            return;
        }
        
        let selected_rows = selected_indices.map(index => frm.doc.stone_details[index]);
        let approved_count = 0;
        let required_fields = ['stone_name', 'stone_code', 'l1', 'b1', 'h1', 'l2', 'b2', 'h2', 'volume'];
        
        selected_rows.forEach(row => {
            approved_count += approve_filled_fields_in_row(frm, row, required_fields);
        });
        
        if (approved_count > 0) {
            frappe.show_alert({
                message: __('Approved {0} fields in {1} selected rows', [approved_count, selected_rows.length]),
                indicator: 'gray'
            });
            
            // Apply visual styling
            apply_all_field_approval_states(frm);
            
            // Update buttons
            setup_approval_and_publish_buttons(frm);
        } else {
            frappe.msgprint(__('No filled fields found to approve in selected rows'));
        }
    }, __('Approve Fields'), __('Approve Selected'));
}

// Simpler approach - approve all filled fields in all rows
function approve_all_filled_fields(frm) {
    if (!frm.doc.stone_details || frm.doc.stone_details.length === 0) {
        frappe.msgprint(__('No rows to approve'));
        return;
    }
    
    let approved_count = 0;
    let required_fields = ['stone_name', 'stone_code', 'l1', 'b1', 'h1', 'l2', 'b2', 'h2', 'volume'];
    
    frm.doc.stone_details.forEach(row => {
        approved_count += approve_filled_fields_in_row(frm, row, required_fields);
    });
    
    if (approved_count > 0) {
        frappe.show_alert({
            message: __('Approved {0} filled fields across all rows', [approved_count]),
            indicator: 'gray'
        });
        
        // Apply visual styling
        apply_all_field_approval_states(frm);
        
        // Update buttons
        setup_approval_and_publish_buttons(frm);
    } else {
        frappe.msgprint(__('No filled fields found to approve'));
    }
}

// Count filled fields in a row
function count_filled_fields(row) {
    let required_fields = ['stone_name', 'stone_code', 'l1', 'b1', 'h1', 'l2', 'b2', 'h2', 'volume'];
    let count = 0;
    
    required_fields.forEach(field => {
        let value = row[field];
        if (value !== undefined && value !== null && value !== '' && value !== 0) {
            count++;
        }
    });
    
    return count;
}

// Approve filled fields in a single row (with persistent storage)
function approve_filled_fields_in_row(frm, row, required_fields) {
    if (!row._approved_fields) {
        row._approved_fields = {};
    }
    
    let approved_count = 0;
    
    required_fields.forEach(field => {
        let value = row[field];
        if (value !== undefined && value !== null && value !== '' && value !== 0) {
            if (!row._approved_fields[field]) {
                row._approved_fields[field] = true;
                // Save to persistent storage
                save_approval_state(frm, row.name, field, true);
                approved_count++;
            }
        }
    });
    
    return approved_count;
}

// Apply visual styling to all approved fields
function apply_all_field_approval_states(frm) {
    if (!frm.doc.stone_details) return;
    
    frm.doc.stone_details.forEach((row, row_index) => {
        if (row._approved_fields) {
            Object.keys(row._approved_fields).forEach(field => {
                if (row._approved_fields[field]) {
                    lock_individual_field(frm, row_index, field);
                }
            });
        }
    });
}

// Lock individual field with visual styling
function lock_individual_field(frm, row_index, field) {
    setTimeout(() => {
        let field_selector = `.grid-row[data-idx="${row_index}"] [data-fieldname="${field}"]`;
        let $field = $(field_selector);
        
        if ($field.length) {
            $field.addClass('field-approved');
            $field.find('input, select, textarea').prop('readonly', true);
        }
    }, 200);
}

// Publish data (final step)
function publish_data(frm) {
    frappe.confirm(
        __('Are you sure you want to publish this data? This will finalize all approvals.'),
        () => {
            // Add your publish logic here
            frappe.msgprint(__('Data published successfully!'));
            
            // You can add additional logic here such as:
            // - Setting a "published" flag
            // - Sending notifications
            // - Creating related documents
            // - etc.
        }
    );
}

// ============================
// CSS STYLING
// ============================

// Add CSS styling for approved fields
if (!document.querySelector('#approval-field-styles')) {
    const style = document.createElement('style');
    style.id = 'approval-field-styles';
    style.textContent = `
        .field-approved {
            background-color: #f8f9fa !important;
            border: 2px solid #6c757d !important;
            position: relative;
            opacity: 0.8;
        }
        .field-approved::after {
            content: '🔒';
            position: absolute;
            top: 2px;
            right: 5px;
            font-size: 12px;
            color: #6c757d;
            pointer-events: none;
        }
        .approval-progress {
            font-weight: bold;
            color: #007bff;
            margin: 5px 0;
        }
    `;
    document.head.appendChild(style);
}
