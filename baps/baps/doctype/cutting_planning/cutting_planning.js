// Copyright (c) 2025, Kavin Dave and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Cutting Planning", {
// 	refresh(frm) {

// 	},
// });
frappe.ui.form.on("Cutting Planning", {
    refresh: function(frm) {
        frm.trigger("calculate_totals");
    },

    block_volume: function(frm) {
        frm.trigger("calculate_totals");
    },

    calculate_totals: function(frm) {
        let total_detail_volume = 0;
        (frm.doc.cutting_plan_details || []).forEach(row => {
            total_detail_volume += flt(row.volume);
        });

        frm.set_value("total_stone_volume", total_detail_volume);

        if (frm.doc.block_volume && total_detail_volume) {
            let wastage = ((frm.doc.block_volume - total_detail_volume) / frm.doc.block_volume) * 100;
            frm.set_value("wastage_percentage", Math.round(wastage * 100) / 100);
        } else {
            frm.set_value("wastage_percentage", 0);
        }
    }
});

// ---------------- Cutting Plan Details ----------------
frappe.ui.form.on("Cutting Plan Details", {
    l1: function(frm, cdt, cdn) { calculate_detail_volume(frm, cdt, cdn); },
    l2: function(frm, cdt, cdn) { calculate_detail_volume(frm, cdt, cdn); },
    b1: function(frm, cdt, cdn) { calculate_detail_volume(frm, cdt, cdn); },
    b2: function(frm, cdt, cdn) { calculate_detail_volume(frm, cdt, cdn); },
    h1: function(frm, cdt, cdn) { calculate_detail_volume(frm, cdt, cdn); },
    h2: function(frm, cdt, cdn) { calculate_detail_volume(frm, cdt, cdn); },
    volume: function(frm) { frm.trigger("calculate_totals"); },
    cutting_plan_details_remove: function(frm) { frm.trigger("calculate_totals"); },
    cutting_plan_details_add: function(frm) { frm.trigger("calculate_totals"); }
});

// ---------------- Cutting Plan Final ----------------
frappe.ui.form.on("Cutting Plan Final", {
    block_volume: function(frm, cdt, cdn) { calculate_wastage(frm, cdt, cdn); },
    stone_volume: function(frm, cdt, cdn) { calculate_wastage(frm, cdt, cdn); },
    cutting_plan_final_remove: function(frm) { frm.trigger("calculate_totals"); },
    cutting_plan_final_add: function(frm) { frm.trigger("calculate_totals"); }
});

// ---------------- Helpers ----------------
function toFeet(feet, inch) {
    let f = flt(feet) || 0;
    let i = flt(inch) || 0;
    return f + (i / 12.0);
}

function calculate_detail_volume(frm, cdt, cdn) {
    let row = locals[cdt][cdn];

    let L = toFeet(row.l1, row.l2);
    let B = toFeet(row.b1, row.b2);
    let H = toFeet(row.h1, row.h2);

    if (L && B && H) {
        row.volume = Math.round((L * B * H) * 100) / 100;
    } else {
        row.volume = 0;
    }

    frm.refresh_field("cutting_plan_details");
    frm.trigger("calculate_totals");
}

function calculate_wastage(frm, cdt, cdn) {
    let row = locals[cdt][cdn];
    if (row.block_volume && row.stone_volume) {
        row.wastage = ((row.block_volume - row.stone_volume) / row.block_volume) * 100;
        row.wastage = Math.round(row.wastage * 100) / 100;
        frm.refresh_field("cutting_plan_final");
    }
    frm.trigger("calculate_totals");
}