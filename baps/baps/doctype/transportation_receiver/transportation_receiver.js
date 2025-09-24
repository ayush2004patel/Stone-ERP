
frappe.ui.form.on("Transportation Receiver", {
    refresh: function(frm) {
        apply_gate_pass_no_filter(frm);
    },

    gate_pass_bookno: function(frm) {
        frm.set_value("gate_pass_no", "");
        apply_gate_pass_no_filter(frm);

        if (frm.doc.gate_pass_no) {
            validate_gate_pass_belongs_to_book(frm);
        }
    }
});

// --- Gate Pass Filter Helpers (Copied from gate_pass_bookno.js for modularity) ---
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
        frm.set_query("gate_pass_no", function() {
            return { query: "frappe.desk.search.search_link" };
        });
    }
}

function validate_gate_pass_belongs_to_book(frm) {
    frappe.db.get_value("Gate Pass No", frm.doc.gate_pass_no, "gate_pass_book_no", function(r) {
        if (r && r.gate_pass_book_no !== frm.doc.gate_pass_bookno) {
            frm.set_value("gate_pass_no", null);
            frappe.msgprint(__("Selected Gate Pass No doesn't belong to the chosen Book. Selection cleared."));
        }
    });
}