/**
 * User Proxy Management Dialog
 * 
 * This file provides functionality to manage user proxy assignments
 * Allows users to assign proxy users for specific date ranges
 */

frappe.provide('baps.proxy');

/**
 * Show proxy management dialog
 */
baps.proxy.show_dialog = function() {
    // Create the dialog
    let d = new frappe.ui.Dialog({
        title: __('Manage User Proxy'),
        size: 'large',
        fields: [
            {
                fieldtype: 'HTML',
                fieldname: 'current_proxy_info',
                options: '<div id="current-proxy-info"></div>'
            },
            {
                fieldtype: 'Section Break',
                label: __('Add New Proxy Assignment')
            },
            {
                fieldtype: 'Link',
                fieldname: 'proxy_user',
                label: __('Proxy User'),
                options: 'User',
                reqd: 1,
                description: __('Select a user who will act as proxy on your behalf')
            },
            {
                fieldtype: 'Column Break'
            },
            {
                fieldtype: 'Date',
                fieldname: 'from_date',
                label: __('From Date'),
                reqd: 1,
                default: frappe.datetime.get_today()
            },
            {
                fieldtype: 'Date',
                fieldname: 'to_date',
                label: __('To Date'),
                reqd: 1,
                default: frappe.datetime.add_days(frappe.datetime.get_today(), 7)
            },
            {
                fieldtype: 'Section Break'
            },
            {
                fieldtype: 'Button',
                fieldname: 'add_proxy',
                label: __('Add Proxy Assignment'),
                click: function() {
                    baps.proxy.add_assignment(d);
                }
            },
            {
                fieldtype: 'Section Break',
                label: __('Your Proxy Assignments')
            },
            {
                fieldtype: 'HTML',
                fieldname: 'proxy_list',
                options: '<div id="proxy-assignments-list"></div>'
            }
        ],
        primary_action_label: __('Close'),
        primary_action: function() {
            d.hide();
        }
    });

    // Load and display current proxy info and assignments
    baps.proxy.load_data(d);

    d.show();
};

/**
 * Load proxy data (active proxy info and all assignments)
 */
baps.proxy.load_data = function(dialog) {
    // Load active proxy info
    frappe.call({
        method: 'baps.api.proxy_api.get_active_proxy_info',
        callback: function(r) {
            baps.proxy.render_active_proxy(r.message);
        }
    });

    // Load all proxy assignments
    frappe.call({
        method: 'baps.api.proxy_api.get_my_proxy_assignments',
        callback: function(r) {
            baps.proxy.render_assignments(r.message || []);
        }
    });
};

/**
 * Render active proxy information
 */
baps.proxy.render_active_proxy = function(proxy_info) {
    let html = '';
    
    if (proxy_info && proxy_info.is_active) {
        html = `
            <div class="alert alert-success" style="margin-bottom: 15px;">
                <strong><i class="fa fa-user-shield"></i> Active Proxy:</strong><br>
                <span style="font-size: 14px;">
                    <strong>${proxy_info.proxy_user_full_name}</strong> (${proxy_info.proxy_user}) 
                    is acting as your proxy<br>
                    <small>From: ${frappe.datetime.str_to_user(proxy_info.from_date)} 
                    to ${frappe.datetime.str_to_user(proxy_info.to_date)}</small>
                </span>
            </div>
        `;
    } else {
        html = `
            <div class="alert alert-info" style="margin-bottom: 15px;">
                <i class="fa fa-info-circle"></i> No active proxy assignment at the moment
            </div>
        `;
    }
    
    $('#current-proxy-info').html(html);
};

/**
 * Render proxy assignments list
 */
baps.proxy.render_assignments = function(assignments) {
    let html = '';
    
    if (!assignments || assignments.length === 0) {
        html = `
            <div class="text-muted text-center" style="padding: 20px;">
                <i class="fa fa-users" style="font-size: 48px; opacity: 0.3;"></i>
                <p style="margin-top: 10px;">No proxy assignments yet</p>
            </div>
        `;
    } else {
        html = '<table class="table table-bordered" style="margin-top: 10px;">';
        html += `
            <thead>
                <tr>
                    <th>Proxy User</th>
                    <th>From Date</th>
                    <th>To Date</th>
                    <th>Status</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
        `;
        
        assignments.forEach(function(assignment) {
            let status_badge = '';
            if (assignment.status === 'Active') {
                status_badge = '<span class="badge badge-success">Active</span>';
            } else if (assignment.status === 'Upcoming') {
                status_badge = '<span class="badge badge-info">Upcoming</span>';
            } else if (assignment.status === 'Expired') {
                status_badge = '<span class="badge badge-secondary">Expired</span>';
            } else {
                status_badge = '<span class="badge badge-light">Inactive</span>';
            }
            
            html += `
                <tr>
                    <td><strong>${assignment.proxy_user_full_name}</strong><br>
                        <small class="text-muted">${assignment.proxy_user}</small>
                    </td>
                    <td>${frappe.datetime.str_to_user(assignment.from_date)}</td>
                    <td>${frappe.datetime.str_to_user(assignment.to_date)}</td>
                    <td>${status_badge}</td>
                    <td>
                        <button class="btn btn-sm btn-danger" 
                            onclick="baps.proxy.delete_assignment('${assignment.proxy_user}', '${assignment.from_date}')">
                            <i class="fa fa-trash"></i> Remove
                        </button>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
    }
    
    $('#proxy-assignments-list').html(html);
};

/**
 * Add new proxy assignment
 */
baps.proxy.add_assignment = function(dialog) {
    let values = dialog.get_values();
    
    if (!values.proxy_user || !values.from_date || !values.to_date) {
        frappe.msgprint(__('Please fill all required fields'));
        return;
    }
    
    // Validate dates
    if (new Date(values.from_date) > new Date(values.to_date)) {
        frappe.msgprint(__('From Date cannot be after To Date'));
        return;
    }
    
    frappe.call({
        method: 'baps.api.proxy_api.create_proxy_assignment',
        args: {
            user: frappe.session.user,
            proxy_user: values.proxy_user,
            from_date: values.from_date,
            to_date: values.to_date
        },
        callback: function(r) {
            if (r.message && r.message.status === 'success') {
                frappe.show_alert({
                    message: r.message.message,
                    indicator: 'green'
                }, 5);
                
                // Clear form fields
                dialog.set_value('proxy_user', '');
                dialog.set_value('from_date', frappe.datetime.get_today());
                dialog.set_value('to_date', frappe.datetime.add_days(frappe.datetime.get_today(), 7));
                
                // Reload data
                baps.proxy.load_data(dialog);
            }
        },
        error: function(r) {
            frappe.msgprint(__('Error adding proxy assignment'));
        }
    });
};

/**
 * Delete proxy assignment
 */
baps.proxy.delete_assignment = function(proxy_user, from_date) {
    frappe.confirm(
        __('Are you sure you want to remove this proxy assignment?'),
        function() {
            frappe.call({
                method: 'baps.api.proxy_api.delete_proxy_assignment',
                args: {
                    user: frappe.session.user,
                    proxy_user: proxy_user,
                    from_date: from_date
                },
                callback: function(r) {
                    if (r.message && r.message.status === 'success') {
                        frappe.show_alert({
                            message: r.message.message,
                            indicator: 'green'
                        }, 5);
                        
                        // Reload the dialog
                        baps.proxy.show_dialog();
                    }
                }
            });
        }
    );
};

// Export to global scope
window.baps = window.baps || {};
window.baps.proxy = baps.proxy;
