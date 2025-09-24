// Copyright (c) 2025, Ayush Patel and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Repayment Record", {
// 	refresh(frm) {

// 	},
// });













frappe.ui.form.on('Repayment Record', {
    loan_application: function(frm) {
        if (frm.doc.loan_application) {
            frappe.db.get_value("Loan Application", frm.doc.loan_application, "status", function(value) {
                if (value.status !== "Approved") {
                    frappe.msgprint("Loan Approve hone ke baad aana.");
                    frm.set_value("loan_application", "");
                }
            });
        }
    }
});


