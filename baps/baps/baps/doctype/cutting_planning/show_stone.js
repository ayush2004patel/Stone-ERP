/**
 * Stone Selection Dialog for Cutting Planning
 * Complete implementation as per CUTTING_PLANNING_SCHEMA.md
 */

frappe.provide('baps.stone_dialog');

/**
 * Main function to show stone selection dialog
 * Called from cutting_planning.js
 */
baps.stone_dialog.show = function(frm) {
    // Create the dialog with all filter fields
    let dialog = new frappe.ui.Dialog({
        title: __('Select Stones for Cutting Plan'),
        size: 'extra-large',
        fields: [
            // Project Filter
            {
                fieldname: 'project',
                fieldtype: 'Link',
                label: __('Project'),
                options: 'Baps Project',
                onchange: function() {
                    search_stones(frm, dialog);
                }
            },
            
            // Stone Name Filter
            {
                fieldname: 'stone_name',
                fieldtype: 'Link',
                label: __('Stone Name'),
                options: 'Stone Name',
                onchange: function() {
                    search_stones(frm, dialog);
                }
            },
            
            // Column Break
            {
                fieldtype: 'Column Break'
            },
            
            // Stone Code Filter
            {
                fieldname: 'stone_code',
                fieldtype: 'Data',
                label: __('Stone Code'),
                onchange: function() {
                    search_stones(frm, dialog);
                }
            },
            
            // Main Part Filter
            {
                fieldname: 'main_part',
                fieldtype: 'Link',
                label: __('Main Part'),
                options: 'Main Part',
                onchange: function() {
                    search_stones(frm, dialog);
                }
            },
            
            // Section Break for Dimensions
            {
                fieldtype: 'Section Break',
                label: __('Length Filters')
            },
            
            // Length Filter Type
            {
                fieldname: 'l_filter_type',
                fieldtype: 'Select',
                label: __('Length Filter Type'),
                options: ['', 'Below', 'Between'],
                default: '',
                onchange: function() {
                    toggle_dimension_fields(dialog, 'l');
                }
            },
            
            {
                fieldname: 'l_below',
                fieldtype: 'Float',
                label: __('Length Below'),
                depends_on: 'eval:doc.l_filter_type=="Below"',
                onchange: function() {
                    search_stones(frm, dialog);
                }
            },
            
            {
                fieldtype: 'Column Break'
            },
            
            {
                fieldname: 'l_between_from',
                fieldtype: 'Float',
                label: __('Length From'),
                depends_on: 'eval:doc.l_filter_type=="Between"',
                onchange: function() {
                    search_stones(frm, dialog);
                }
            },
            
            {
                fieldname: 'l_between_to',
                fieldtype: 'Float',
                label: __('Length To'),
                depends_on: 'eval:doc.l_filter_type=="Between"',
                onchange: function() {
                    search_stones(frm, dialog);
                }
            },
            
            // Section Break for Breadth
            {
                fieldtype: 'Section Break',
                label: __('Breadth Filters')
            },
            
            {
                fieldname: 'b_filter_type',
                fieldtype: 'Select',
                label: __('Breadth Filter Type'),
                options: ['', 'Below', 'Between'],
                default: '',
                onchange: function() {
                    toggle_dimension_fields(dialog, 'b');
                }
            },
            
            {
                fieldname: 'b_below',
                fieldtype: 'Float',
                label: __('Breadth Below'),
                depends_on: 'eval:doc.b_filter_type=="Below"',
                onchange: function() {
                    search_stones(frm, dialog);
                }
            },
            
            {
                fieldtype: 'Column Break'
            },
            
            {
                fieldname: 'b_between_from',
                fieldtype: 'Float',
                label: __('Breadth From'),
                depends_on: 'eval:doc.b_filter_type=="Between"',
                onchange: function() {
                    search_stones(frm, dialog);
                }
            },
            
            {
                fieldname: 'b_between_to',
                fieldtype: 'Float',
                label: __('Breadth To'),
                depends_on: 'eval:doc.b_filter_type=="Between"',
                onchange: function() {
                    search_stones(frm, dialog);
                }
            },
            
            // Section Break for Height
            {
                fieldtype: 'Section Break',
                label: __('Height Filters')
            },
            
            {
                fieldname: 'h_filter_type',
                fieldtype: 'Select',
                label: __('Height Filter Type'),
                options: ['', 'Below', 'Between'],
                default: '',
                onchange: function() {
                    toggle_dimension_fields(dialog, 'h');
                }
            },
            
            {
                fieldname: 'h_below',
                fieldtype: 'Float',
                label: __('Height Below'),
                depends_on: 'eval:doc.h_filter_type=="Below"',
                onchange: function() {
                    search_stones(frm, dialog);
                }
            },
            
            {
                fieldtype: 'Column Break'
            },
            
            {
                fieldname: 'h_between_from',
                fieldtype: 'Float',
                label: __('Height From'),
                depends_on: 'eval:doc.h_filter_type=="Between"',
                onchange: function() {
                    search_stones(frm, dialog);
                }
            },
            
            {
                fieldname: 'h_between_to',
                fieldtype: 'Float',
                label: __('Height To'),
                depends_on: 'eval:doc.h_filter_type=="Between"',
                onchange: function() {
                    search_stones(frm, dialog);
                }
            },
            
            // Section Break for Results
            {
                fieldtype: 'Section Break',
                label: __('Search Results')
            },
            
            // HTML field to display stones
            {
                fieldname: 'stones_html',
                fieldtype: 'HTML',
                options: `
                    <div class="text-center text-muted" style="padding: 60px;">
                        <i class="fa fa-filter fa-3x" style="opacity: 0.3;"></i>
                        <p style="margin-top: 20px; font-size: 16px;">Apply filters to search for stones</p>
                        <p style="font-size: 12px;">Select project, stone name, or use dimension filters</p>
                    </div>
                `
            }
        ],
        primary_action_label: __('Add Selected Stones'),
        primary_action: function() {
            add_selected_stones(frm, dialog);
        },
        secondary_action_label: __('Clear Filters'),
        secondary_action: function() {
            dialog.clear();
            dialog.fields_dict.stones_html.$wrapper.html(`
                <div class="text-center text-muted" style="padding: 60px;">
                    <i class="fa fa-filter fa-3x" style="opacity: 0.3;"></i>
                    <p style="margin-top: 20px; font-size: 16px;">Apply filters to search for stones</p>
                    <p style="font-size: 12px;">Select project, stone name, or use dimension filters</p>
                </div>
            `);
        }
    });
    
    // Show the dialog
    dialog.show();
    
    // Auto-search if project is already set in the form
    if (frm.doc.baps_project) {
        dialog.set_value('project', frm.doc.baps_project);
        search_stones(frm, dialog);
    }
};

function toggle_dimension_fields(dialog, dimension) {
    let type = dialog.get_value(`${dimension}_filter_type`);
    dialog.get_field(`${dimension}_below`).df.hidden = (type !== 'Below');
    dialog.get_field(`${dimension}_between_from`).df.hidden = (type !== 'Between');
    dialog.get_field(`${dimension}_between_to`).df.hidden = (type !== 'Between');
    dialog.refresh();
}

// Search stones from server
function search_stones(frm, dialog) {
    let filters = dialog.get_values();
    
    // Show loading indicator
    dialog.fields_dict.stones_html.$wrapper.html(`
        <div class="text-center" style="padding: 60px;">
            <i class="fa fa-spinner fa-spin fa-3x text-muted"></i>
            <p class="text-muted" style="margin-top: 20px; font-size: 14px;">
                Searching for stones...
            </p>
        </div>
    `);
    
    // Call server method
    frappe.call({
        method: 'baps.baps.doctype.cutting_planning.cutting_planning.get_filtered_stones',
        args: {
            filters: filters,
            block_no: frm.doc.block_no
        },
        callback: function(r) {
            if (r.message && r.message.length > 0) {
                display_stones(dialog, r.message, frm);
            } else {
                dialog.fields_dict.stones_html.$wrapper.html(`
                    <div class="text-center text-muted" style="padding: 60px;">
                        <i class="fa fa-search fa-3x" style="opacity: 0.3;"></i>
                        <p style="margin-top: 20px; font-size: 16px;">No stones found matching your criteria</p>
                        <p style="font-size: 12px;">Try adjusting your filter settings</p>
                    </div>
                `);
            }
        },
        error: function(r) {
            dialog.fields_dict.stones_html.$wrapper.html(`
                <div class="text-center text-danger" style="padding: 60px;">
                    <i class="fa fa-exclamation-triangle fa-3x"></i>
                    <p style="margin-top: 20px;">Error loading stones</p>
                    <p style="font-size: 12px;">${r.message || 'Please try again'}</p>
                </div>
            `);
        }
    });
}

// Display stones in table
function display_stones(dialog, stones, frm) {
    let html = `
        <div style="max-height: 450px; overflow-y: auto; overflow-x: auto;">
            <table class="table table-bordered table-hover" style="font-size: 12px;">
                <thead style="position: sticky; top: 0; background: white; z-index: 10; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <tr style="background: #f8f9fa;">
                        <th style="width: 40px; text-align: center;">
                            <input type="checkbox" id="select_all_stones" title="Select All" />
                        </th>
                        <th style="min-width: 100px;">Stone Code</th>
                        <th style="min-width: 120px;">Stone Name</th>
                        <th style="min-width: 150px;">Project</th>
                        <th style="min-width: 60px;">L1</th>
                        <th style="min-width: 60px;">L2</th>
                        <th style="min-width: 60px;">B1</th>
                        <th style="min-width: 60px;">B2</th>
                        <th style="min-width: 60px;">H1</th>
                        <th style="min-width: 60px;">H2</th>
                        <th style="min-width: 80px;">Volume</th>
                        
                    </tr>
                </thead>
                <tbody>
    `;
    
    stones.forEach((stone, index) => {
        let warning = stone.is_altered ? '<span class="badge badge-warning" title="Stone dimensions altered">⚠️ Altered</span>' : 
                                        '<span class="badge badge-success">✓ OK</span>';
        let rowClass = index % 2 === 0 ? 'bg-light' : '';
        
        html += `
            <tr class="${rowClass}" style="cursor: pointer;" onmouseover="this.style.backgroundColor='#e9ecef'" onmouseout="this.style.backgroundColor='${index % 2 === 0 ? '#f8f9fa' : 'white'}'">
                <td style="text-align: center;">
                    <input type="checkbox" class="stone-checkbox" 
                           data-stone='${JSON.stringify(stone).replace(/'/g, "&apos;")}' />
                </td>
                <td><strong>${stone.stone_no || stone.stone_code || ''}</strong></td>
                <td>${stone.stone_name || '-'}</td>
                <td>${stone.project_name || '-'}</td>
                <td>${parseFloat(stone.l1 || 0).toFixed(2)}</td>
                <td>${parseFloat(stone.l2 || 0).toFixed(2)}</td>
                <td>${parseFloat(stone.b1 || 0).toFixed(2)}</td>
                <td>${parseFloat(stone.b2 || 0).toFixed(2)}</td>
                <td>${parseFloat(stone.h1 || 0).toFixed(2)}</td>
                <td>${parseFloat(stone.h2 || 0).toFixed(2)}</td>
                <td><strong>${parseFloat(stone.volume || 0).toFixed(3)}</strong></td>
                <td>${warning}</td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
        <div style="margin-top: 15px; padding: 10px; background: #f0f4f8; border-radius: 5px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <i class="fa fa-info-circle text-primary"></i> 
                    <strong>${stones.length}</strong> stones found
                </div>
                <div style="font-size: 11px; color: #666;">
                    Select stones and click "Add Selected Stones" to add to cutting plan
                </div>
            </div>
        </div>
    `;
    
    dialog.fields_dict.stones_html.$wrapper.html(html);
    
    // Add select all functionality
    dialog.fields_dict.stones_html.$wrapper.find('#select_all_stones').on('change', function() {
        let checked = $(this).is(':checked');
        dialog.fields_dict.stones_html.$wrapper.find('.stone-checkbox').prop('checked', checked);
    });
    
    // Add row click to toggle checkbox
    dialog.fields_dict.stones_html.$wrapper.find('tbody tr').on('click', function(e) {
        if (!$(e.target).is('input[type="checkbox"]')) {
            let checkbox = $(this).find('.stone-checkbox');
            checkbox.prop('checked', !checkbox.prop('checked'));
        }
    });
}

// Add selected stones to cutting plan
function add_selected_stones(frm, dialog) {
    let selected_stones = [];
    let altered_stones = [];
    
    dialog.fields_dict.stones_html.$wrapper.find('.stone-checkbox:checked').each(function() {
        let stone_data = $(this).data('stone');
        selected_stones.push(stone_data);
        
        // Track altered stones
        if (stone_data.is_altered) {
            altered_stones.push(stone_data.stone_no || stone_data.stone_code);
        }
    });
    
    if (selected_stones.length === 0) {
        frappe.msgprint({
            title: __('No Selection'),
            message: __('Please select at least one stone to add'),
            indicator: 'orange'
        });
        return;
    }
    
    // Show warning if altered stones selected
    if (altered_stones.length > 0) {
        frappe.warn(
            __('Altered Stones Selected'),
            __(`The following stones have altered properties: <br><br><strong>${altered_stones.join(', ')}</strong><br><br>Do you want to continue?`),
            () => {
                // User confirmed, proceed with adding stones
                add_stones_to_details(frm, selected_stones, dialog);
            },
            () => {
                // User cancelled
                frappe.show_alert({
                    message: __('Stone addition cancelled'),
                    indicator: 'orange'
                });
            }
        );
    } else {
        // No altered stones, proceed directly
        add_stones_to_details(frm, selected_stones, dialog);
    }
}

// Actually add stones to the details table
function add_stones_to_details(frm, selected_stones, dialog) {
    let added_count = 0;
    
    selected_stones.forEach(stone => {
        // Calculate volume if not present
        let volume = stone.volume;
        if (!volume || volume === 0) {
            let l_avg = (parseFloat(stone.l1) + parseFloat(stone.l2)) / 2;
            let b_avg = (parseFloat(stone.b1) + parseFloat(stone.b2)) / 2;
            let h_avg = (parseFloat(stone.h1) + parseFloat(stone.h2)) / 2;
            volume = l_avg * b_avg * h_avg;
        }
        
        // Add row to details table
        let row = frm.add_child('details', {
            project_name: stone.project_name || '',
            stone_no: stone.stone_no || stone.stone_code,
            l1: parseFloat(stone.l1) || 0,
            l2: parseFloat(stone.l2) || 0,
            b1: parseFloat(stone.b1) || 0,
            b2: parseFloat(stone.b2) || 0,
            h1: parseFloat(stone.h1) || 0,
            h2: parseFloat(stone.h2) || 0,
            volume: parseFloat(volume) || 0
        });
        added_count++;
    });
    
    // Refresh the child table
    frm.refresh_field('details');
    
    // Trigger calculation
    if (typeof calculate_summary === 'function') {
        calculate_summary(frm);
    }
    
    // Show success message
    frappe.show_alert({
        message: __(`Successfully added ${added_count} stone(s) to cutting plan`),
        indicator: 'green'
    }, 5);
    
    // Close dialog
    dialog.hide();
}
