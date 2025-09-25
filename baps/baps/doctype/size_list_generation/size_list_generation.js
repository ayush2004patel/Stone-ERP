// Copyright (c) 2025, Amax Consultancy Pvt Ltd and contributors
// For license information, please see license.txt

// frappe.ui.form.on("SIze List Generation", {
// 	refresh(frm) {

// 	},
// });

// Copyright (c) 2025, Ayush Patel and contributors
// For license information, please see license.txt

// Copyright (c) 2025, Ayush Patel and contributors
// For license information, please see license.txt

frappe.ui.form.on('Size List Generation', {
    refresh: function(frm) {
        // Add custom CSS for approved stones (greyed out)
        if (!$('#generation-styles').length) {
            $('head').append(`
                <style id="generation-styles">
                    .approved-stone-row {
                        background-color: #f8f9fa !important;
                        border-left: 4px solid #28a745 !important;
                    }
                    .approved-stone-row .grid-static-col {
                        background-color: #f8f9fa !important;
                        color: #6c757d;
                    }
                    .generation-summary {
                        background: linear-gradient(135deg, #28a745, #20c997);
                        color: white;
                        padding: 15px;
                        border-radius: 8px;
                        margin: 10px 0;
                    }
                </style>
            `);
        }
        
        // Make all fields read-only except form_number for new documents
        if (frm.is_new() && !frm.doc.stone_details?.length) {
            // For new documents, only form_number is editable
            frm.set_df_property('form_number', 'read_only', 0);
            make_main_fields_readonly(frm);
        } else {
            // For existing documents, make everything read-only
            make_all_fields_readonly(frm);
        }
        
        // Make child table read-only and apply styling
        make_child_table_readonly(frm);
        apply_approved_stone_styling(frm);
        
        // Add custom buttons
        if (frm.doc.stone_details && frm.doc.stone_details.length > 0) {
            frm.add_custom_button(__('Generation Summary'), function() {
                show_generation_summary(frm);
            });
        }
        
        // Show help text for new documents
        if (frm.is_new() && !frm.doc.stone_details?.length) {
            frm.dashboard.add_comment(
                __('📋 Enter a Form Number to automatically load approved stones from Size List Verification. Only verified stones will be imported.'), 
                'blue', 
                true
            );
        }

        // Add debug buttons
        frm.add_custom_button(__('Debug Verification Search'), function() {
            debug_verification_search(frm);
        }, __('Debug'));

        frm.add_custom_button(__('Show Available Verifications'), function() {
            show_available_verifications(frm);
        }, __('Debug'));
    },
    
    form_number: function(frm) {
        if (!frm.doc.form_number) return;

        // Show loading indicator
        frappe.show_alert({
            message: __('Loading approved stones for Form Number: {0}...', [frm.doc.form_number]),
            indicator: 'blue'
        });

        // Fetch approved stones from verification
        frappe.call({
            method: "baps.baps.doctype.size_list_generation.size_list_generation.get_approved_stones_from_verification",
            args: {
                form_number: frm.doc.form_number
            },
            callback: function(r) {
                if (r && r.message && r.message.success) {
                    auto_fill_from_verification(frm, r.message);
                } else {
                    // Show detailed error with available verifications
                    show_verification_not_found_dialog(frm, r.message.message || 'Size List Verification not found');
                }
            }
        });
    }
});

// Auto-fill form from verification data
function auto_fill_from_verification(frm, response) {
    let data = response.data;
    
    // Fill main form fields
    frm.set_value('prep_date', data.prep_date);
    frm.set_value('material_type', data.material_type);
    frm.set_value('baps_project', data.baps_project);
    frm.set_value('project_name', data.project_name);
    frm.set_value('main_part', data.main_part);
    frm.set_value('sub_part', data.sub_part);
    frm.set_value('total_volume_cft', data.total_volume_cft);
    frm.set_value('cutting_region', data.cutting_region);
    frm.set_value('polishing_required', data.polishing_required);
    frm.set_value('dry_fitting_required', data.dry_fitting_required);
    frm.set_value('carving_required', data.carving_required);
    frm.set_value('chemical_required', data.chemical_required);
    frm.set_value('approved_date', data.approved_date);
    frm.set_value('checked_by', data.checked_by);
    
    // Clear and populate child table with ONLY approved stones
    frm.clear_table('stone_details');
    
    if (data.stone_details && data.stone_details.length > 0) {
        data.stone_details.forEach(function(stone) {
            let row = frm.add_child('stone_details');
            row.stone_name = stone.stone_name;
            row.stone_code = stone.stone_code;
            row.range = stone.range;
            row.l1 = stone.l1;
            row.l2 = stone.l2;
            row.b1 = stone.b1;
            row.b2 = stone.b2;
            row.h1 = stone.h1;
            row.h2 = stone.h2;
            row.volume = stone.volume;
        });
        
        frm.refresh_field('stone_details');
    }
    
    // Make everything read-only after loading data
    make_all_fields_readonly(frm);
    make_child_table_readonly(frm);
    
    // Apply styling to show these are approved stones
    setTimeout(() => {
        apply_approved_stone_styling(frm);
    }, 500);
    
    // Show success message
    frappe.show_alert({
        message: __('✅ Loaded {0} approved stones for generation', [response.approved_count]),
        indicator: 'green'
    });
    
    // Show summary in dashboard
    show_generation_info(frm, response);
    
    frappe.msgprint({
        title: __('Generation Ready'),
        message: __('<strong>✅ Success!</strong><br><br>Loaded <b>{0}</b> approved stones out of <b>{1}</b> total stones from verification.<br><br>All stones shown are verified and ready for generation processing.', 
            [response.approved_count, response.total_count]),
        indicator: 'green'
    });
}

// Make main form fields read-only (except form_number for new docs)
function make_main_fields_readonly(frm) {
    const main_fields = [
        'prep_date', 'material_type', 'baps_project', 'project_name', 
        'main_part', 'sub_part', 'total_volume_cft', 'cutting_region',
        'polishing_required', 'dry_fitting_required', 'carving_required', 
        'chemical_required', 'approved_date', 'checked_by'
    ];
    
    main_fields.forEach(function(field) {
        frm.set_df_property(field, 'read_only', 1);
    });
}

// Make all fields read-only
function make_all_fields_readonly(frm) {
    make_main_fields_readonly(frm);
    frm.set_df_property('form_number', 'read_only', 1);
}

// Make child table read-only
function make_child_table_readonly(frm) {
    // Disable adding/removing rows
    frm.set_df_property('stone_details', 'cannot_add_rows', 1);
    frm.set_df_property('stone_details', 'cannot_delete_rows', 1);
    
    // Make all child table fields read-only
    const child_fields = [
        'stone_name', 'stone_code', 'range', 'l1', 'l2', 'b1', 'b2', 'h1', 'h2', 'volume'
    ];
    
    child_fields.forEach(function(field) {
        frm.set_df_property('stone_details', field, 'read_only', 1);
    });
}

// Apply styling to show approved stones (greyed out)
function apply_approved_stone_styling(frm) {
    setTimeout(() => {
        if (frm.doc.stone_details) {
            frm.doc.stone_details.forEach(function(row) {
                let row_element = $(`.grid-row[data-name="${row.name}"]`);
                row_element.addClass('approved-stone-row');
            });
        }
    }, 300);
}

// Show generation info in dashboard
function show_generation_info(frm, response) {
    let info_html = `
        <div class="generation-summary">
            <h5>📊 Generation Summary - ${frm.doc.form_number}</h5>
            <div class="row text-center">
                <div class="col-sm-4">
                    <strong style="font-size: 20px;">${response.approved_count}</strong><br>
                    <small>Approved Stones</small>
                </div>
                <div class="col-sm-4">
                    <strong style="font-size: 20px;">${response.total_count}</strong><br>
                    <small>Total in Verification</small>
                </div>
                <div class="col-sm-4">
                    <strong style="font-size: 20px;">${Math.round((response.approved_count/response.total_count)*100)}%</strong><br>
                    <small>Approval Rate</small>
                </div>
            </div>
        </div>
    `;
    
    frm.dashboard.add_comment(info_html, 'green', true);
}

// Show detailed generation summary
function show_generation_summary(frm) {
    let total_stones = frm.doc.stone_details ? frm.doc.stone_details.length : 0;
    let total_volume = 0;
    let stone_types = {};
    
    // Calculate statistics
    if (frm.doc.stone_details) {
        frm.doc.stone_details.forEach(function(row) {
            if (row.volume) {
                total_volume += parseFloat(row.volume) || 0;
            }
            if (row.stone_name) {
                stone_types[row.stone_name] = (stone_types[row.stone_name] || 0) + 1;
            }
        });
    }
    
    // Generate stone types list
    let stone_types_html = '';
    if (Object.keys(stone_types).length > 0) {
        stone_types_html = Object.entries(stone_types).map(([type, count]) => 
            `<li><strong>${type}:</strong> ${count} stones</li>`
        ).join('');
    } else {
        stone_types_html = '<li>No stone types found</li>';
    }
    
    let summary_html = `
        <div class="generation-detailed-summary">
            <h4>📈 Detailed Generation Summary - ${frm.doc.form_number}</h4>
            
            <div class="row">
                <div class="col-sm-6">
                    <div class="alert alert-success">
                        <h5>📊 Statistics</h5>
                        <ul style="margin-bottom: 0;">
                            <li><strong>Approved Stones:</strong> ${total_stones}</li>
                            <li><strong>Total Volume:</strong> ${total_volume.toFixed(3)} CFT</li>
                            <li><strong>Average Volume:</strong> ${total_stones > 0 ? (total_volume/total_stones).toFixed(3) : 0} CFT per stone</li>
                            <li><strong>Project:</strong> ${frm.doc.project_name || 'N/A'}</li>
                            <li><strong>Cutting Region:</strong> ${frm.doc.cutting_region || 'N/A'}</li>
                        </ul>
                    </div>
                </div>
                
                <div class="col-sm-6">
                    <div class="alert alert-info">
                        <h5>🏗️ Stone Types</h5>
                        <ul style="margin-bottom: 0;">
                            ${stone_types_html}
                        </ul>
                    </div>
                </div>
            </div>
            
            <div class="alert alert-primary">
                <strong>🎯 Status:</strong> All ${total_stones} stones are verified and ready for generation processing.
            </div>
        </div>
    `;
    
    frappe.msgprint({
        title: __('Generation Summary'),
        message: summary_html,
        indicator: 'green'
    });
}

// Debug and helper functions
function debug_verification_search(frm) {
    if (!frm.doc.form_number) {
        frappe.msgprint({
            title: __('Form Number Required'),
            message: __('Please enter a form number to debug the verification search.'),
            indicator: 'orange'
        });
        return;
    }
    
    frappe.call({
        method: "baps.baps.doctype.size_list_generation.size_list_generation.debug_verification_search",
        args: {
            form_number: frm.doc.form_number
        },
        callback: function(r) {
            if (r && r.message && r.message.success) {
                let results = r.message.results;
                let debug_html = `
                    <div class="debug-verification-results">
                        <h5>🔍 Verification Search Debug Results for: "${results.search_term}"</h5>
                        
                        <div class="row">
                            <div class="col-sm-6">
                                <h6>📋 Exact Form Number Match:</h6>
                                ${results.exact_form_number_match ? 
                                    `<div class="alert alert-success">
                                        ✅ Found: ${results.exact_form_number_match.name}<br>
                                        Form: ${results.exact_form_number_match.form_number}<br>
                                        Created: ${results.exact_form_number_match.creation}
                                    </div>` : 
                                    `<div class="alert alert-warning">❌ No exact match found</div>`
                                }
                                
                                <h6>📝 Exact Name Match:</h6>
                                ${results.exact_name_match ? 
                                    `<div class="alert alert-info">✅ Document exists with this name</div>` : 
                                    `<div class="alert alert-warning">❌ No document with this name</div>`
                                }
                            </div>
                            
                            <div class="col-sm-6">
                                <h6>🔎 Like Matches:</h6>
                                ${results.like_matches.length > 0 ? 
                                    `<ul>` + results.like_matches.map(match => 
                                        `<li>${match.name} (Form: ${match.form_number}) - ${match.creation}</li>`
                                    ).join('') + `</ul>` : 
                                    `<div class="alert alert-warning">❌ No partial matches</div>`
                                }
                            </div>
                        </div>
                        
                        <h6>📚 Available Size List Verifications (Latest 10):</h6>
                        <div class="table-responsive">
                            <table class="table table-sm">
                                <thead><tr><th>Document Name</th><th>Form Number</th><th>Created</th></tr></thead>
                                <tbody>
                                    ${results.all_verifications.map(sv => 
                                        `<tr><td>${sv.name}</td><td>${sv.form_number || 'Not Set'}</td><td>${sv.creation}</td></tr>`
                                    ).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
                
                frappe.msgprint({
                    title: __('Verification Search Debug'),
                    message: debug_html,
                    indicator: 'blue'
                });
            } else {
                frappe.msgprint({
                    title: __('Debug Error'),
                    message: r.message.message || 'Could not run verification search debug',
                    indicator: 'red'
                });
            }
        }
    });
}

function show_available_verifications(frm) {
    frappe.call({
        method: "frappe.client.get_list",
        args: {
            doctype: "Size List Verification",
            fields: ["name", "form_number", "creation"],
            order_by: "creation desc",
            limit_page_length: 20
        },
        callback: function(r) {
            if (r && r.message) {
                let verifications_html = '<div class="available-verifications"><h5>Available Size List Verifications:</h5><ul>';
                
                r.message.forEach(function(doc) {
                    verifications_html += `<li><strong>${doc.name}</strong> 
                                    ${doc.form_number ? `(Form: ${doc.form_number})` : '(No form number)'} 
                                    - Created: ${doc.creation}</li>`;
                });
                
                verifications_html += '</ul></div>';
                
                frappe.msgprint({
                    title: __('Available Size List Verifications'),
                    message: verifications_html,
                    indicator: 'blue'
                });
            }
        }
    });
}

function show_verification_not_found_dialog(frm, error_message) {
    frappe.msgprint({
        title: __('Size List Verification Not Found'),
        message: `
            <div class="alert alert-warning">
                <strong>No Size List Verification found with Form Number: ${frm.doc.form_number}</strong>
                <br><br>
                ${error_message}
                <br><br>
                <strong>Suggestions:</strong>
                <ul>
                    <li>Check if the form number is correct</li>
                    <li>Make sure Size List Verification exists and has been saved</li>
                    <li>Ensure some stones are marked as "Verified" in the verification</li>
                    <li>Use the debug tools to check available verifications</li>
                </ul>
            </div>
        `,
        indicator: 'orange',
        primary_action: {
            label: __('Show Available Verifications'),
            action: function() {
                show_available_verifications(frm);
            }
        },
        secondary_action: {
            label: __('Debug Search'),
            action: function() {
                debug_verification_search(frm);
            }
        }
    });
}