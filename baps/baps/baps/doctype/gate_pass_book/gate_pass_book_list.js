// // your_app/public/js/gate_pass_book_list.js

// frappe.listview_settings["Gate Pass Book"] = {
//   onload(listview) {
//     listview.page.add_inner_button(__("Assign To"), async () => {
//       const selected = listview.get_checked_items(true); // returns array of names
//       if (!selected.length) {
//         frappe.msgprint(__("Select at least one Gate Pass Book record."));
//         return;
//       }

//       // fetch allowed users once
//       const r = await frappe.call({
//         method: "baps.api.get_transportation_users",
//       });
//       const users = r.message || [];
//       const allowed_user_ids = users.map(u => u.name);

//       if (!allowed_user_ids.length) {
//         frappe.msgprint(__("No transportation users found."));
//         return;
//       }

//       const d = new frappe.ui.Dialog({
//         title: __("Assign To"),
//         fields: [
//           {
//             fieldname: "assign_to",
//             label: __("Assign To"),
//             fieldtype: "Link",
//             options: "User",
//             reqd: true,
//           },
//         ],
//         primary_action_label: __("Assign"),
//         primary_action: async (values) => {
//           await frappe.call({
//             method: "baps.api.assign_gate_passes",
//             args: {
//               docnames: selected,
//               user: values.assign_to,
//             },
//             freeze: true,
//             freeze_message: __("Assigning..."),
//           });
//           frappe.show_alert({
//             message: __("Assigned {0} record(s) to {1}", [selected.length, values.assign_to]),
//             indicator: "green",
//           });
//           d.hide();
//           listview.refresh();
//         },
//       });

//       // restrict the Link field to our allowed users
//       d.fields_dict.assign_to.get_query = () => {
//         return {
//           filters: [["User", "name", "in", allowed_user_ids]],
//         };
//       };

//       d.show();
//     });
//   },
// };


////the uper code is mostly not working but for reference only
// baps/baps/doctype/gate_pass_book/gate_pass_book_list.js


////////////////////////////////////////////////////////////
//the working code is below
////////////////////////////////////////////////////////////
// frappe.listview_settings["Gate Pass Book"] = {
//   onload(listview) {
//     listview.page.add_inner_button(__("Assign To"), async () => {
//       const selected = listview.get_checked_items(true);
//       if (!selected.length) {
//         frappe.msgprint(__("Select at least one Gate Pass Book record."));
//         return;
//       }

//       // fetch allowed users
//       const r = await frappe.call({
//         method: "baps.api.gate_pass_allocate_api.get_transportation_users",
//       });
//       const users = r.message || [];
//       const allowed_user_ids = users.map(u => u.name);

//       if (!allowed_user_ids.length) {
//         frappe.msgprint(__("No transportation users found."));
//         return;
//       }

//       const d = new frappe.ui.Dialog({
//         title: __("Assign To"),
//         fields: [
//           {
//             fieldname: "assign_to",
//             label: __("Assign To"),
//             fieldtype: "Link",
//             options: "User",
//             reqd: true,
//           },
//         ],
//         primary_action_label: __("Assign"),
//         primary_action: async (values) => {
//           await frappe.call({
//             method: "baps.api.gate_pass_allocate_api.assign_gate_passes",
//             args: {
//               docnames: selected,
//               user: values.assign_to,
//             },
//             freeze: true,
//             freeze_message: __("Assigning..."),
//           });
//           frappe.show_alert({
//             message: __("Assigned {0} record(s) to {1}", [selected.length, values.assign_to]),
//             indicator: "green",
//           });
//           d.hide();
//           listview.refresh();
//         },
//       });

//       // restrict Link options to transportation users
//       d.fields_dict.assign_to.get_query = () => {
//         return {
//           query: "frappe.core.doctype.user.user.user_query",
//           filters: {
//             ignore_user_type: 1,          // allow System Users
//             user_type: "System User",
//             name: ["in", allowed_user_ids] // restrict to your list
//           },
//         };
//       };

//       d.show();
//     });
//   },
// };

frappe.listview_settings["Gate Pass Book"] = {
  onload(listview) {
    listview.page.add_inner_button(__("Assign To"), async () => {
      const selected = listview.get_checked_items(true);
      if (!selected.length) {
        frappe.msgprint(__("Select at least one Gate Pass Book record."));
        return;
      }

      // fetch allowed users
      const r = await frappe.call({
        method: "baps.api.gate_pass_allocate_api.get_transportation_users",
      });
      const users = r.message || [];
      const allowed_user_ids = users.map(u => u.name);

      if (!allowed_user_ids.length) {
        frappe.msgprint(__("No transportation users found."));
        return;
      }

      const d = new frappe.ui.Dialog({
        title: __("Assign To"),
        fields: [
          {
            fieldname: "assign_to",
            label: __("Assign To"),
            fieldtype: "Link",
            options: "User",
            reqd: true,
          },
        ],
        primary_action_label: __("Assign"),
        primary_action: async (values) => {
          await frappe.call({
            method: "baps.api.gate_pass_allocate_api.assign_gate_passes",
            args: {
              docnames: selected,
              user: values.assign_to,
            },
            freeze: true,
            freeze_message: __("Assigning..."),
          });
          frappe.show_alert({
            message: __("Assigned {0} record(s) to {1}", [selected.length, values.assign_to]),
            indicator: "green",
          });
          d.hide();
          listview.refresh();
        },
      });

      // restrict Link options to transportation users
      d.fields_dict.assign_to.get_query = () => {
        return {
          query: "frappe.core.doctype.user.user.user_query",
          filters: {
            ignore_user_type: 1,          // allow System Users
            user_type: "System User",
            name: ["in", allowed_user_ids] // restrict to your list
          },
        };
      };

      d.show();
    });
  },
};