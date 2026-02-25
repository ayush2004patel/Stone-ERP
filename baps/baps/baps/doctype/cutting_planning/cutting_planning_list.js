
// Copyright (c) 2025, Amax Consultancy Pvt Ltd and contributors

frappe.listview_settings['Cutting Planning'] = {
    onload: function(listview) {
        
        // Store original clear and refresh methods before they get overridden
        listview._original_clear = listview.filter_area.clear.bind(listview.filter_area);
        listview._original_refresh = listview.refresh.bind(listview);
        
        // Add Plan Status filter dropdown buttons
        listview.page.add_inner_button(__('Show All'), function() {
            // Show all plans (both final and not final) - clear all filters
            listview.filter_area.clear();
            listview.refresh();
        }, __('Filter Status'));

        listview.page.add_inner_button(__('Final Only'), function() {
            // Show only final plans (is_final_plan = 1)
            listview.filter_area.clear();
            listview.filter_area.add([[listview.doctype, 'is_final_plan', '=', 1]]);
            listview.refresh();
        }, __('Filter Status'));

        listview.page.add_inner_button(__('Not Final Only'), function() {
            // Show only not final plans (is_final_plan = 0)
            listview.filter_area.clear();
            listview.filter_area.add([[listview.doctype, 'is_final_plan', '=', 0]]);
            listview.refresh();
        }, __('Filter Status'));
        
        // Apply permanent filter to show only one plan per block
        apply_permanent_one_per_block_filter(listview);
     },
     
    get_indicator: function(doc) {
        if (doc.is_final_plan) {
            return [__("Final"), "green", "is_final_plan,=,1"];
        } else {
            return [__("Not Final"), "orange", "is_final_plan,=,0"];
        }
    },
    
    formatters: {
        plan_count: function(value, df, doc) {
            // Display plan count as a clickable button
            let count = value || 0;
            let buttonClass = count > 1 ? 'btn-primary' : 'btn-secondary';
            return `<button class="btn btn-xs ${buttonClass}" 
                            onclick="event.stopPropagation(); event.preventDefault(); show_all_plans_for_block('${doc.block_no}'); return false;" 
                            style="pointer-events: auto;">
                        ${count} Plan${count !== 1 ? 's' : ''}
                    </button>`;
        }
    }
};

// Function to apply PERMANENT filter showing only one representative plan per block
// This filter shows one plan per block (preferring final plans)
function apply_permanent_one_per_block_filter(listview) {
    frappe.call({
        method: 'baps.baps.doctype.cutting_planning.cutting_planning.get_representative_plans',
        callback: function(r) {
            if (r.message && r.message.length > 0) {
                let plan_names = r.message.map(p => p.name);
                
                // Store representative plan names in listview object
                listview._plan_names = plan_names;
                listview._representative_plans = plan_names;
                
                // Apply filter to show only representative plans
                listview._original_clear(false);
                listview.filter_area.add([[listview.doctype, 'name', 'in', plan_names]]);
                listview._original_refresh();
                
                // Lock the filter by preventing clear and refresh operations
                lock_filter(listview, plan_names);
            }
        }
    });
}

// Function to lock the filter so users cannot remove it
// BUT allows status filters to work independently
function lock_filter(listview, plan_names) {
    // Don't lock filters - allow full flexibility for status filtering
    // The permanent filter was causing issues with status filters
    // Users can now filter freely by status (Final/Not Final/All)
}

// Function to show comparison dialog and allow finalizing one plan
function show_comparison_dialog(plans, block_no) {
    let dialog = new frappe.ui.Dialog({
        title: __('Compare Plans - Block: {0}', [block_no]),
        size: 'extra-large',
        fields: [
            {
                fieldtype: 'HTML',
                fieldname: 'comparison_table'
            }
        ]
    });
    
    // Sort plans by wastage percentage (ascending - lower is better)
    plans.sort((a, b) => (a.waste || 0) - (b.waste || 0));
    
    let html = `
        <div style="max-height: 600px; overflow-y: auto;">
            <table class="table table-bordered">
                <thead style="position: sticky; top: 0; background: white;">
                    <tr>
                        <th style="width: 60px;">Select</th>
                        <th>Plan</th>
                        <th>Trial No</th>
                        <th style="text-align: right;">Block Vol</th>
                        <th style="text-align: right;">Stone Vol</th>
                        <th style="text-align: right;">Wastage %</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    plans.forEach((plan, index) => {
        let waste = plan.waste || 0;
        let rowClass = plan.is_final_plan ? 'table-success' : '';
        let wasteClass = waste < 10 ? 'text-success' : waste < 20 ? 'text-warning' : 'text-danger';
        let statusBadge = plan.is_final_plan ? 
            '<span class="badge badge-success">Final</span>' : 
            '<span class="badge badge-secondary">Not Final</span>';
        
        html += `
            <tr class="${rowClass}">
                <td style="text-align: center;">
                    <input type="radio" name="selected_plan" value="${plan.name}" 
                           ${plan.is_final_plan || index === 0 ? 'checked' : ''} 
                           id="plan_${index}">
                </td>
                <td><a href="/app/cutting-planning/${plan.name}" target="_blank">${plan.name}</a></td>
                <td><strong>${plan.trial_no || '-'}</strong></td>
                <td style="text-align: right;">${plan.block_volume ? plan.block_volume.toFixed(2) : '0.00'}</td>
                <td style="text-align: right;">${plan.total_stone_volume ? plan.total_stone_volume.toFixed(2) : '0.00'}</td>
                <td style="text-align: right;">
                    <strong class="${wasteClass}">${waste.toFixed(2)}%</strong>
                </td>
                <td>${statusBadge}</td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    dialog.fields_dict.comparison_table.$wrapper.html(html);
    
    // Check if any plan is already marked as final
    const has_final_plan = plans.some(p => p.is_final_plan);
    
    // Only show "Mark as Final" button if no plan is already final
    if (!has_final_plan) {
        dialog.set_primary_action(__('Mark as Final'), function() {
            let selected_plan = dialog.$wrapper.find('input[name="selected_plan"]:checked').val();
            
            if (!selected_plan) {
                frappe.msgprint(__('Please select a plan'));
                return;
            }
            
            mark_plan_as_final(selected_plan, plans, dialog);
        });
    } else {
        // Show info message that a final plan already exists
        dialog.set_secondary_action_label(__('Close'));
    }
    
    dialog.show();
}

// Function to mark a plan as final
function mark_plan_as_final(plan_name, all_plans, dialog) {
    frappe.confirm(
        __('Are you sure you want to mark {0} as the Final Plan? All other plans in this comparison will be unmarked.', [plan_name]),
        () => {
            frappe.call({
                method: 'baps.baps.doctype.cutting_planning.cutting_planning.mark_plan_as_final',
                args: {
                    plan_name: plan_name,
                    all_plan_names: all_plans.map(p => p.name)
                },
                callback: function(r) {
                    if (r.message && r.message.success) {
                        frappe.show_alert({
                            message: __('Plan marked as final successfully!'),
                            indicator: 'green'
                        }, 5);
                        dialog.hide();
                        // Refresh the list view
                        cur_list.refresh();
                    } else {
                        frappe.msgprint({
                            title: __('Error'),
                            indicator: 'red',
                            message: r.message.error || __('Failed to mark plan as final')
                        });
                    }
                }
            });
        }
    );
}


function show_trial_comparison_dialog() {
    let dialog = new frappe.ui.Dialog({
        title: __('Compare Trial Versions Across Documents'),
        fields: [
            {
                fieldname: 'trial_no',
                fieldtype: 'Data',
                label: __('Trial Number'),
                reqd: 1,
                description: __('Enter trial number (e.g., TRIAL-A1)')
            }
        ],
        primary_action_label: __('Search'),
        primary_action: function() {
            let trial_no = dialog.get_value('trial_no');
            if (!trial_no) {
                frappe.msgprint(__('Please enter a Trial Number'));
                return;
            }
            dialog.hide();
            fetch_and_display_trials(trial_no);
        }
    });
    dialog.show();
}

function fetch_and_display_trials(trial_no) {
    frappe.call({
        method: 'baps.baps.doctype.cutting_planning.cutting_planning.get_all_trial_versions',
        args: { trial_no: trial_no },
        callback: function(r) {
            if (r.message && r.message.length > 0) {
                show_trial_comparison_table(trial_no, r.message);
            } else {
                frappe.msgprint({
                    title: __('No Trials Found'),
                    indicator: 'orange',
                    message: __('No Cutting Planning documents found with Trial No: {0}', [trial_no])
                });
            }
        }
    });
}



// Global function to show all plans for a specific block
window.show_all_plans_for_block = function(block_no) {
    frappe.call({
        method: 'baps.baps.doctype.cutting_planning.cutting_planning.get_plans_by_block',
        args: { block_no: block_no },
        callback: function(r) {
            if (r.message && r.message.length > 0) {
                show_block_plans_dialog(block_no, r.message);
            } else {
                frappe.msgprint({
                    title: __('No Plans Found'),
                    indicator: 'orange',
                    message: __('No plans found for block {0}', [block_no])
                });
            }
        }
    });
};

// Function to display all plans for a block in a dialog
function show_block_plans_dialog(block_no, plans) {
    let dialog = new frappe.ui.Dialog({
        title: __('All Plans for Block: {0}', [block_no]),
        size: 'extra-large',
        fields: [
            {
                fieldtype: 'HTML',
                fieldname: 'plans_table'
            }
        ]
    });
    
    // Sort plans by wastage percentage (ascending - lower is better)
    plans.sort((a, b) => (a.waste || 0) - (b.waste || 0));
    
    // Check if any plan is already marked as final
    const has_final_plan = plans.some(p => p.is_final_plan);
    
    let html = `
        <style>
            .final-checkbox {
                width: 20px;
                height: 20px;
                cursor: pointer;
                accent-color: #000000;
            }
            .final-checkbox:disabled {
                cursor: not-allowed;
                opacity: 0.5;
            }
        </style>
        <div style="max-height: 600px; overflow-y: auto;">
            <table class="table table-bordered table-hover">
                <thead style="position: sticky; top: 0; background: white; z-index: 10;">
                    <tr>
                        <th style="text-align: center; width: 120px;">Select for Final</th>
                        <th>Plan ID</th>
                        <th>Trial No</th>
                        <th style="text-align: right;">Block Vol</th>
                        <th style="text-align: right;">Stone Vol</th>
                        <th style="text-align: right;">Wastage %</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    plans.forEach((plan, index) => {
        let waste = plan.waste || 0;
        let wasteClass = waste < 10 ? 'text-success' : waste < 20 ? 'text-warning' : 'text-danger';
        let statusBadge = plan.is_final_plan ? 
            '<span class="badge badge-success">Final</span>' : 
            '<span class="badge badge-secondary">Not Final</span>';
        let rowClass = plan.is_final_plan ? 'table-success' : '';
        
        // Only allow one checkbox to be checked at a time
        let checkboxChecked = plan.is_final_plan ? 'checked' : '';
        let checkboxDisabled = has_final_plan && !plan.is_final_plan ? 'disabled' : '';
        
        html += `
            <tr class="${rowClass}">
                <td style="text-align: center;">
                    <input type="checkbox" 
                           class="final-checkbox plan-checkbox-${block_no}" 
                           data-plan-name="${plan.name}" 
                           data-plan-index="${index}"
                           ${checkboxChecked}
                           ${checkboxDisabled}>
                </td>
                <td><a href="/app/cutting-planning/${plan.name}" target="_blank">${plan.name}</a></td>
                <td><strong>${plan.trial_no || '-'}</strong></td>
                <td style="text-align: right;">${plan.block_volume ? plan.block_volume.toFixed(2) : '0.00'}</td>
                <td style="text-align: right;">${plan.total_stone_volume ? plan.total_stone_volume.toFixed(2) : '0.00'}</td>
                <td style="text-align: right;">
                    <strong class="${wasteClass}">${waste.toFixed(2)}%</strong>
                </td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn btn-xs btn-primary" 
                            onclick="frappe.set_route('Form', 'Cutting Planning', '${plan.name}')">
                        <i class="fa fa-eye"></i> View
                    </button>
                </td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
        <div style="margin-top: 15px; padding: 10px; background-color: #f8f9fa; border-radius: 5px;">
            <p class="text-muted" style="margin: 0;">
                <i class="fa fa-info-circle"></i> 
                <strong>Total: ${plans.length} plan${plans.length !== 1 ? 's' : ''}</strong> for block ${block_no}
            </p>
            ${has_final_plan ? '<p class="text-success" style="margin: 5px 0 0 0;"><i class="fa fa-check-circle"></i> A final plan has been selected for this block.</p>' : '<p class="text-info" style="margin: 5px 0 0 0;"><i class="fa fa-info-circle"></i> Select a plan and click "Mark as Final" button below.</p>'}
        </div>
    `;
    
    dialog.fields_dict.plans_table.$wrapper.html(html);
    
    // Make only one checkbox selectable at a time
    dialog.$wrapper.find(`.plan-checkbox-${block_no}`).on('change', function() {
        if (this.checked) {
            // Uncheck all other checkboxes
            dialog.$wrapper.find(`.plan-checkbox-${block_no}`).not(this).prop('checked', false);
        }
    });
    
    // Always show both buttons with proper labels
    if (!has_final_plan) {
        // No final plan yet - show only "Mark as Final"
        dialog.set_primary_action(__('Mark as Final'), function() {
            // Get the checked checkbox
            let selectedCheckbox = dialog.$wrapper.find(`.plan-checkbox-${block_no}:checked`);
            
            if (selectedCheckbox.length === 0) {
                frappe.msgprint({
                    title: __('No Plan Selected'),
                    indicator: 'orange',
                    message: __('Please select a plan by checking the checkbox.')
                });
                return;
            }
            
            let selectedPlanName = selectedCheckbox.attr('data-plan-name');
            
            // Confirm before marking as final
            frappe.confirm(
                __('Are you sure you want to mark this plan as Final? All other plans for this block will be unmarked.'),
                () => {
                    frappe.call({
                        method: 'baps.baps.doctype.cutting_planning.cutting_planning.mark_plan_as_final',
                        args: {
                            plan_name: selectedPlanName,
                            all_plan_names: plans.map(p => p.name)
                        },
                        callback: function(r) {
                            if (r.message && r.message.success) {
                                frappe.show_alert({
                                    message: __('Plan marked as final successfully!'),
                                    indicator: 'green'
                                }, 5);
                                dialog.hide();
                                // Refresh the list view
                                cur_list.refresh();
                            } else {
                                frappe.msgprint({
                                    title: __('Error'),
                                    indicator: 'red',
                                    message: r.message.error || __('Failed to mark plan as final')
                                });
                            }
                        }
                    });
                }
            );
        });
    } else {
        // A plan is already final - show both "Unmark Final" and "Mark as Final"
        dialog.set_primary_action(__('Mark as Final'), function() {
            // Get the checked checkbox
            let selectedCheckbox = dialog.$wrapper.find(`.plan-checkbox-${block_no}:checked`);
            
            if (selectedCheckbox.length === 0) {
                frappe.msgprint({
                    title: __('No Plan Selected'),
                    indicator: 'orange',
                    message: __('Please select a plan by checking the checkbox.')
                });
                return;
            }
            
            let selectedPlanName = selectedCheckbox.attr('data-plan-name');
            
            // Confirm before marking as final
            frappe.confirm(
                __('Are you sure you want to mark this plan as Final? All other plans for this block will be unmarked.'),
                () => {
                    frappe.call({
                        method: 'baps.baps.doctype.cutting_planning.cutting_planning.mark_plan_as_final',
                        args: {
                            plan_name: selectedPlanName,
                            all_plan_names: plans.map(p => p.name)
                        },
                        callback: function(r) {
                            if (r.message && r.message.success) {
                                frappe.show_alert({
                                    message: __('Plan marked as final successfully!'),
                                    indicator: 'green'
                                }, 5);
                                dialog.hide();
                                // Refresh the list view
                                cur_list.refresh();
                            } else {
                                frappe.msgprint({
                                    title: __('Error'),
                                    indicator: 'red',
                                    message: r.message.error || __('Failed to mark plan as final')
                                });
                            }
                        }
                    });
                }
            );
        });
        
        dialog.set_secondary_action_label(__('Unmark Final'));
        dialog.set_secondary_action(function() {
            // Get the checked checkbox (the final plan)
            let selectedCheckbox = dialog.$wrapper.find(`.plan-checkbox-${block_no}:checked`);
            
            if (selectedCheckbox.length === 0) {
                frappe.msgprint({
                    title: __('No Plan Selected'),
                    indicator: 'orange',
                    message: __('No final plan found to unmark.')
                });
                return;
            }
            
            let selectedPlanName = selectedCheckbox.attr('data-plan-name');
            
            // Confirm before unmarking
            frappe.confirm(
                __('Are you sure you want to unmark this plan as Final?'),
                () => {
                    frappe.call({
                        method: 'baps.baps.doctype.cutting_planning.cutting_planning.unmark_plan_as_final',
                        args: {
                            plan_name: selectedPlanName
                        },
                        callback: function(r) {
                            if (r.message && r.message.success) {
                                frappe.show_alert({
                                    message: __('Plan unmarked successfully! You can now select another plan to mark as final.'),
                                    indicator: 'green'
                                }, 5);
                                
                                // Don't close the dialog - just refresh it
                                // Reload the plans data and refresh the dialog content
                                frappe.call({
                                    method: 'baps.baps.doctype.cutting_planning.cutting_planning.get_plans_by_block',
                                    args: { block_no: block_no },
                                    callback: function(response) {
                                        if (response.message && response.message.length > 0) {
                                            // Close current dialog
                                            dialog.hide();
                                            // Reopen with updated data
                                            show_block_plans_dialog(block_no, response.message);
                                        }
                                    }
                                });
                            } else {
                                frappe.msgprint({
                                    title: __('Error'),
                                    indicator: 'red',
                                    message: r.message.error || __('Failed to unmark plan')
                                });
                            }
                        }
                    });
                }
            );
        });
    }
    
    dialog.show();
}

// Global functions to handle button clicks inside dialog
window.view_trial_details = function(docname) {
    frappe.set_route('Form', 'Cutting Planning', docname);
};

window.mark_as_final_from_list = function(docname, trial_no) {
    frappe.confirm(
        __('Mark Trial {0} in {1} as Final Selected Plan?', [trial_no, docname]),
        () => {
            frappe.call({
                method: 'baps.baps.doctype.cutting_planning.cutting_planning.finalize_plan',
                args: {
                    cutting_plan_name: docname,
                    trial_no: trial_no
                },
                callback: function(r) {
                    if (r.message && r.message.success) {
                        frappe.show_alert({
                            message: __('Marked as Final!'),
                            indicator: 'green'
                        }, 5);
                    } else {
                        frappe.msgprint({
                            title: __('Error'),
                            indicator: 'red',
                            message: r.message.error || __('Failed to finalize')
                        });
                    }
                }
            });
        }
    );
};


