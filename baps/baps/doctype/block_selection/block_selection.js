// // Copyright (c) 2025, Dharmesh Rathod and contributors
// // For license information, please see license.txt

// // frappe.ui.form.on("Block Selection", {
// // 	refresh(frm) {

// // 	},
// // });

// // Copyright (c) 2025, Dharmesh Rathod and contributors
// // For license information, please see license.txt

// // frappe.ui.form.on("Block Selection", {
// // 	refresh(frm) {

// // 	},
// // });

// // frappe.ui.form.on("Block Selection", {
// //     // Auto-fill fields from Baps Project
// //     baps_project: function(frm) {
// //         if (frm.doc.baps_project) {
// //             frappe.call({
// //                 method: "frappe.client.get",
// //                 args: {
// //                     doctype: "Baps Project",
// //                     name: frm.doc.baps_project
// //                 },
// //                 callback: function(r) {
// //                     if (r.message) {
// //                         frm.set_value('region', r.message.region);
// //                         frm.set_value('site', r.message.site);
// //                         frm.set_value('main_part', r.message.main_part);
// //                         frm.set_value('sub_part', r.message.sub_part);
// //                     }
// //                 }
// //             });
// //         }
// //     }
// // });

// // frappe.ui.form.on("Block Selection Detail", {
// //     l1: calculate_volume,
// //     l2: calculate_volume,
// //     b1: calculate_volume,
// //     b2: calculate_volume,
// //     h1: calculate_volume,
// //     h2: calculate_volume
// // });

// // function calculate_volume(frm, cdt, cdn) {
// //     let row = locals[cdt][cdn];
// //     let l = (row.l1 || 0) + (row.l2 || 0);
// //     let b = (row.b1 || 0) + (row.b2 || 0);
// //     let h = (row.h1 || 0) + (row.h2 || 0);

// //     let volume = (l / 12) * (b / 12) * (h / 12);
// //     frappe.model.set_value(cdt, cdn, "volume", parseFloat(volume.toFixed(4)));
// // }



// // Client-side auto-calculation of row volume (feet + inches -> feet -> cubic feet)

// frappe.ui.form.on('Block Selection', {
//     refresh: function(frm) {
//         // nothing required on refresh for now
//     }
// });

// // Child table events (child doctype name = "Block Selection Detail")
// frappe.ui.form.on('Block Selection Detail', {
//     l1: calculate_volume,
//     l2: calculate_volume,
//     b1: calculate_volume,
//     b2: calculate_volume,
//     h1: calculate_volume,
//     h2: calculate_volume,
//     // if you remove/add rows and want to recompute totals in parent later, add handlers here
//     block_selection_details_remove: function(frm) {
//         // optional: recompute parent total if you add a total field later
//     }
// });

// function calculate_volume(frm, cdt, cdn) {
//     let row = locals[cdt][cdn];

//     // Validate inches must be < 12
//     if ((row.l2 || 0) > 12 || (row.b2 || 0) > 12 || (row.h2 || 0) > 12) {
//         frappe.msgprint(__("Inches (l2, b2, h2) must be less than 12"));
//         return;
//     }

//     // Convert feet + inches -> feet
//     let L = (flt(row.l1) || 0) + ((flt(row.l2) || 0) / 12.0);
//     let B = (flt(row.b1) || 0) + ((flt(row.b2) || 0) / 12.0);
//     let H = (flt(row.h1) || 0) + ((flt(row.h2) || 0) / 12.0);

//     let vol = 0.0;
//     if (L > 0 && B > 0 && H > 0) {
//         vol = parseFloat((L * B * H).toFixed(3)); // cubic feet, rounded 3 decimals
//     }

//     // Write back to child row
//     frappe.model.set_value(cdt, cdn, 'volume', vol);

//     frm.refresh_field('block_selection_details');
// }


// frappe.ui.form.on("Block Selection Detail", {
//     block_number: function(frm, cdt, cdn) {
//         let row = locals[cdt][cdn];
//         if (!row.block_number) {
//             // assign next serial number
//             row.block_number = (frm.doc.block_selection_details.length).toString().padStart(4, '0');
//         }
//         frappe.model.set_value(cdt, cdn, "block_number", row.block_number);
//     }
// });


// frappe.ui.form.on("Block Selection", {
//     // When Party or Project changes, update all child rows instantly
//     party: function(frm) {
//         update_block_codes(frm);
//     },
//     baps_project: function(frm) {
//         update_block_codes(frm);
//     },
//     refresh: function(frm) {
//         update_block_codes(frm);
//     }
// });

// frappe.ui.form.on("Block Selection Detail", {
//     // // When a new row is added, generate number+code immediately
//     // block_selection_details_add: function(frm, cdt, cdn) {
//     //     update_block_codes(frm);
//     // }
// });

// // -------- Helper --------
// function update_block_codes(frm) {
// //     // Take first 3 chars of project name
// //     let project_name = (frm.doc.project_name || "").substring(0, 2).toUpperCase();

// //     // Take first 2 chars of trade_partner
// //     let trade_partner = (frm.doc.trade_partner || "").substring(0, 3).toUpperCase();

//     (frm.doc.block_selection_details || []).forEach((row, i) => {
//         let seq = (i + 1).toString().padStart(4, '0');

//         frappe.model.set_value(row.doctype, row.name, "block_number", seq);
// //         frappe.model.set_value(row.doctype, row.name, "block_custom_code", `${trade_partner}${project_name}${seq}`);
//     });

// //     frm.refresh_field("block_selection_details");
// // }
// }












// block_selection.js
// Ensure this matches your child doctype name exactly:
const CHILD_DOCTYPE = "Block Selection Detail";

frappe.ui.form.on("Block Selection", {
    onload(frm) {
        if (!frm.doc.selected_by) {
            frm.set_value("selected_by", frappe.session.user);
        }
    },

    refresh(frm) {
        // keep numbers in sync on refresh
        frm.trigger("update_block_numbers");
    },

    project_name(frm) {
        frm.trigger("update_block_numbers");
    },

    trade_partner(frm) {
        frm.trigger("update_block_numbers");
    },

    update_block_numbers(frm) {
        // short-circuit if we don't have enough info
        const project = get_project_code(frm.doc.project_name || "");
        const partner = get_partner_code(frm.doc.trade_partner || "");

        (frm.doc.block_selection_details || []).forEach((row, i) => {
            const seq = String(i + 1).padStart(4, "0"); // 0001, 0002, ...
            const code = project + partner + seq;
            // only set when it differs to avoid unnecessary writes
            if (row.block_number !== code) {
                frappe.model.set_value(row.doctype, row.name, "block_number", code);
            }
        });

        frm.refresh_field("block_selection_details");
    }
});

// Child-table events (use the exact child doctype name here)
frappe.ui.form.on(CHILD_DOCTYPE, {
    // When a new row is added, wait a tick then recompute numbers
    block_selection_details_add: function(frm, cdt, cdn) {
        // small delay ensures Frappe has created the child row internally
        setTimeout(() => frm.trigger("update_block_numbers"), 50);
    },

    block_selection_details_remove: function(frm) {
        setTimeout(() => frm.trigger("update_block_numbers"), 50);
    },

    // keep your existing volume calculation handlers (copied from your code)
    l1: calculate_volume,
    l2: calculate_volume,
    b1: calculate_volume,
    b2: calculate_volume,
    h1: calculate_volume,
    h2: calculate_volume
});

function calculate_volume(frm, cdt, cdn) {
    let row = locals[cdt][cdn];

    // Validate inches must be < 12
    if ((row.l2 || 0) >= 12 || (row.b2 || 0) >= 12 || (row.h2 || 0) >= 12) {
        frappe.msgprint("Inches (l2, b2, h2) must be less than 12");
        return;
    }

    // Convert feet + inches -> feet
    let L = (parseFloat(row.l1) || 0) + ((parseFloat(row.l2) || 0) / 12.0);
    let B = (parseFloat(row.b1) || 0) + ((parseFloat(row.b2) || 0) / 12.0);
    let H = (parseFloat(row.h1) || 0) + ((parseFloat(row.h2) || 0) / 12.0);

    let vol = 0.0;
    if (L > 0 && B > 0 && H > 0) {
        vol = parseFloat((L * B * H).toFixed(3)); // cubic feet, rounded 3 decimals
    }

    // Write back to child row properly
    frappe.model.set_value(cdt, cdn, 'volume', vol);
    frm.refresh_field('block_selection_details');
}

function get_project_code(project_name) {
    if (!project_name) return "XX";
    let words = project_name.trim().split(/\s+/);
    if (words.length >= 2) {
        return words[0][0].toUpperCase() + words[1][0].toUpperCase();
    }
    return words[0][0].toUpperCase() + "X";
}

function get_partner_code(partner_name) {
    if (!partner_name) return "XXX";
    let words = partner_name.trim().split(/\s+/);
    if (words.length >= 2) {
        return words[0][0].toUpperCase() + words[1][0].toUpperCase() + words[1].slice(-1).toUpperCase();
    } else {
        let name = words[0] || "";
        if (name.length >= 3) {
            return name[0].toUpperCase() + name[1].toUpperCase() + name.slice(-1).toUpperCase();
        } else if (name.length === 2) {
            return name[0].toUpperCase() + name[1].toUpperCase() + "X";
        } else if (name.length === 1) {
            return name[0].toUpperCase() + "XX";
        } else {
            return "XXX";
        }
    }
}

frappe.ui.form.on("Block Selection", {
    last_block_number: function (frm) {
        if (frm.doc.block_selection_details && frm.doc.block_selection_details.length > 0) {
            // get last row from child table
            let last_row = frm.doc.block_selection_details[frm.doc.block_selection_details.length - 1];
            
            frappe.msgprint({
                title: __("Last Block Number"),
                indicator: "blue",
                // message: __("The last Block Number is: <b>{0}</b>", [last_row.block_number || "Not Set"])
            });

            // if you also want to update the hidden field
            frm.set_value("last_blocknumber", last_row.block_number);
        } else {
            frappe.msgprint({
                title: __("No Blocks Found"),
                indicator: "red",
                message: __("No Block Selection Detail has been added yet.")
            });
        }
    }
});

