// // ============================
// // Size List - Field-Level Approval System with Persistent Storage
// // ============================



// //main part-sub part filtering from common.js
// frappe.ui.form.on("Size List", {
//     refresh: function(frm) {
//         setup_main_part_sub_part(frm);
//         setup_volume_calculation("stone_details");
//     }
// });

// // Child Table Handler - Size List Details
// frappe.ui.form.on('Size List Details', {
//     // Stone Name handler with approval check
//     stone_name: function(frm, cdt, cdn) {
//         let row = locals[cdt][cdn];
//         if (is_field_approved(frm, row, 'stone_name')) {
//             frappe.show_alert({message: __('Stone Name is approved and locked'), indicator: 'red'});
//             // Reset the field to previous value
//             setTimeout(() => {
//                 let previous_value = get_previous_field_value(frm, row, 'stone_name');
//                 frappe.model.set_value(cdt, cdn, 'stone_name', previous_value);
//             }, 100);
//             return false;
//         }
//         // Save current value for future reference
//         save_previous_field_value(frm, row, 'stone_name', row.stone_name);

//         // Original stone_name logic
//         if (row && row.stone_name) {
//             frappe.db.get_value('Stone Name', row.stone_name, 'stone_code', (r) => {
//                 if (r && r.stone_code) {
//                     frappe.model.set_value(cdt, cdn, 'stone_code', r.stone_code);
//                 }
//             });
//         }
//         setTimeout(() => setup_approval_and_publish_buttons(frm), 100);
//     },

//     stone_code: function(frm, cdt, cdn) {
//         let row = locals[cdt][cdn];
//         if (is_field_approved(frm, row, 'stone_code')) {
//             frappe.show_alert({message: __('Stone Code is approved and locked'), indicator: 'red'});
//             // Reset the field to previous value
//             setTimeout(() => {
//                 let previous_value = get_previous_field_value(frm, row, 'stone_code');
//                 frappe.model.set_value(cdt, cdn, 'stone_code', previous_value);
//             }, 100);
//             return false;
//         }
//         // Save current value for future reference
//         save_previous_field_value(frm, row, 'stone_code', row.stone_code);

//         setTimeout(() => setup_approval_and_publish_buttons(frm), 100);
//     },

//     // Dimension fields with approval checks
//     l1: function(frm, cdt, cdn) {
//         let row = locals[cdt][cdn];
//         if (is_field_approved(frm, row, 'l1')) {
//             frappe.show_alert({message: __('L1 field is approved and locked'), indicator: 'red'});
//             // Reset the field to previous value
//             setTimeout(() => {
//                 let previous_value = get_previous_field_value(frm, row, 'l1');
//                 frappe.model.set_value(cdt, cdn, 'l1', previous_value);
//             }, 100);
//             return false;
//         }
//         // Save current value for future reference
//         save_previous_field_value(frm, row, 'l1', row.l1);

//         calculate_volume(frm, cdt, cdn);
//         setTimeout(() => setup_approval_and_publish_buttons(frm), 100);
//     },

//     l2: function(frm, cdt, cdn) {
//         let row = locals[cdt][cdn];
//         if (is_field_approved(frm, row, 'l2')) {
//             frappe.show_alert({message: __('L2 field is approved and locked'), indicator: 'red'});
//             // Reset the field to previous value
//             setTimeout(() => {
//                 let previous_value = get_previous_field_value(frm, row, 'l2');
//                 frappe.model.set_value(cdt, cdn, 'l2', previous_value);
//             }, 100);
//             return false;
//         }
//         // Save current value for future reference
//         save_previous_field_value(frm, row, 'l2', row.l2);

//         if (row && row.l2 >= 12) {
//             frappe.msgprint(('L2 must be less than 12 inches'));
//             frappe.model.set_value(cdt, cdn, 'l2', 0);
//         }
//         calculate_volume(frm, cdt, cdn);
//         setTimeout(() => setup_approval_and_publish_buttons(frm), 100);
//     },

//     b1: function(frm, cdt, cdn) {
//         let row = locals[cdt][cdn];
//         if (is_field_approved(frm, row, 'b1')) {
//             frappe.show_alert({message: __('B1 field is approved and locked'), indicator: 'red'});
//             // Reset the field to previous value
//             setTimeout(() => {
//                 let previous_value = get_previous_field_value(frm, row, 'b1');
//                 frappe.model.set_value(cdt, cdn, 'b1', previous_value);
//             }, 100);
//             return false;
//         }
//         // Save current value for future reference
//         save_previous_field_value(frm, row, 'b1', row.b1);

//         calculate_volume(frm, cdt, cdn);
//         setTimeout(() => setup_approval_and_publish_buttons(frm), 100);
//     },

//     b2: function(frm, cdt, cdn) {
//         let row = locals[cdt][cdn];
//         if (is_field_approved(frm, row, 'b2')) {
//             frappe.show_alert({message: __('B2 field is approved and locked'), indicator: 'red'});
//             // Reset the field to previous value
//             setTimeout(() => {
//                 let previous_value = get_previous_field_value(frm, row, 'b2');
//                 frappe.model.set_value(cdt, cdn, 'b2', previous_value);
//             }, 100);
//             return false;
//         }
//         // Save current value for future reference
//         save_previous_field_value(frm, row, 'b2', row.b2);

//         if (row && row.b2 >= 12) {
//             frappe.msgprint(('B2 must be less than 12 inches'));
//             frappe.model.set_value(cdt, cdn, 'b2', 0);
//         }
//         calculate_volume(frm, cdt, cdn);
//         setTimeout(() => setup_approval_and_publish_buttons(frm), 100);
//     },

//     h1: function(frm, cdt, cdn) {
//         let row = locals[cdt][cdn];
//         if (is_field_approved(frm, row, 'h1')) {
//             frappe.show_alert({message: __('H1 field is approved and locked'), indicator: 'red'});
//             // Reset the field to previous value
//             setTimeout(() => {
//                 let previous_value = get_previous_field_value(frm, row, 'h1');
//                 frappe.model.set_value(cdt, cdn, 'h1', previous_value);
//             }, 100);
//             return false;
//         }
//         // Save current value for future reference
//         save_previous_field_value(frm, row, 'h1', row.h1);

//         calculate_volume(frm, cdt, cdn);
//         setTimeout(() => setup_approval_and_publish_buttons(frm), 100);
//     },

//     h2: function(frm, cdt, cdn) {
//         let row = locals[cdt][cdn];
//         if (is_field_approved(frm, row, 'h2')) {
//             frappe.show_alert({message: __('H2 field is approved and locked'), indicator: 'red'});
//             // Reset the field to previous value
//             setTimeout(() => {
//                 let previous_value = get_previous_field_value(frm, row, 'h2');
//                 frappe.model.set_value(cdt, cdn, 'h2', previous_value);
//             }, 100);
//             return false;
//         }
//         // Save current value for future reference
//         save_previous_field_value(frm, row, 'h2', row.h2);

//         if (row && row.h2 >= 12) {
//             frappe.msgprint(('H2 must be less than 12 inches'));
//             frappe.model.set_value(cdt, cdn, 'h2', 0);
//         }
//         calculate_volume(frm, cdt, cdn);
//         setTimeout(() => setup_approval_and_publish_buttons(frm), 100);
//     },

//     stone_details_remove: function(frm) {
//         update_total_volume(frm);
//         setTimeout(() => setup_approval_and_publish_buttons(frm), 100);
//     }
// });

// // Parent Form Handler - Size List
// frappe.ui.form.on('Size List', {
//     refresh: function(frm) {
//         setup_approval_and_publish_buttons(frm);
//         // Restore approval states from saved data
//         restore_approval_states(frm);
//         // Initialize previous field values for all rows
//         initialize_previous_field_values(frm);

//         // Apply field-level approval styling when form loads
//         setTimeout(() => {
//             apply_all_field_approval_states(frm);
//             // Debug approval states (temporary)
//             debug_approval_states(frm);
//         }, 800);
//     },

//     baps_project: function(frm) {
//         if (frm.doc.baps_project) {
//             load_project_flags(frm);
//         }
//     }
// });

// // ============================
// // PERSISTENT STORAGE FUNCTIONS (Browser localStorage)
// // ============================

// // Get unique key for this document's approval data
// function get_approval_storage_key(frm) {
//     return `size_list_approvals_${frm.doc.name || 'new'}`;
// }

// // Check if a field is approved (with persistent storage)
// function is_field_approved(frm, row, field_name) {
//     try {
//         let storage_key = get_approval_storage_key(frm);
//         let approval_data = localStorage.getItem(storage_key);
//         if (!approval_data) return false;
        
//         approval_data = JSON.parse(approval_data);
//         return !!(approval_data[row.name] && approval_data[row.name][field_name]);
//     } catch (e) {
//         console.error('Error checking field approval state:', e);
//         return false;
//     }
// }

// // Save approval state to localStorage
// function save_approval_state(frm, row_name, field_name, is_approved) {
//     try {
//         let storage_key = get_approval_storage_key(frm);
//         let approval_data = {};
        
//         // Load existing approval data
//         let existing_data = localStorage.getItem(storage_key);
//         if (existing_data) {
//             approval_data = JSON.parse(existing_data);
//         }
        
//         // Initialize row data if not exists
//         if (!approval_data[row_name]) {
//             approval_data[row_name] = {};
//         }
        
//         // Set approval state
//         approval_data[row_name][field_name] = is_approved;
        
//         // Save back to localStorage
//         localStorage.setItem(storage_key, JSON.stringify(approval_data));
//     } catch (e) {
//         console.error('Error saving approval state:', e);
//     }
// }

// // Restore approval states from localStorage
// function restore_approval_states(frm) {
//     if (!frm.doc.stone_details) return;
    
//     try {
//         let storage_key = get_approval_storage_key(frm);
//         let approval_data = localStorage.getItem(storage_key);
//         if (!approval_data) return;
        
//         approval_data = JSON.parse(approval_data);
        
//         frm.doc.stone_details.forEach(row => {
//             if (approval_data[row.name]) {
//                 // Restore client-side approval data for immediate use
//                 row._approved_fields = approval_data[row.name];
//             }
//         });
//     } catch (e) {
//         console.error('Error restoring approval states:', e);
//     }
// }

// // Helper functions for field value management
// function save_previous_field_value(frm, row, field_name, value) {
//     try {
//         let storage_key = `${get_approval_storage_key(frm)}_previous_values`;
//         let previous_data = {};
        
//         // Load existing previous value data
//         let existing_data = localStorage.getItem(storage_key);
//         if (existing_data) {
//             previous_data = JSON.parse(existing_data);
//         }
        
//         // Initialize row data if not exists
//         if (!previous_data[row.name]) {
//             previous_data[row.name] = {};
//         }
        
//         // Set previous value
//         previous_data[row.name][field_name] = value;
        
//         // Save back to localStorage
//         localStorage.setItem(storage_key, JSON.stringify(previous_data));
//     } catch (e) {
//         console.error('Error saving previous field value:', e);
//     }
// }

// function get_previous_field_value(frm, row, field_name) {
//     try {
//         let storage_key = `${get_approval_storage_key(frm)}_previous_values`;
//         let previous_data = localStorage.getItem(storage_key);
//         if (!previous_data) return null;
        
//         previous_data = JSON.parse(previous_data);
//         return previous_data[row.name] && previous_data[row.name][field_name] || null;
//     } catch (e) {
//         console.error('Error getting previous field value:', e);
//         return null;
//     }
// }

// // Initialize previous field values for all rows
// function initialize_previous_field_values(frm) {
//     if (!frm.doc.stone_details) return;
    
//     let required_fields = ['stone_name', 'stone_code', 'l1', 'b1', 'h1', 'l2', 'b2', 'h2', 'volume'];
    
//     frm.doc.stone_details.forEach(row => {
//         required_fields.forEach(field => {
//             if (row[field] !== undefined && row[field] !== null) {
//                 save_previous_field_value(frm, row, field, row[field]);
//             }
//         });
//     });
// }

// // Debug function to check approval states
// function debug_approval_states(frm) {
//     console.log('=== Approval States Debug ===');
//     if (!frm.doc.stone_details) {
//         console.log('No stone_details found');
//         return;
//     }
    
//     frm.doc.stone_details.forEach((row, index) => {
//         console.log(`Row ${index + 1} (${row.name}):`);
//         let required_fields = ['stone_name', 'stone_code', 'l1', 'b1', 'h1', 'l2', 'b2', 'h2', 'volume'];
//         required_fields.forEach(field => {
//             let isApproved = is_field_approved(frm, row, field);
//             let value = row[field];
//             console.log(`  ${field}: ${value} (approved: ${isApproved})`);
//         });
//     });
    
//     // Also check localStorage
//     let storage_key = get_approval_storage_key(frm);
//     let approval_data = localStorage.getItem(storage_key);
//     console.log('LocalStorage data:', approval_data ? JSON.parse(approval_data) : 'None');
// }

// // ============================
// // CORE FUNCTIONS
// // ============================

// // Volume calculation for a single row
// function calculate_volume(frm, cdt, cdn) {
//     let row = locals[cdt][cdn];
//     if (!row) return;
    
//     let L = ((row.l1 || 0) * 12) + (row.l2 || 0);
//     let B = ((row.b1 || 0) * 12) + (row.b2 || 0);
//     let H = ((row.h1 || 0) * 12) + (row.h2 || 0);
    
//     row.volume = ((L * B * H) / 1728).toFixed(2);
//     frm.refresh_field('stone_details');
//     update_total_volume(frm);
// }

// // Total volume across all rows
// function update_total_volume(frm) {
//     let total = 0;
//     (frm.doc.stone_details || []).forEach(r => {
//         total += flt(r.volume);
//     });
//     frm.set_value('total_volume', total.toFixed(2));
// }

// // Load project flags from BAPS Project
// function load_project_flags(frm) {
//     if (!frm.doc.baps_project) return;
    
//     frappe.db.get_doc('BAPS Project', frm.doc.baps_project).then(project_doc => {
//         if (project_doc) {
//             ['chemical', 'dry_fitting', 'polishing'].forEach(field => {
//                 if (project_doc[field] !== undefined) {
//                     frm.set_value(field, project_doc[field]);
//                 }
//             });
//         }
//     });
// }

// // ============================
// // APPROVAL SYSTEM FUNCTIONS
// // ============================

// // Setup approval and publish buttons
// function setup_approval_and_publish_buttons(frm) {
//     // Remove ALL existing custom buttons to prevent duplicates
//     Object.keys(frm.custom_buttons || {}).forEach(key => {
//         if (frm.custom_buttons[key] && frm.custom_buttons[key].remove) {
//             frm.custom_buttons[key].remove();
//         }
//     });
//     frm.custom_buttons = {};

//     // Primary button - Approve Selected Fields (with multiple fallback methods)
//     frm.add_custom_button(('Approve Selected Fields'), () => approve_selected_fields(frm))
//         .addClass('btn-primary');
    
//     // Alternative button - Approve All Filled Fields (simpler approach)
//     frm.add_custom_button(('Approve All Filled Fields'), () => approve_all_filled_fields(frm))
//         .addClass('btn-info');

//     // Check if all fields in all rows are filled and approved
//     let all_complete = check_all_fields_complete(frm);
    
//     if (all_complete) {
//         // Show Publish button only when everything is complete
//         frm.add_custom_button(('Publish'), () => publish_data(frm))
//             .addClass('btn-success');
//     } else {
//         // Show single progress message - only one button
//         let progress = get_completion_progress(frm);
//         frm.add_custom_button(`Progress: ${progress.filled}/${progress.total} fields`, () => {
//             frappe.msgprint(('Complete all fields to enable publishing.'));
//         }).addClass('btn-secondary');
//     }
// }

// // Check if all fields in all rows are completely filled
// function check_all_fields_complete(frm) {
//     if (!frm.doc.stone_details || frm.doc.stone_details.length === 0) return false;
    
//     let required_fields = ['stone_name', 'stone_code', 'l1', 'b1', 'h1', 'l2', 'b2', 'h2', 'volume'];
    
//     for (let row of frm.doc.stone_details) {
//         for (let field of required_fields) {
//             let value = row[field];
//             if (value === undefined || value === null || value === '' || value === 0) {
//                 return false; // Found empty field
//             }
//         }
        
//         // Also check if all fields are approved
//         for (let field of required_fields) {
//             if (!is_field_approved(frm, row, field)) return false;
//         }
//     }
//     return true; // All fields filled and approved
// }

// // Get completion progress
// function get_completion_progress(frm) {
//     if (!frm.doc.stone_details) return {filled: 0, total: 0};
    
//     let required_fields = ['stone_name', 'stone_code', 'l1', 'b1', 'h1', 'l2', 'b2', 'h2', 'volume'];
//     let total_fields = frm.doc.stone_details.length * required_fields.length;
//     let filled_fields = 0;
    
//     frm.doc.stone_details.forEach(row => {
//         required_fields.forEach(field => {
//             let value = row[field];
//             if (value !== undefined && value !== null && value !== '' && value !== 0) {
//                 filled_fields++;
//             }
//         });
//     });
    
//     return {filled: filled_fields, total: total_fields};
// }






// function can_publish(frm) {
//     if (!frm.doc.stone_details) return false;

//     let all_checked = true;
//     frm.doc.stone_details.forEach(row => {
//         if (!row.carving || !row.chemical || !row.polishing || !row.dry_fitting) {
//             all_checked = false;
//         }
//     });

//     if (!all_checked) {
//         frappe.msgprint(__('Cannot Publish: All rows must have Carving, Chemical, Polishing, Dry Fitting checked.'));
//     }

//     return all_checked;
// }





// // Approve selected fields in selected rows
// function approve_selected_fields(frm) {
//     if (!frm.doc.stone_details || frm.doc.stone_details.length === 0) {
//         frappe.msgprint(__('No rows to approve'));
//         return;
//     }

//     let selected_rows = frm.get_field('stone_details').grid.get_selected_children() || [];

//     // Fallback: if nothing selected, approve all
//     if (selected_rows.length === 0) selected_rows = frm.doc.stone_details;

//     let approved_count = 0;
//     let required_fields = ['stone_name', 'stone_code', 'l1', 'b1', 'h1', 'l2', 'b2', 'h2', 'volume'];

//     selected_rows.forEach(row => {
//         approved_count += approve_filled_fields_in_row(frm, row, required_fields);
//     });

//     if (approved_count > 0) {
//         frappe.show_alert({
//             message: __('Approved {0} fields in {1} selected rows', [approved_count, selected_rows.length]),
//             indicator: 'gray'
//         });

//         // Apply visual styling to all rows, including last row
//         apply_all_field_approval_states(frm);

//         // Update buttons
//         setup_approval_and_publish_buttons(frm);
//     } else {
//         frappe.msgprint(__('No filled fields found to approve in selected rows'));
//     }
// }


// // Show dialog to select rows when no rows are selected
// function show_row_selection_dialog(frm) {
//     if (!frm.doc.stone_details || frm.doc.stone_details.length === 0) {
//         frappe.msgprint(('No rows available'));
//         return;
//     }
    
//     let row_options = frm.doc.stone_details.map((row, index) => {
//         let stone_info = row.stone_name || `Row ${index + 1}`;
//         let filled_count = count_filled_fields(row);
//         return {
//             label: `${stone_info} (${filled_count} fields filled)`,
//             value: index
//         };
//     });
    
//     frappe.prompt([
//         {
//             label: 'Select Rows to Approve',
//             fieldname: 'selected_rows',
//             fieldtype: 'MultiSelectPills',
//             options: row_options,
//             reqd: 1
//         }
//     ], function(values) {
//         let selected_indices = values.selected_rows;
//         if (!selected_indices || selected_indices.length === 0) {
//             frappe.msgprint(('No rows selected'));
//             return;
//         }
        
//         let selected_rows = selected_indices.map(index => frm.doc.stone_details[index]);
//         let approved_count = 0;
//         let required_fields = ['stone_name', 'stone_code', 'l1', 'b1', 'h1', 'l2', 'b2', 'h2', 'volume'];
        
//         selected_rows.forEach(row => {
//             approved_count += approve_filled_fields_in_row(frm, row, required_fields);
//         });
        
//         if (approved_count > 0) {
//             frappe.show_alert({
//                 message: __('Approved {0} fields in {1} selected rows', [approved_count, selected_rows.length]),
//                 indicator: 'gray'
//             });
            
//             // Apply visual styling
//             apply_all_field_approval_states(frm);
            
//             // Update buttons
//             setup_approval_and_publish_buttons(frm);
//         } else {
//             frappe.msgprint(('No filled fields found to approve in selected rows'));
//         }
//     }, __('Approve Fields'), __('Approve Selected'));
// }

// // Simpler approach - approve all filled fields in all rows
// function approve_all_filled_fields(frm) {
//     if (!frm.doc.stone_details || frm.doc.stone_details.length === 0) {
//         frappe.msgprint(('No rows to approve'));
//         return;
//     }
    
//     let approved_count = 0;
//     let required_fields = ['stone_name', 'stone_code', 'l1', 'b1', 'h1', 'l2', 'b2', 'h2', 'volume'];
    
//     frm.doc.stone_details.forEach(row => {
//         approved_count += approve_filled_fields_in_row(frm, row, required_fields);
//     });
    
//     if (approved_count > 0) {
//         frappe.show_alert({
//             message: __('Approved {0} filled fields across all rows', [approved_count]),
//             indicator: 'gray'
//         });
        
//         // Apply visual styling
//         apply_all_field_approval_states(frm);
        
//         // Update buttons
//         setup_approval_and_publish_buttons(frm);
//     } else {
//         frappe.msgprint(('No filled fields found to approve'));
//     }
// }

// // Count filled fields in a row
// function count_filled_fields(row) {
//     let required_fields = ['stone_name', 'stone_code', 'l1', 'b1', 'h1', 'l2', 'b2', 'h2', 'volume'];
//     let count = 0;
    
//     required_fields.forEach(field => {
//         let value = row[field];
//         if (value !== undefined && value !== null && value !== '' && value !== 0) {
//             count++;
//         }
//     });
    
//     return count;
// }

// // Approve filled fields in a single row (with persistent storage)
// function approve_filled_fields_in_row(frm, row, required_fields) {
//     if (!row._approved_fields) {
//         row._approved_fields = {};
//     }
    
//     let approved_count = 0;
    
//     required_fields.forEach(field => {
//         let value = row[field];
//         if (value !== undefined && value !== null && value !== '' && value !== 0) {
//             if (!row._approved_fields[field]) {
//                 row._approved_fields[field] = true;
//                 // Save to persistent storage (localStorage)
//                 save_approval_state(frm, row.name, field, true);
//                 approved_count++;
//             }
//         }
//     });
    
//     return approved_count;
// }

// // Apply visual styling to all approved fields
// function apply_all_field_approval_states(frm) {
//     if (!frm.doc.stone_details) return;

//     // Wait until child table rows are rendered
//     setTimeout(() => {
//         let grid_rows = frm.fields_dict.stone_details.grid.grid_rows;

//         frm.doc.stone_details.forEach((row, row_index) => {
//             let required_fields = ['stone_name','stone_code','l1','b1','h1','l2','b2','h2','volume'];

//             required_fields.forEach(field => {
//                 if (is_field_approved(frm, row, field) || (row._approved_fields && row._approved_fields[field])) {
//                     // Use rendered grid row instead of jQuery selector
//                     let grid_row = grid_rows.find(r => r.doc && r.doc.name === row.name);
//                     if (grid_row) {
//                         let $field = grid_row.row.find(`[data-fieldname="${field}"]`);
//                         if ($field.length) {
//                             $field.addClass('field-approved');
//                             $field.find('input, select, textarea')
//                                 .prop('readonly', true)
//                                 .prop('disabled', true)
//                                 .addClass('field-approved-input')
//                                 .attr('title', 'This field is approved and locked')
//                                 .off('click focus keydown keypress keyup change input')
//                                 .on('click focus keydown keypress keyup change input', function(e){
//                                     e.preventDefault(); e.stopPropagation();
//                                     frappe.show_alert({message:'This field is approved and locked',indicator:'red'});
//                                 });
//                         }
//                     }
//                 }
//             });

//             // If row fully approved, apply row styling
//             if (is_row_fully_approved(frm,row)) {
//                 let grid_row = grid_rows.find(r => r.doc && r.doc.name === row.name);
//                 if(grid_row) {
//                     let $row = grid_row.row;
//                     $row.addClass('row-fully-approved');
//                     if(!$row.find('.row-approved-indicator').length){
//                         $row.find('.grid-row-index').append('<span class="row-approved-indicator">✓</span>');
//                     }
//                 }
//             }
//         });
//     }, 500); // Ensure grid rows fully rendered
// }



// // Lock individual field with visual styling
// function lock_individual_field(frm, row_index, field) {
//     setTimeout(() => {
//         // Try multiple selector strategies for robust field selection
//         let selectors = [
//             `.grid-row[data-idx="${row_index}"] [data-fieldname="${field}"]`,
//             `.grid-row:nth-child(${row_index + 1}) [data-fieldname="${field}"]`,
//             `[data-fieldname="${field}"]`
//         ];
        
//         let $field = null;
//         let $row = $(`.grid-row[data-idx="${row_index}"]`);
        
//         // Try each selector until we find the field
//         for (let selector of selectors) {
//             if (selector === `[data-fieldname="${field}"]`) {
//                 // For the generic selector, filter by row
//                 $field = $(selector).filter(function() {
//                     let $parent_row = $(this).closest('.grid-row');
//                     let idx = $parent_row.attr('data-idx');
//                     return idx == row_index || $parent_row.index() == row_index;
//                 });
//             } else {
//                 $field = $(selector);
//             }
            
//             if ($field.length > 0) break;
//         }

//         if ($field && $field.length > 0) {
//             $field.addClass('field-approved');
            
//             // Make inputs truly uneditable
//             $field.find('input, select, textarea').each(function() {
//                 $(this).prop('readonly', true)
//                        .prop('disabled', true)
//                        .addClass('field-approved-input')
//                        .attr('title', 'This field is approved and locked');
//             });
            
//             // Prevent any click/focus events
//             $field.find('input, select, textarea').off('click focus keydown keypress keyup change input')
//                    .on('click focus keydown keypress keyup change input', function(e) {
//                 e.preventDefault();
//                 e.stopPropagation();
//                 frappe.show_alert({message: __('This field is approved and locked'), indicator: 'red'});
//                 return false;
//             });
//         } else {
//             console.log(`Could not find field ${field} for row ${row_index}`);
//         }
        
//         // Check if this row should be fully grayed out
//         let row_doc = frm.doc.stone_details[row_index];
//         if (row_doc && is_row_fully_approved(frm, row_doc)) {
//             // Make the entire row gray
//             if ($row.length) {
//                 $row.addClass('row-fully-approved');
                
//                 // Add visual indicator to row
//                 if (!$row.find('.row-approved-indicator').length) {
//                     $row.find('.grid-row-index').append('<span class="row-approved-indicator">✓</span>');
//                 }
                
//                 // Ensure all fields in this row are disabled
//                 $row.find('input, select, textarea').each(function() {
//                     $(this).prop('readonly', true)
//                            .prop('disabled', true)
//                            .addClass('field-approved-input');
//                 });
//             }
//         }
//     }, 300);
// }

// // Publish data (final step)
// function publish_data(frm) {
//     if (!can_publish(frm)) return; // Stop if checkbox validation fails

//     frappe.confirm(
//         __('Are you sure you want to publish this data? This will finalize all approvals.'),
//         () => {
//             frappe.msgprint(__('Data published successfully!'));
//             // Additional publish logic here...
//         }
//     );
// }


// // Check if a row has all its required fields approved
// function is_row_fully_approved(frm, row) {
//     let required_fields = ['stone_name', 'stone_code', 'l1', 'b1', 'h1', 'l2', 'b2', 'h2', 'volume'];
    
//     for (let field of required_fields) {
//         // Check if field has value and is approved
//         let value = row[field];
//         if (value !== undefined && value !== null && value !== '' && value !== 0) {
//             if (!is_field_approved(frm, row, field)) {
//                 return false; // Found a filled field that's not approved
//             }
//         }
//     }
    
//     // Check if row has at least some approved fields
//     let has_approved_fields = false;
//     for (let field of required_fields) {
//         if (is_field_approved(frm, row, field)) {
//             has_approved_fields = true;
//             break;
//         }
//     }
    
//     return has_approved_fields;
// }

// // ============================
// // CSS STYLING
// // ============================

// // Add CSS styling for approved fields
// if (!document.querySelector('#approval-field-styles')) {
//     const style = document.createElement('style');
//     style.id = 'approval-field-styles';
//     style.textContent = `
//         .field-approved {
//             background-color: #e8f5e8 !important;
//             border: 1px solid #4caf50 !important;
//             position: relative;
//             opacity: 1;
//         }
//         .field-approved::after {
//             content: '✓';
//             position: absolute;
//             top: 2px;
//             right: 5px;
//             font-size: 12px;
//             color: #2e7d32;
//             font-weight: bold;
//             pointer-events: none;
//             z-index: 1000;
//         }
//         .field-approved-input {
//             background-color: #f1f8e9 !important;
//             color: #2e7d32 !important;
//             cursor: not-allowed !important;
//             pointer-events: none !important;
//             border: 1px solid #81c784 !important;
//         }
//         .field-approved-input:focus,
//         .field-approved-input:hover {
//             background-color: #f1f8e9 !important;
//             border-color: #81c784 !important;
//             box-shadow: 0 0 0 0.2rem rgba(76, 175, 80, 0.25) !important;
//         }
//         .row-fully-approved {
//             background: linear-gradient(90deg, #e8f5e8 0%, #f1f8e9 100%) !important;
//             border: 2px solid #4caf50 !important;
//             border-radius: 4px;
//             opacity: 1;
//             box-shadow: 0 2px 4px rgba(76, 175, 80, 0.1);
//         }
//         .row-fully-approved .grid-static-col,
//         .row-fully-approved .grid-static-col input,
//         .row-fully-approved .grid-static-col select,
//         .row-fully-approved .grid-static-col textarea {
//             background-color: #f1f8e9 !important;
//             color: #2e7d32 !important;
//             border-color: #81c784 !important;
//         }
//         .row-approved-indicator {
//             color: #2e7d32;
//             font-weight: bold;
//             margin-left: 5px;
//             background: #4caf50;
//             color: white;
//             border-radius: 50%;
//             padding: 2px 6px;
//             font-size: 10px;
//         }
//         .approval-progress {
//             font-weight: bold;
//             color: #1976d2;
//             margin: 5px 0;
//         }
        
//         /* Hover effects for approved elements */
//         .row-fully-approved:hover {
//             box-shadow: 0 4px 8px rgba(76, 175, 80, 0.15);
//             transform: translateY(-1px);
//             transition: all 0.2s ease-in-out;
//         }
        
//         /* Better styling for locked state */
//         .row-fully-approved .grid-row-check {
//             background-color: #e8f5e8 !important;
//         }
//     `
//     document.head.appendChild(style);
// }













// Copyright (c) 2025, Ayush Patel and contributors
// For license information, please see license.txt

frappe.ui.form.on('Size List', {
    refresh: function(frm) {
        // Add custom CSS for verification status
        if (!$('#size-list-styles').length) {
            $('head').append(`
                <style id="size-list-styles">
                    .stone-approved {
                        background-color: #d4edda !important;
                        border-left: 4px solid #28a745 !important;
                    }
                    .stone-incorrect {
                        background-color: #f8d7da !important;
                        border-left: 4px solid #dc3545 !important;
                    }
                    .stone-pending {
                        background-color: #fff3cd !important;
                        border-left: 4px solid #ffc107 !important;
                    }
                    .stone-approved .grid-static-col {
                        background-color: #d4edda !important;
                    }
                    .stone-incorrect .grid-static-col {
                        background-color: #f8d7da !important;
                    }
                    .stone-pending .grid-static-col {
                        background-color: #fff3cd !important;
                    }
                    .verification-summary-box {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 15px;
                        border-radius: 8px;
                        margin: 10px 0;
                    }
                </style>
            `);
        }
        
        // Apply verification status styling
        apply_verification_styling(frm);
        
        // Make approved stones read-only
        make_approved_stones_readonly(frm);
        
        // Add custom buttons
        if (!frm.is_new()) {
            // Verification management buttons
            frm.add_custom_button(__('Create Verification'), function() {
                create_verification_document(frm);
            }, __('Verification'));
            
            frm.add_custom_button(__('Open Verification'), function() {
                open_verification_document(frm);
            }, __('Verification'));
            
            frm.add_custom_button(__('Verification Status'), function() {
                show_verification_status(frm);
            }, __('Verification'));
            
            // Filter buttons
            frm.add_custom_button(__('Show Approved Stones'), function() {
                show_stones_by_status(frm, 'Approved');
            }, __('Filter'));
            
            frm.add_custom_button(__('Show Incorrect Stones'), function() {
                show_stones_by_status(frm, 'Incorrect');
            }, __('Filter'));
            
            frm.add_custom_button(__('Show Pending Stones'), function() {
                show_stones_by_status(frm, 'Pending');
            }, __('Filter'));
            
            // Analysis buttons
            frm.add_custom_button(__('Size List Statistics'), function() {
                show_size_list_statistics(frm);
            }, __('Analysis'));
            
            frm.add_custom_button(__('Export Approved Stones'), function() {
                export_stones_by_status(frm, 'Approved');
            }, __('Export'));
        }
        
        // Auto-generate form_number if not set - but allow user to edit it
        if (!frm.doc.form_number && frm.doc.__islocal) {
            // Only suggest form_number for new documents, don't auto-set it
            frm.dashboard.add_comment(__('💡 Tip: Enter a unique Form Number (e.g., SZLST-001, PROJECT-A-001) to connect this Size List with verification and generation documents.'), 'blue', true);
        }
        
        // Show verification summary if available
        if (!frm.is_new()) {
            load_verification_summary(frm);
        }
    },

    before_save: function(frm) {
        // Calculate total volume
        calculate_total_volume(frm);
        
        // Validate form_number is provided
        if (!frm.doc.form_number) {
            frappe.msgprint({
                title: __('Form Number Required'),
                message: __('Please enter a unique Form Number. This will be used to connect Size List, Verification, and Generation documents.'),
                indicator: 'red'
            });
            frappe.validated = false;
            return;
        }
    },

    after_save: function(frm) {
        // Refresh verification styling after save
        setTimeout(() => {
            apply_verification_styling(frm);
            make_approved_stones_readonly(frm);
        }, 1000);
    },

    form_number: function(frm) {
        // Validate form_number uniqueness
        if (frm.doc.form_number && frm.doc.form_number !== frm.doc.name) {
            frappe.call({
                method: "frappe.client.get_list",
                args: {
                    doctype: "Size List",
                    filters: [
                        ["form_number", "=", frm.doc.form_number],
                        ["name", "!=", frm.doc.name || ""]
                    ],
                    fields: ["name"],
                    limit_page_length: 1
                },
                callback: function(r) {
                    if (r.message && r.message.length > 0) {
                        frappe.msgprint({
                            title: __('Duplicate Form Number'),
                            message: __('Form Number {0} is already used in Size List: {1}', 
                                [frm.doc.form_number, r.message[0].name]),
                            indicator: 'orange'
                        });
                    }
                }
            });
        }
    }
});

// Child table events for Size List Details
frappe.ui.form.on('Size List Details', {
    stone_details_add: function(frm, cdt, cdn) {
        // Apply styling when new rows are added
        setTimeout(() => {
            apply_verification_styling(frm);
        }, 500);
    },

    l1: function(frm, cdt, cdn) { calculate_volume_for_row(frm, cdt, cdn); },
    l2: function(frm, cdt, cdn) { calculate_volume_for_row(frm, cdt, cdn); },
    b1: function(frm, cdt, cdn) { calculate_volume_for_row(frm, cdt, cdn); },
    b2: function(frm, cdt, cdn) { calculate_volume_for_row(frm, cdt, cdn); },
    h1: function(frm, cdt, cdn) { calculate_volume_for_row(frm, cdt, cdn); },
    h2: function(frm, cdt, cdn) { calculate_volume_for_row(frm, cdt, cdn); }
});

// Helper functions
function apply_verification_styling(frm) {
    if (!frm.doc.stone_details) return;
    
    // Get verification status for all stones
    frappe.call({
        method: "baps.baps.doctype.size_list.size_list.get_stones_by_status",
        args: {
            size_list_name: frm.doc.name,
            status: "All"
        },
        callback: function(r) {
            if (r && r.message && r.message.success) {
                let stones_status = {};
                r.message.stones.forEach(function(stone) {
                    stones_status[stone.stone_code] = stone.status;
                });
                
                // Apply styling
                setTimeout(() => {
                    frm.doc.stone_details.forEach(function(row) {
                        let row_element = $(`.grid-row[data-name="${row.name}"]`);
                        let status = stones_status[row.stone_code] || 'Pending';
                        
                        // Remove existing classes
                        row_element.removeClass('stone-approved stone-incorrect stone-pending');
                        
                        // Add appropriate class
                        if (status === 'Approved') {
                            row_element.addClass('stone-approved');
                        } else if (status === 'Incorrect') {
                            row_element.addClass('stone-incorrect');
                        } else {
                            row_element.addClass('stone-pending');
                        }
                    });
                }, 500);
            }
        }
    });
}

function make_approved_stones_readonly(frm) {
    if (!frm.doc.stone_details) return;
    
    frappe.call({
        method: "baps.baps.doctype.size_list.size_list.get_stones_by_status",
        args: {
            size_list_name: frm.doc.name,
            status: "Approved"
        },
        callback: function(r) {
            if (r && r.message && r.message.success) {
                let approved_codes = r.message.stones.map(stone => stone.stone_code);
                
                // Make approved stones read-only
                frm.doc.stone_details.forEach(function(row, idx) {
                    if (approved_codes.includes(row.stone_code)) {
                        // Make specific fields read-only for approved stones
                        frm.fields_dict.stone_details.grid.grid_rows[idx].make_editable(['stone_name', 'stone_code', 'range', 'l1', 'l2', 'b1', 'b2', 'h1', 'h2', 'volume'], false);
                    }
                });
            }
        }
    });
}

function calculate_volume_for_row(frm, cdt, cdn) {
    let row = locals[cdt][cdn];
    
    if (row.l1 && row.l2 && row.b1 && row.b2 && row.h1 && row.h2) {
        // Calculate average dimensions and volume
        let avg_length = (parseFloat(row.l1) + parseFloat(row.l2)) / 2;
        let avg_breadth = (parseFloat(row.b1) + parseFloat(row.b2)) / 2;
        let avg_height = (parseFloat(row.h1) + parseFloat(row.h2)) / 2;
        
        let volume = avg_length * avg_breadth * avg_height / 1728; // Convert to cubic feet
        
        frappe.model.set_value(cdt, cdn, 'volume', volume.toFixed(3));
    }
}

function calculate_total_volume(frm) {
    let total_volume = 0;
    
    if (frm.doc.stone_details) {
        frm.doc.stone_details.forEach(function(row) {
            if (row.volume) {
                total_volume += parseFloat(row.volume) || 0;
            }
        });
    }
    
    if (frm.doc.total_volume_cft !== total_volume) {
        frm.set_value('total_volume_cft', total_volume);
    }
}

function create_verification_document(frm) {
    frappe.confirm(
        __('This will create a new Size List Verification document for form number: {0}. Continue?', [frm.doc.form_number]),
        function() {
            frappe.call({
                method: "baps.baps.doctype.size_list.size_list.create_verification_document",
                args: {
                    size_list_name: frm.doc.name
                },
                callback: function(r) {
                    if (r && r.message && r.message.success) {
                        frappe.show_alert({
                            message: __('✅ {0}', [r.message.message]),
                            indicator: 'green'
                        });
                        
                        frappe.msgprint({
                            title: __('Verification Created'),
                            message: __('Size List Verification document <b>{0}</b> has been created with {1} stones ready for verification.', 
                                [r.message.doc_name, r.message.stone_count]),
                            indicator: 'green',
                            primary_action: {
                                label: __('Open Verification'),
                                action: function() {
                                    frappe.set_route('Form', 'Size List Verification', r.message.doc_name);
                                }
                            }
                        });
                    } else {
                        frappe.msgprint({
                            title: __('Error'),
                            message: r.message.message || 'Error creating verification document',
                            indicator: 'red'
                        });
                        
                        if (r.message.existing_doc) {
                            setTimeout(() => {
                                frappe.msgprint({
                                    title: __('Existing Document Found'),
                                    message: __('Would you like to open the existing verification document?'),
                                    indicator: 'blue',
                                    primary_action: {
                                        label: __('Open Existing'),
                                        action: function() {
                                            frappe.set_route('Form', 'Size List Verification', r.message.existing_doc);
                                        }
                                    }
                                });
                            }, 2000);
                        }
                    }
                }
            });
        }
    );
}

function open_verification_document(frm) {
    frappe.call({
        method: "frappe.client.get_list",
        args: {
            doctype: "Size List Verification",
            filters: {"form_number": frm.doc.form_number},
            fields: ["name"],
            limit_page_length: 1
        },
        callback: function(r) {
            if (r.message && r.message.length > 0) {
                frappe.set_route('Form', 'Size List Verification', r.message[0].name);
            } else {
                frappe.msgprint({
                    title: __('Not Found'),
                    message: __('No Size List Verification document found for form number: {0}', [frm.doc.form_number]),
                    indicator: 'orange',
                    primary_action: {
                        label: __('Create Verification'),
                        action: function() {
                            create_verification_document(frm);
                        }
                    }
                });
            }
        }
    });
}

function load_verification_summary(frm) {
    frappe.call({
        method: "baps.baps.doctype.size_list.size_list.get_verification_summary_for_size_list",
        args: {
            size_list_name: frm.doc.name
        },
        callback: function(r) {
            if (r && r.message && r.message.success && r.message.verification_exists) {
                let data = r.message.data;
                
                let summary_html = `
                    <div class="verification-summary-box">
                        <h5>📋 Verification Progress</h5>
                        <div class="row">
                            <div class="col-sm-3 text-center">
                                <strong style="font-size: 18px;">${data.verified_count}</strong><br>
                                <small>✅ Approved</small>
                            </div>
                            <div class="col-sm-3 text-center">
                                <strong style="font-size: 18px;">${data.incorrect_count}</strong><br>
                                <small>❌ Incorrect</small>
                            </div>
                            <div class="col-sm-3 text-center">
                                <strong style="font-size: 18px;">${data.pending_count}</strong><br>
                                <small>⏳ Pending</small>
                            </div>
                            <div class="col-sm-3 text-center">
                                <strong style="font-size: 18px;">${data.completion_percentage}%</strong><br>
                                <small>Complete</small>
                            </div>
                        </div>
                    </div>
                `;
                
                frm.dashboard.add_comment(summary_html, 'blue', true);
            }
        }
    });
}

function show_verification_status(frm) {
    frappe.call({
        method: "baps.baps.doctype.size_list.size_list.get_verification_summary_for_size_list",
        args: {
            size_list_name: frm.doc.name
        },
        callback: function(r) {
            if (r && r.message && r.message.success) {
                if (r.message.verification_exists) {
                    let data = r.message.data;
                    let status_html = `
                        <div class="verification-status">
                            <h4>📊 Verification Status - ${frm.doc.form_number}</h4>
                            <div class="row">
                                <div class="col-sm-3">
                                    <div class="alert alert-info text-center">
                                        <strong style="font-size: 24px;">${data.total_stones}</strong><br>
                                        <span>Total Stones</span>
                                    </div>
                                </div>
                                <div class="col-sm-3">
                                    <div class="alert alert-success text-center">
                                        <strong style="font-size: 24px; color: #28a745;">${data.verified_count}</strong><br>
                                        <span>✅ Approved</span>
                                    </div>
                                </div>
                                <div class="col-sm-3">
                                    <div class="alert alert-danger text-center">
                                        <strong style="font-size: 24px; color: #dc3545;">${data.incorrect_count}</strong><br>
                                        <span>❌ Incorrect</span>
                                    </div>
                                </div>
                                <div class="col-sm-3">
                                    <div class="alert alert-warning text-center">
                                        <strong style="font-size: 24px; color: #ffc107;">${data.pending_count}</strong><br>
                                        <span>⏳ Pending</span>
                                    </div>
                                </div>
                            </div>
                            <div class="progress" style="height: 25px;">
                                <div class="progress-bar bg-success" style="width: ${data.verified_count/data.total_stones*100}%">${data.verified_count}</div>
                                <div class="progress-bar bg-danger" style="width: ${data.incorrect_count/data.total_stones*100}%">${data.incorrect_count}</div>
                                <div class="progress-bar bg-warning" style="width: ${data.pending_count/data.total_stones*100}%">${data.pending_count}</div>
                            </div>
                            <p class="text-center mt-3">
                                <strong>Status: </strong>
                                ${data.verification_complete ? 
                                    '<span class="text-success">✅ All stones verified</span>' : 
                                    `<span class="text-warning">⏳ ${data.pending_count} stones pending verification</span>`
                                }
                            </p>
                        </div>
                    `;
                    
                    frappe.msgprint({
                        title: __('Verification Status'),
                        message: status_html,
                        indicator: data.verification_complete ? 'green' : 'orange'
                    });
                } else {
                    frappe.msgprint({
                        title: __('No Verification Found'),
                        message: __('Size List Verification document not found for this form number.'),
                        indicator: 'orange',
                        primary_action: {
                            label: __('Create Verification'),
                            action: function() {
                                create_verification_document(frm);
                            }
                        }
                    });
                }
            }
        }
    });
}