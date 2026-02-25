// Copyright (c) 2025, Amax Consultancy Pvt Ltd and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Transport Site Allocation", {
// 	refresh(frm) {

// 	},
// });


frappe.ui.form.on('Transport Site Allocation', {
    /**
     * This function runs when the form is loaded or refreshed.
     * It applies the filter to any existing rows in the 'allocated_sites' child table.
     */
    refresh: function(frm) {
        frm.set_query('site', 'allocated_sites', function() {
            return {
                filters: {
                    'site_type': 'Working Site'
                }
            };
        });
    },

    /**
     * This function runs whenever a new row is added to the 'allocated_sites' child table.
     * This is crucial because the filter needs to apply to new rows as well, not just existing ones.
     */
    allocated_sites_add: function(frm) {
        frm.set_query('site', 'allocated_sites', function() {
            return {
                filters: {
                    'site_type': 'Working Site'
                }
            };
        });
    }
});