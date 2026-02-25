// Direct Cut Stone - All logic is in Purchase Material module
// This file is intentionally minimal


// // =====================================================
// // DIRECT CUT STONE — FULL EXIT & BACK-BUTTON LOCKDOWN
// // =====================================================

// let dcs_exit_dirty = false;
// let dcs_force_block = true;


// // -----------------------------------------------------
// // 0️⃣ DISABLE BROWSER BACK BUTTON BY HISTORY TRICK
// // -----------------------------------------------------
// window.history.pushState(null, "", window.location.href);
// window.addEventListener("popstate", function () {
//     window.history.pushState(null, "", window.location.href);
//     dcs_show_exit_popup(cur_frm);
// });


// // -----------------------------------------------------
// // 1️⃣ FORM EVENTS
// // -----------------------------------------------------
// frappe.ui.form.on("Direct Cut Stone", {

//     refresh(frm) {
//         // Always show Cancel button
//         frm.add_custom_button("Cancel", () => {
//             dcs_show_exit_popup(frm);
//         }).addClass("btn-danger");

//         dcs_force_block = true;
//     },

//     "*"(frm) {
//         if (frm.is_dirty()) {
//             dcs_exit_dirty = true;
//             dcs_force_block = true;
//         }
//     }
// });


// // -----------------------------------------------------
// // 2️⃣ BLOCK ERPNext ROUTER NAVIGATION
// // -----------------------------------------------------
// frappe.router.on("change", () => {
//     if (cur_frm?.doctype === "Direct Cut Stone" && dcs_force_block) {
//         frappe.router.back();
//         dcs_show_exit_popup(cur_frm);
//     }
// });


// // -----------------------------------------------------
// // 3️⃣ BLOCK REFRESH / CLOSE
// // -----------------------------------------------------
// window.addEventListener("beforeunload", function (e) {
//     if (dcs_force_block) {
//         e.preventDefault();
//         e.returnValue = "";
//     }
// });


// // -----------------------------------------------------
// // 4️⃣ EXIT POPUP
// // -----------------------------------------------------
// function dcs_show_exit_popup(frm) {

//     let d = new frappe.ui.Dialog({
//         title: "Leave Page?",
//         size: "small",
//         fields: [{
//             fieldtype: "HTML",
//             fieldname: "msg",
//             options: `
//                 <p style="font-size:14px; margin-top:10px;">
//                     Are you sure you want to leave this page?
//                     <br><br><b>Unsaved changes will be lost.</b>
//                 </p>
//             `
//         }],
//         primary_action_label: "Yes, Leave",
//         primary_action() {

//             dcs_exit_dirty = false;
//             dcs_force_block = false;
//             d.hide();

//             // ⭐ Redirect to 5 button page
//             frappe.set_route("Form", "Purchase Material", "new-purchase-material");
//         }
//     });

//     d.set_secondary_action_label("No");
//     d.set_secondary_action(() => d.hide());

//     d.$wrapper.find(".modal")
//         .attr("data-backdrop", "static")
//         .attr("data-keyboard", "false");

//     d.show();
// }
