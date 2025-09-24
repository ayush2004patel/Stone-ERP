// Copyright (c) 2025, Tirthan Shah and contributors
// For license information, please see license.txt

frappe.ui.form.on("Gate Pass BookNo", {
    // Update gate_pass_range when page_limit changes
    page_limit: function(frm) {
        if (frm.doc.name && frm.doc.page_limit) {
            let start_no = 1;
            let end_no = frm.doc.page_limit;
            let range_text = `${frm.doc.name}: ${start_no} to ${end_no}`;
            frm.set_value("gate_pass_range", range_text);
        } else {
            frm.set_value("gate_pass_range", "");
        }
    },

    // Update gate_pass_range when form is refreshed (e.g., after save)
    refresh: function(frm) {
        if (frm.doc.name && frm.doc.page_limit) {
            let start_no = 1;
            let end_no = frm.doc.page_limit;
            let range_text = `${frm.doc.name}: ${start_no} to ${end_no}`;
            frm.set_value("gate_pass_range", range_text);
        }
    }
});

// Filter for Transportation Sender
frappe.ui.form.on("Transportation Sender", {
    refresh: function(frm) {
        // Apply filter on form load
        apply_gate_pass_no_filter(frm);
    },

    gate_pass_bookno: function(frm) {
        // Clear selection when book changes
        frm.set_value("gate_pass_no", "");

        // Apply filter
        apply_gate_pass_no_filter(frm);

        // Validate existing selection (if any)
        if (frm.doc.gate_pass_no) {
            validate_gate_pass_belongs_to_book(frm);
        }
    }
});

// Filter for Transportation Receiver
frappe.ui.form.on("Transportation Receiver", {
    refresh: function(frm) {
        // Apply filter on form load
        apply_gate_pass_no_filter(frm);
    },

    gate_pass_bookno: function(frm) {
        // Clear selection when book changes
        frm.set_value("gate_pass_no", "");

        // Apply filter
        apply_gate_pass_no_filter(frm);

        // Validate existing selection (if any)
        if (frm.doc.gate_pass_no) {
            validate_gate_pass_belongs_to_book(frm);
        }
    }
});

// Helper: Apply filter to gate_pass_no field
function apply_gate_pass_no_filter(frm) {
    if (frm.doc.gate_pass_bookno) {
        frm.set_query("gate_pass_no", function() {
            return {
                filters: {
                    gate_pass_book_no: frm.doc.gate_pass_bookno
                }
            };
        });
    } else {
        // Reset to default if no book selected
        frm.set_query("gate_pass_no", function() {
            return { query: "frappe.desk.search.search_link" };
        });
    }
}

// Helper: Validate selected gate_pass_no belongs to selected book
function validate_gate_pass_belongs_to_book(frm) {
    frappe.db.get_value("Gate Pass No", frm.doc.gate_pass_no, "gate_pass_book_no", function(r) {
        if (r && r.gate_pass_book_no !== frm.doc.gate_pass_bookno) {
            frm.set_value("gate_pass_no", null);
            frappe.msgprint(__("Selected Gate Pass No doesn't belong to the chosen Book. Selection cleared."));
        }
    });
}