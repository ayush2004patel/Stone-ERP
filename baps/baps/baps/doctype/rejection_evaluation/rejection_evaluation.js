// Rejection Evaluation Client Script (Save button hidden always, fields read-only)

// Helper: hide Save button for this form
function hide_save_button_re(frm) {
    if (!frm.page || !frm.page.wrapper) {
        return;
    }

    // Hide primary Save button
    const saveBtn = frm.page.wrapper.find('.btn-primary:contains("Save")');
    if (saveBtn.length) {
        saveBtn.hide();
    }

    // Remove primary action so Enter key does nothing
    frm.page.set_primary_action("", null);
}

// Helper: make all normal fields read-only (static)
function make_all_fields_read_only(frm) {
    if (!frm.fields_dict) {
        return;
    }

    Object.keys(frm.fields_dict).forEach((fieldname) => {
        const field = frm.fields_dict[fieldname];
        if (!field || !field.df) {
            return;
        }

        const df = field.df;

        // Skip layout / non-input fields
        if (["Section Break", "Column Break", "HTML", "Button"].includes(df.fieldtype)) {
            return;
        }

        // Already read_only in DocType → leave it
        if (df.read_only) {
            return;
        }

        // Make it read-only
        frm.set_df_property(fieldname, "read_only", 1);
    });
}

frappe.ui.form.on("Rejection Evaluation", {
    refresh(frm) {
        // ALWAYS hide Save button (new or existing)
        hide_save_button_re(frm);

        // ALWAYS make fields static / non-editable
        make_all_fields_read_only(frm);

        // No actions for new unsaved doc
        if (frm.is_new()) {
            return;
        }

        const current_status = frm.doc.request_status || "Pending";

        // If already Accepted or Rejected → Do not show buttons again
        if (["Accepted", "Rejected"].includes(current_status)) {
            return;
        }

        // ==========================
        // 🔴 Reject Request Button
        // ==========================
        frm.add_custom_button(__("Reject Request"), () => {
            frappe.confirm(
                __("Are you sure you want to reject this request?"),
                () => {
                    // First ask for reason
                    frappe.prompt(
                        {
                            fieldname: "reason",
                            label: __("Why are you rejecting this request?"),
                            fieldtype: "Small Text",
                            reqd: 1,
                        },
                        function (values) {
                            // Call existing backend method with reason
                            frm.call("reject_request", {
                                reason: values.reason,
                            })
                                .then(() => {
                                    frm.reload_doc();
                                })
                                .catch((err) => {
                                    frappe.msgprint({
                                        message: __("Failed to reject request: {0}", [
                                            err?.message || err,
                                        ]),
                                        indicator: "red",
                                    });
                                });
                        },
                        __("Rejection Comment"),
                        __("Submit")
                    );
                }
            );
        }).addClass("btn-danger");

        // ==========================
        // 🟢 Accept Request Button
        // ==========================
        frm.add_custom_button(__("Accept Request"), () => {
            const linked_insp = frm.doc.inspection_demo;

            function show_accept_dialog(options) {
                const d = new frappe.ui.Dialog({
                    title: __("Accept Rejection Evaluation"),
                    fields: [
                        {
                            fieldname: "decision",
                            label: __("Decision"),
                            fieldtype: "Select",
                            reqd: 1,
                            options: ["", ...options],
                        },
                    ],
                    primary_action_label: __("Submit"),
                    primary_action(values) {
                        let decision_token = "";

                        if (values.decision === "Accept and Can Use") {
                            decision_token = "can_use";
                        } else if (values.decision === "Accept and Cannot Use") {
                            decision_token = "cannot_use";
                        } else if (values.decision === "Available") {
                            decision_token = "available";
                        } else {
                            decision_token = values.decision;
                        }

                        if (!decision_token) {
                            frappe.msgprint({
                                message: __("Please select a valid decision."),
                                indicator: "red",
                            });
                            return;
                        }

                        frm.call("accept_request", { decision: decision_token })
                            .then(() => {
                                d.hide();
                                frm.reload_doc();
                            })
                            .catch((err) => {
                                frappe.msgprint({
                                    message: __("Failed to accept request: {0}", [
                                        err?.message || err,
                                    ]),
                                    indicator: "red",
                                });
                            });
                    },
                });

                d.show();
            }

            // No linked inspection? → show normal options
            if (!linked_insp) {
                show_accept_dialog(["Accept and Can Use", "Accept and Cannot Use"]);
                return;
            }

            // Get Inspection Type for correct options
            frappe.db
                .get_value("Inspection Demo", linked_insp, "inspection_type")
                .then((res) => {
                    const insp_type = res?.message?.inspection_type;

                    if (insp_type === "Block Inspection") {
                        // For Block Inspection: only "Available"
                        show_accept_dialog(["Available"]);
                    } else {
                        // For all other inspections: normal two options
                        show_accept_dialog(["Accept and Can Use", "Accept and Cannot Use"]);
                    }
                })
                .catch((err) => {
                    console.error("Error fetching inspection type", err);
                    show_accept_dialog(["Accept and Can Use", "Accept and Cannot Use"]);
                });
        }).addClass("btn-success");
    },
});
