// Copyright (c) 2025, Amax Consultancy Pvt Ltd and contributors
// For license information, please see license.txt

// frappe.ui.form.on("SIze List Generation", {
// 	refresh(frm) {

// 	},
// });

// Copyright (c) 2025, Ayush Patel and contributors
// For license information, please see license.txt

frappe.ui.form.on('Size List Generation', {
    refresh: function(frm) {
        // Add custom CSS for generation status
        if (!$('#generation-styles').length) {
            $('head').append(`
                <style id="generation-styles">
                    .generation-approved {
                        background-color: #d4edda !important;
                        border-left: 4px solid #28a745 !important;
                    }
                    .generation-info-box {
                        background-color: #e3f2fd;
                        border: 1px solid #2196f3;
                        border-radius: 5px;
                        padding: 15px;
                        margin: 10px 0;
                    }
                    .verification-stats {
                        display: flex;
                        justify-content: space-around;
                        text-align: center;
                    }
                    .verification-stats .stat {
                        flex: 1;
                        padding: 10px;
                    }
                    .verification-stats .stat .number {
                        font-size: 24px;
                        font-weight: bold;
                        display: block;
                    }
                </style>
            `);
        }
        
        // Make all fields read-only except form_number for new documents
        make_generation_fields_read_only(frm);
        
        // Disable adding/deleting rows in child table
        frm.set_df_property('stone_details', 'cannot_add_rows', 1);
        frm.set_df_property('stone_details', 'cannot_delete_rows', 1);
        make_child_table_read_only(frm);
        
        // Add custom buttons
        if (frm.doc.form_number && !frm.is_new()) {
            frm.add_custom_button(__('Refresh from Verification'), function() {
                refresh_from_verification(frm);
            });
            
            frm.add_custom_button(__('Show Verification Status'), function() {
                show_verification_status(frm);
            });
        }
        
        if (frm.doc.stone_details && frm.doc.stone_details.length > 0) {
            frm.add_custom_button(__('Generation Summary'), function() {
                show_generation_summary(frm);
            });
            
            frm.add_custom_button(__('Export to Excel'), function() {
                export_to_excel(frm);
            });
        }
        
        // Add help text
        if (!frm.doc.form_number && !frm.doc.stone_details?.length) {
            frm.dashboard.add_comment(__('📋 Enter a Form Number to automatically load approved stones from Size List Verification. This form shows only verified stones ready for generation.'), 'blue', true);
        }
        
        // Apply styling to existing rows
        apply_generation_styling(frm);
    },
    
    form_number: function(frm) {
        if (!frm.doc.form_number) return;

        // Show loading indicator
        frappe.show_alert({
            message: __('Loading approved stones for Form Number: {0}...', [frm.doc.form_number]),
            indicator: 'blue'
        });

        // Check if verification exists and get summary
        frappe.call({
            method: "baps.baps.doctype.size_list_generation.size_list_generation.check_form_number_exists",
            args: {
                form_number: frm.doc.form_number
            },
            callback: function(r) {
                if (r && r.message && r.message.success) {
                    if (r.message.verification_exists) {
                        // Show verification summary and load approved stones
                        show_verification_info(frm, r.message.summary);
                        load_approved_stones(frm);
                    } else {
                        frappe.msgprint({
                            title: __('Verification Required'),
                            message: __('Size List Verification not found for Form Number: {0}.<br><br>{1}<br><br>Please complete the verification process first before generating the size list.', 
                                [frm.doc.form_number, r.message.message]),
                            indicator: 'orange',
                            primary_action: {
                                label: __('Create Verification'),
                                action: function() {
                                    frappe.new_doc("Size List Verification", {
                                        form_number: frm.doc.form_number
                                    });
                                }
                            }
                        });
                    }
                } else {
                    frappe.msgprint({
                        title: __('Error'),
                        message: r.message.message || 'Error checking form number',
                        indicator: 'red'
                    });
                }
            }
        });
    },

    before_save: function(frm) {
        if (frm.doc.stone_details && frm.doc.stone_details.length > 0) {
            // Calculate total volume
            let total_volume = 0;
            frm.doc.stone_details.forEach(function(row) {
                if (row.volume) {
                    total_volume += parseFloat(row.volume) || 0;
                }
            });
            frm.set_value('total_volume_cft', total_volume);
        }
    }
});

// Load approved stones from verification
function load_approved_stones(frm) {
    frappe.call({
        method: "baps.baps.doctype.size_list_generation.size_list_generation.auto_populate_from_verification",
        args: {
            form_number: frm.doc.form_number,
            generation_doc_name: frm.doc.name || null
        },
        callback: function(r) {
            if (r && r.message && r.message.success) {
                // Reload the document to show updated data
                frm.reload_doc();
                
                frappe.show_alert({
                    message: __('✅ {0}', [r.message.message]),
                    indicator: 'green'
                });
                
                // Show success message
                frappe.msgprint({
                    title: __('Generation Ready'),
                    message: __('Successfully loaded <b>{0}</b> approved stones out of <b>{1}</b> total stones.<br><br>The size list is now ready for generation processing.', 
                        [r.message.approved_count, r.message.total_count]),
                    indicator: 'green'
                });
            } else {
                frappe.msgprint({
                    title: __('Load Error'),
                    message: r.message.message || 'Error loading approved stones',
                    indicator: 'red'
                });
            }
        }
    });
}

// Show verification information
function show_verification_info(frm, summary) {
    if (!summary) return;
    
    let info_html = `
        <div class="generation-info-box">
            <h5>📊 Verification Status for Form ${frm.doc.form_number}</h5>
            <div class="verification-stats">
                <div class="stat">
                    <span class="number" style="color: #28a745;">${summary.verified_count}</span>
                    <small>Approved</small>
                </div>
                <div class="stat">
                    <span class="number" style="color: #dc3545;">${summary.incorrect_count}</span>
                    <small>Incorrect</small>
                </div>
                <div class="stat">
                    <span class="number" style="color: #ffc107;">${summary.pending_count}</span>
                    <small>Pending</small>
                </div>
                <div class="stat">
                    <span class="number" style="color: #2196f3;">${summary.completion_percentage}%</span>
                    <small>Complete</small>
                </div>
            </div>
        </div>
    `;
    
    // Add to form dashboard
    frm.dashboard.add_comment(info_html, 'blue', true);
}

// Refresh from verification
function refresh_from_verification(frm) {
    frappe.confirm(
        __('This will refresh the stone details from the latest verification data. Any manual changes will be lost. Continue?'),
        function() {
            load_approved_stones(frm);
        }
    );
}

// Show verification status
function show_verification_status(frm) {
    frappe.call({
        method: "baps.baps.doctype.size_list_generation.size_list_generation.get_verification_summary",
        args: {
            form_number: frm.doc.form_number
        },
        callback: function(r) {
            if (r && r.message && r.message.success) {
                let summary = r.message.data;
                let status_html = `
                    <div class="verification-summary">
                        <h4>📋 Verification Status - Form ${frm.doc.form_number}</h4>
                        <div class="row">
                            <div class="col-sm-3">
                                <div class="alert alert-info text-center">
                                    <strong style="font-size: 20px;">${summary.total_stones}</strong><br>
                                    <span>Total Stones</span>
                                </div>
                            </div>
                            <div class="col-sm-3">
                                <div class="alert alert-success text-center">
                                    <strong style="font-size: 20px;">${summary.verified_count}</strong><br>
                                    <span>✅ Approved</span>
                                </div>
                            </div>
                            <div class="col-sm-3">
                                <div class="alert alert-danger text-center">
                                    <strong style="font-size: 20px;">${summary.incorrect_count}</strong><br>
                                    <span>❌ Incorrect</span>
                                </div>
                            </div>
                            <div class="col-sm-3">
                                <div class="alert alert-warning text-center">
                                    <strong style="font-size: 20px;">${summary.pending_count}</strong><br>
                                    <span>⏳ Pending</span>
                                </div>
                            </div>
                        </div>
                        <div class="alert ${summary.verification_complete ? 'alert-success' : 'alert-warning'}">
                            <strong>Status: </strong>
                            ${summary.verification_complete ? 
                                '✅ Verification Complete - All stones have been reviewed' : 
                                `⏳ ${summary.pending_count} stones still pending verification`
                            }
                        </div>
                    </div>
                `;
                
                frappe.msgprint({
                    title: __('Verification Status'),
                    message: status_html,
                    indicator: summary.verification_complete ? 'green' : 'orange'
                });
            }
        }
    });
}

// Make fields read-only
function make_generation_fields_read_only(frm) {
    if (frm.is_new() && !frm.doc.form_number) {
        // For new documents, only form_number is editable
        frm.set_df_property('form_number', 'read_only', 0);
    } else {
        // For existing documents, make all main fields read-only
        const read_only_fields = [
            'prep_date', 'material_type', 'baps_project', 'project_name', 
            'main_part', 'sub_part', 'total_volume_cft', 'cutting_region',
            'polishing_required', 'dry_fitting_required', 'carving_required', 
            'chemical_required', 'approved_date', 'checked_by'
        ];
        
        read_only_fields.forEach(function(field) {
            frm.set_df_property(field, 'read_only', 1);
        });
        
        // Form number should also be read-only after data is loaded
        frm.set_df_property('form_number', 'read_only', 1);
    }
}

function make_child_table_read_only(frm) {
    if (!frm.doc.stone_details) return;
    
    const child_read_only_fields = [
        'stone_name', 'stone_code', 'range', 'l1', 'l2', 'b1', 'b2', 'h1', 'h2', 'volume'
    ];
    
    child_read_only_fields.forEach(function(field) {
        frm.set_df_property('stone_details', field, 'read_only', 1);
    });
}

function apply_generation_styling(frm) {
    setTimeout(() => {
        frm.doc.stone_details?.forEach(function(row) {
            let row_element = $(`.grid-row[data-name="${row.name}"]`);
            row_element.addClass('generation-approved');
        });
    }, 500);
}

function show_generation_summary(frm) {
    let total_stones = frm.doc.stone_details ? frm.doc.stone_details.length : 0;
    let total_volume = 0;
    let stone_types = {};
    
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
    
    let stone_types_html = '';
    Object.keys(stone_types).forEach(function(type) {
        stone_types_html += `<li><strong>${type}:</strong> ${stone_types[type]} stones</li>`;
    });
    
    let summary_html = `
        <div class="generation-summary">
            <h4>📈 Generation Summary - ${frm.doc.form_number}</h4>
            <div class="row">
                <div class="col-sm-6">
                    <div class="alert alert-info">
                        <h5>📊 Statistics</h5>
                        <ul>
                            <li><strong>Total Stones:</strong> ${total_stones}</li>
                            <li><strong>Total Volume:</strong> ${total_volume.toFixed(2)} CFT</li>
                            <li><strong>Average Volume:</strong> ${total_stones > 0 ? (total_volume/total_stones).toFixed(2) : 0} CFT per stone</li>
                            <li><strong>Project:</strong> ${frm.doc.project_name || 'N/A'}</li>
                            <li><strong>Region:</strong> ${frm.doc.cutting_region || 'N/A'}</li>
                        </ul>
                    </div>
                </div>
                <div class="col-sm-6">
                    <div class="alert alert-success">
                        <h5>🏗️ Stone Types</h5>
                        <ul>
                            ${stone_types_html || '<li>No stone types found</li>'}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    frappe.msgprint({
        title: __('Generation Summary'),
        message: summary_html,
        indicator: 'green'
    });
}

function export_to_excel(frm) {
    // Prepare data for export
    let data = [];
    
    if (frm.doc.stone_details) {
        frm.doc.stone_details.forEach(function(row, index) {
            data.push({
                'Sr No': index + 1,
                'Stone Name': row.stone_name || '',
                'Stone Code': row.stone_code || '',
                'Range': row.range || '',
                'L1': row.l1 || '',
                'L2': row.l2 || '',
                'B1': row.b1 || '',
                'B2': row.b2 || '',
                'H1': row.h1 || '',
                'H2': row.h2 || '',
                'Volume (CFT)': row.volume || ''
            });
        });
    }
    
    // Use frappe's built-in export functionality
    frappe.tools.downloadify(data, null, `Size_List_Generation_${frm.doc.form_number}_${frappe.datetime.now_date()}`);
    
    frappe.show_alert({
        message: __('Excel export initiated for {0} stones', [data.length]),
        indicator: 'green'
    });
}