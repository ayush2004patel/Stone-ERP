
//==================================================
// 0. Prevent auto-add row on load
//==================================================
frappe.ui.form.on('Block Selection', {
    onload: function(frm) {
        if (frm.doc.block_selection_details && frm.doc.block_selection_details.length === 1) {
            if (!frm.doc.block_selection_details[0].block_number) {
                frm.clear_table("block_selection_details");
                // Frappe auto-refreshes; no refresh_field needed
            }
        }
    }
});

//==================================================
// 1. Auto-fill fields from Baps Project
//==================================================
frappe.ui.form.on("Block Selection", {
    baps_project: function(frm) {
        if (frm.doc.baps_project) {
            frappe.call({
                method: "frappe.client.get",
                args: {
                    doctype: "Baps Project",
                    name: frm.doc.baps_project
                },
                callback: function(r) {
                    if (r.message) {
                        // Example: frm.set_value('region', r.message.region);
                    }
                }
            });
        }
    }
});

//==================================================
// 2. Volume calculation (DEBOUNCED)
//==================================================
const volumeDebounceTimers = {};

frappe.ui.form.on('Block Selection Detail', {
    l1: function(frm, cdt, cdn) { debounceVolumeCalc(frm, cdt, cdn); },
    l2: function(frm, cdt, cdn) { debounceVolumeCalc(frm, cdt, cdn); },
    b1: function(frm, cdt, cdn) { debounceVolumeCalc(frm, cdt, cdn); },
    b2: function(frm, cdt, cdn) { debounceVolumeCalc(frm, cdt, cdn); },
    h1: function(frm, cdt, cdn) { debounceVolumeCalc(frm, cdt, cdn); },
    h2: function(frm, cdt, cdn) { debounceVolumeCalc(frm, cdt, cdn); },
});

function debounceVolumeCalc(frm, cdt, cdn) {
    const key = cdt + '_' + cdn;
    if (volumeDebounceTimers[key]) {
        clearTimeout(volumeDebounceTimers[key]);
    }
    volumeDebounceTimers[key] = setTimeout(() => {
        calculate_volume(frm, cdt, cdn);
        delete volumeDebounceTimers[key];
    }, 150);
}

function calculate_volume(frm, cdt, cdn) {
    let row = locals[cdt][cdn];

    let inch_fields = ['l2', 'b2', 'h2'];
    for (let f of inch_fields) {
        if ((row[f] || 0) > 12) {
            // ✅ Use show_alert — does NOT close popup
            frappe.show_alert({
                message: __(f.toUpperCase() + ' must be ≤ 12 inches'),
                indicator: 'red'
            }, 5); // auto-dismiss after 5 seconds

            // ✅ Reset field to 0
            frappe.model.set_value(cdt, cdn, f, 0);

            // ✅ Optional: Focus back to field
            setTimeout(() => {
                if (frm.fields_dict[f]) {
                    frm.fields_dict[f].set_focus();
                }
            }, 300);

            return; // Skip volume calc
        }
    }

    // Proceed with volume calculation
    let L = (flt(row.l1) || 0) + ((flt(row.l2) || 0) / 12.0);
    let B = (flt(row.b1) || 0) + ((flt(row.b2) || 0) / 12.0);
    let H = (flt(row.h1) || 0) + ((flt(row.h2) || 0) / 12.0);

    let vol = 0.0;
    if (L > 0 && B > 0 && H > 0) {
        vol = parseFloat((L * B * H).toFixed(3));
    }

    frappe.model.set_value(cdt, cdn, 'volume', vol);
}

//==================================================
// Auto-set 5-letter prefix in block_number (NO auto digits)
//==================================================

frappe.ui.form.on("Block Selection", {
    refresh: function(frm) {
        // Re-apply prefix logic if codes change
        frm.trigger("apply_block_prefix_to_rows");
    },
    project_code: function(frm) {
        frm.trigger("apply_block_prefix_to_rows");
    },
    trade_partner_code: function(frm) {
        frm.trigger("apply_block_prefix_to_rows");
    },

    apply_block_prefix_to_rows: function(frm) {
        if (!frm.doc.project_code || !frm.doc.trade_partner_code) return;

        let prefix = getFiveLetterPrefix(frm.doc.project_code, frm.doc.trade_partner_code);

        // Apply prefix ONLY to rows that have NO block_number yet
        frm.doc.block_selection_details.forEach(row => {
            if (!row.block_number) {
                // Set ONLY the 5-letter prefix — no numbers
                row.block_number = prefix;
            }
            // If block_number already exists (e.g., "ABCDE1234"), leave it untouched
        });
        frm.refresh_field("block_selection_details");
    }
});

// When a new row is added
frappe.ui.form.on("Block Selection Detail", {
    block_selection_details_add: function(frm, cdt, cdn) {
        // Lock header fields immediately when row is added
        lock_header_fields_if_children_exist(frm);

        if (!frm.doc.project_code || !frm.doc.trade_partner_code) return;

        let prefix = getFiveLetterPrefix(frm.doc.project_code, frm.doc.trade_partner_code);
        let row = locals[cdt][cdn];

        // Only set if not already set
        if (!row.block_number) {
            frappe.model.set_value(cdt, cdn, "block_number", prefix);
        }
    },

    block_selection_details_remove: function(frm, cdt, cdn) {
        // Re-check lock status when row is removed
        // Small delay to ensure DOM is updated with new row count
        setTimeout(() => {
            lock_header_fields_if_children_exist(frm);
        }, 200);
    }
});

//==================================================
// 5. Site Filter
//==================================================
frappe.ui.form.on("Block Selection", {
    trade_partner: function(frm) {
        frm.set_value("site", "");
        frm.fields_dict.site.get_query = null;
        if (frm.doc.trade_partner) {
            frm.set_query("site", function() {
                return { filters: { trade_partner: frm.doc.trade_partner } };
            });
        }
    }
});

//==================================================
// 6. Last block number popup
//==================================================
frappe.ui.form.on('Block Selection', {
    last_block_number: function(frm) {
    

        frappe.call({
            method: 'baps.baps.doctype.block_selection.block_selection.get_last_block_number',
            args: {
                trade_partner: frm.doc.trade_partner,
                project_name: frm.doc.project_name,
                current_docname: frm.doc.name
            },
            callback: function(r) {
                if (r.message) {
                    frappe.msgprint({
                        title: __('Last Block Number'),
                        message: __('Last block number: <b>{0}</b>', [r.message]),
                        indicator: 'green'
                    });
                    frm.last_block_no = parseInt(r.message.replace(/[^\d]/g, "")) || 0;
                } else {
                    frappe.msgprint({
                        title: __('No Previous Blocks'),
                        message: __('No previous blocks found'),
                        indicator: 'blue'
                    });
                    frm.last_block_no = 0;
                }
            }
        });
    }
});

//==================================================
// 9. Header fields lock after saving or when child rows exist
//==================================================
let headerLockState = { has_rows: false, is_saved: false };

frappe.ui.form.on('Block Selection', {
    refresh: function(frm) { 
        lock_header_fields_if_children_exist(frm); 
    },
    after_save: function(frm) {
        lock_header_fields_if_children_exist(frm);
    }
});

function lock_header_fields_if_children_exist(frm) {
    const has_rows = (frm.doc.block_selection_details || []).length > 0;
    const is_saved = !frm.is_new();
    
    // Lock if: (has rows AND not saved) OR (is saved)
    // Unlock if: (no rows AND not saved)
    const should_lock = has_rows || is_saved;

    // Check if lock state is changing to show notification
    const was_locked = headerLockState.has_rows || headerLockState.is_saved;
    
    // Skip redundant updates
    if (headerLockState.has_rows === has_rows && headerLockState.is_saved === is_saved) {
        return;
    }
    
    headerLockState.has_rows = has_rows;
    headerLockState.is_saved = is_saved;

    // All header fields that should be locked when child rows exist or after save
    const header_fields_to_lock = [
        'trade_partner',
        'baps_project'
    ];

    // Apply lock/unlock to all header fields
    header_fields_to_lock.forEach(fieldname => {
        if (frm.fields_dict[fieldname]) {
            frm.set_df_property(fieldname, 'read_only', should_lock ? 1 : 0);
        }
    });

    // Show notification when lock state changes
    if (!is_saved) { // Only show notifications for unsaved forms
        if (!was_locked && should_lock && has_rows) {
            frappe.show_alert({
                message: __('Header fields are now locked'),
                indicator: 'blue'
            }, 3);
        } else if (was_locked && !should_lock && !has_rows) {
            frappe.show_alert({
                message: __('Header fields are now editable'),
                indicator: 'green'
            }, 3);
        }
    }
}

//==================================================
// 9. Header fields lock after saving or when child rows exist (Version 2)
//==================================================
let headerLockState2 = { has_rows: false, is_saved: false };

frappe.ui.form.on('Block Selection', {
    refresh: function(frm) { toggle_header_fields_v2(frm); },
    after_save: function(frm) {
        toggle_header_fields_v2(frm);
        frappe.msgprint({ message: __('Header fields are now locked.'), indicator: 'blue' });
    },
    block_selection_details_add: function(frm) { toggle_header_fields_v2(frm); },
    block_selection_details_remove: function(frm) { toggle_header_fields_v2(frm); }
});

function toggle_header_fields_v2(frm) {
    const has_rows = (frm.doc.block_selection_details || []).length > 0;
    const is_saved = !frm.is_new();

    if (headerLockState2.has_rows === has_rows && headerLockState2.is_saved === is_saved) {
        return; // Skip redundant updates
    }
    headerLockState2.has_rows = has_rows;
    headerLockState2.is_saved = is_saved;

    const permanently_locked = ['trade_partner', 'site', 'baps_project', 'material_type'];
    const conditional_locked = ['date', 'party', 'invoice_to_be_paid_after_block_receipt', 'selected_by'];

    permanently_locked.forEach(fieldname => {
        if (frm.fields_dict[fieldname]) {
            frm.set_df_property(fieldname, 'read_only', is_saved);
        }
    });

    const lock_fields = has_rows || is_saved;
    conditional_locked.forEach(fieldname => {
        if (frm.fields_dict[fieldname]) {
            frm.set_df_property(fieldname, 'read_only', lock_fields);
        }
    });

    if (frm.fields_dict['party']) {
        frm.set_df_property('party', 'read_only', 0);
    }
}




//==================================================
// Auto-set Selected By (User)
//==================================================
frappe.ui.form.on("Block Selection", {
    onload: function(frm) {
        if (!frm.doc.selected_by) {
            frm.set_value("selected_by", frappe.session.user);
        }
    }
});

//==================================================
// Invoice after receipt
//==================================================
frappe.ui.form.on('Block Selection', {
    invoice_after_receipt: function(frm) {
        if (frm.doc.invoice_after_receipt) {
            frappe.msgprint({
                title: __("Notice"),
                message: __("This will be handled after payment method."),
                indicator: "orange"
            });
        }
    }
});

//==================================================
// Party filter
//==================================================
frappe.ui.form.on('Block Selection', {
    trade_partner: function(frm) {
        frm.set_value('party', '');
        if (frm.doc.trade_partner) {
            frm.set_query('party', function() {
                return { filters: { trade_partner: frm.doc.trade_partner } };
            });
        }
    }
});



function getFiveLetterPrefix(project_code, trade_partner_code) {
    // Combine and extract only letters
    let combined = (project_code || "") + (trade_partner_code || "");
    let letters = combined.replace(/[^A-Za-z]/g, "").toUpperCase();

    // Take first 5 letters; if fewer than 5, pad with 'X'
    if (letters.length < 5) {
        letters = (letters + "XXXXX").substring(0, 5);
    } else {
        letters = letters.substring(0, 5);
    }

    return letters;
}

frappe.ui.form.on("Block Selection Detail", {
    block_number: function(frm, cdt, cdn) {
        let value = locals[cdt][cdn].block_number;
        if (value && !/^[A-Z]{5}\d{4}$/.test(value)) {
            frappe.show_alert({
                message: __("Block number must be 5 letters + 4 digits (e.g., ABCDE1234)"),
                indicator: "orange"
            }, 5);
        }
    }
});