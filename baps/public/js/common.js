// -----------------------------
// Main Part → Sub Part Filtering
// -----------------------------
function setup_main_part_sub_part(frm) {
    frappe.ui.form.on(frm.doctype, {
        main_part: function(frm) {
            // If main_part is cleared, reset sub_part immediately
            if (!frm.doc.main_part) {
                frm.set_value("sub_part", null);
                return;
            }

            // Restrict sub_part selection based on selected main_part
            frm.set_query("sub_part", function() {
                return {
                    filters: {
                        main_part: frm.doc.main_part
                    }
                };
            });

            // Clear sub_part if it doesn’t belong to the new main_part
            if (frm.doc.sub_part) {
                frappe.db.get_value("Sub Part", frm.doc.sub_part, "main_part", function(r) {
                    if (r && r.main_part !== frm.doc.main_part) {
                        frm.set_value("sub_part", null);
                    }
                });
            }
        },

        validate: function(frm) {
            if (!frm.doc.main_part && frm.doc.sub_part) {
                frappe.throw("You cannot add a Sub Part without selecting a Main Part.");
            }
        }
    });
}

// -----------------------------
// Volume Auto-Calculation
// -----------------------------
function setup_volume_calculation(childtable_field) {
    frappe.ui.form.on(childtable_field, {
        l1: calculate_volume,
        l2: function(frm, cdt, cdn) {
            let row = locals[cdt][cdn];
            if (row.l2 >= 12) {
                frappe.msgprint(__('L2 must be less than 12 inches'));
                frappe.model.set_value(cdt, cdn, 'l2', 0);
            }
            calculate_volume(frm, cdt, cdn);
        },
        b1: calculate_volume,
        b2: function(frm, cdt, cdn) {
            let row = locals[cdt][cdn];
            if (row.b2 >= 12) {
                frappe.msgprint(__('B2 must be less than 12 inches'));
                frappe.model.set_value(cdt, cdn, 'b2', 0);
            }
            calculate_volume(frm, cdt, cdn);
        },
        h1: calculate_volume,
        h2: function(frm, cdt, cdn) {
            let row = locals[cdt][cdn];
            if (row.h2 >= 12) {
                frappe.msgprint(__('H2 must be less than 12 inches'));
                frappe.model.set_value(cdt, cdn, 'h2', 0);
            }
            calculate_volume(frm, cdt, cdn);
        }
    });

    // --- Volume calculation for a single row ---
    function calculate_volume(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        let L = ((row.l1 || 0) * 12) + (row.l2 || 0);  // Convert feet + inches to total inches
        let B = ((row.b1 || 0) * 12) + (row.b2 || 0);
        let H = ((row.h1 || 0) * 12) + (row.h2 || 0);

        row.volume = ((L * B * H) / 1728).toFixed(2);  // Convert cubic inches → cubic feet
        frm.refresh_field(childtable_field);
        update_total_volume(frm, childtable_field);
    }

    // --- Total volume across all rows ---
    function update_total_volume(frm, childtable_field) {
        let total = 0;
        (frm.doc[childtable_field] || []).forEach(r => {
            total += flt(r.volume);  // Ensure correct float handling
        });
        frm.set_value('total_volume', total.toFixed(2));
    }
}
