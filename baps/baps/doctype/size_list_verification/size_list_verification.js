// Copyright (c) 2025, Ayush Patel and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Size List Verification", {
// 	refresh(frm) {

// 	},
// });

// Copyright (c) 2025, Ayush Patel and contributors
// For license information, please see license.txt

// Copyright (c) 2025, Ayush Patel and contributors
// For license information, please see license.txt

frappe.ui.form.on('Size List Verification', {
    refresh: function(frm) {
        // Add custom CSS for verification status
        if (!$('#verification-styles').length) {
            $('head').append(`
                <style id="verification-styles">
                    .verification-verified {
                        background-color: #d4edda !important;
                        border-left: 4px solid #28a745 !important;
                    }
                    .verification-incorrect {
                        background-color: #f8d7da !important;
                        border-left: 4px solid #dc3545 !important;
                    }
                    .grid-row .verification-verified .grid-static-col {
                        background-color: #d4edda !important;
                    }
                    .grid-row .verification-incorrect .grid-static-col {
                        background-color: #f8d7da !important;
                    }
                    .verification-pending {
                        background-color: #fff3cd !important;
                        border-left: 4px solid #ffc107 !important;
                    }
                </style>
            `);
        }
        
        // Make specific fields read-only (keep form_number editable)
        make_specific_fields_read_only(frm);
        
        // Disable adding new rows to child table
        frm.set_df_property('stone_details', 'cannot_add_rows', 1);
        frm.set_df_property('stone_details', 'cannot_delete_rows', 1);
        
        // Make child table fields read-only except verified and incorrect checkboxes
        make_child_table_fields_read_only(frm);
        
        // Apply visual styling to existing rows
        apply_verification_styling(frm);
        
        // Add verification summary if form has data
        if (frm.doc.stone_details && frm.doc.stone_details.length > 0) {
            frm.add_custom_button(__('Verification Summary'), function() {
                show_verification_summary(frm);
            });
            
            // Add bulk actions
            frm.add_custom_button(__('Mark All as Verified'), function() {
                mark_all_stones(frm, 'verified');
            });
            
            frm.add_custom_button(__('Mark All as Incorrect'), function() {
                mark_all_stones(frm, 'incorrect');
            });
        }
        
        // Add help text for users
        if (!frm.doc.form_number && !frm.doc.stone_details?.length) {
            frm.dashboard.add_comment(__('📝 Enter a Size List form number to load stone details for verification. Only form_number and verification checkboxes are editable.'), 'blue', true);
        }

        // Add debug button for troubleshooting
        frm.add_custom_button(__('Debug Size List Structure'), function() {
            debug_size_list_structure(frm);
        }, __('Debug'));

        // Add button to show available Size Lists
        frm.add_custom_button(__('Show Available Size Lists'), function() {
            show_available_size_lists(frm);
        }, __('Debug'));

        // Add button to test form number search
        frm.add_custom_button(__('Test Form Number Search'), function() {
            test_form_number_search(frm);
        }, __('Debug'));

        // Add button to check DocTypes status
        frm.add_custom_button(__('Check DocTypes Status'), function() {
            check_doctypes_status(frm);
        }, __('Debug'));
    },
    
    form_number: function(frm) {
        if (!frm.doc.form_number) return;

        // Show loading indicator
        frappe.show_alert({
            message: __('Searching for Size List with Form Number: {0}...', [frm.doc.form_number]),
            indicator: 'blue'
        });

        // Use the correct search method - search by form_number field (not document name)
        frappe.call({
            method: "baps.baps.doctype.size_list_verification.size_list_verification.search_size_list_by_form_number",
            args: {
                form_number: frm.doc.form_number
            },
            callback: function(r) {
                if (r && r.message && r.message.success) {
                    auto_fill_from_size_list(frm, r.message.data);
                } else {
                    // Show detailed error message
                    show_size_list_not_found_dialog(frm, r.message.message || 'Size List not found');
                }
            }
        });
    },

    before_save: function(frm) {
        // Validate that no row has both verified and incorrect checked
        let validation_errors = [];
        
        frm.doc.stone_details.forEach(function(row, idx) {
            if (row.verified && row.incorrect) {
                validation_errors.push(`Row ${idx + 1}: Stone ${row.stone_name || row.stone_code} cannot be both verified and incorrect`);
            }
        });
        
        if (validation_errors.length > 0) {
            frappe.msgprint({
                title: __('Validation Error'),
                message: validation_errors.join('<br>'),
                indicator: 'red'
            });
            frappe.validated = false;
        }
    },

    after_save: function(frm) {
        // Check workflow status after save
        frappe.call({
            method: "baps.baps.doctype.size_list_verification.size_list_verification.check_doctypes_status",
            callback: function(r) {
                if (r && r.message && r.message.success) {
                    let verified_count = frm.doc.stone_details.filter(row => row.verified).length;
                    let incorrect_count = frm.doc.stone_details.filter(row => row.incorrect).length;
                    
                    let workflow_msg = '';
                    if (!r.message.doctypes_status["Size List Generation"]) {
                        workflow_msg = ' (Note: Size List Generation not available - only Size List status updated)';
                    }
                    
                    if (verified_count > 0 || incorrect_count > 0) {
                        frappe.show_alert({
                            message: __('✅ Verification saved! {0} stones approved, {1} stones marked incorrect{2}', 
                                [verified_count, incorrect_count, workflow_msg]),
                            indicator: 'green'
                        });
                    }
                } else {
                    // Fallback message
                    let verified_count = frm.doc.stone_details.filter(row => row.verified).length;
                    let incorrect_count = frm.doc.stone_details.filter(row => row.incorrect).length;
                    
                    if (verified_count > 0 || incorrect_count > 0) {
                        frappe.show_alert({
                            message: __('✅ Verification saved! {0} stones approved, {1} stones marked incorrect', 
                                [verified_count, incorrect_count]),
                            indicator: 'green'
                        });
                    }
                }
            }
        });
        
        // Refresh to show updated styling
        setTimeout(() => {
            apply_verification_styling(frm);
        }, 1000);
    }
});

// Helper function to auto-fill fields & lock them
function auto_fill_from_size_list(frm, size_list) {
    // Map main fields (read-only)
    const field_map = {
        'prep_date': 'prep_date',
        'material_type': 'stone_type',
        'baps_project': 'baps_project',
        'project_name': 'project_name',
        'main_part': 'main_part',
        'sub_part': 'sub_part',
        'total_volume_cft': 'total_volume',
        'cutting_region': 'cutting_region',
        'polishing_required': 'polishing',
        'dry_fitting_required': 'dry_fitting',
        'carving_required': 'carving',
        'chemical_required': 'chemical',
        'approved_date': 'approved_date',
        'checked_by': 'checked_by'
    };

    // Fill fields
    $.each(field_map, function(target, source) {
        if (size_list[source] !== undefined) {
            frm.set_value(target, size_list[source]);
        }
    });

    // Populate child table: stone_details with verification fields
    if (size_list.stone_details && size_list.stone_details.length > 0) {
        frm.clear_table('stone_details');
        
        size_list.stone_details.forEach(function(item, index) {
            let row = frm.add_child('stone_details');
            
            // Map all Size List Detail fields to Verification Details
            row.stone_name = item.stone_name;
            row.stone_code = item.stone_code;
            row.range = item.range;
            row.l1 = item.l1;
            row.l2 = item.l2;
            row.b1 = item.b1;
            row.b2 = item.b2;
            row.h1 = item.h1;
            row.h2 = item.h2;
            row.volume = item.volume;
            
            // Initialize verification fields
            row.verified = 0;
            row.incorrect = 0;
        });
        
        frm.refresh_field('stone_details');
        
        // Apply settings after data is loaded
        make_specific_fields_read_only(frm);
        make_child_table_fields_read_only(frm);
        apply_verification_styling(frm);
        
        frappe.show_alert({
            message: __('✅ Size List data loaded successfully! {0} stone details imported for verification.', [size_list.stone_details.length]),
            indicator: 'green'
        });
        
        // Show user instructions
        frappe.msgprint({
            title: __('Verification Ready'),
            message: __('All stone details from Size List <b>{0}</b> have been loaded.<br><br>Please review each stone entry and click:<br>• <b>Verified</b> if the data matches your manual form<br>• <b>Incorrect</b> if there are discrepancies<br><br><i>Note: Checking one option will automatically uncheck the other.</i>', [size_list.name]),
            indicator: 'blue'
        });
    } else {
        frappe.show_alert({
            message: __('⚠ Size List found but no stone details available to verify.'),
            indicator: 'orange'
        });
    }

    // Store reference to original size list for verification
    frm._original_size_list = size_list.name;
}

// Function to make specific main form fields read-only (keep form_number editable)
function make_specific_fields_read_only(frm) {
    const read_only_fields = [
        'prep_date', 'material_type', 'baps_project', 'project_name', 
        'main_part', 'sub_part', 'total_volume_cft', 'cutting_region',
        'polishing_required', 'dry_fitting_required', 'carving_required', 
        'chemical_required', 'approved_date', 'checked_by'
    ];
    
    read_only_fields.forEach(function(field) {
        frm.set_df_property(field, 'read_only', 1);
    });
    
    // Keep form_number editable always
    frm.set_df_property('form_number', 'read_only', 0);
}

// Function to make child table fields read-only except verified and incorrect checkboxes
function make_child_table_fields_read_only(frm) {
    if (!frm.doc.stone_details) return;
    
    const child_read_only_fields = [
        'stone_name', 'stone_code', 'range', 'l1', 'l2', 'b1', 'b2', 'h1', 'h2', 'volume'
    ];
    
    child_read_only_fields.forEach(function(field) {
        frm.set_df_property('stone_details', field, 'read_only', 1);
    });
    
    // Ensure verified and incorrect checkboxes remain editable
    frm.set_df_property('stone_details', 'verified', 'read_only', 0);
    frm.set_df_property('stone_details', 'incorrect', 'read_only', 0);
}

// Apply visual styling based on verification status
function apply_verification_styling(frm) {
    setTimeout(() => {
        frm.doc.stone_details.forEach(function(row) {
            let row_element = $(`.grid-row[data-name="${row.name}"]`);
            
            // Remove all existing classes
            row_element.removeClass('verification-verified verification-incorrect verification-pending');
            
            if (row.verified) {
                row_element.addClass('verification-verified');
            } else if (row.incorrect) {
                row_element.addClass('verification-incorrect');
            } else {
                row_element.addClass('verification-pending');
            }
        });
    }, 500);
}

// Bulk action functions
function mark_all_stones(frm, status) {
    frappe.confirm(
        __('Are you sure you want to mark all stones as {0}?', [status]),
        function() {
            frm.doc.stone_details.forEach(function(row) {
                if (status === 'verified') {
                    row.verified = 1;
                    row.incorrect = 0;
                } else if (status === 'incorrect') {
                    row.verified = 0;
                    row.incorrect = 1;
                }
            });
            
            frm.refresh_field('stone_details');
            apply_verification_styling(frm);
            
            frappe.show_alert({
                message: __('All stones marked as {0}', [status]),
                indicator: status === 'verified' ? 'green' : 'red'
            });
        }
    );
}

// Handle verification button clicks in child table
frappe.ui.form.on('Size List Verification Details', {
    verified: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        
        // If verified is checked, uncheck incorrect
        if (row.verified) {
            frappe.model.set_value(cdt, cdn, 'incorrect', 0);
            
            frappe.show_alert({
                message: __('Stone {0} marked as verified ✓', [row.stone_name || row.stone_code]),
                indicator: 'green'
            });
            
            // Add visual feedback (green highlight)
            setTimeout(() => {
                let row_element = $(`.grid-row[data-name="${cdn}"]`);
                row_element.removeClass('verification-incorrect verification-pending');
                row_element.addClass('verification-verified');
            }, 100);
        } else {
            // Remove verified highlighting when unchecked
            setTimeout(() => {
                let row_element = $(`.grid-row[data-name="${cdn}"]`);
                row_element.removeClass('verification-verified');
                row_element.addClass('verification-pending');
            }, 100);
        }
    },
    
    incorrect: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        
        // If incorrect is checked, uncheck verified
        if (row.incorrect) {
            frappe.model.set_value(cdt, cdn, 'verified', 0);
            
            frappe.show_alert({
                message: __('Stone {0} marked as incorrect ❌', [row.stone_name || row.stone_code]),
                indicator: 'red'
            });
            
            // Add visual feedback (red highlight)
            setTimeout(() => {
                let row_element = $(`.grid-row[data-name="${cdn}"]`);
                row_element.removeClass('verification-verified verification-pending');
                row_element.addClass('verification-incorrect');
            }, 100);
        } else {
            // Remove incorrect highlighting when unchecked
            setTimeout(() => {
                let row_element = $(`.grid-row[data-name="${cdn}"]`);
                row_element.removeClass('verification-incorrect');
                row_element.addClass('verification-pending');
            }, 100);
        }
    }
});

// Show verification summary function
function show_verification_summary(frm) {
    let total_stones = frm.doc.stone_details ? frm.doc.stone_details.length : 0;
    let verified_count = 0;
    let incorrect_count = 0;
    let pending_count = 0;
    
    if (frm.doc.stone_details) {
        frm.doc.stone_details.forEach(function(row) {
            if (row.verified) verified_count++;
            else if (row.incorrect) incorrect_count++;
            else pending_count++;
        });
    }
    
    let completion_percentage = total_stones > 0 ? Math.round(((verified_count + incorrect_count) / total_stones) * 100) : 0;
    
    let summary_html = `
        <div class="verification-summary">
            <h4>📊 Verification Progress - ${completion_percentage}% Complete</h4>
            <div class="row">
                <div class="col-sm-3">
                    <div class="alert alert-info text-center">
                        <strong style="font-size: 24px;">${total_stones}</strong><br>
                        <span>Total Stones</span>
                    </div>
                </div>
                <div class="col-sm-3">
                    <div class="alert alert-success text-center">
                        <strong style="font-size: 24px; color: #28a745;">${verified_count}</strong><br>
                        <span>✅ Verified</span>
                    </div>
                </div>
                <div class="col-sm-3">
                    <div class="alert alert-danger text-center">
                        <strong style="font-size: 24px; color: #dc3545;">${incorrect_count}</strong><br>
                        <span>❌ Incorrect</span>
                    </div>
                </div>
                <div class="col-sm-3">
                    <div class="alert alert-warning text-center">
                        <strong style="font-size: 24px; color: #ffc107;">${pending_count}</strong><br>
                        <span>⏳ Pending</span>
                    </div>
                </div>
            </div>
            <div class="progress" style="height: 20px; margin-top: 15px;">
                <div class="progress-bar bg-success" style="width: ${verified_count/total_stones*100}%">${verified_count}</div>
                <div class="progress-bar bg-danger" style="width: ${incorrect_count/total_stones*100}%">${incorrect_count}</div>
                <div class="progress-bar bg-warning" style="width: ${pending_count/total_stones*100}%">${pending_count}</div>
            </div>
            <p class="text-muted text-center mt-2">
                <small>Green: Verified | Red: Incorrect | Yellow: Pending</small>
            </p>
        </div>
    `;
    
    frappe.msgprint({
        title: __('Verification Summary'),
        message: summary_html,
        indicator: completion_percentage === 100 ? 'green' : 'blue'
    });
}

// Debug functions
function debug_size_list_structure(frm) {
    frappe.call({
        method: "baps.baps.doctype.size_list_verification.size_list_verification.debug_size_list_structure",
        callback: function(r) {
            if (r && r.message && r.message.success) {
                let data = r.message.data;
                let debug_html = `
                    <div class="debug-info">
                        <h5>Size List DocType Fields:</h5>
                        <p><code>${data.doctype_fields.join(', ')}</code></p>
                        
                        <h5>Sample Document Structure:</h5>
                        <pre>${JSON.stringify(data.sample_document, null, 2)}</pre>
                    </div>
                `;
                
                frappe.msgprint({
                    title: __('Size List Debug Info'),
                    message: debug_html,
                    indicator: 'blue'
                });
            } else {
                frappe.msgprint({
                    title: __('Debug Error'),
                    message: r.message.message || 'Could not fetch debug info',
                    indicator: 'red'
                });
            }
        }
    });
}

function check_doctypes_status(frm) {
    frappe.call({
        method: "baps.baps.doctype.size_list_verification.size_list_verification.check_doctypes_status",
        callback: function(r) {
            if (r && r.message && r.message.success) {
                let status = r.message;
                let status_html = `
                    <div class="doctypes-status">
                        <h5>🔧 DocTypes Status Check</h5>
                        
                        <div class="table-responsive">
                            <table class="table table-sm">
                                <thead>
                                    <tr><th>DocType</th><th>Status</th></tr>
                                </thead>
                                <tbody>
                                    ${Object.entries(status.doctypes_status).map(([dt, exists]) => 
                                        `<tr>
                                            <td>${dt}</td>
                                            <td>${exists ? 
                                                '<span class="text-success">✅ Exists</span>' : 
                                                '<span class="text-danger">❌ Missing</span>'
                                            }</td>
                                        </tr>`
                                    ).join('')}
                                </tbody>
                            </table>
                        </div>
                        
                        <div class="alert ${status.all_exist ? 'alert-success' : 'alert-warning'}">
                            <strong>Workflow Status:</strong><br>
                            ${status.workflow_available ? 
                                '✅ Basic workflow available (Size List ↔ Verification)' : 
                                '❌ Basic workflow not available'
                            }<br>
                            ${status.doctypes_status["Size List Generation"] ? 
                                '✅ Full workflow available (includes Generation)' : 
                                '⚠️ Size List Generation not available - stones will only update Size List status'
                            }
                        </div>
                        
                        ${status.missing_doctypes.length > 0 ? 
                            `<div class="alert alert-info">
                                <strong>Missing DocTypes:</strong> ${status.missing_doctypes.join(', ')}<br>
                                <small>Please install/migrate these DocTypes to enable full workflow.</small>
                            </div>` : ''
                        }
                    </div>
                `;
                
                frappe.msgprint({
                    title: __('DocTypes Status'),
                    message: status_html,
                    indicator: status.all_exist ? 'green' : 'orange'
                });
            } else {
                frappe.msgprint({
                    title: __('Error'),
                    message: r.message.message || 'Could not check DocTypes status',
                    indicator: 'red'
                });
            }
        }
    });
}


function show_available_size_lists(frm) {
    frappe.call({
        method: "frappe.client.get_list",
        args: {
            doctype: "Size List",
            fields: ["name", "form_number", "creation"],
            order_by: "creation desc",
            limit_page_length: 20
        },
        callback: function(r) {
            if (r && r.message) {
                let lists_html = '<div class="available-lists"><h5>Available Size Lists:</h5><ul>';
                
                r.message.forEach(function(doc) {
                    lists_html += `<li><strong>${doc.name}</strong> 
                                    ${doc.form_number ? `(Form: ${doc.form_number})` : '(No form number)'} 
                                    - Created: ${doc.creation}</li>`;
                });
                
                lists_html += '</ul></div>';
                
                frappe.msgprint({
                    title: __('Available Size Lists'),
                    message: lists_html,
                    indicator: 'blue'
                });
            }
        }
    });
}

function show_size_list_not_found_dialog(frm, error_message) {
    frappe.msgprint({
        title: __('Size List Not Found'),
        message: `
            <div class="alert alert-warning">
                <strong>No Size List found with Form Number: ${frm.doc.form_number}</strong>
                <br><br>
                ${error_message}
                <br><br>
                <strong>Suggestions:</strong>
                <ul>
                    <li>Check if the form number is correct</li>
                    <li>Use the "Show Available Size Lists" button to see all available documents</li>
                    <li>Make sure the Size List document exists and is accessible</li>
                </ul>
            </div>
        `,
        indicator: 'orange',
        primary_action: {
            label: __('Show Available Size Lists'),
            action: function() {
                show_available_size_lists(frm);
            }
        }
    });
}

function show_multiple_matches_dialog(frm, matches) {
    let options_html = '<div class="multiple-matches"><p>Multiple Size Lists found. Please select one:</p><ul>';
    
    matches.forEach(function(doc, index) {
        options_html += `
            <li style="margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                <button class="btn btn-sm btn-primary" onclick="load_selected_size_list('${doc.name}', this)">
                    Select
                </button>
                <strong>${doc.name}</strong> 
                ${doc.form_number ? `(Form: ${doc.form_number})` : '(No form number)'}
            </li>
        `;
    });
    
    options_html += '</ul></div>';
    
    // Add global function for button clicks
    window.load_selected_size_list = function(doc_name, button_element) {
        $(button_element).text('Loading...').prop('disabled', true);
        
        frappe.call({
            method: "baps.baps.doctype.size_list_verification.size_list_verification.get_size_list_with_details",
            args: {
                size_list_name: doc_name
            },
            callback: function(r) {
                if (r && r.message && r.message.success) {
                    auto_fill_from_size_list(frm, r.message.data);
                    frappe.hide_msgprint();
                } else {
                    frappe.show_alert({
                        message: __('Error loading selected Size List'),
                        indicator: 'red'
                    });
                    $(button_element).text('Select').prop('disabled', false);
                }
            }
        });
    };
    
    frappe.msgprint({
        title: __('Multiple Matches Found'),
        message: options_html,
        indicator: 'blue'
    });
}