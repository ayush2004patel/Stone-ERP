// Copyright (c) 2025, Ayush Patel and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Size List Creation", {
// 	refresh(frm) {

// 	},
// });




frappe.ui.form.on('Size List Creation', {
    form_number: function(frm) {
        if (!frm.doc.form_number) return;

        frappe.call({
            method: "baps.baps.doctype.size_list_creation.size_list_creation.create_size_list_items_from_range",
            args: { form_number: frm.doc.form_number },
            callback: function(r) {
                if (r.message) {
                    frm.clear_table("stone_details");
                    r.message.items.forEach(item => {
                        let row = frm.add_child("stone_details");
                        Object.assign(row, item);
                    });
                    frm.refresh_field("stone_details");

                    frappe.msgprint({
                        title: "Range Processing Complete",
                        message: `✅ Created ${r.message.created_count} items<br>⚠️ Skipped ${r.message.skipped_count} duplicates`,
                        indicator: r.message.skipped_count > 0 ? "orange" : "green"
                    });
                }
            }
        });
    }
});
