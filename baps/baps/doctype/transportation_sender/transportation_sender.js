
frappe.ui.form.on('Transportation Sender', {
    refresh: function (frm) {
        // Apply Gate Pass No filter on refresh
        apply_gate_pass_no_filter(frm);
    },

    gate_pass_bookno: function(frm) {
        frm.set_value("gate_pass_no", "");
        apply_gate_pass_no_filter(frm);

        if (frm.doc.gate_pass_no) {
            validate_gate_pass_belongs_to_book(frm);
        }
    },

    show_items: function (frm) {
        show_items_dialog(frm);
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
// --- End Gate Pass Filter Helpers ---

// --- Show Items Dialog (Your Original Code) ---
function show_items_dialog(frm) {
    const d = new frappe.ui.Dialog({
        title: 'Select Blocks to Add',
        fields: [
            {
                label: 'Baps Project',
                fieldname: 'baps_project',
                fieldtype: 'Link',
                options: 'Baps Project',
                reqd: true,
                default: frm.doc.baps_project
            },
            {
                label: 'Material Type',
                fieldname: 'material_type',
                fieldtype: 'Link',
                options: 'Stone Type',
                reqd: true,
                default: frm.doc.material_type
            },
            {
                fieldtype: 'Section Break',
                label: 'Available Blocks'
            },
            {
                fieldname: 'block_items',
                fieldtype: 'HTML'
            }
        ],
        primary_action_label: 'Add Selected',
        primary_action: function () {
            const values = d.get_values();
            const selected_blocks = [];

            const checkedBoxes = document.querySelectorAll('input[data-block-checkbox="1"]:checked');
            checkedBoxes.forEach((cb) => {
                selected_blocks.push({
                    block_number: cb.dataset.block,
                    project: values.baps_project,
                    material_type: values.material_type
                });
            });

            if (selected_blocks.length === 0) {
                frappe.msgprint(__('Please select at least one block.'));
                return;
            }

            frappe.call({
                method: 'baps.baps.doctype.transportation_sender.transportation_sender.add_blocks_to_table',
                args: {
                    sender_name: frm.doc.name,
                    blocks: selected_blocks
                },
                callback: function (r) {
                    if (!r.exc) {
                        frappe.show_alert({
                            message: __('Blocks added successfully'),
                            indicator: 'green'
                        });
                        frm.reload_doc();
                        d.hide();
                    } else {
                        frappe.msgprint(__('Error adding blocks. Please try again.'));
                    }
                }
            });
        }
    });

    d.fields_dict.baps_project.df.onchange = d.fields_dict.material_type.df.onchange = () => {
        update_block_list(d, frm);
    };

    update_block_list(d, frm);
    d.show();
}

function update_block_list(dialog, frm) {
    const values = dialog.get_values();
    const project = values?.baps_project;

    if (!project) {
        dialog.fields_dict.block_items.$wrapper.html(
            '<p style="color: var(--text-color-light); font-style: italic;">Select a Baps Project to load blocks.</p>'
        );
        return;
    }

    frappe.call({
        method: 'baps.baps.doctype.transportation_sender.transportation_sender.get_blocks_for_project',
        args: {
            project: project
        },
        callback: function (r) {
            if (r.message && Array.isArray(r.message) && r.message.length > 0) {
                let html = `
                    <div style="max-height: 300px; overflow-y: auto; border: 1px solid #d1d8dd; border-radius: 5px; padding: 8px; background: #fafbfc;">
                        <p style="margin: 0 0 8px; font-weight: 500; color: var(--text-color);">Select blocks:</p>
                `;

                r.message.forEach(block => {
                    const blockNum = block.block_number || 'Unknown';
                    html += `
                        <div class="checkbox" style="margin: 4px 0;">
                            <label style="font-size: 14px; color: var(--text-color);">
                                <input type="checkbox" 
                                       data-block-checkbox="1" 
                                       data-block="${blockNum}" 
                                       style="margin-right: 6px;" />
                                ${blockNum}
                            </label>
                        </div>
                    `;
                });

                html += `</div>`;
                dialog.fields_dict.block_items.$wrapper.html(html);
            } else {
                dialog.fields_dict.block_items.$wrapper.html(
                    '<p style="color: #7d8588; font-style: italic;">No blocks found for this project.</p>'
                );
            }
        }
    });
}






































// frappe.ui.form.on('Loan Application', {
//     loan_amount: function(frm) {
//         if (frm.doc.loan_amount > 100000) {
//             frm.set_df_property("collaterals", "hidden", 0);
//         } else {
//             frm.set_df_property("collaterals", "hidden", 1);
//         }
//     },
//     refresh: function(frm) {
//         if (frm.doc.loan_amount > 100000) {
//             frm.set_df_property("collaterals", "hidden", 0);
//         } else {
//             frm.set_df_property("collaterals", "hidden", 1);
//         }
//     }
// });

// Step 4: Restrict Repayment Entry if Loan Not Approved

// Custom Script for Repayment Record:

// frappe.ui.form.on('Repayment Record', {
//     loan_application: function(frm) {
//         if (frm.doc.loan_application) {
//             frappe.db.get_value("Loan Application", frm.doc.loan_application, "status", function(value) {
//                 if (value.status !== "Approved") {
//                     frappe.msgprint("Repayment can only be made if Loan Application is Approved.");
//                     frm.set_value("loan_application", "");
//                 }
//             });
//         }
//     }
// });

// Step 5: Backend Validation (Python Hooks)

// In loan_application.py (inside your custom app):

// import frappe
// from frappe.model.document import Document

// class LoanApplication(Document):
//     def validate(self):
//         self.validate_installments()
//         self.validate_guarantors()
//         self.validate_collaterals()

//     def validate_installments(self):
//         total_installments = sum([d.amount for d in self.installments])
//         if total_installments < self.loan_amount * 1.05:
//             frappe.throw("Total Installments must be at least 5% more than Principal (Loan Amount).")

//     def validate_guarantors(self):
//         names = [d.guarantor_name for d in self.guarantors]
//         if len(names) != len(set(names)):
//             frappe.msgprint("Duplicate Guarantor Name found. Please ensure guarantor names are unique.")

//     def validate_collaterals(self):
//         if self.loan_amount > 100000:  # only check if collateral is required
//             for c in self.collaterals:
//                 if c.value < (self.loan_amount / 2):
//                     frappe.throw(f"Collateral value '{c.value}' cannot be less than half of Loan Amount.")

// Step 6: Hook into Repayment Record Validation

// In repayment_record.py:

// import frappe
// from frappe.model.document import Document

// class RepaymentRecord(Document):
//     def validate(self):
//         loan_status = frappe.db.get_value("Loan Application", self.loan_application, "status")
//         if loan_status != "Approved":
//             frappe.throw("Repayments can only be recorded for Approved Loan Applications.")

// Step 7: Testing Workflow

// Create a Loan Application with loan amount:

// If < 100000 → no collaterals shown.

// If > 100000 → collaterals section visible, and values must be >= 50% of loan amount.

// Add Installments:

// Must total >= 105% of loan amount.

// Add Guarantors:

// No duplicate names allowed.

// Change Status to Approved → now Repayment Records can be created.

// Try Repayment Record for non-approved loan → should block.

// ✅ With this, you’ll have:

// UI rules (JS)

// Backend validations (Python)

// Workflow 