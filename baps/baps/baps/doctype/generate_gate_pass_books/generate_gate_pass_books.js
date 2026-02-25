// Copyright (c) 2025, Dharmesh Rathod and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Generate Gate Pass Books", {
// 	refresh(frm) {

// 	},
// });
frappe.ui.form.on('Generate Gate Pass Books', {
    refresh: function(frm) {
        // Update the last generated book field when the form loads or refreshes
        update_last_generated_book_from_db(frm);
    }
});

function update_last_generated_book_from_db(frm) {
    // Query the database to get the actual last generated book
    frappe.call({
        method: 'frappe.client.get_list',
        args: {
            doctype: 'Gate Pass Book',
            fields: ['gate_pass_book_display_no'],
            order_by: 'creation desc',
            limit: 1
        },
        callback: function(response) {
            if (response.message && response.message.length > 0) {
                let last_book = response.message[0];
                frm.set_value('last_generated_book', last_book.gate_pass_book_display_no);
            } else {
                // If no books exist yet, show empty
                frm.set_value('last_generated_book', '');
            }
            frm.refresh_field('last_generated_book');
        }
    });
}