// Copyright (c) 2025, Ayush Patel and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Loan Application", {
// 	refresh(frm) {

// 	},
// });





frappe.ui.form.on('Loan Application', {
    loan_amount: function(frm) {
        if (frm.doc.loan_amount > 100000) {
            frm.set_df_property("collaterals", "hidden", 0);
        } else {
            frm.set_df_property("collaterals", "hidden", 1);
        }
    },
    refresh: function(frm) {
        if (frm.doc.loan_amount > 100000) {
            frm.set_df_property("collaterals", "hidden", 0);
        } else {
            frm.set_df_property("collaterals", "hidden", 1);
        }
    }
});
