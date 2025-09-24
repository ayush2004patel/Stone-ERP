//inspection.js:-              // Copyright (c) 2025, Ayush and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Inspection", {
// 	refresh(frm) {

// 	},
// });


frappe.ui.form.on('Block Selection Detail', {
    l1: function(frm, cdt, cdn) { calculate_volume(frm, cdt, cdn); },
    l2: function(frm, cdt, cdn) { calculate_volume(frm, cdt, cdn); },
    b1: function(frm, cdt, cdn) { calculate_volume(frm, cdt, cdn); },
    b2: function(frm, cdt, cdn) { calculate_volume(frm, cdt, cdn); },
    h1: function(frm, cdt, cdn) { calculate_volume(frm, cdt, cdn); },
    h2: function(frm, cdt, cdn) { calculate_volume(frm, cdt, cdn); }
});

function calculate_volume(frm, cdt, cdn) {
    let row = locals[cdt][cdn];

    let L = ((row.l1 || 0) * 12) + (row.l2 || 0);
    let B = ((row.b1 || 0) * 12) + (row.b2 || 0);
    let H = ((row.h1 || 0) * 12) + (row.h2 || 0);

    row.volume = ((L * B * H) / 1728).toFixed(2);

    frm.refresh_field("table_uehl");
}

frappe.ui.form.on("Inspection", {
    onload: function(frm) {
        frm.set_df_property("block_selection", "hidden", 0);
        frm.set_df_property("block_selection", "read_only", 0);
    },

    transport_ref: function(frm) { fetch_from_transport(frm); },
    transport_reference: function(frm) { fetch_from_transport(frm); },


    block_selection: function(frm) {
        if (frm.doc.block_selection) {
            populate_from_block_selection(frm, frm.doc.block_selection);
            frm.set_df_property("block_selection", "read_only", 1);
        }
    }
});

function fetch_from_transport(frm) {
    const transport_value = frm.doc.transport_ref || frm.doc.transport_reference;
    if (!transport_value) {
        frm.set_value("block_selection", null);
        frm.set_df_property("block_selection", "read_only", 0);
        clear_child_table(frm);
        return;
    }

    frappe.db.get_doc("Transportation Sender", transport_value)
        .then(r => {
            const sender = r;
            if (sender && sender.block_selection) {
                frm.set_value("block_selection", sender.block_selection);

                frm.set_df_property("block_selection", "read_only", 1);

                populate_from_block_selection(frm, sender.block_selection);
            } else {
                frm.set_df_property("block_selection", "read_only", 0);
            }
        })
        .catch(err => {
            console.error("Error fetching Transportation Sender:", err);
        });
}

function populate_from_block_selection(frm, block_selection_name) {
    if (!block_selection_name) return;

    frappe.db.get_doc("Block Selection", block_selection_name)
        .then(block_doc => {
            const child_field = (frm.doc.table_uehl !== undefined) ? "table_uehl"
                              : (frm.doc.inspection_details !== undefined) ? "inspection_details"
                              : (frm.doc.inspection_detail !== undefined) ? "inspection_detail"
                              : null;

            if (!child_field) {
                console.warn("Child table field not detected. Please confirm child fieldname in Inspection doctype.");
                return;
            }

            frm.clear_table(child_field);
            (block_doc.block_selection_details || []).forEach(bs_row => {
                const child = frm.add_child(child_field);
                child.block_number = bs_row.block_number;
                child.block_custom_code = bs_row.block_custom_code;
                child.colour = bs_row.colour;
                child.grain = bs_row.grain;
                if (bs_row.l1 !== undefined) child.l1 = bs_row.l1;
                if (bs_row.l2 !== undefined) child.l2 = bs_row.l2;
                if (bs_row.b1 !== undefined) child.b1 = bs_row.b1;
                if (bs_row.b2 !== undefined) child.b2 = bs_row.b2;
                if (bs_row.h1 !== undefined) child.h1 = bs_row.h1;
                if (bs_row.h2 !== undefined) child.h2 = bs_row.h2;
            });

            frm.refresh_field(child_field);
        })
        .catch(err => {
            console.error("Error fetching Block Selection:", err);
        });
}

function clear_child_table(frm) {
    const child_field = (frm.doc.table_uehl !== undefined) ? "table_uehl"
                      : (frm.doc.inspection_details !== undefined) ? "inspection_details"
                      : null;
    if (child_field) {
        frm.clear_table(child_field);
        frm.refresh_field(child_field);
    }
}