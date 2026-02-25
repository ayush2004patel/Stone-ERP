//==================================================
// Dynamic Filters for Block & Stones
//==================================================
function set_block_and_stone_filters(frm) {
    // Block Inspection
    if (frm.doc.current_site) {
        frm.set_query("block_number", function() {
            return {
                query: "baps.baps.doctype.inspection_demo.inspection_demo.get_available_block_or_stone",
                filters: {
                    usage: "block_inspection",
                    site: frm.doc.current_site,
                    project: frm.doc.project,
                    status: "Ready for Inspection",
                },
            };
        });

    } else {
        frm.set_query("block_number", null);
    }

    // Pre Carving Inspection
    if (frm.doc.current_sitee) {
        frm.set_query("stone_number", function() {
            return {
                query: "baps.baps.doctype.inspection_demo.inspection_demo.get_available_block_or_stone",
                filters: {
                    usage: "pre_carving",
                    site: frm.doc.current_sitee,
                    baps_project: frm.doc.projectt,
                    status: "Ready for Carving Inspection"
                }
            };
        });
    } else {
        frm.set_query("stone_number", null);
    }

    //Ready for Cutting
    if (frm.doc.current_siteee) {
        frm.set_query("stone_number", function() {
            return {
                query: "baps.baps.doctype.inspection_demo.inspection_demo.get_available_block_or_stone",
                filters: {
                    usage: "ready_for_cutting",
                    site: frm.doc.current_siteee,
                    baps_project: frm.doc.projectt,
                    status: "Ready for Cutting"
                }
            };
        });
    } else {
        frm.set_query("stone_number", null);
    }

    // Post Carving Inspection
    if (frm.doc.current_siteee) {
        frm.set_query("stone_numberr", function() {
            return {
                query: "baps.baps.doctype.inspection_demo.inspection_demo.get_available_block_or_stone",
                filters: {
                    usage: "post_carving",
                    site: frm.doc.current_siteee,
                    baps_project: frm.doc.projecttt,
                    status: "Ready for Carving Inspection"
                }
            };
        });
    } else {
        frm.set_query("stone_numberr", null);
    }

    // Post Polishing Inspection
    if (frm.doc.current_siteeee) {
        frm.set_query("stone_numberrrr", function() {
            return {
                query: "baps.baps.doctype.inspection_demo.inspection_demo.get_available_block_or_stone",
                filters: {
                    usage: "post_polishing",
                    site: frm.doc.current_siteeee,
                    baps_project: frm.doc.projectttt,
                    status: "Ready for Polishing Inspection"
                }
            };
        });
    } else {
        frm.set_query("stone_numberrrr", null);
    }

    // Direct: Post Carving
    if (frm.doc.direct_current_siteeeeeeee) {
        frm.set_query("direct_stone_numberrrrrrrr", function() {
            return {
                query: "baps.baps.doctype.inspection_demo.inspection_demo.get_available_block_or_stone",
                filters: {
                    usage: "direct_post_carving",
                    site: frm.doc.direct_current_siteeeeeeee,
                    baps_project: frm.doc.direct_projecttttttt,
                    status: "Ready for Carving Inspection"
                }
            };
        });
    } else {
        frm.set_query("direct_stone_numberrrrrrrr", null);
    }

    // Direct: Post Polishing
    if (frm.doc.direct_current_siteeeeeeeee) {
        frm.set_query("direct_stone_numberrrrrrrrrr", function() {
            return {
                query: "baps.baps.doctype.inspection_demo.inspection_demo.get_available_block_or_stone",
                filters: {
                    usage: "direct_post_polishing",
                    site: frm.doc.direct_current_siteeeeeeeee,
                    baps_project: frm.doc.direct_projectttttttt,
                    status: "Ready for Polishing Inspection"
                }
            };
        });
    } else {
        frm.set_query("direct_stone_numberrrrrrrrrr", null);
    }
}


//==================================================
// Create or Remove Cancel Button (custom inspection cancel)
//==================================================
function make_cancel_button(frm) {
    if (frm.custom_buttons && frm.custom_buttons["Cancel Inspection"]) {
        frm.custom_buttons["Cancel Inspection"].remove();
        delete frm.custom_buttons["Cancel Inspection"];
    }

    if (frm.is_new()) {
        const anyActive =
            frm._toggle_states.block_inspection ||
            frm._toggle_states.pre_carving_inspection ||
            frm._toggle_states.post_carving_inspection ||
            frm._toggle_states.post_polishing_inspection ||
            frm._toggle_states.direct_inspection_purchase ||
            frm._toggle_states.post_carving ||
            frm._toggle_states.post_polishing;

        if (anyActive) {
            frm.add_custom_button(__("Cancel Inspection"), function() {
                frappe.confirm(
                    __("Are you sure you want to cancel this inspection? All unsaved changes will be lost."),
                    () => {
                        // Reset states
                        frm._toggle_states = {
                            block_inspection: false,
                            pre_carving_inspection: false,
                            post_carving_inspection: false,
                            post_polishing_inspection: false,
                            direct_inspection_purchase: false,
                            post_carving: false,
                            post_polishing: false,
                            direct_inspection_active: false
                        };

                        // Clear types
                        clear_all_inspection_type_fields(frm);

                        // Clear stone/block fields
                        const stoneFields = [
                            'block_number', 'stone_number', 'stone_numberr', 'stone_numberrrr',
                            'direct_stone_numberrrrrrrr', 'direct_stone_numberrrrrrrrrr'
                        ];
                        stoneFields.forEach(f => frm.set_value(f, ''));

                        // Clear question tables
                        const questionFields = ['ques', 'que', 'quess', 'quesssssss', 'quessssssss'];
                        questionFields.forEach(field => {
                            if (frm.fields_dict[field]?.grid) {
                                frm.clear_table(field);
                                frm.refresh_field(field);
                            }
                        });

                        // Hide all sections
                        const sections = [
                            'section_break_aqhc', 'section_break_jktu', 'section_break_wfcc', 'section_break_hmer', 'section_break_vfxp',
                            'pre_carving_inspection_section', 'section_break_hcbi',
                            'post_carving_inspection_section', 'section_break_eilj',
                            'post_polishing_inspection_section', 'section_break_jzno',
                            'section_break_kvqm',
                            'direct_post_carving', 'section_break_vixw',
                            'direct_post_polishing', 'section_break_lhrw'
                        ];
                        sections.forEach(sec => frm.toggle_display(sec, false));

                        // Show all toggle buttons
                        const toggleFields = [
                            'block_inspection', 'pre_carving_inspection', 'post_carving_inspection',
                            'post_polishing_inspection', 'direct_inspection_purchase',
                            'pre_carving', 'post_carving', 'post_polishing'
                        ];
                        toggleFields.forEach(field => frm.toggle_display(field, true));

                        frm.refresh();

                        // Hide Save button after cancel
                        toggle_save_button(frm, false);

                        // Reset dynamic required fields
                        set_dynamic_required_fields(frm);
                    }
                );
            }).addClass("btn-danger");
        }
    }
}

//==================================================
// Helper: Hide all inspection sections
//==================================================
function hideAllInspectionSections(frm) {
    const sections = [
        'section_break_aqhc', 'section_break_jktu', 'section_break_wfcc', 'section_break_hmer', 'section_break_vfxp',
        'pre_carving_inspection_section', 'section_break_hcbi',
        'post_carving_inspection_section', 'section_break_eilj',
        'post_polishing_inspection_section', 'section_break_jzno',
        'section_break_kvqm',
        'direct_post_carving', 'section_break_vixw',
        'direct_post_polishing', 'section_break_lhrw'
    ];
    sections.forEach(sec => frm.toggle_display(sec, false));
}

//==================================================
// Helper: Clear all inspection_type fields
//==================================================
function clear_all_inspection_type_fields(frm) {
    const inspectionTypeFields = [
        'inspection_type', 'inspection_typee', 'inspection_typeee', 'inspection_typeeee',
        'direct_inspection_typeeeeeee', 'direct_inspection_typeeeeeeee'
    ];
    inspectionTypeFields.forEach(f => frm.set_value(f, ''));
}

//==================================================
// Helper: Update toggle states (mutual exclusion)
//==================================================
function updateToggleStates(frm, activeKey) {
    const keys = [
        'block_inspection', 'pre_carving_inspection', 'post_carving_inspection', 'post_polishing_inspection',
        'direct_inspection_purchase', 'pre_carving', 'post_carving', 'post_polishing'
    ];
    keys.forEach(key => {
        frm._toggle_states[key] = (key === activeKey);
    });
}

//==================================================
// Helper: Show or Hide the Primary Save Button
//==================================================
function toggle_save_button(frm, show) {
    const saveBtn = frm.page.wrapper.find('.btn-primary:contains("Save")');
    if (saveBtn.length) {
        saveBtn.toggle(show);
    }
    frm.page.set_primary_action(show ? __("Save") : "", show ? () => frm.save() : null);
}

//==================================================
// Dynamic required fields based on inspection type
//==================================================
function set_dynamic_required_fields(frm) {
    const block_fields = [
        "current_site", "block_number", "color", "grain",
        "l1", "b1", "h1",
        "l2", "b2", "h2"
    ];
    const is_block = frm.doc.inspection_type === "Block Inspection";
    block_fields.forEach(f => {
        frm.toggle_reqd(f, !!is_block);
    });
}

//==================================================
// Disable Save when Completed
//==================================================
function toggle_save_cancel_for_completed(frm) {
    const is_completed =
        (frm.doc.inspection_status && frm.doc.inspection_status === "Completed") ||
        (frm.doc.workflow_state && frm.doc.workflow_state === "Completed");

    if (is_completed) {
        frm.disable_save();
    } else {
        frm.enable_save();
    }

    setTimeout(() => {
        if (!frm.page || !frm.page.wrapper) return;

        const $wrapper = frm.page.wrapper;

        const $cancelBtns = $wrapper.find('.page-actions button, .page-actions a')
            .filter(function() {
                const txt = ($(this).text() || "").trim().toLowerCase();
                if (!txt) return false;
                return txt.indexOf("cancel") !== -1;
            });

        $cancelBtns.each(function() {
            const $btn = $(this);

            if (is_completed) {
                if ($btn.data('inspection_cancel_locked')) return;

                const $clone = $btn.clone(false);
                $clone.data('inspection_cancel_locked', true);

                $clone.on('click', function(e) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    frappe.show_alert({
                        message: __("Once inspection is completed it cannot be cancelled."),
                        indicator: 'orange'
                    }, 8);
                });

                $btn.replaceWith($clone);
            }
        });
    }, 150);
}

//==================================================
// Custom Actions menu (Under inspection / Completed)
//==================================================
function setup_action_menu(frm) {
    if (frm.is_new()) return;

    const actions_menu = frm.page.wrapper.find('.actions-btn-group .dropdown-menu');
    if (actions_menu && actions_menu.length) {
        actions_menu.empty();
    }

    frm.page.add_action_item(__('Under inspection'), function() {
        if (frm.doc.inspection_status !== 'Under inspection') {
            frm.set_value('inspection_status', 'Under inspection');
        }
        frm.save();
    });

    frm.page.add_action_item(__('Completed'), function() {
        if (frm.doc.inspection_status !== 'Completed') {
            frm.set_value('inspection_status', 'Completed');
        }
        frm.save();
    });
}

//==================================================
// Status button configuration helper
//==================================================
function get_status_config(frm) {
    // Block Inspection form
    if (frm.doc.inspection_type === "Block Inspection") {
        return {
            target_field: "status",
            allowed_statuses: [
                "Pass",
                "Pass with alter size",
                "Reject and do not bill",
                "Reject and bill"
            ]
        };
    }

    // Pre Carving Inspection form
    if (frm.doc.inspection_typee === "Pre Carving") {
        return {
            target_field: "statuss",
            allowed_statuses: [
                "Pass",
                "Repair",
                "Reject"
            ]
        };
    }

    // Post Carving Inspection form
    if (frm.doc.inspection_typeee === "Post Carving") {
        return {
            target_field: "statusss",
            allowed_statuses: [
                "Pass",
                "Repair",
                "Reject"
            ]
        };
    }

    // Post Polishing Inspection form
    if (frm.doc.inspection_typeeee === "Post Polishing") {
        return {
            target_field: "statussss",
            allowed_statuses: [
                "Pass",
                "Repair",
                "Reject"
            ]
        };
    }

    // Direct Purchase – Post Carving
    if (frm.doc.direct_inspection_typeeeeeee === "Direct Post Carving") {
        return {
            target_field: "statussssss",
            allowed_statuses: [
                "Pass",
                "Repair",
                "Reject"
            ]
        };
    }

    // Direct Purchase – Post Polishing
    if (frm.doc.direct_inspection_typeeeeeeee === "Direct Post Polishing") {
        return {
            target_field: "statusssssss",
            allowed_statuses: [
                "Pass",
                "Repair",
                "Reject"
            ]
        };
    }

    return null;
}

// ==================================================
// HELPERS: toolbar removal & safe clear for status
// ==================================================
function remove_status_options_from_toolbar(remove_labels) {
    setTimeout(() => {
        $(".dropdown-menu a, .dropdown-menu li, .dropdown-menu button").each(function() {
            const txt = $(this).text().trim();
            if (remove_labels.indexOf(txt) !== -1) {
                $(this).remove();
            }
        });
    }, 50);
}

function clear_existing_status_buttons(frm) {
    try {
        const container = frm.page.wrapper.find('.page-actions .dropdown-menu');
        if (container && container.length) {
            container.find('li, a, button').each(function() {
                const txt = $(this).text().trim();
                if (/^(Pass|Pass with alter size|Reject and do not bill|Reject and bill|Repair|Reject)$/i.test(txt)) {
                    $(this).remove();
                }
            });
        }
    } catch (e) {
        console.warn("clear_existing_status_buttons:", e);
    }
}
function hide_status_button_group(frm) {
    try {
        if (!frm.page || !frm.page.wrapper) return;

        const $wrapper = frm.page.wrapper;

        // Find the btn-group whose dropdown toggle caption is "Status"
        $wrapper.find('.page-actions .btn-group').each(function () {
            const $toggle = $(this).find('.dropdown-toggle').first();
            const txt = ($toggle.text() || "").trim().toLowerCase();

            if (txt === "status" || txt === __("Status").toLowerCase()) {
                // hide the whole Status dropdown group
                $(this).hide();   // (use .remove() instead if you want to completely remove it)
            }
        });
    } catch (e) {
        console.warn("hide_status_button_group:", e);
    }
}


//==================================================
// Create Status dropdown (group of buttons)
//==================================================
function setup_status_buttons(frm) {
    if (frm.is_new()) return;

    // remove any old status entries
    clear_existing_status_buttons(frm);

    // 🔒 If inspection is completed (by field or workflow), hide the Status dropdown
    const is_completed =
        (frm.doc.inspection_status && frm.doc.inspection_status === "Completed") ||
        (frm.doc.workflow_state && frm.doc.workflow_state === "Completed");

    if (is_completed) {
        hide_status_button_group(frm);
        return;
    }

    const cfg = get_status_config(frm);
    if (!cfg) {
        // No config → also hide the Status group if it exists
        hide_status_button_group(frm);
        return;
    }

    // Block inspection reject labels
    const BLOCK_REJECT_LABELS = ["Reject and bill", "Reject and do not bill"];
    // Other inspections – only plain Reject
    const OTHER_REJECT_LABELS = ["Reject"];
    const REJECTION_STATUS_VALUE = "Reject Request";

    frappe.db.get_list("Rejection Evaluation", {
        filters: {
            inspection_demo: frm.doc.name,
            request_status: REJECTION_STATUS_VALUE
        },
        fields: ["name"],
        limit_page_length: 1
    }).then(function(res) {
        let hasRejection = (res && res.length > 0);

        if (!hasRejection) {
            return frappe.db.get_list("Rejection Evaluation", {
                filters: {
                    inspection_demo: frm.doc.name,
                    status: REJECTION_STATUS_VALUE
                },
                fields: ["name"],
                limit_page_length: 1
            }).then(function(res2) {
                hasRejection = (res2 && res2.length > 0);
                return hasRejection;
            });
        } else {
            return hasRejection;
        }
    }).then(function(hasRejection) {

        // Decide which labels we should hide based on which status field we are driving
        const labelsToRemove = (cfg.target_field === "status")
            ? BLOCK_REJECT_LABELS       // Block Inspection
            : OTHER_REJECT_LABELS;      // All other inspections

        if (hasRejection) {
            cfg.allowed_statuses = cfg.allowed_statuses.filter(function(st) {
                if (!st) return true;
                return labelsToRemove.indexOf(st) === -1;
            });
        }

        cfg.allowed_statuses.forEach(function (st) {
            frm.add_custom_button(__(st), function () {
                if (cfg.target_field) {
                    // only set the field; your on-change handler does the rest
                    frm.set_value(cfg.target_field, st);
                }
            }, __("Status"));
        });

        if (hasRejection) {
            remove_status_options_from_toolbar(labelsToRemove);
            if (frm.fields_dict && frm.fields_dict[cfg.target_field]) {
                const df = frm.fields_dict[cfg.target_field].df;
                if (df && df.options) {
                    const opts = df.options.split("\n").map(o => o.trim()).filter(Boolean);
                    const newOpts = opts.filter(o => labelsToRemove.indexOf(o) === -1);
                    frm.set_df_property(cfg.target_field, "options", newOpts.join("\n"));
                    if (labelsToRemove.indexOf(frm.doc[cfg.target_field]) !== -1) {
                        const fallback = newOpts.length ? newOpts[0] : "";
                        frm.set_value(cfg.target_field, fallback);
                    }
                }
            }
        }
    }).catch(function(err) {
        console.error("Error checking Rejection Evaluation in setup_status_buttons:", err);
        cfg.allowed_statuses.forEach(function(st) {
            frm.add_custom_button(__(st), function() {
                if (cfg.target_field) {
                    frm.set_value(cfg.target_field, st);
                }
            }, __("Status"));
        });
    });
}



//==================================================
// Main Form Script
//==================================================
frappe.ui.form.on('Inspection Demo', {
    refresh: function(frm) {
        frm._toggle_states = {
            block_inspection: false,
            pre_carving_inspection: false,
            post_carving_inspection: false,
            post_polishing_inspection: false,
            direct_inspection_purchase: false,
            pre_carving: false,
            post_carving: false,
            post_polishing: false,
            direct_inspection_active: false
        };

        hideAllInspectionSections(frm);
        set_block_and_stone_filters(frm);

        ['ques', 'que', 'quess', 'quesssssss', 'quessssssss'].forEach(field => {
            if (frm.fields_dict[field]?.grid) {
                frm.fields_dict[field].grid.cannot_add_rows = true;
                frm.refresh_field(field);
            }
        });

        const toggleFields = [
            'block_inspection', 'pre_carving_inspection', 'post_carving_inspection',
            'post_polishing_inspection', 'direct_inspection_purchase',
            'pre_carving', 'post_carving', 'post_polishing'
        ];
        toggleFields.forEach(field => {
            frm.toggle_display(field, frm.is_new());
        });

        // Show/Hide inner buttons for Direct Inspection Purchase
        const innerButtons = ['post_carving', 'post_polishing'];
        innerButtons.forEach(field => {
            frm.toggle_display(field, frm._toggle_states.direct_inspection_active);
        });

        if (!frm.is_new()) {
            if (frm.doc.inspection_type === "Block Inspection") {
                updateToggleStates(frm, 'block_inspection');
                frm.toggle_display('section_break_aqhc', true);
                frm.toggle_display('section_break_jktu', true);
                frm.toggle_display('section_break_wfcc', true);
                frm.toggle_display('section_break_hmer', true);
                frm.toggle_display('section_break_vfxp', true);

            } else if (frm.doc.inspection_typee === "Pre Carving") {
                updateToggleStates(frm, 'pre_carving_inspection');
                frm.toggle_display('pre_carving_inspection_section', true);
                frm.toggle_display('section_break_hcbi', true);

            } else if (frm.doc.inspection_typeee === "Post Carving") {
                updateToggleStates(frm, 'post_carving_inspection');
                frm.toggle_display('post_carving_inspection_section', true);
                frm.toggle_display('section_break_eilj', true);

            } else if (frm.doc.inspection_typeeee === "Post Polishing") {
                updateToggleStates(frm, 'post_polishing_inspection');
                frm.toggle_display('post_polishing_inspection_section', true);
                frm.toggle_display('section_break_jzno', true);

            } else if (
                frm.doc.direct_inspection_typeeeeeee === "Direct Post Carving"
                || frm.doc.direct_stone_numberrrrrrrr
            ) {
                updateToggleStates(frm, 'post_carving');
                frm.toggle_display('direct_post_carving', true);
                frm.toggle_display('section_break_vixw', true);

            } else if (
                frm.doc.direct_inspection_typeeeeeeee === "Direct Post Polishing"
                || frm.doc.direct_stone_numberrrrrrrrrr
            ) {
                updateToggleStates(frm, 'post_polishing');
                frm.toggle_display('direct_post_polishing', true);
                frm.toggle_display('section_break_lhrw', true);
            }
        }

        set_dynamic_required_fields(frm);
        make_cancel_button(frm);

        const isOnMainPage = frm.is_new() && !(
            frm._toggle_states.block_inspection ||
            frm._toggle_states.pre_carving_inspection ||
            frm._toggle_states.post_carving_inspection ||
            frm._toggle_states.post_polishing_inspection ||
            frm._toggle_states.direct_inspection_purchase ||
            frm._toggle_states.pre_carving ||
            frm._toggle_states.post_carving ||
            frm._toggle_states.post_polishing
        );
        toggle_save_button(frm, !isOnMainPage);

        setup_action_menu(frm);
        setup_status_buttons(frm);
        toggle_save_cancel_for_completed(frm);
    },

    inspection_status: function(frm) {
        toggle_save_cancel_for_completed(frm);
    },

    // Site change handlers
    current_site: (frm) => { set_block_and_stone_filters(frm); if (frm.doc.block_number) frm.set_value('block_number', ''); },
    current_sitee: (frm) => { set_block_and_stone_filters(frm); if (frm.doc.stone_number) frm.set_value('stone_number', ''); },
    current_siteee: (frm) => { set_block_and_stone_filters(frm); if (frm.doc.stone_numberr) frm.set_value('stone_numberr', ''); },
    current_siteeee: (frm) => { set_block_and_stone_filters(frm); if (frm.doc.stone_numberrrr) frm.set_value('stone_numberrrr', ''); },
    direct_current_siteeeeeeee: (frm) => { set_block_and_stone_filters(frm); if (frm.doc.direct_stone_numberrrrrrrr) frm.set_value('direct_stone_numberrrrrrrr', ''); },
    direct_current_siteeeeeeeee: (frm) => { set_block_and_stone_filters(frm); if (frm.doc.direct_stone_numberrrrrrrrrr) frm.set_value('direct_stone_numberrrrrrrrrr', ''); },

    // Toggle Handlers
    block_inspection: (frm) => {
        const show = !frm._toggle_states.block_inspection;
        if (show) hideAllInspectionSections(frm);
        frm.toggle_display('section_break_aqhc', show);
        frm.toggle_display('section_break_jktu', show);
        frm.toggle_display('section_break_wfcc', show);
        frm.toggle_display('section_break_hmer', show);
        frm.toggle_display('section_break_vfxp', show); 

        if (show) {
            clear_all_inspection_type_fields(frm);
            frm.set_value('inspection_type', 'Block Inspection');
            if (frm.is_new()) {
                load_questions_by_type(frm, 'Block Inspection', 'ques');
            }
        } else {
            frm.set_value('inspection_type', '');
        }
        updateToggleStates(frm, show ? 'block_inspection' : null);

        set_dynamic_required_fields(frm);

        const toggleFields = [
            'block_inspection', 'pre_carving_inspection', 'post_carving_inspection',
            'post_polishing_inspection', 'direct_inspection_purchase',
            'pre_carving', 'post_carving', 'post_polishing'
        ];
        toggleFields.forEach(field => frm.toggle_display(field, false));

        frm._toggle_states.direct_inspection_active = false;
        ['pre_carving', 'post_carving', 'post_polishing'].forEach(field => {
            frm.toggle_display(field, false);
        });

        make_cancel_button(frm);
        toggle_save_button(frm, true);
    },

    pre_carving_inspection: (frm) => {
        const show = !frm._toggle_states.pre_carving_inspection;
        if (show) hideAllInspectionSections(frm);
        frm.toggle_display('pre_carving_inspection_section', show);
        frm.toggle_display('section_break_hcbi', show);

        if (show) {
            clear_all_inspection_type_fields(frm);
            frm.set_value('inspection_typee', 'Pre Carving');
            if (frm.is_new()) {
                load_questions_by_type(frm, 'Pre Carving', 'ques');
            }
        } else {
            frm.set_value('inspection_typee', '');
            if (frm.doc.stone_number) frm.set_value('stone_number', '');
        }
        updateToggleStates(frm, show ? 'pre_carving_inspection' : null);

        set_dynamic_required_fields(frm);

        const toggleFields = [
            'block_inspection', 'pre_carving_inspection', 'post_carving_inspection',
            'post_polishing_inspection', 'direct_inspection_purchase',
            'pre_carving', 'post_carving', 'post_polishing'
        ];
        toggleFields.forEach(field => frm.toggle_display(field, false));

        frm._toggle_states.direct_inspection_active = false;
        ['pre_carving', 'post_carving', 'post_polishing'].forEach(field => {
            frm.toggle_display(field, false);
        });

        make_cancel_button(frm);
        toggle_save_button(frm, true);
    },

    post_carving_inspection: (frm) => {
        const show = !frm._toggle_states.post_carving_inspection;
        if (show) hideAllInspectionSections(frm);
        frm.toggle_display('post_carving_inspection_section', show);
        frm.toggle_display('section_break_eilj', show);

        if (show) {
            clear_all_inspection_type_fields(frm);
            frm.set_value('inspection_typeee', 'Post Carving');
            if (frm.is_new()) {
                load_questions_by_type(frm, 'Post Carving', 'que');
            }
        } else {
            frm.set_value('inspection_typeee', '');
            if (frm.doc.stone_numberr) frm.set_value('stone_numberr', '');
        }
        updateToggleStates(frm, show ? 'post_carving_inspection' : null);

        set_dynamic_required_fields(frm);

        const toggleFields = [
            'block_inspection', 'pre_carving_inspection', 'post_carving_inspection',
            'post_polishing_inspection', 'direct_inspection_purchase',
            'pre_carving', 'post_carving', 'post_polishing'
        ];
        toggleFields.forEach(field => frm.toggle_display(field, false));

        frm._toggle_states.direct_inspection_active = false;
        ['pre_carving', 'post_carving', 'post_polishing'].forEach(field => {
            frm.toggle_display(field, false);
        });

        make_cancel_button(frm);
        toggle_save_button(frm, true);
    },

    post_polishing_inspection: (frm) => {
        const show = !frm._toggle_states.post_polishing_inspection;
        if (show) hideAllInspectionSections(frm);
        frm.toggle_display('post_polishing_inspection_section', show);
        frm.toggle_display('section_break_jzno', show);

        if (show) {
            clear_all_inspection_type_fields(frm);
            frm.set_value('inspection_typeeee', 'Post Polishing');
            if (frm.is_new()) {
                load_questions_by_type(frm, 'Post Polishing', 'quess');
            }
        } else {
            frm.set_value('inspection_typeeee', '');
            if (frm.doc.stone_numberrrr) frm.set_value('stone_numberrrr', '');
        }
        updateToggleStates(frm, show ? 'post_polishing_inspection' : null);

        set_dynamic_required_fields(frm);

        const toggleFields = [
            'block_inspection', 'pre_carving_inspection', 'post_carving_inspection',
            'post_polishing_inspection', 'direct_inspection_purchase',
            'pre_carving', 'post_carving', 'post_polishing'
        ];
        toggleFields.forEach(field => frm.toggle_display(field, false));

        frm._toggle_states.direct_inspection_active = false;
        ['pre_carving', 'post_carving', 'post_polishing'].forEach(field => {
            frm.toggle_display(field, false);
        });

        make_cancel_button(frm);
        toggle_save_button(frm, true);
    },

    direct_inspection_purchase: (frm) => {
        const show = !frm._toggle_states.direct_inspection_purchase;
        if (show) hideAllInspectionSections(frm);
        frm.toggle_display('section_break_kvqm', show);
        updateToggleStates(frm, show ? 'direct_inspection_purchase' : null);

        set_dynamic_required_fields(frm);

        const toggleFields = [
            'block_inspection', 'pre_carving_inspection', 'post_carving_inspection',
            'post_polishing_inspection', 'direct_inspection_purchase',
            'pre_carving', 'post_carving', 'post_polishing'
        ];
        toggleFields.forEach(field => {
            frm.toggle_display(field, false);
        });

        frm._toggle_states.direct_inspection_active = true;
        ['post_carving', 'post_polishing'].forEach(field => {
            frm.toggle_display(field, true);
        });

        clear_all_inspection_type_fields(frm);

        make_cancel_button(frm);
        toggle_save_button(frm, true);
    },

    post_carving: (frm) => {
        const show = !frm._toggle_states.post_carving;
        if (show) hideAllInspectionSections(frm);
        frm.toggle_display('direct_post_carving', show);
        frm.toggle_display('section_break_vixw', show);

        if (show) {
            clear_all_inspection_type_fields(frm);
            frm.set_value('direct_inspection_typeeeeeee', 'Direct Post Carving');
            if (frm.is_new()) {
                load_questions_by_type(frm, 'Direct Post Carving', 'quesssssss');
            }
        } else {
            frm.set_value('direct_inspection_typeeeeeee', '');
        }
        updateToggleStates(frm, show ? 'post_carving' : null);

        set_dynamic_required_fields(frm);

        const toggleFields = [
            'block_inspection', 'pre_carving_inspection', 'post_carving_inspection',
            'post_polishing_inspection', 'direct_inspection_purchase',
            'pre_carving', 'post_carving', 'post_polishing'
        ];
        toggleFields.forEach(field => frm.toggle_display(field, false));

        frm._toggle_states.direct_inspection_active = true;
        ['post_carving', 'post_polishing'].forEach(field => {
            frm.toggle_display(field, true);
        });

        make_cancel_button(frm);
        toggle_save_button(frm, true);
    },

    post_polishing: (frm) => {
        const show = !frm._toggle_states.post_polishing;
        if (show) hideAllInspectionSections(frm);
        frm.toggle_display('direct_post_polishing', show);
        frm.toggle_display('section_break_lhrw', show);

        if (show) {
            clear_all_inspection_type_fields(frm);
            frm.set_value('direct_inspection_typeeeeeeee', 'Direct Post Polishing');
            if (frm.is_new()) {
                load_questions_by_type(frm, 'Direct Post Polishing', 'quessssssss');
            }
        } else {
            frm.set_value('direct_inspection_typeeeeeeee', '');
        }
        updateToggleStates(frm, show ? 'post_polishing' : null);

        set_dynamic_required_fields(frm);

        const toggleFields = [
            'block_inspection', 'pre_carving_inspection', 'post_carving_inspection',
            'post_polishing_inspection', 'direct_inspection_purchase',
            'pre_carving', 'post_carving', 'post_polishing'
        ];
        toggleFields.forEach(field => frm.toggle_display(field, false));

        frm._toggle_states.direct_inspection_active = true;
        ['post_carving', 'post_polishing'].forEach(field => {
            frm.toggle_display(field, true);
        });

        make_cancel_button(frm);
        toggle_save_button(frm, true);
    }
});

//==================================================
// Auto-load questions (only if table empty)
//==================================================
function load_questions_by_type(frm, inspection_type, child_table_field) {
    if (frm.doc[child_table_field] && frm.doc[child_table_field].length > 0) {
        return;
    }

    frappe.call({
        method: 'frappe.client.get_list',
        args: {
            doctype: 'Inspection Detail',
            filters: { 'inspection': inspection_type },
            fields: ['name'],
            order_by: 'creation asc'
        },
        callback: function(r) {
            frm.clear_table(child_table_field);
            if (r.message && r.message.length > 0) {
                r.message.forEach(row => {
                    let child = frm.add_child(child_table_field);
                    child.questions = row.name;
                });
                frm.refresh_field(child_table_field);
            }
        }
    });
}

//==================================================
// Auto-set Inspected By
//==================================================
frappe.ui.form.on("Inspection Demo", {
    onload: function(frm) {
        const inspectedFields = [
            "inspected_by", "inspected_byy", "inspected_byyy", "inspected_byyyy",
            "direct_inspected_byyyyyyy", "direct_inspected_byyyyyyyy"
        ];
        inspectedFields.forEach(field => {
            if (!frm.doc[field]) {
                frm.set_value(field, frappe.session.user);
            }
        });
    }
});

//==================================================
// Volume Calculation
//==================================================
let volumeDebounceTimer = null;
['l1', 'l2', 'b1', 'b2', 'h1', 'h2'].forEach(field => {
    frappe.ui.form.on('Inspection Demo', field, function(frm) {
        if (volumeDebounceTimer) clearTimeout(volumeDebounceTimer);
        volumeDebounceTimer = setTimeout(() => {
            const d = frm.doc;
            ['l2', 'b2', 'h2'].forEach(f => {
                if ((d[f] || 0) > 12) {
                    frappe.show_alert({ message: __(f.toUpperCase() + ' must be ≤ 12 inches'), indicator: 'red' }, 5);
                    frm.set_value(f, 0);
                    return;
                }
            });
            const L = (d.l1 || 0) + ((d.l2 || 0) / 12);
            const B = (d.b1 || 0) + ((d.b2 || 0) / 12);
            const H = (d.h1 || 0) + ((d.h2 || 0) / 12);
            frm.set_value('volume', (L > 0 && B > 0 && H > 0) ? parseFloat((L * B * H).toFixed(3)) : 0.0);
        }, 300);
    });
});

// ================================
// AUTO-REDIRECT TO EXISTING INSPECTION
// ================================
function get_full_method_name(short_name) {
    const module_name = frappe.boot.doctype_module["Inspection Demo"];
    const app_name = frappe.boot.module_app[module_name];
    return `${app_name}.${frappe.scrub(module_name)}.${short_name}`;
}

frappe.ui.form.on('Inspection Demo', {
    block_number: function(frm) {
        if (!frm.is_new() || !frm.doc.block_number) return;
        frappe.call({
            method: get_full_method_name('get_existing_inspection_for_block'),
            args: { block_number: frm.doc.block_number },
            callback: function(r) {
                if (r.message) {
                    frappe.show_alert({
                        message: __("Block Inspection already exists. Opening existing record..."),
                        indicator: 'blue'
                    }, 3);
                    setTimeout(() => frappe.set_route('Form', 'Inspection Demo', r.message), 400);
                }
            }
        });
    },
    stone_number: function(frm) {
        if (!frm.is_new() || !frm.doc.stone_number) return;
        frappe.call({
            method: get_full_method_name('get_existing_inspection_for_stone'),
            args: { stone_number: frm.doc.stone_number, inspection_type: "Pre Carving" },
            callback: function(r) {
                if (r.message) {
                    frappe.show_alert({
                        message: __("Pre Carving Inspection already exists. Opening existing record..."),
                        indicator: 'blue'
                    }, 3);
                    setTimeout(() => frappe.set_route('Form', 'Inspection Demo', r.message), 400);
                }
            }
        });
    },
    stone_numberr: function(frm) {
        if (!frm.is_new() || !frm.doc.stone_numberr) return;
        frappe.call({
            method: get_full_method_name('get_existing_inspection_for_stone'),
            args: { stone_number: frm.doc.stone_numberr, inspection_type: "Post Carving" },
            callback: function(r) {
                if (r.message) {
                    frappe.show_alert({
                        message: __("Post Carving Inspection already exists. Opening existing record..."),
                        indicator: 'blue'
                    }, 3);
                    setTimeout(() => frappe.set_route('Form', 'Inspection Demo', r.message), 400);
                }
            }
        });
    },
    stone_numberrrr: function(frm) {
        if (!frm.is_new() || !frm.doc.stone_numberrrr) return;
        frappe.call({
            method: get_full_method_name('get_existing_inspection_for_stone'),
            args: { stone_number: frm.doc.stone_numberrrr, inspection_type: "Post Polishing" },
            callback: function(r) {
                if (r.message) {
                    frappe.show_alert({
                        message: __("Post Polishing Inspection already exists. Opening existing record..."),
                        indicator: 'blue'
                    }, 3);
                    setTimeout(() => frappe.set_route('Form', 'Inspection Demo', r.message), 400);
                }
            }
        });
    }
});


// ======================================================================
// Rejection auto-create helper + Status handlers
// ======================================================================
(function() {
    const STATUS_FIELD_MAP = {
        "status": {
            inspection_type_field: "inspection_type",
            number_field: "block_number",
            site_field: "current_site",
            date_field: "inspection_date",
            inspected_by_field: "inspected_by",
            from_status_field: "status"
        },
        "statuss": {
            inspection_type_field: "inspection_typee",
            number_field: "stone_number",
            site_field: "current_sitee",
            date_field: "inspection_datee",
            inspected_by_field: "inspected_byy",
            from_status_field: "statuss"
        },
        "statusss": {
            inspection_type_field: "inspection_typeee",
            number_field: "stone_numberr",
            site_field: "current_siteee",
            date_field: "inspection_dateee",
            inspected_by_field: "inspected_byyy",
            from_status_field: "statusss"
        },
        "statussss": {
            inspection_type_field: "inspection_typeeee",
            number_field: "stone_numberrrr",
            site_field: "current_siteeee",
            date_field: "inspection_dateeee",
            inspected_by_field: "inspected_byyyy",
            from_status_field: "statussss"
        },
        "statussssss": { // direct post carving
            inspection_type_field: "direct_inspection_typeeeeeee",
            number_field: "direct_stone_numberrrrrrrr",
            site_field: "direct_current_siteeeeeeee",
            date_field: "direct_inspection_dateeeeeee",
            inspected_by_field: "direct_inspected_byyyyyyy",
            from_status_field: "statussssss"
        },
        "statusssssss": { // direct post polishing
            inspection_type_field: "direct_inspection_typeeeeeeee",
            number_field: "direct_stone_numberrrrrrrrrr",
            site_field: "direct_current_siteeeeeeeee",
            date_field: "direct_inspection_dateeeeeeee",
            inspected_by_field: "direct_inspected_byyyyyyyy",
            from_status_field: "statusssssss"
        }
    };

    function isRejectStatus(val) {
        if (!val) return false;
        return (String(val).toLowerCase().indexOf('reject') !== -1);
    }

    function handle_status_change(frm, fieldname) {
        try {
            const val = frm.doc[fieldname];
            if (!isRejectStatus(val)) {
                return;
            }

            const map = STATUS_FIELD_MAP[fieldname] || {};
            const inspection_type = frm.doc[map.inspection_type_field] || frm.doc.inspection_type || "";
            const number = frm.doc[map.number_field] || frm.doc.block_number || frm.doc.stone_number || "";
            const site = frm.doc[map.site_field] || frm.doc.current_site || "";
            const date = frm.doc[map.date_field] || frm.doc.inspection_date || "";
            const rejected_by = frm.doc[map.inspected_by_field] || frm.doc.inspected_by || frappe.session.user || "";
            const from_status = frm.doc[map.from_status_field] || frm.doc.status || frm.doc.statuss || frm.doc.statusss || frm.doc.statussss || frm.doc.statussssss || frm.doc.statusssssss || "";

            const payload = {
                inspection_demo: frm.doc.name,
                inspection_type: inspection_type,
                number: number,
                current_site: site,
                date: date,
                rejected_by: rejected_by,
                from_status: from_status,
                trigger_field: fieldname,
                trigger_value: val
            };

            frappe.call({
                method: "baps.baps.doctype.inspection_demo.inspection_demo.create_rejection_evaluation",
                args: { payload: payload },
                freeze: true,
                freeze_message: __("Creating Rejection Evaluation..."),
                callback: function(r) {
                    if (r && r.message && r.message.success) {
                        const name = r.message.name;
                        frappe.show_alert(__("Rejection request created: {0}", [name]), 5);
                        if (frm.fields_dict && frm.fields_dict["rejection_evaluation_reference"]) {
                            frm.set_value("rejection_evaluation_reference", name);
                            frm.save();
                        }
                    } else if (r && r.message && r.message.exists) {
                        frappe.show_alert(__("Rejection request already exists: {0}", [r.message.exists]), 5);
                    } else {
                        const err = (r && (r.exc || r.message && r.message.error)) ? (r.exc || r.message.error) : "";
                        frappe.show_alert({ message: __("Failed to create Rejection Evaluation. {0}", [err]), indicator: 'red' }, 8);
                    }
                }
            });

        } catch (err) {
            console.error("handle_status_change error", err);
        }
    }

    // helper: save & move workflow from "Under Inspection" → "Completed"
    function complete_workflow_if_under_inspection(frm) {
        if (frm.doc.workflow_state !== "Under Inspection") {
            console.log("Current workflow_state:", frm.doc.workflow_state);
            return;
        }

        frm.save().then((r) => {
            const doc_for_workflow = (r && r.doc) ? r.doc : frm.doc;

            frappe.call({
                method: "frappe.model.workflow.apply_workflow",
                args: {
                    doc: doc_for_workflow,
                    action: "Completed"   // must match Workflow Action name
                },
                callback: function(res) {
                    if (!res.exc) {
                        frm.reload_doc();   // refresh pill to show Completed
                    } else {
                        console.error("Workflow apply error:", res.exc);
                        frappe.msgprint(__("Error applying workflow transition 'Completed'."));
                    }
                }
            });
        });
    }

    // ONE unified set of status handlers
    frappe.ui.form.on('Inspection Demo', {
        // Block Inspection Status (Pass / Pass with alter size → workflow Completed)
        status: function(frm) {
            const val = frm.doc.status;

            // Only when Pass or Pass with alter size
            if (["Pass", "Pass with alter size"].includes(val)) {

                // Set inspection_status
                if (frm.doc.inspection_status !== "Completed") {
                    frm.set_value("inspection_status", "Completed");
                }

                frappe.show_alert({
                    message: __("Status is {0}. Marking workflow as Completed…", [val]),
                    indicator: 'green'
                }, 6);

                // Save, then apply workflow
                complete_workflow_if_under_inspection(frm);
            }

            // Keep your rejection logic
            handle_status_change(frm, 'status');
        },

        // Pre Carving status (Pass → Completed)
        statuss: function(frm) {
            const val = frm.doc.statuss;
            if (val === "Pass") {
                frm.set_value("inspection_status", "Completed");

                frappe.show_alert({
                    message: __("Inspection completed automatically."),
                    indicator: 'green'
                }, 6);

                complete_workflow_if_under_inspection(frm);
            }

            handle_status_change(frm, 'statuss');
        },

        // Post Carving status (Pass → Completed)
        statusss: function(frm) {
            const val = frm.doc.statusss;
            if (val === "Pass") {
                frm.set_value("inspection_status", "Completed");

                frappe.show_alert({
                    message: __("Inspection completed automatically."),
                    indicator: 'green'
                }, 6);

                complete_workflow_if_under_inspection(frm);
            }

            handle_status_change(frm, 'statusss');
        },

        // Post Polishing status (Pass → Completed)
        statussss: function(frm) {
            const val = frm.doc.statussss;
            if (val === "Pass") {
                frm.set_value("inspection_status", "Completed");

                frappe.show_alert({
                    message: __("Inspection completed automatically."),
                    indicator: 'green'
                }, 6);

                complete_workflow_if_under_inspection(frm);
            }

            handle_status_change(frm, 'statussss');
        },

        // Direct Post Carving (Pass → Completed)
        statussssss: function(frm) {
            const val = frm.doc.statussssss;
            if (val === "Pass") {
                frm.set_value("inspection_status", "Completed");

                frappe.show_alert({
                    message: __("Inspection completed automatically."),
                    indicator: 'green'
                }, 6);

                complete_workflow_if_under_inspection(frm);
            }

            handle_status_change(frm, 'statussssss');
        },

        // Direct Post Polishing (Pass → Completed)
        statusssssss: function(frm) {
            const val = frm.doc.statusssssss;
            if (val === "Pass") {
                frm.set_value("inspection_status", "Completed");

                frappe.show_alert({
                    message: __("Inspection completed automatically."),
                    indicator: 'green'
                }, 6);

                complete_workflow_if_under_inspection(frm);
            }

            handle_status_change(frm, 'statusssssss');
        }
    });

})();

