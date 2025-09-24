// // Copyright (c) 2025, Kavin Dave and contributors
// // For license information, please see license.txt

// frappe.ui.form.on("Cutting Plan Details", {
// 	refresh(frm) {

// 	},
// });



// Copyright (c) 2025, Ayush and contributors
// For license information, please see license.txt

frappe.ui.form.on('Cutting Plan Details', {
    l1: calculate_volume,
    l2: calculate_volume,
    b1: calculate_volume,
    b2: calculate_volume,
    h1: calculate_volume,
    h2: calculate_volume
});

function calculate_volume(frm, cdt, cdn) {
    let row = locals[cdt][cdn];

    let l1 = row.l1 || 0;
    let l2 = row.l2 || 0;
    let b1 = row.b1 || 0;
    let b2 = row.b2 || 0;
    let h1 = row.h1 || 0;
    let h2 = row.h2 || 0;

    let length_in = (l1 * 12) + l2;
    let breadth_in = (b1 * 12) + b2;
    let height_in = (h1 * 12) + h2;

    row.volume = Math.round(((length_in * breadth_in * height_in) / 1728) * 100) / 100;
    frm.refresh_field('cutting_plan_details');
}
