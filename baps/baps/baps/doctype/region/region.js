// Copyright (c) 2025, Dharmesh Rathod and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Region", {
// 	refresh(frm) {

// 	},
// });

////////////////////////////////////    

// Custom Script for DocType: Region

frappe.ui.form.on('Region', {
    refresh: function(frm) {
        // Set a custom query filter for the 'main_site' field
        frm.set_query('main_site', function() {
            // 1. Get the name of the current Region being edited
            var current_region = frm.doc.name; 
            
            // 2. Return the filters for the Site DocType Link field
            return {
                filters: {
                    'region': current_region,      // Site's region must match the current Region's name
                    'site_type': 'Working Site'   // Site must be a 'Working Site'
                }
            }
        });
    }
});