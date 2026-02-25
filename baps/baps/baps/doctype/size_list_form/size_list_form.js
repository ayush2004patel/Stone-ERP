// Size List - Basic Functionality
// Essential business logic only, no workflow

// Helper function to get current workflow state
function get_workflow_state(frm) {
    // Check both workflow_state (Frappe workflow) and workflow_status (custom field)
    return frm.doc.workflow_state || get_workflow_state(frm) || frm.doc.__wf || '';
}


// MAIN PART AND SUB PART FILTER VALIDATION AND CONFIRMATION
// -------------------------------------------------------

let previous_main_part = null;
let previous_sub_part = null;

frappe.ui.form.on("Size List Form", {
    onload(frm) {
        // Save initial values
        previous_main_part = frm.doc.main_part;
        previous_sub_part = frm.doc.sub_part;
    },

    refresh(frm) {
        // Update previous values after every refresh
        previous_main_part = frm.doc.main_part;
        previous_sub_part = frm.doc.sub_part;
    },

    main_part(frm) {
        handle_main_or_sub_part_change(frm, "main_part");
    },

    sub_part(frm) {
        handle_main_or_sub_part_change(frm, "sub_part");
    }
});

function handle_main_or_sub_part_change(frm, changed_field) {
    const new_main = frm.doc.main_part;
    const new_sub = frm.doc.sub_part;

    // ✅ CASE 1: User cleared Main Part (blank)
    if (changed_field === "main_part" && !new_main) {
        frappe.confirm(
            "You removed the Main Part. This will clear all related data.<br><br><b>Do you want to proceed?</b>",
            () => {
                // ✅ User clicked Yes → clear sub part and stone details
                frm.set_value("sub_part", "");
                frm.clear_table("stone_details");
                frm.refresh_field("stone_details");
                frappe.show_alert({
                    message: "Main Part removed. Sub Part and Stone Details cleared.",
                    indicator: "orange"
                });
                previous_main_part = null;
                previous_sub_part = null;
            },
            () => {
                // ❌ User clicked No → restore old values silently
                frappe.run_serially([
                    () => frm.set_value("main_part", previous_main_part),
                    () => frm.set_value("sub_part", previous_sub_part)
                ]);
            }
        );
        return;
    }

    // ✅ CASE 2: Normal change (user selected another Main/Sub Part)
    if (frm.doc.stone_details && frm.doc.stone_details.length > 0) {
        frappe.confirm(
            "You changed the Main Part or Sub Part. " +
            "Existing Stone Details may no longer be valid.<br><br>" +
            "<b>Do you want to clear all Stone Details?</b>",
            () => {
                // ✅ Yes → clear the table
                frm.clear_table("stone_details");
                frm.refresh_field("stone_details");
                frappe.show_alert({
                    message: "Stone Details cleared due to Main/Sub Part change.",
                    indicator: "orange"
                });

                // Save new values as latest
                previous_main_part = new_main;
                previous_sub_part = new_sub;
            },
            () => {
                // ❌ No → restore old values silently
                frappe.run_serially([
                    () => frm.set_value("main_part", previous_main_part),
                    () => frm.set_value("sub_part", previous_sub_part)
                ]);
            }
        );
    } else {
        // ✅ No stone details → just update previous values
        previous_main_part = new_main;
        previous_sub_part = new_sub;
    }
}













// size_list.js — Robust row-checkbox ↔ verify-fields sync (Checker-only editable)
frappe.ui.form.on("Size List Form", {
    refresh(frm) {
        setup_row_checkbox_sync(frm);
    },
    onload_post_render(frm) {
        setup_row_checkbox_sync(frm);
    },
    stone_details_add(frm) {
        setTimeout(() => setup_row_checkbox_sync(frm), 200);
    },
    stone_details_remove(frm) {
        setTimeout(() => setup_row_checkbox_sync(frm), 200);
    }
});

function setup_row_checkbox_sync(frm) {
    const grid = frm.fields_dict?.stone_details?.grid;
    if (!grid) return;

    const allowed_role = "Size List Data Checker";
    const is_checker = frappe.user_roles && frappe.user_roles.includes(allowed_role);
    const is_admin = frappe.user_roles && frappe.user_roles.includes("Administrator");

    const verify_fields = [
        "stone_name_verified", "range_verified", "stone_code_verified",
        "l1_verified", "l2_verified", "b1_verified", "b2_verified",
        "h1_verified", "h2_verified"
    ];

    bind_all_grid_rows(frm, grid, verify_fields, is_checker || is_admin);

    try {
        if (typeof grid.on_grid_after_render === "function") {
            const orig = grid.on_grid_after_render.bind(grid);
            grid.on_grid_after_render = function () {
                orig();
                setTimeout(() => bind_all_grid_rows(frm, grid, verify_fields, is_checker || is_admin), 50);
            };
        }
    } catch (e) {}

    if (!grid._dup_sync_interval) {
        grid._dup_sync_interval = setInterval(() => {
            if (!frm.fields_dict || !frm.fields_dict.stone_details) {
                clearInterval(grid._dup_sync_interval);
                grid._dup_sync_interval = null;
                return;
            }
            bind_all_grid_rows(frm, grid, verify_fields, is_checker || is_admin);
        }, 2000);
    }
}

function bind_all_grid_rows(frm, grid, verify_fields, can_edit) {
    grid.wrapper.find(".grid-row").each(function () {
        const $domRow = $(this);
        const docname = $domRow.attr("data-name") || $domRow.attr("data-idx");
        if (!docname) return;

        const child = frm.doc.stone_details?.find(r => r.name === docname || String(r.idx) === String(docname));
        if (!child) return;

        let $checkbox = null;
        const selectors = [
            ".grid-row-check input[type='checkbox']",
            ".grid-check input[type='checkbox']",
            ".grid-checkbox input[type='checkbox']",
            "input[type='checkbox'].grid-row-checkbox",
            $domRow.find("input[type='checkbox']").filter(function () {
                return $(this).closest('.grid-row').length > 0;
            })
        ];
        for (let s of selectors) {
            const found = typeof s === "string" ? $domRow.find(s) : s;
            if (found?.length) { $checkbox = found.first(); break; }
        }
        if (!$checkbox?.length) return;

        // 🔹 Always reflect saved verify state (for all users)
        const all_checked = verify_fields.every(f => !!child[f]);
        if ($checkbox.prop("checked") !== all_checked) {
            $checkbox.prop("checked", all_checked);
        }

        // Only bind once
        if ($checkbox.data("_sync_bound")) return;
        $checkbox.data("_sync_bound", true);

        // Make read-only if not allowed
        if (!can_edit) {
            $checkbox.prop("disabled", true).css("cursor", "not-allowed");
            $checkbox.attr("title", "Only Checker can verify this row");
            return; // skip binding change handler
        }

        // Checker (or Admin) can toggle
        $checkbox.on("change", function () {
            const checked = $(this).is(":checked") ? 1 : 0;

            // 🔸 Update all verify fields in this row
            verify_fields.forEach(fn => {
                if (child.hasOwnProperty(fn) || child[fn] !== undefined) {
                    frappe.model.set_value(child.doctype, child.name, fn, checked);
                }
            });

            // 🔹 Also keep checkbox visually synced instantly
            $checkbox.prop("checked", !!checked);

            frappe.show_alert({
                message: checked ? `✅ Row verified (all checks)` : `❌ Row unverified (all checks cleared)`,
                indicator: checked ? "green" : "orange"
            });
        });

        // Reverse-sync (if all verify fields are manually checked)
        if (!grid._sync_model_poll) {
            grid._sync_model_poll = setInterval(() => {
                try {
                    grid.wrapper.find(".grid-row").each(function () {
                        const $r = $(this);
                        const rn = $r.attr("data-name") || $r.attr("data-idx");
                        const ch = frm.doc.stone_details?.find(x => x.name === rn || String(x.idx) === String(rn));
                        if (!ch) return;
                        const $cb = $r.find(".grid-row-check input[type='checkbox']").first();
                        if (!$cb.length) return;
                        const all_checked_now = verify_fields.every(f => !!ch[f]);
                        if ($cb.prop("checked") !== all_checked_now) {
                            $cb.prop("checked", all_checked_now);
                        }
                    });
                } catch {}
            }, 600);
        }
    });
}

//remove delete button from child table for checker role
frappe.ui.form.on("Size List Form", {
    refresh(frm) {
        hide_child_table_buttons_for_role(frm, "stone_details");
        disable_popup_delete_button_for_checkers();
    }
});

frappe.ui.form.on('Size List Form', {
    setup: function(frm) {
        // Ensure prepared_by is set as early as possible for new documents
        setTimeout(() => {
            if (!frm.doc.prepared_by && frappe.session.user && frm.is_new()) {
                frm.set_value('prepared_by', frappe.session.user);
            }
        }, 100);
    },
    
    refresh: function(frm) {
        const workflow_state = get_workflow_state(frm);
        
        // Setup Sub Part query filter based on Main Part
        setup_sub_part_query(frm);
        
        // Hide Duplicate Row button from child table
        hide_duplicate_row_button(frm);
        
        // Setup stone_name query filter based on main_part and sub_part
        setup_stone_name_query_for_all_rows(frm);
        
        // Setup field permissions based on verification status
        setup_field_permissions(frm);
        
        // Setup child table verification columns
        hide_child_verification_columns(frm);
        
        // Control child table "Add Row" button visibility
        control_child_table_add_button(frm);
        
        // Lock header fields if child rows exist
        lock_header_fields_if_children_exist(frm);

        // Lock stone_name only in rows that already have values
        lock_child_stone_name_if_already_set(frm);
        
        // Setup child table row permissions based on verification
        setup_child_row_verification_permissions(frm);
        
        // Check for duplicates and highlight rows (especially important for Under Rechange status)
        setTimeout(() => {
            // Apply duplicate highlighting
            apply_duplicate_highlighting(frm);
            
            // Then do full duplicate check
            check_and_highlight_all_duplicate_rows(frm);
        }, 1000);
        
        // Auto-uncheck range verification for duplicate rows when in Under Rechange
        if (workflow_state === 'Under Rechange') {
            auto_uncheck_range_verification_for_duplicates(frm);
        }
        
        // Set default values for new forms
        if (frm.is_new()) {
            // Set Polishing and Carving to checked by default
            if (!frm.doc.polishing) {
                frm.set_value('polishing', 1);
            }
            if (!frm.doc.carving) {
                frm.set_value('carving', 1);
            }
            
            // Auto-fill Prepared By with current logged-in user
            console.log('Setting prepared_by for new form:', frappe.session.user);
            if (!frm.doc.prepared_by) {
                frm.set_value('prepared_by', frappe.session.user);
            }
        }
        
        // Always ensure prepared_by is set for Data Entry Operators (more aggressive approach)
        if (!frm.doc.prepared_by) {
            console.log('Refresh - prepared_by is empty, setting to current user:', frappe.session.user);
            frm.set_value('prepared_by', frappe.session.user);
        }
        
        // Force refresh the field to ensure it displays
        frm.refresh_field('prepared_by');
    },
    
    // Event handlers for verification checkboxes - dynamically update field permissions
    baps_project_verified: function(frm) {
        update_field_by_verification(frm, 'baps_project', 'baps_project_verified');
    },
    
    stone_type_verified: function(frm) {
        update_field_by_verification(frm, 'stone_type', 'stone_type_verified');
    },
    
    main_part_verified: function(frm) {
        update_field_by_verification(frm, 'main_part', 'main_part_verified');
    },
    
    sub_part_verified: function(frm) {
        update_field_by_verification(frm, 'sub_part', 'sub_part_verified');
    },
    
    cutting_region_verified: function(frm) {
        update_field_by_verification(frm, 'cutting_region', 'cutting_region_verified');
    },
    
    polishing_verified: function(frm) {
        update_field_by_verification(frm, 'polishing', 'polishing_verified');
    },
    
    
    validate: function(frm) {
        // Validate only when moving to "Verified" status from "Under Verification"
        // Allow "Reject" action (Under Rechange/Under Recheck) even if fields are not verified
        const current_state = get_workflow_state(frm);
        const new_state = frm.doc.workflow_state;
        const is_data_checker = frappe.user_roles.includes('Size List Data Checker');
        
        // Check if trying to move to "Verified" status
        if (is_data_checker && current_state === 'Under Verification' && new_state === 'Verified') {
            const all_verified = validate_all_fields_verified(frm);
            if (!all_verified) {
                frappe.validated = false;
                frappe.throw('All fields must be verified (checkboxes checked) before approving to Verified status.');
                return false;
            }
        }
        
        // // Validate Main Part and Sub Part relationship
        // if (!frm.doc.main_part && frm.doc.sub_part) {
        //     frappe.throw("You cannot add a Sub Part without selecting a Main Part.");
        // }
        
        // // Validate that child rows exist only when Main Part and Sub Part are selected
        // if (frm.doc.stone_details && frm.doc.stone_details.length > 0) {
        //     if (!frm.doc.main_part || !frm.doc.sub_part) {
        //         frappe.throw("Cannot save Stone Details without Main Part and Sub Part. Please select both or remove all Stone Details rows.");
        //     }
        // }
    },
    
    before_workflow_action: function(frm) {
        // Get the current workflow state and user role
        const current_state = get_workflow_state(frm);
        const is_data_checker = frappe.user_roles.includes('Size List Data Checker');
        
        // Only validate when trying to verify from "Under Verification" status
        if (current_state === 'Under Verification' && is_data_checker) {
            // We need to determine if this is a "Verify" or "Reject" action
            // Since we can't easily detect the action here, we'll rely on server-side validation
           
        }
        
        return true;  // Allow the action and rely on server-side validation
    },
    
    onload: function(frm) {
        // Setup Sub Part query filter based on Main Part
        setup_sub_part_query(frm);
        
        // Setup field permissions based on verification status
        setup_field_permissions(frm);
        
        // Setup child table verification columns
        hide_child_verification_columns(frm);
        
        // Control child table "Add Row" button visibility
        control_child_table_add_button(frm);
        
        // Lock header fields if child rows exist
        lock_header_fields_if_children_exist(frm);
        
        // Override workflow button clicks to validate before "Verify" action
        setup_workflow_validation(frm);
        
        // Set default values for new forms
        if (frm.is_new()) {
            // Set Polishing and Carving to checked by default
            if (!frm.doc.polishing) {
                frm.set_value('polishing', 1);
            }
            if (!frm.doc.carving) {
                frm.set_value('carving', 1);
            }
            
            // Auto-fill Prepared By with current logged-in user
            if (!frm.doc.prepared_by) {
                frm.set_value('prepared_by', frappe.session.user);
            }
        }
        
        // Always ensure prepared_by is set (more aggressive approach)
        if (!frm.doc.prepared_by) {
            frm.set_value('prepared_by', frappe.session.user);
        }
        
        // Force refresh the field to ensure it displays
        frm.refresh_field('prepared_by');
        
        // Ensure duplicate_flag visibility for all existing rows
        if (frm.doc.stone_details) {
            frm.doc.stone_details.forEach(row => {
                update_duplicate_flag_visibility(frm, row.doctype, row.name);
            });
        }
    },
    
    // Verification field events - control field editability
    form_number_verified: function(frm) {
        control_field_editability(frm, 'form_number', frm.doc.form_number_verified);
    },
    
    baps_project_verified: function(frm) {
        control_field_editability(frm, 'baps_project', frm.doc.baps_project_verified);
    },
    
    prep_date_verified: function(frm) {
        control_field_editability(frm, 'prep_date', frm.doc.prep_date_verified);
    },
    
    stone_type_verified: function(frm) {
        control_field_editability(frm, 'stone_type', frm.doc.stone_type_verified);
    },
    
    main_part_verified: function(frm) {
        control_field_editability(frm, 'main_part', frm.doc.main_part_verified);
    },
    
    sub_part_verified: function(frm) {
        control_field_editability(frm, 'sub_part', frm.doc.sub_part_verified);
    },
    
    cutting_region_verified: function(frm) {
        control_field_editability(frm, 'cutting_region', frm.doc.cutting_region_verified);
    },
    
    polishing_verified: function(frm) {
        control_field_editability(frm, 'polishing', frm.doc.polishing_verified);
    },
    
    // BAPS Project handler
    baps_project: function(frm) {
        if (frm.doc.baps_project) {
            load_project_flags(frm);
            // Check for duplicates when project changes
            check_for_duplicates(frm);
        } else {
            frm._project_flags = { chemical: 0, dry_fitting: 0, polishing: 1, carving: 1 };
            // Clear the process flags when project is cleared (except polishing and carving which stay checked)
            frm.set_value('chemical', 0);
            frm.set_value('dry_fitting', 0);
            frm.set_value('polishing', 1);  // Keep checked by default
            frm.set_value('carving', 1);    // Keep checked by default
            set_child_grid_readonly(frm);
            // Clear any duplicate warnings
            frm.dashboard.clear_comment();
        }
    },
    
    // Main Part and Sub Part handlers
    // main_part: function(frm) {
    //     // If main_part is cleared, clear sub_part and all child rows
    //     if (!frm.doc.main_part) {
    //         frm.set_value('sub_part', '');
            
    //         // Clear all child table rows when main_part is cleared
    //         if (frm.doc.stone_details && frm.doc.stone_details.length > 0) {
    //             frappe.confirm(
    //                 'Clearing Main Part will remove all Stone Details rows. Do you want to continue?',
    //                 function() {
    //                     // User confirmed - clear all rows
    //                     frm.clear_table('stone_details');
    //                     frm.refresh_field('stone_details');
    //                 },
    //                 function() {
    //                     // User cancelled - restore the previous main_part value if available
    //                     // This prevents the field from being cleared
    //                     frm.reload_doc();
    //                 }
    //             );
    //         }
    //     }
        
    //     // Setup Sub Part query filter
    //     setup_sub_part_query(frm);

    //     // clear sub_part if mismatch
    //     if (frm.doc.sub_part) {
    //         frappe.db.get_value("Sub Part", frm.doc.sub_part, "main_part", function(r) {
    //             if (r && r.main_part !== frm.doc.main_part) {
    //                 frm.set_value("sub_part", null);
    //             }
    //         });
    //     }
        
    //     // Update stone_name query filter
    //     setup_stone_name_query_for_all_rows(frm);
        
    //     // Check for duplicates when main part changes
    //     check_for_duplicates(frm);
    // },
    
    // sub_part: function(frm) {
    //     // First, validate that sub_part belongs to the selected main_part
    //     if (frm.doc.sub_part && frm.doc.main_part) {
    //         frappe.db.get_value("Sub Part", frm.doc.sub_part, "main_part", function(r) {
    //             if (r && r.main_part !== frm.doc.main_part) {
    //                 // Sub Part doesn't match Main Part
    //                 frappe.msgprint({
    //                     title: 'Invalid Sub Part',
    //                     message: `The selected Sub Part "${frm.doc.sub_part}" does not belong to Main Part "${frm.doc.main_part}". Please select a valid Sub Part.`,
    //                     indicator: 'red'
    //                 });
                    
    //                 // Clear sub_part and child rows
    //                 frm.set_value('sub_part', '');
    //                 if (frm.doc.stone_details && frm.doc.stone_details.length > 0) {
    //                     frm.clear_table('stone_details');
    //                     frm.refresh_field('stone_details');
    //                 }
    //                 return;
    //             }
    //         });
    //     }
        
    //     // If sub_part is cleared, clear all child rows
    //     if (!frm.doc.sub_part) {
    //         // Clear all child table rows when sub_part is cleared
    //         if (frm.doc.stone_details && frm.doc.stone_details.length > 0) {
    //             frappe.confirm(
    //                 'Clearing Sub Part will remove all Stone Details rows. Do you want to continue?',
    //                 function() {
    //                     // User confirmed - clear all rows
    //                     frm.clear_table('stone_details');
    //                     frm.refresh_field('stone_details');
    //                 },
    //                 function() {
    //                     // User cancelled - restore the previous sub_part value
    //                     frm.reload_doc();
    //                 }
    //             );
    //         }
    //     } else if (frm.doc.stone_details && frm.doc.stone_details.length > 0) {
    //         // Sub part is being changed (not just cleared) and child rows exist
    //         // Clear child rows with confirmation
    //         frappe.confirm(
    //             'Changing Sub Part will remove all existing Stone Details rows. Do you want to continue?',
    //             function() {
    //                 // User confirmed - clear all rows
    //                 frm.clear_table('stone_details');
    //                 frm.refresh_field('stone_details');
    //             },
    //             function() {
    //                 // User cancelled - restore the previous sub_part value
    //                 frm.reload_doc();
    //             }
    //         );
    //     }
        
    //     // Update stone_name query filter
    //     setup_stone_name_query_for_all_rows(frm);
        
    //     // Check for duplicates when sub part changes
    //     check_for_duplicates(frm);
    // },
    
    // stone_type: function(frm) {
    //     // Check for duplicates when stone type changes
    //     check_for_duplicates(frm);
    // },
    
    // cutting_region: function(frm) {
    //     // Check for duplicates when cutting region changes
    //     check_for_duplicates(frm);
    // },
    
    // // Stone details add handler
    // stone_details_add: function(frm, cdt, cdn) {
    //     // Validate that Main Part and Sub Part are selected before adding rows
    //     if (!frm.doc.main_part || !frm.doc.sub_part) {
    //         // Remove the newly added row
    //         const row = locals[cdt][cdn];
    //         frm.get_field('stone_details').grid.grid_rows_by_docname[cdn].remove();
            
    //         frappe.msgprint({
    //             title: 'Cannot Add Row',
    //             message: 'Please select both Main Part and Sub Part before adding Stone Details.',
    //             indicator: 'red'
    //         });
    //         return false;
    //     }
        
    //     // Note: chemical, dry_fitting, polishing are parent-level fields
    //     // They are set on the Size List form, not on individual stone rows
        
    //     // Lock header fields after first child row is added
    //     lock_header_fields_if_children_exist(frm);
    // }
});

// Child table events
frappe.ui.form.on('Size List Details', {
    // Before grid row opens for editing
    before_stone_details_edit: function(frm, cdt, cdn) {
        setup_child_row_permissions(frm, cdt, cdn);
        
        // Control Show Duplicates button visibility
        control_show_duplicates_button_visibility(frm, cdt, cdn);
    },
    
    // Form render event to setup row-level permissions
    form_render: function(frm, cdt, cdn) {
        setup_child_row_permissions(frm, cdt, cdn);
        
        // Setup stone_name query to prevent duplicates
        setup_stone_name_query(frm, cdt, cdn);
        
        // Control Show Duplicates button visibility
        control_show_duplicates_button_visibility(frm, cdt, cdn);
    },
    
    // Before row is displayed - setup query
    stone_details_add: function(frm, cdt, cdn) {
        setup_stone_name_query(frm, cdt, cdn);
        
        // For new rows in Under Rechange/Recheck, ensure fields are editable
        const row = locals[cdt][cdn];
        const is_under_rechange = get_workflow_state(frm) === 'Under Rechange';
        const is_under_recheck = get_workflow_state(frm) === 'Under Recheck';
        const is_data_operator = frappe.user_roles.includes('Size List Data Entry Operator');
        
        if (is_data_operator && (is_under_rechange || is_under_recheck)) {
            // For new empty rows, make sure all fields are editable
            setTimeout(() => {
                const row_wrapper = frm.fields_dict.stone_details?.grid?.grid_rows_by_docname[cdn];
                if (row_wrapper && !row.stone_name) {
                    const fields = ['stone_name', 'stone_code', 'range', 'l1', 'l2', 'b1', 'b2', 'h1', 'h2'];
                    fields.forEach(field => {
                        const field_wrapper = row_wrapper.get_field(field);
                        if (field_wrapper && field_wrapper.$input) {
                            field_wrapper.$input.prop('readonly', false);
                            field_wrapper.$input.prop('disabled', false);
                            field_wrapper.$input.css('background-color', '');
                            field_wrapper.$input.css('cursor', 'text');
                        }
                    });
                }
            }, 100);
        }
    },
    
    // Verification checkbox events for child table
    stone_name_verified: function(frm, cdt, cdn) {
        control_child_field_editability(frm, cdt, cdn, 'stone_name', locals[cdt][cdn].stone_name_verified);
        control_range_verification_access(frm, cdt, cdn);
    },
    
    stone_code_verified: function(frm, cdt, cdn) {
        control_child_field_editability(frm, cdt, cdn, 'stone_code', locals[cdt][cdn].stone_code_verified);
        control_range_verification_access(frm, cdt, cdn);
    },
    
    range_verified: function(frm, cdt, cdn) {
        const row = locals[cdt][cdn];
        
        // Check if user is trying to check range_verified
        if (row.range_verified == 1) {
           
            
            const unchecked_fields = required_verifications.filter(field => !row[field]);
            
            if (unchecked_fields.length > 0) {
                // Uncheck range_verified and show message
                frappe.model.set_value(cdt, cdn, 'range_verified', 0);
                
                const field_labels = {
                    'stone_name_verified': 'Stone Name',
                    'stone_code_verified': 'Stone Code',
                    'l1_verified': 'L1',
                    'l2_verified': 'L2', 
                    'b1_verified': 'B1',
                    'b2_verified': 'B2',
                    'h1_verified': 'H1',
                    'h2_verified': 'H2'
                };
                
                const missing_labels = unchecked_fields.map(field => field_labels[field]).join(', ');
                
                // frappe.msgprint({
                //     title: 'Range Verification Not Allowed',
                //     message: `Please verify all other fields first before verifying Range.<br><br><strong>Pending verifications:</strong> ${missing_labels}`,
                //     indicator: 'red'
                // });
                
                return;
            }
        }
        
        // control_child_field_editability(frm, cdt, cdn, 'range', locals[cdt][cdn].range_verified);
    },
    
    // Show Duplicates button event
    show_duplicates: function(frm, cdt, cdn) {
        show_duplicate_records(frm, cdt, cdn);
    },
    
    // Essential data field events only
    stone_name: function(frm, cdt, cdn) {
        calculate_volume(frm, cdt, cdn);
        
        // No duplicate checking during data entry - only during verification action
    },
    
    stone_code: function(frm, cdt, cdn) {
        calculate_volume(frm, cdt, cdn);
        
        // No duplicate checking during data entry - only during verification action
    },
    
    range: function(frm, cdt, cdn) {
        // No duplicate checking during data entry - only during verification action
    },
    
    l1: function(frm, cdt, cdn) {
        calculate_volume(frm, cdt, cdn);
    },
    
    l2: function(frm, cdt, cdn) {
        calculate_volume(frm, cdt, cdn);
    },
    
    b1: function(frm, cdt, cdn) {
        calculate_volume(frm, cdt, cdn);
    },
    
    b2: function(frm, cdt, cdn) {
        calculate_volume(frm, cdt, cdn);
    },
    
    h1: function(frm, cdt, cdn) {
        calculate_volume(frm, cdt, cdn);
    },
    
    h2: function(frm, cdt, cdn) {
        calculate_volume(frm, cdt, cdn);
    },
    
    start_stone_no: function(frm, cdt, cdn) {
        validate_number_range(frm, cdt, cdn);
        calculate_volume(frm, cdt, cdn);
    },
    
    end_stone_no: function(frm, cdt, cdn) {
        validate_number_range(frm, cdt, cdn);
        calculate_volume(frm, cdt, cdn);
    },
    
    group_of_stones: function(frm, cdt, cdn) {
        calculate_volume(frm, cdt, cdn);
    },
    
    size_list_details_remove: function(frm) {
        calculate_total_volume(frm);
        
        // Check if all child rows have been removed
        if (!frm.doc.stone_details || frm.doc.stone_details.length === 0) {
            // All rows removed - clear Main Part and Sub Part with confirmation
            if (frm.doc.main_part || frm.doc.sub_part) {
                frappe.confirm(
                    'All Stone Details rows have been removed. Do you want to clear Main Part and Sub Part as well?',
                    function() {
                        // User confirmed - clear Main Part and Sub Part
                        frm.set_value('main_part', '');
                        frm.set_value('sub_part', '');
                        frappe.show_alert({
                            message: 'Main Part and Sub Part have been cleared',
                            indicator: 'green'
                        });
                    },
                    function() {
                        // User cancelled - keep Main Part and Sub Part
                        frappe.show_alert({
                            message: 'Main Part and Sub Part kept unchanged',
                            indicator: 'blue'
                        });
                    }
                );
            }
        }
        
        // Check if fields should be unlocked after row removal
        lock_header_fields_if_children_exist(frm);
    },

   });



function calculate_volume(frm, cdt, cdn) {
    let row = locals[cdt][cdn];

    if (row) {
        // Validate inches
        if ((row.l2 || 0) > 12) {
            frappe.msgprint(__("L2 (inches) cannot be greater than 12"));
            frappe.model.set_value(cdt, cdn, "l2", 0);
            frappe.validated = false;
        }
        if ((row.b2 || 0) > 12) {
            frappe.msgprint(__("B2 (inches) cannot be greater than 12"));
            frappe.model.set_value(cdt, cdn, "b2", 0);
            frappe.validated = false;
        }
        if ((row.h2 || 0) > 12) {
            frappe.msgprint(__("H2 (inches) cannot be greater than 12"));
            frappe.model.set_value(cdt, cdn, "h2", 0);
            frappe.validated = false;
        }

        // Calculate only if all are valid
        if ((row.l2 || 0) <= 12 && (row.b2 || 0) <= 12 && (row.h2 || 0) <= 12) {
            let l = (row.l1 || 0) + (row.l2 || 0) / 12;
            let b = (row.b1 || 0) + (row.b2 || 0) / 12;
            let h = (row.h1 || 0) + (row.h2 || 0) / 12;

            row.volume = Math.round(l * b * h * 1000) / 1000;
            calculate_total_volume(frm);
        }

        frm.refresh_field('stone_details');
    }
}


function calculate_total_volume(frm) {
    let total = 0;
    if (frm.doc.stone_details) {
        frm.doc.stone_details.forEach(row => {
            total += (row.volume || 0);
        });
    }
    frm.set_value('total_volume', Math.round(total * 1000) / 1000);
}

function validate_number_range(frm, cdt, cdn) {
    let row = locals[cdt][cdn];
    if (row && row.start_stone_no && row.end_stone_no) {
        if (parseInt(row.start_stone_no) > parseInt(row.end_stone_no)) {
            frappe.msgprint("Start stone number should be less than or equal to end stone number");
            frappe.model.set_value(cdt, cdn, 'end_stone_no', '');
        }
    }
}

// Field permission control functions
function setup_field_permissions(frm) {
    // Check user roles
    const is_data_operator = frappe.user_roles.includes('Size List Data Entry Operator');
    const is_data_checker = frappe.user_roles.includes('Size List Data Checker');
    const workflow_state = get_workflow_state(frm);
    const is_under_verification = workflow_state === 'Under Verification';
    const is_under_rechange = workflow_state === 'Under Rechange';
    const is_under_recheck = workflow_state === 'Under Recheck';
    const show_verification = is_under_rechange || is_under_recheck;


    // Main form field verification mapping
    const field_verification_map = {
        'form_number': 'form_number_verified',
        'baps_project': 'baps_project_verified',
        'prep_date': 'prep_date_verified',
        'stone_type': 'stone_type_verified',
        'main_part': 'main_part_verified',
        'sub_part': 'sub_part_verified',
        'cutting_region': 'cutting_region_verified',
        'polishing': 'polishing_verified'
    };
    
    // Fields to exclude for Data Entry Checker (no verification checkbox)
    const checker_excluded_fields = ['form_number', 'prep_date'];
    
    if (is_data_checker) {
        if (is_under_verification) {
            // Under Verification: Checkboxes editable, ALL header fields read-only
            Object.keys(field_verification_map).forEach(field => {
                const verification_field = field_verification_map[field];
                
                if (checker_excluded_fields.includes(field)) {
                    // Hide verification checkbox for form_number and prep_date
                    frm.set_df_property(verification_field, 'hidden', 1);
                    frm.set_df_property(field, 'read_only', 1);  // Read-only
                } else {
                    // Show verification checkbox (editable)
                    frm.set_df_property(verification_field, 'hidden', 0);
                    frm.set_df_property(verification_field, 'read_only', 0);  // Checkbox editable
                    // Make header field read-only for Data Checker
                    frm.set_df_property(field, 'read_only', 1);
                    frm.set_df_property(field, 'description', '');
                }
            });
            
        } else {
            // Other statuses: All fields read-only for Data Checker
            Object.keys(field_verification_map).forEach(field => {
                const verification_field = field_verification_map[field];
                
                if (checker_excluded_fields.includes(field)) {
                    // Hide verification checkbox for form_number and prep_date
                    frm.set_df_property(verification_field, 'hidden', 1);
                    frm.set_df_property(field, 'read_only', 1);
                    frm.set_df_property(field, 'description', '');
                } else {
                    // Show verification checkbox as read-only
                    frm.set_df_property(verification_field, 'hidden', 0);
                    frm.set_df_property(verification_field, 'read_only', 1);
                    // Make header field read-only
                    frm.set_df_property(field, 'read_only', 1);
                    frm.set_df_property(field, 'description', '');
                }
            });
        }
        
    } else if (is_data_operator) {
        // Data Entry Operator: Show verification only in "Under Rechange" or "Under Recheck"
        if (show_verification) {
            // Show verification fields and apply permissions
            Object.keys(field_verification_map).forEach(field => {
                const verification_field = field_verification_map[field];
                const is_verified = frm.doc[verification_field];
                
                // Show verification checkbox but ALWAYS make it read-only for operator
                frm.set_df_property(verification_field, 'hidden', 0);
                frm.set_df_property(verification_field, 'read_only', 1);  // Operator cannot change checkboxes
                
                // Control field editability based on verification status
                control_field_editability(frm, field, is_verified);
            });
            
        } else {
            // Hide verification fields for other statuses
            Object.values(field_verification_map).forEach(verification_field => {
                frm.set_df_property(verification_field, 'hidden', 1);
            });
            
            // Make all fields editable when verification is not applicable
            Object.keys(field_verification_map).forEach(field => {
                frm.set_df_property(field, 'read_only', 0);
                frm.set_df_property(field, 'description', '');
            });
            
        }
    } else {
        // For other roles, always hide verification fields
        Object.values(field_verification_map).forEach(verification_field => {
            frm.set_df_property(verification_field, 'hidden', 1);
        });
    }
}

function control_field_editability(frm, field_name, is_verified) {
    // Check if user is Data Checker
    const is_data_checker = frappe.user_roles.includes('Size List Data Checker');
    const workflow_state = get_workflow_state(frm);
    const is_under_verification = workflow_state === 'Under Verification';
    
    // For Data Checker: ALWAYS keep fields read-only
    if (is_data_checker && is_under_verification) {
        frm.set_df_property(field_name, 'read_only', 1);
        frm.set_df_property(field_name, 'description', '');
        frm.refresh_field(field_name);
        return;
    }
    
    // For other roles: Control field editability based on verification status
    if (is_verified) {
        // Field is verified (ticked) - make read-only
        frm.set_df_property(field_name, 'read_only', 1);
        frm.set_df_property(field_name, 'description', '');
    } else {
        // Field is not verified (not ticked) - make editable
        frm.set_df_property(field_name, 'read_only', 0);
        frm.set_df_property(field_name, 'description', '');
    }
    frm.refresh_field(field_name);
}

function setup_child_row_permissions(frm, cdt, cdn) {
    const is_data_operator = frappe.user_roles.includes('Size List Data Entry Operator');
    const is_data_checker = frappe.user_roles.includes('Size List Data Checker');
    const is_under_verification = get_workflow_state(frm) === 'Under Verification';
    const is_under_rechange = get_workflow_state(frm) === 'Under Rechange';
    const is_under_recheck = get_workflow_state(frm) === 'Under Recheck';
    const show_verification = is_under_rechange || is_under_recheck;
    
    
    // Child table field verification mapping
    const child_field_verification_map = {
        'stone_name': 'stone_name_verified',
        'stone_code': 'stone_code_verified',
        'range': 'range_verified',
        'l1': 'l1_verified',
        'l2': 'l2_verified',
        'b1': 'b1_verified',
        'b2': 'b2_verified',
        'h1': 'h1_verified',
        'h2': 'h2_verified'
    };
    
    // Get the row wrapper for direct field manipulation
    const row_wrapper = frm.fields_dict.stone_details?.grid?.grid_rows_by_docname[cdn];
    
    if (is_data_checker && is_under_verification) {
        // Data Checker in Under Verification: Make ALL data fields READ-ONLY
        
        // Use setTimeout to ensure the dialog is fully rendered
        setTimeout(() => {
            if (row_wrapper) {
                Object.keys(child_field_verification_map).forEach(field => {
                    const field_wrapper = row_wrapper.get_field(field);
                    if (field_wrapper) {
                        // Make data field read-only
                        field_wrapper.df.read_only = 1;
                        if (field_wrapper.$input) {
                            field_wrapper.$input.prop('readonly', true);
                            field_wrapper.$input.prop('disabled', true);
                            field_wrapper.$input.css('background-color', '#f5f5f5');
                            field_wrapper.$input.css('cursor', 'not-allowed');
                            //field_wrapper.$input.attr('title', 'Read-only during verification. Use checkbox to verify.');
                        }
                        // For link fields
                        if (field_wrapper.$input_wrapper) {
                            field_wrapper.$input_wrapper.find('.link-btn').hide();
                        }
                    }
                    
                    // Make verification checkbox editable
                    const verification_field = child_field_verification_map[field];
                    const verification_wrapper = row_wrapper.get_field(verification_field);
                    if (verification_wrapper) {
                        verification_wrapper.df.read_only = 0;
                        verification_wrapper.df.hidden = 0;
                    }
                });
            }
        }, 100);
        
    } else if (is_data_operator && show_verification) {
        const row = locals[cdt][cdn];
        
        // Apply permissions to each field in this row based on verification values
        Object.keys(child_field_verification_map).forEach(field => {
            const verification_field = child_field_verification_map[field];
            const is_verified = row[verification_field];
            control_child_field_editability(frm, cdt, cdn, field, is_verified);
        });
        
    } else {
        // Make all child fields editable for normal statuses
        if (row_wrapper) {
            Object.keys(child_field_verification_map).forEach(field => {
                const field_wrapper = row_wrapper.get_field(field);
                if (field_wrapper && field_wrapper.$input) {
                    field_wrapper.$input.prop('readonly', false);
                    field_wrapper.$input.css('background-color', '');
                    field_wrapper.$input.attr('title', '');
                }
            });
        }
    }
    
    // Always control range verification checkbox based on other verifications
    control_range_verification_access(frm, cdt, cdn);
}

// Control range verification checkbox - only enable when all other verifications are done
function control_range_verification_access(frm, cdt, cdn) {
    const row = locals[cdt][cdn];
    const row_wrapper = frm.fields_dict.stone_details?.grid?.grid_rows_by_docname[cdn];
    
    if (!row_wrapper) return;
    
    // Check if all other verification checkboxes are checked
    const required_verifications = [
        'stone_name_verified',
        'stone_code_verified',
        'range_verified',
        'l1_verified',
        'l2_verified', 
        'b1_verified',
        'b2_verified',
        'h1_verified',
        'h2_verified'
    ];
    
    const all_verified = required_verifications.every(field => row[field] == 1);
    const range_wrapper = row_wrapper.get_field('range_verified');
    

}

// Control Show Duplicates button visibility based on user roles and workflow state
function control_show_duplicates_button_visibility(frm, cdt, cdn) {
    const row_wrapper = frm.fields_dict.stone_details?.grid?.grid_rows_by_docname[cdn];
    if (!row_wrapper) return;
    
    // Check user roles and workflow state
    const is_data_entry_operator = frappe.user_roles.includes('Size List Data Entry Operator');
    const is_administrator = frappe.user_roles.includes('Administrator');
    const workflow_state = get_workflow_state(frm);
    const is_under_rechange = workflow_state === 'Under Rechange';
    
    // Button is visible only to Data Entry Operator when status is Under Rechange
    // OR to Administrator (always visible for admin for troubleshooting)
    const can_see_button = (is_data_entry_operator && is_under_rechange) || is_administrator;
    
    // Get the Show Duplicates button field
    const show_duplicates_wrapper = row_wrapper.get_field('show_duplicates');
    
    if (show_duplicates_wrapper) {
        if (can_see_button) {
            // Show button for authorized conditions
            show_duplicates_wrapper.df.hidden = 0;
            show_duplicates_wrapper.$wrapper.show();
        } else {
            // Hide button for other conditions
            show_duplicates_wrapper.df.hidden = 1;
            show_duplicates_wrapper.$wrapper.hide();
        }
        
        // Refresh the field to apply changes
        show_duplicates_wrapper.refresh();
    }
    

}

function control_child_field_editability(frm, cdt, cdn, field_name, is_verified) {
    // Only apply for Data Entry Operators in "Under Rechange" status
    const is_data_operator = frappe.user_roles.includes('Size List Data Entry Operator');
    const is_under_rechange = get_workflow_state(frm) === 'Under Rechange';
    
    if (is_data_operator && is_under_rechange) {
        const row_wrapper = frm.fields_dict.stone_details.grid.grid_rows_by_docname[cdn];
        
        if (row_wrapper) {
            const field_wrapper = row_wrapper.get_field(field_name);
            if (field_wrapper && field_wrapper.$input) {
                if (is_verified) {
                    // Field is verified (ticked) - make read-only
                    field_wrapper.$input.prop('readonly', true);
                    field_wrapper.$input.css('background-color', '#e9ecef');
                    field_wrapper.$input.attr('title', '✅ Verified - Read Only');
                } else {
                    // Field is not verified (not ticked) - make editable
                    field_wrapper.$input.prop('readonly', false);
                    field_wrapper.$input.css('background-color', '');
                    //field_wrapper.$input.attr('title', '⚠️ Not verified - You can edit this field');
                }
            } else {
            }
        } else {
        }
    }
}

// Load project flags from Baps Project
function load_project_flags(frm) {
    if (frm.doc.baps_project) {
        
        frappe.db.get_value('Baps Project', frm.doc.baps_project, ['chemical', 'dry_fitting', 'polishing'], function(r) {
            if (r) {
                frm._project_flags = {
                    chemical: r.chemical || 0,
                    dry_fitting: r.dry_fitting || 0,
                    polishing: r.polishing || 0,
                    carving: 0  // Carving is not in Baps Project, defaults to 0
                };
                
                
                // Set flags on the parent Size List form
                // These are parent-level fields, not child table fields
                frm.set_value('chemical', r.chemical || 0);
                frm.set_value('dry_fitting', r.dry_fitting || 0);
                // Polishing and Carving are ALWAYS checked by default (regardless of project settings)
                frm.set_value('polishing', 1);
                frm.set_value('carving', 1);
                
                set_child_grid_readonly(frm);
                
                
            } else {
                frm._project_flags = { chemical: 0, dry_fitting: 0, polishing: 0, carving: 0 };
                set_child_grid_readonly(frm);
            }
        });
    }
}

// Set child grid readonly based on project flags
function set_child_grid_readonly(frm) {
    
}

// ALWAYS hide child table verification columns
function hide_child_verification_columns(frm) {
    const is_data_operator = frappe.user_roles.includes('Size List Data Entry Operator');
    const is_data_checker = frappe.user_roles.includes('Size List Data Checker');
    const is_under_verification = get_workflow_state(frm) === 'Under Verification';
    const is_under_rechange = get_workflow_state(frm) === 'Under Rechange';
    const is_under_recheck = get_workflow_state(frm) === 'Under Recheck';
    const show_verification = is_under_rechange || is_under_recheck;
    
    const verification_fields = [
        'stone_name_verified',
        'stone_code_verified',
        'range_verified',
        'l1_verified',
        'l2_verified',
        'b1_verified',
        'b2_verified',
        'h1_verified',
        'h2_verified',
        'row_verified'
    ];
    
    const data_fields = [
        'stone_name',
        'stone_code',
        'range',
        'l1',
        'l2',
        'b1',
        'b2',
        'h1',
        'h2'
    ];
    
    // Get the grid field definition
    const grid = frm.fields_dict.stone_details;
    if (grid && grid.grid) {
        if (is_data_checker) {
            if (is_under_verification) {
                // Under Verification: Show verification checkboxes, make all data fields READ-ONLY
                
                // Show verification checkboxes, hide data fields as read-only
                verification_fields.forEach(fieldname => {
                    grid.grid.update_docfield_property(fieldname, 'hidden', 0);
                    grid.grid.update_docfield_property(fieldname, 'read_only', 0);
                });
                
                // Make all data fields READ-ONLY using grid method
                data_fields.forEach(fieldname => {
                    grid.grid.update_docfield_property(fieldname, 'read_only', 1);
                });
                
                // Also set at docfield level for initial render
                verification_fields.forEach(fieldname => {
                    const field = frappe.meta.get_docfield('Size List Details', fieldname, frm.doc.name);
                    if (field) {
                        field.hidden = 0;
                        field.read_only = 0;
                    }
                });
                
                data_fields.forEach(fieldname => {
                    const field = frappe.meta.get_docfield('Size List Details', fieldname, frm.doc.name);
                    if (field) {
                        field.read_only = 1;
                    }
                });
                
                
            } else {
                // Other statuses: Show all verification columns with normal behavior
                verification_fields.forEach(fieldname => {
                    const field = frappe.meta.get_docfield('Size List Details', fieldname, frm.doc.name);
                    if (field) {
                        field.hidden = 0;  // Show
                        field.read_only = 0;  // Editable
                    }
                });
            }
            
        } else if (is_data_operator && show_verification) {
            // Data Operator in correction mode: Show verification columns but make verified fields read-only
            verification_fields.forEach(fieldname => {
                const field = frappe.meta.get_docfield('Size List Details', fieldname, frm.doc.name);
                if (field) {
                    field.hidden = 0;  // Show verification checkboxes
                }
            });
            
            // For each row, make verified checkboxes and fields read-only
            if (frm.doc.stone_details && frm.doc.stone_details.length > 0) {
                frm.doc.stone_details.forEach(row => {
                    verification_fields.forEach((verification_field, index) => {
                        const data_field = data_fields[index];
                        const is_verified = row[verification_field];
                        
                        if (is_verified) {
                            // Make verification checkbox read-only
                            grid.grid.update_docfield_property(verification_field, 'read_only', 1, row.name);
                            // Make data field read-only
                            if (data_field) {
                                grid.grid.update_docfield_property(data_field, 'read_only', 1, row.name);
                            }
                        } else {
                            // Keep editable if not verified
                            grid.grid.update_docfield_property(verification_field, 'read_only', 0, row.name);
                            if (data_field) {
                                grid.grid.update_docfield_property(data_field, 'read_only', 0, row.name);
                            }
                        }
                    });
                });
            }
            
        } else if (is_data_operator && show_verification) {
            // Data Entry Operator in Under Rechange/Recheck: Show verification columns but make them read-only
            verification_fields.forEach(fieldname => {
                grid.grid.update_docfield_property(fieldname, 'hidden', 0);
                grid.grid.update_docfield_property(fieldname, 'read_only', 1); // Read-only for operator
                
                const field = frappe.meta.get_docfield('Size List Details', fieldname, frm.doc.name);
                if (field) {
                    field.hidden = 0;
                    field.read_only = 1;
                }
            });
            
            // Data fields should be editable for operators to make corrections
            data_fields.forEach(fieldname => {
                grid.grid.update_docfield_property(fieldname, 'read_only', 0);
                
                const field = frappe.meta.get_docfield('Size List Details', fieldname, frm.doc.name);
                if (field) {
                    field.read_only = 0;
                }
            });
        } else {
            // For all other cases: Hide verification columns
            verification_fields.forEach(fieldname => {
                const field = frappe.meta.get_docfield('Size List Details', fieldname, frm.doc.name);
                if (field) {
                    field.hidden = 1;  // Hide
                }
            });
        }
        
        // Refresh the grid to apply changes
        grid.grid.refresh();
        frm.refresh_field('stone_details');
    }
}

// Control "Add Row" button visibility in child table
function control_child_table_add_button(frm) {
    const is_data_operator = frappe.user_roles.includes('Size List Data Entry Operator');
    const is_project_manager = frappe.user_roles.includes('Size List Project Manager') || frappe.user_roles.includes('Project Manager');
    const is_admin = frappe.user_roles.includes('Administrator');
    
    const workflow_state = get_workflow_state(frm);
    const is_under_rechange = workflow_state === 'Under Rechange';
    const is_under_recheck = workflow_state === 'Under Recheck';
    const is_verified = workflow_state === 'Verified';
    const is_published = workflow_state === 'Published';
    
    const grid = frm.fields_dict.stone_details;
    
    if (grid && grid.grid) {
        let should_hide_buttons = false;
        
        if (is_data_operator) {
            // Data Entry Operator can add rows in normal mode and Under Rechange
            // But NOT in Under Recheck, Verified, or Published
            if (is_under_recheck || is_verified || is_published) {
                should_hide_buttons = true;
            } else {
                should_hide_buttons = false;
            }
        } else if (is_project_manager && !is_admin) {
            // Project Manager CANNOT add/delete rows when Verified or Published
            if (is_verified || is_published) {
                should_hide_buttons = true;
            } else {
                should_hide_buttons = false;
            }
        } else if (!is_admin) {
            // Other roles (like Checker) - ALWAYS hide buttons
            should_hide_buttons = true;
        } else {
            // Admin - Always allow
            should_hide_buttons = false;
        }
        
        // Apply the setting
        grid.grid.cannot_add_rows = should_hide_buttons;
        
        // Also hide delete buttons if needed
        if (should_hide_buttons) {
            setTimeout(() => {
                $(grid.grid.wrapper).find('.grid-remove-rows, .grid-delete-row, .btn-open-row').hide();
            }, 100);
        } else {
            $(grid.grid.wrapper).find('.grid-remove-rows, .grid-delete-row, .btn-open-row').show();
        }
        
        // Refresh the grid to apply changes
        grid.grid.refresh();
    }
}


function lock_header_fields_if_children_exist(frm) {
    if (!frm.doc) return;

    const has_children = frm.doc.stone_details && frm.doc.stone_details.length > 0;

    const critical_header_fields = [];
    const editable_header_fields = ['main_part', 'sub_part','baps_project', 'form_number', 'prep_date', 'stone_type', 'cutting_region'];

    if (has_children) {
        // ALWAYS lock critical fields when children exist
        critical_header_fields.forEach(fieldname => {
            frm.set_df_property(fieldname, 'read_only', 1);
        });

        // For editable fields: only lock if they are verified; otherwise, keep editable
        editable_header_fields.forEach(fieldname => {
            const is_verified = frm.doc[fieldname + '_verified'];
            frm.set_df_property(fieldname, 'read_only', is_verified ? 1 : 0);
        });
    } else {
        // No children: unlock all fields (unless verified)
        [...critical_header_fields, ...editable_header_fields].forEach(fieldname => {
            const is_verified = frm.doc[fieldname + '_verified'];
            frm.set_df_property(fieldname, 'read_only', is_verified ? 1 : 0);
        });
    }
}

// Lock stone_name in child rows when any child exists (to preserve stone_code integrity)
function lock_child_stone_name_if_children_exist(frm) {
    if (!frm.doc || !frm.doc.stone_details || frm.doc.stone_details.length === 0) {
        return;
    }

    const grid = frm.fields_dict?.stone_details?.grid;
    if (!grid) return;

    // Update field definition so new rows also respect this
    const stone_name_df = frappe.meta.get_docfield('Size List Details', 'stone_name');
    if (stone_name_df) {
        stone_name_df.read_only = 1;
    }

    // Lock stone_name in all existing rendered rows
    frm.doc.stone_details.forEach((row) => {
        const grid_row = grid.grid_rows_by_docname?.[row.name];
        if (grid_row && grid_row.get_field) {
            const field = grid_row.get_field('stone_name');
            if (field && field.$input) {
                field.$input.prop('readonly', true).css({
                    'background-color': '#f0f0f0',
                    'cursor': 'not-allowed'
                });
            }
        }
    });

    // Refresh to apply
    frm.refresh_field('stone_details');
}
// Lock stone_name in child rows if it has already been set (to preserve stone_code integrity)
function lock_child_stone_name_if_already_set(frm) {
    if (!frm.doc || !frm.doc.stone_details || !frm.fields_dict.stone_details?.grid) {
        return;
    }

    const grid = frm.fields_dict.stone_details.grid;

    // Reset base field to editable by default (for new empty rows)
    const base_df = frappe.meta.get_docfield('Size List Details', 'stone_name');
    if (base_df) {
        base_df.read_only = 0;
    }

    frm.doc.stone_details.forEach((row) => {
        const grid_row = grid.grid_rows_by_docname?.[row.name];
        if (!grid_row) return;

        const field = grid_row.get_field('stone_name');
        if (!field || !field.$input) return;

        const should_lock = !!row.stone_name?.toString().trim();

        if (should_lock) {
            field.$input.prop('readonly', true).css({
                'background-color': '#f0f0f0',
                'cursor': 'not-allowed'
            });
            field.df.read_only = 1;
        } else {
            field.$input.prop('readonly', false).css({
                'background-color': '',
                'cursor': 'text'
            });
            field.df.read_only = 0;
        }
    });

    frm.refresh_field('stone_details');
}

// Setup query for stone_name and stone_code fields to filter by main_part and sub_part
function setup_stone_name_query(frm, cdt, cdn) {
    if (!frm || !frm.doc || !frm.fields_dict.stone_details) return;
    
    // Get the main_part and sub_part from the parent form
    const main_part = frm.doc.main_part;
    const sub_part = frm.doc.sub_part;
    
    // Set query filter for stone_name field in child table
    frm.fields_dict.stone_details.grid.get_field('stone_name').get_query = function(doc, cdt, cdn) {
        const filters = {};
        
        // Filter by main_part if selected
        if (main_part) {
            filters.main_part = main_part;
        }
        
        // Filter by sub_part if selected
        if (sub_part) {
            filters.sub_part = sub_part;
        }
        
        return {
            filters: filters
        };
    };
    
    // Set query filter for stone_code field in child table
    frm.fields_dict.stone_details.grid.get_field('stone_code').get_query = function(doc, cdt, cdn) {
        const filters = {};
        
        // Filter by main_part if selected
        if (main_part) {
            filters.main_part = main_part;
        }
        
        // Filter by sub_part if selected
        if (sub_part) {
            filters.sub_part = sub_part;
        }
        
        return {
            filters: filters
        };
    };
}

// Apply stone_name query filter to all existing rows
function setup_stone_name_query_for_all_rows(frm) {
    if (!frm || !frm.doc || !frm.fields_dict.stone_details) return;
    
    const main_part = frm.doc.main_part;
    const sub_part = frm.doc.sub_part;
    
    // Set the query at the grid level for stone_name
    frm.fields_dict.stone_details.grid.get_field('stone_name').get_query = function(doc, cdt, cdn) {
        const filters = {};
        
        if (main_part) {
            filters.main_part = main_part;
        }
        
        if (sub_part) {
            filters.sub_part = sub_part;
        }
        
        return {
            filters: filters
        };
    };
    
    // Set the query at the grid level for stone_code
    frm.fields_dict.stone_details.grid.get_field('stone_code').get_query = function(doc, cdt, cdn) {
        const filters = {};
        
        if (main_part) {
            filters.main_part = main_part;
        }
        
        if (sub_part) {
            filters.sub_part = sub_part;
        }
        
        return {
            filters: filters
        };
    };
    
    // Refresh the grid to apply the filter
    frm.refresh_field('stone_details');
}

// Setup query filter for Sub Part dropdown to show only Sub Parts belonging to selected Main Part
function setup_sub_part_query(frm) {
    if (!frm) return;
    
    frm.set_query("sub_part", function() {
        if (!frm.doc.main_part) {
            frappe.msgprint({
                title: 'Main Part Required',
                message: 'Please select Main Part before choosing Sub Part.',
                indicator: 'orange'
            });
            return {
                filters: {
                    name: ['=', '']  // Return no results
                }
            };
        }
        return {
            filters: {
                main_part: frm.doc.main_part
            }
        };
    });
}

// Hide the "Duplicate Row" button from child table
function hide_duplicate_row_button(frm) {
    if (!frm.fields_dict.stone_details) return;
    
    const grid = frm.fields_dict.stone_details.grid;
    if (!grid) return;
    
    // Hide duplicate button using CSS
    setTimeout(() => {
        // Hide the duplicate row button
        grid.wrapper.find('.grid-duplicate-row').hide();
        grid.wrapper.find('[data-label="Duplicate"]').hide();
        grid.wrapper.find('button:contains("Duplicate")').hide();
        
        // Also hide it from the dropdown menu if it exists
        grid.wrapper.find('.dropdown-menu a:contains("Duplicate")').parent().hide();
    }, 100);
    
    // Override the grid's add_custom_button to prevent duplicate button from appearing
    if (grid.add_custom_button) {
        const original_add_custom_button = grid.add_custom_button.bind(grid);
        grid.add_custom_button = function(label) {
            if (label && label.toLowerCase().includes('duplicate')) {
                return; // Don't add duplicate button
            }
            return original_add_custom_button.apply(this, arguments);
        };
    }
}

// Validate all fields are verified
function validate_all_fields_verified(frm) {
    
    // Parent form fields to check (excluding form_number and prep_date)
    const parent_verification_fields = [
        'baps_project_verified',
        'stone_type_verified',
        'main_part_verified',
        'sub_part_verified',
        'cutting_region_verified',
        'polishing_verified'
    ];
    
    // Check parent fields
    let all_parent_verified = true;
    parent_verification_fields.forEach(field => {
        if (!frm.doc[field]) {
            all_parent_verified = false;
        }
    });
    
    if (!all_parent_verified) {
        frappe.msgprint({
            title: 'Verification Incomplete',
            message: 'Please verify all parent form fields before proceeding.',
            indicator: 'red'
        });
        return false;
    }
    
    // Child table verification fields (must match all fields that have verification checkboxes)
    const child_verification_fields = [
        'stone_name_verified',
        'stone_code_verified',
        'range_verified',  // Added range_verified
        'l1_verified',
        'l2_verified',
        'b1_verified',
        'b2_verified',
        'h1_verified',
        'h2_verified'
    ];
    
    // Check child table rows
    if (!frm.doc.stone_details || frm.doc.stone_details.length === 0) {
        frappe.msgprint({
            title: 'No Data',
            message: 'Please add at least one stone detail row.',
            indicator: 'red'
        });
        return false;
    }
    
    let all_child_verified = true;
    let unverified_rows = [];
    
    frm.doc.stone_details.forEach((row, index) => {
        let row_fully_verified = true;
        child_verification_fields.forEach(field => {
            if (!row[field]) {
                row_fully_verified = false;
            }
        });
        
        if (!row_fully_verified) {
            unverified_rows.push(index + 1);
            all_child_verified = false;
        }
    });
    
    if (!all_child_verified) {
        frappe.msgprint({
            title: 'Verification Incomplete',
            message: `Please verify all fields in child table rows: ${unverified_rows.join(', ')}`,
            indicator: 'red'
        });
        return false;
    }
    
    return true;
}

// Update field editability dynamically when verification checkbox changes
function update_field_by_verification(frm, field_name, verification_field) {
    const is_data_operator = frappe.user_roles.includes('Size List Data Entry Operator');
    const is_data_checker = frappe.user_roles.includes('Size List Data Checker');
    const is_under_verification = get_workflow_state(frm) === 'Under Verification';
    const is_under_rechange = get_workflow_state(frm) === 'Under Rechange';
    const is_under_recheck = get_workflow_state(frm) === 'Under Recheck';
    const is_verified = frm.doc[verification_field];
    
    // For Data Entry Checker in Under Verification - update field editability when checkbox changes
    if (is_data_checker && is_under_verification) {
        control_field_editability(frm, field_name, is_verified);
        return;
    }
    
    // For Data Entry Operator in correction mode
    if (is_data_operator && (is_under_rechange || is_under_recheck)) {
        if (is_verified) {
            // Checkbox is CHECKED → Field becomes READ-ONLY
            frm.set_df_property(field_name, 'read_only', 1);
            frm.set_df_property(verification_field, 'read_only', 1);
        } else {
            // Checkbox is UNCHECKED → Field becomes EDITABLE
            frm.set_df_property(field_name, 'read_only', 0);
        }
        frm.refresh_field(field_name);
    }
}

// Setup child table row permissions based on verification status
function setup_child_row_verification_permissions(frm) {
    const is_data_operator = frappe.user_roles.includes('Size List Data Entry Operator');
    const is_data_checker = frappe.user_roles.includes('Size List Data Checker');
    const is_under_verification = get_workflow_state(frm) === 'Under Verification';
    const is_under_rechange = get_workflow_state(frm) === 'Under Rechange';
    const is_under_recheck = get_workflow_state(frm) === 'Under Recheck';
    const show_verification_operator = is_under_rechange || is_under_recheck;
    
    if (!frm.doc.stone_details || frm.doc.stone_details.length === 0) {
        return;
    }
    
    // Apply permissions to each row based on its verification status
    setTimeout(function() {
        frm.doc.stone_details.forEach((row, idx) => {
            const grid_row = frm.fields_dict.stone_details.grid.grid_rows[idx];
            if (!grid_row) return;
            
            // Child table field verification mapping
            const child_fields = {
                'stone_name': 'stone_name_verified',
                'stone_code': 'stone_code_verified',
                'range': 'range_verified',
                'l1': 'l1_verified',
                'l2': 'l2_verified',
                'b1': 'b1_verified',
                'b2': 'b2_verified',
                'h1': 'h1_verified',
                'h2': 'h2_verified'
            };
            
            // For Data Entry Checker in Under Verification mode
            if (is_data_checker && is_under_verification) {
                Object.keys(child_fields).forEach(field => {
                    const verification_field = child_fields[field];
                    const field_obj = grid_row.get_field(field);
                    const verify_field_obj = grid_row.get_field(verification_field);
                    
                    // Make ALL data fields read-only for Data Checker
                    if (field_obj) {
                        field_obj.$input.prop('readonly', true);
                    }
                    
                    // Make verification checkboxes editable
                    if (verify_field_obj) {
                        verify_field_obj.$input.prop('disabled', false);
                    }
                });
            }
            
            // For Data Entry Operator in correction mode
            if (is_data_operator && show_verification_operator) {
                Object.keys(child_fields).forEach(field => {
                    const verification_field = child_fields[field];
                    const is_verified = row[verification_field];
                    const field_obj = grid_row.get_field(field);
                    const verify_field_obj = grid_row.get_field(verification_field);
                    
                    // Control field editability based on verification status
                    if (field_obj) {
                        if (is_verified) {
                            // Verified field → READ-ONLY
                            field_obj.$input.prop('readonly', true);
                        } else {
                            // Not verified field → EDITABLE
                            field_obj.$input.prop('readonly', false);
                        }
                    }
                    
                    // ALWAYS make verification checkbox read-only for operator
                    if (verify_field_obj) {
                        verify_field_obj.$input.prop('disabled', true);
                    }
                });
            }
        });
        
        frm.refresh_field('stone_details');
    }, 200);
}

// Control individual child table field editability based on verification checkbox
function control_child_field_editability(frm, cdt, cdn, field_name, is_verified) {
    const is_data_operator = frappe.user_roles.includes('Size List Data Entry Operator');
    const is_data_checker = frappe.user_roles.includes('Size List Data Checker');
    const is_under_verification = get_workflow_state(frm) === 'Under Verification';
    const is_under_rechange = get_workflow_state(frm) === 'Under Rechange';
    const is_under_recheck = get_workflow_state(frm) === 'Under Recheck';
    const show_verification = is_under_rechange || is_under_recheck;
    
    const grid_row_idx = frm.fields_dict.stone_details.grid.grid_rows_by_docname[cdn];
    if (!grid_row_idx) return;
    
    // For Data Entry Checker in Under Verification - update field editability when checkbox changes
    if (is_data_checker && is_under_verification) {
        setTimeout(function() {
            const field_obj = grid_row_idx.get_field(field_name);
            
            if (field_obj) {
                // Always keep data fields read-only for Data Checker
                field_obj.$input.prop('readonly', true);
            }
            
            frm.refresh_field('stone_details');
        }, 100);
    }
    
    // For Data Entry Operator in correction mode
    if (is_data_operator && show_verification) {
        setTimeout(function() {
            const field_obj = grid_row_idx.get_field(field_name);
            
            if (field_obj) {
                if (is_verified) {
                    // Checkbox CHECKED → Field becomes READ-ONLY
                    field_obj.$input.prop('readonly', true);
                } else {
                    // Checkbox UNCHECKED → Field becomes EDITABLE
                    field_obj.$input.prop('readonly', false);
                }
            }
            
            frm.refresh_field('stone_details');
        }, 100);
    }
}

// Lock all fields after verification (except for Project Manager)
function lock_all_fields_after_verification(frm) {
    const is_project_manager = frappe.user_roles.includes('Size List Project Manager');
    
    
    if (is_project_manager) {
        // Project Manager: Make data fields read-only but allow workflow actions
        
        // Make all data fields read-only
        frm.fields.forEach(field => {
            // Don't lock workflow-related fields or special fields
            if (!field.df.fieldname.includes('workflow') && 
                field.df.fieldname !== 'amended_from' &&
                field.df.fieldname !== 'docstatus') {
                frm.set_df_property(field.df.fieldname, 'read_only', 1);
            }
        });
        
        // Lock child table data but keep it visible
        const grid = frm.fields_dict.stone_details;
        if (grid && grid.grid) {
            grid.grid.wrapper.find('.grid-add-row').hide();
            grid.grid.wrapper.find('.grid-remove-rows').hide();
            grid.grid.static_rows = true;
            grid.grid.refresh();
        }
        
        frappe.show_alert({
            message: 'Verified form - Data is read-only. Use workflow actions to publish.',
            indicator: 'blue'
        }, 5);
        
    } else {
        // Other users: Lock everything completely
        
        // Disable the form completely
        frm.disable_save();
        
        // Make all parent fields read-only
        frm.fields.forEach(field => {
            frm.set_df_property(field.df.fieldname, 'read_only', 1);
        });
        
        // Lock all child table fields
        const grid = frm.fields_dict.stone_details;
        if (grid && grid.grid) {
            // Disable add/delete buttons
            grid.grid.wrapper.find('.grid-add-row').hide();
            grid.grid.wrapper.find('.grid-remove-rows').hide();
            grid.grid.wrapper.find('.grid-upload').hide();
            grid.grid.wrapper.find('.grid-download').hide();
            
            // Make all grid rows read-only
            if (frm.doc.stone_details) {
                frm.doc.stone_details.forEach(row => {
                    frappe.model.set_value(row.doctype, row.name, 'editable', 0);
                });
            }
            
            // Disable grid edit
            grid.grid.static_rows = true;
            grid.grid.refresh();
        }
        
        frappe.show_alert({
            message: 'This form is Verified and cannot be edited',
            indicator: 'green'
        }, 5);
    }
}


// Check for duplicate stone names within the same project
function check_stone_duplicates(frm, cdt, cdn) {
    const row = locals[cdt][cdn];
    
    // Only check if we have a stone name and project
    if (!row.stone_name || !frm.doc.baps_project) {
        return;
    }
    
    // Skip check for existing saved documents (only check for new ones)
    if (!frm.is_new() && frm.doc.__islocal !== 1) {
        return;
    }
    
    // Clear any previous stone warnings
    clear_stone_warnings(frm);
    
    // Check for duplicates in current document first
    const current_stone_name = row.stone_name.trim().toLowerCase();
    let internal_duplicates = [];
    
    if (frm.doc.stone_details) {
        frm.doc.stone_details.forEach((stone_row, index) => {
            if (stone_row.name !== row.name && 
                stone_row.stone_name && 
                stone_row.stone_name.trim().toLowerCase() === current_stone_name) {
                internal_duplicates.push(index + 1);
            }
        });
    }
    
    if (internal_duplicates.length > 0) {
        show_stone_duplicate_warning(frm, row.stone_name, internal_duplicates, [], 'internal');
        return;
    }
    
    // Check for duplicates in other Size Lists within the same project
    frappe.call({
        method: 'baps.baps.doctype.size_list_form.size_list_form.check_stone_name_duplicates',
        args: {
            baps_project: frm.doc.baps_project,
            stone_name: row.stone_name,
            exclude_size_list: frm.doc.name || 'new'
        },
        callback: function(r) {
            if (r.message && r.message.has_duplicates) {
                show_stone_duplicate_warning(frm, row.stone_name, [], r.message.duplicates, 'external');
            }
        }
    });
}





// -------------------------------------------------------

frappe.ui.form.on('Size List', {
    refresh(frm) {
        highlight_duplicate_rows(frm);
        // Ensure duplicate_flag visibility for all rows
        if (frm.doc.stone_details) {
            frm.doc.stone_details.forEach(row => {
                update_duplicate_flag_visibility(frm, row.doctype, row.name);
            });
        }
    },
    onload_post_render(frm) {
        highlight_duplicate_rows(frm);
        if (frm.doc.stone_details) {
            frm.doc.stone_details.forEach(row => {
                update_duplicate_flag_visibility(frm, row.doctype, row.name);
            });
        }
    }
});

frappe.ui.form.on('Size List Details', {
    stone_code: function (frm, cdt, cdn) {
        handle_field_edit(frm, cdt, cdn);
    },
    range: function (frm, cdt, cdn) {
        handle_field_edit(frm, cdt, cdn);
    },
    l1: function (frm, cdt, cdn) {
        handle_field_edit(frm, cdt, cdn);
    },
    l2: function (frm, cdt, cdn) {
        handle_field_edit(frm, cdt, cdn);
    },
    b1: function (frm, cdt, cdn) {
        handle_field_edit(frm, cdt, cdn);
    },
    b2: function (frm, cdt, cdn) {
        handle_field_edit(frm, cdt, cdn);
    },
    h1: function (frm, cdt, cdn) {
        handle_field_edit(frm, cdt, cdn);
    },
    h2: function (frm, cdt, cdn) {
        handle_field_edit(frm, cdt, cdn);
    },
    volume: function (frm, cdt, cdn) {
        handle_field_edit(frm, cdt, cdn);
    }
});


// ------------------------------
// Helper Functions
// ------------------------------

function highlight_duplicate_rows(frm) {
    if (!frm.doc.stone_details) {
        return;
    }
    
    frm.doc.stone_details.forEach((row, index) => {
        
        const gridRow = frm.fields_dict.stone_details.grid.grid_rows_by_docname[row.name];

        if (!gridRow) {
            console.log(`No gridRow found for row ${row.name}`);
            return;
        }

        // Remove previous styles first
        $(gridRow.row).css({
            backgroundColor: '',
            borderLeft: ''
        });
        
        // Remove existing warning
        $(gridRow.row).find('.duplicate-warning').remove();

        // Add ⚠️ icon and red background if duplicate
        if (row.duplicate_flag == 1) {
            console.log(`Applying red styling to duplicate row: ${row.stone_code}`);
            
            $(gridRow.row).css({
                backgroundColor: '#ffe5e5',
                borderLeft: '4px solid #e60000'
            });

            const $warning = $(`<span class="duplicate-warning" style="color:#e60000; font-weight:600;"> ⚠️ Duplicate</span>`);
            const $cell = $(gridRow.row).find('.data-row .row-index');
            if ($cell.length > 0) {
                $cell.append($warning);
                console.log('Warning icon added');
            } else {
                console.log('Could not find .row-index cell');
            }
        }
    });
}


function handle_field_edit(frm, cdt, cdn) {
    const row = frappe.get_doc(cdt, cdn);

    // If this row was previously duplicate, user is editing it
    if (row.duplicate_flag == 1) {
        frappe.model.set_value(cdt, cdn, 'duplicate_flag', 0);
        update_duplicate_flag_visibility(frm, cdt, cdn);
        // frappe.show_alert({
        //     message: `⚠️ Duplicate flag removed because you edited this row.`,
        //     indicator: 'orange'
        // });

        // Optional: if you have "verified" checkbox field, auto uncheck it
        if (row.is_verified) {
            frappe.model.set_value(cdt, cdn, 'is_verified', 0);
        }
    }

    // Repaint UI (remove red background)
    setTimeout(() => {
        highlight_duplicate_rows(frm);
    }, 300);
}

// baps/baps/doctype/size_list/size_list.js
frappe.ui.form.on('Size List', {
    refresh: function(frm) {
        // highlight duplicates on refresh
        highlight_duplicate_rows(frm);
        attach_grid_change_handler(frm);
    },
    stone_details_add: function(frm, cdt, cdn) {
        setTimeout(() => {
            highlight_duplicate_rows(frm);
            // Ensure duplicate_flag visibility for the new row
            const row = locals[cdt][cdn];
            if (row) {
                update_duplicate_flag_visibility(frm, cdt, cdn);
            }
        }, 150);
    },
    stone_details_remove: function(frm) {
        setTimeout(() => {
            highlight_duplicate_rows(frm);
            // Refresh duplicate_flag visibility for all remaining rows
            if (frm.doc.stone_details) {
                frm.doc.stone_details.forEach(row => {
                    update_duplicate_flag_visibility(frm, row.doctype, row.name);
                });
            }
        }, 150);
    }
});


function highlight_duplicate_rows(frm) {
    if (!frm.fields_dict || !frm.fields_dict.stone_details) return;
    let grid = frm.fields_dict.stone_details.grid;
    if (!grid) return;

    // small delay to ensure grid rows are rendered
    setTimeout(() => {
        grid.wrapper.find('.grid-row').each(function() {
            let $row = $(this);
            let idx = $row.attr('data-idx');
            if (!idx) return;
            let row_doc = frm.doc.stone_details[idx];
            if (!row_doc) return;

            // add/remove visual
            if (row_doc.duplicate_flag == 1 || row_doc.duplicate_flag === true) {
                $row.addClass('row-duplicate');
                if (!$row.find('.duplicate-badge').length) {
                    $row.find('.grid-row-index').append('<span class="duplicate-badge" title="Duplicate">⚠️</span>');
                }
            } else {
                $row.removeClass('row-duplicate');
                $row.find('.duplicate-badge').remove();
            }
        });
    }, 200);
}


// Attach a single delegated change handler on the grid wrapper
function attach_grid_change_handler(frm) {
    if (!frm.fields_dict || !frm.fields_dict.stone_details) return;
    let grid = frm.fields_dict.stone_details.grid;
    if (!grid) return;

    // Avoid attaching multiple times
    if (grid._dup_change_handler_attached) return;
    grid._dup_change_handler_attached = true;

    grid.wrapper.on('change input', 'input, select, textarea', function(e) {
        // Find closest grid row and index
        let $row = $(this).closest('.grid-row');
        let idx = $row.attr('data-idx');
        if (!idx) return;

        idx = parseInt(idx);
        let row = frm.doc.stone_details[idx];
        if (!row) return;

        // If user edits the row, clear duplicate_flag for that row (client-side + server)
        if (row.duplicate_flag) {
            // clear client-side immediately
            frappe.model.set_value(row.doctype, row.name, 'duplicate_flag', 0);
            update_duplicate_flag_visibility(frm, row.doctype, row.name);
            // Also clear parent verification so operator must resubmit
            if (frm.doc.overall_form_verified) {
                frm.set_value('overall_form_verified', 0);
            }
            // Refresh visuals
            setTimeout(() => highlight_duplicate_rows(frm), 150);
        }

        // Additionally: if the operator changes critical fields, we want the checker to recheck those fields.
        // Optionally clear verification progress field (if present)
        if (frm.fields_dict && frm.fields_dict.verification_progress) {
            frm.set_value('verification_progress', 0);
        }
    });
}

// Auto-uncheck range verification for duplicate rows when document is Under Rechange
function auto_uncheck_range_verification_for_duplicates(frm) {
    if (!frm.doc.stone_details) return;
    
    let unchecked_count = 0;
    
    frm.doc.stone_details.forEach(row => {
        // If this row has duplicate flag and range_verified is checked
        if (row.duplicate_flag == 1 && row.range_verified == 1) {
            // Uncheck the range_verified checkbox
            frappe.model.set_value('Size List Details', row.name, 'range_verified', 0);
            unchecked_count++;
        }
    });
    
    if (unchecked_count > 0) {
        
    }
}

// Show duplicate records for a specific row
function show_duplicate_records(frm, cdt, cdn) {
    const row = locals[cdt][cdn];
    frappe.call({
        method: "baps.baps.doctype.size_list_form.size_list_form.get_duplicate_records_for_row",
        args: {
            row_data: {
                baps_project: frm.doc.baps_project,
                main_part: frm.doc.main_part,
                sub_part: frm.doc.sub_part,
                stone_name: row.stone_name,
                stone_code: row.stone_code,
                range: row.range,
                name: row.name  // Pass the row name to exclude itself
            },
            current_size_list: frm.doc.name
        },
        callback: function (r) {
            const result = r.message || {};
            const duplicates = result.duplicates || [];
            const overlapping_codes = result.overlapping_codes || {};
            
            if (duplicates.length === 0) {
                frappe.msgprint({
                    title: 'No Duplicates Found',
                    message: `✅ No duplicates found for range "<b>${row.range}</b>"`,
                    indicator: 'green'
                });
            } else {
                show_duplicate_records_dialog(duplicates, row, overlapping_codes);
            }
        }
    });
}

function update_duplicate_flag_visibility(frm, cdt, cdn) {
    const row = locals[cdt][cdn];
    const grid_row = frm.fields_dict.stone_details.grid.grid_rows_by_docname[row.name];
    if (!grid_row) return;

    // ✅ Just refresh the field to apply the updated display logic
    grid_row.get_field('duplicate_flag').refresh();

    // Optional: refresh the entire grid if needed (usually not necessary)
    // frm.refresh_field('stone_details');
}

function show_duplicate_records_dialog(duplicate_records, current_row, overlapping_codes) {
    if (!duplicate_records || duplicate_records.length === 0) {
        frappe.msgprint({
            title: 'No Duplicates',
            message: '✅ No duplicate records found.',
            indicator: 'green'
        });
        return;
    }

    let dialog = new frappe.ui.Dialog({
        title: `⚠️ Duplicate Stone Codes Found (${duplicate_records.length})`,
        size: 'large',
        fields: [{ fieldtype: 'HTML', fieldname: 'duplicate_info' }]
    });

    // Build overlapping codes summary
    let overlapping_summary = '';
    if (overlapping_codes && Object.keys(overlapping_codes).length > 0) {
        overlapping_summary = `
            <div style="background: #fff3cd; padding: 10px; margin-bottom: 15px; border-radius: 4px; border-left: 4px solid #ffc107;">
                <strong>⚠️ Duplicate Stone Codes Detected:</strong><br>
                <ul style="margin: 8px 0 0 20px; padding: 0;">
        `;
        for (let code in overlapping_codes) {
            const rows = overlapping_codes[code];
            overlapping_summary += `<li><b>${code}</b> in rows: ${rows.join(', ')}</li>`;
        }
        overlapping_summary += `
                </ul>
                <i style="font-size: 12px; color: #856404;">Please correct the overlapping ranges.</i>
            </div>
        `;
    }

    let rows = duplicate_records.map(record => {
        // Safely escape single quotes in document name to prevent JS break
        const safeName = String(record.source_document).replace(/'/g, "\\'");
        const sourceType = record.source_type || 'Unknown';
        const workflowState = record.workflow_state || 'N/A';
        
        // Show overlapping codes for internal duplicates
        let overlappingCodesHtml = '';
        if (record.overlapping_codes && record.overlapping_codes.length > 0) {
            overlappingCodesHtml = `<br><small style="color: #dc3545;">Overlapping: ${record.overlapping_codes.join(', ')}</small>`;
        }
        
        return `
            <tr>
                <td style="font-family: monospace;">${record.source_document || 'N/A'}</td>
                <td><span class="badge badge-info">${sourceType}</span></td>
                <td><span class="badge badge-warning">${workflowState}</span></td>
                <td>${record.stone_name || 'N/A'}</td>
                <td><strong>${record.range || 'N/A'}</strong>${overlappingCodesHtml}</td>
                <td>${record.stone_code || 'N/A'}</td>
                <td>
                    <button class="btn btn-xs btn-secondary"
                            onclick="frappe.set_route('Form', '${sourceType}', '${safeName}')">
                        View
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    let html = `
        <div style="padding: 12px; font-size: 13px; color: #555;">
            ${overlapping_summary}
            <p style="margin: 0 0 12px;">
                Found <strong>${duplicate_records.length}</strong> duplicate record(s) with overlapping stone codes.
            </p>
            <div style="max-height: 400px; overflow: auto; border: 1px solid #eee; border-radius: 4px;">
                <table class="table table-bordered" style="margin: 0; font-size: 12px;">
                    <thead>
                        <tr>
                            <th>Document</th>
                            <th>Source Type</th>
                            <th>Status</th>
                            <th>Stone Name</th>
                            <th>Range</th>
                            <th>Stone Code</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
            <p style="margin-top: 12px; font-size: 12px; color: #888;">
                → Change the range to avoid duplicate stone codes.
            </p>
        </div>
    `;

    dialog.fields_dict.duplicate_info.$wrapper.html(html);
    dialog.show();
}

// Get status indicator color
function get_status_indicator(status) {
    switch(status) {
        case 'Draft': return 'gray';
        case 'Under Verification': return 'orange';
        case 'Under Rechange': return 'red';
        case 'Verified': return 'green';
        case 'Published': return 'blue';
        default: return 'gray';
    }
}


// Check each row individually for duplicates and highlight
function check_and_highlight_all_duplicate_rows(frm) {
    if (!frm.doc.stone_details || frm.doc.stone_details.length === 0) {
        return;
    }
    
    // Check each row individually
    let promises = frm.doc.stone_details.map((row, index) => {
        return check_single_row_for_duplicates(frm, row, index);
    });
    
    // Wait for all checks to complete, then apply highlighting
    Promise.all(promises).then(() => {
        setTimeout(() => {
            apply_duplicate_highlighting(frm);
        }, 300);
    });
}

// Check a single row for duplicates
function check_single_row_for_duplicates(frm, row, index) {
    return new Promise((resolve) => {
        // Skip if row has no meaningful data
        if (!row.stone_name && !row.range && !row.stone_code) {
            resolve();
            return;
        }
        
        const row_data = {
            stone_name: row.stone_name,
            stone_code: row.stone_code,
            range: row.range,
            l1: row.l1,
            l2: row.l2,
            b1: row.b1,
            b2: row.b2,
            h1: row.h1,
            h2: row.h2,
            baps_project: frm.doc.baps_project,
            main_part: frm.doc.main_part,
            sub_part: frm.doc.sub_part
        };
        
        // Call server to check for duplicates
        frappe.call({
            method: 'baps.baps.doctype.size_list_form.size_list_form.get_duplicate_records_for_row',
            args: {
                row_data: row_data,
                current_size_list: frm.doc.name || 'new'
            },
            callback: function(r) {
                let has_duplicates = r.message && r.message.length > 0;
                
                // Set duplicate flag on the row
                frappe.model.set_value('Size List Details', row.name, 'duplicate_flag', has_duplicates ? 1 : 0);
                update_duplicate_flag_visibility(frm, row.doctype, row.name);
                resolve();
            },
            error: function() {
                resolve();
            }
        });
    });
}



// ===============================================================
// Size List Form — Show Duplicates Button (visible only when duplicates exist)
// Works for both Checker and Operator roles.
// ===============================================================

// On load or refresh, check if duplicates exist and show button if needed
frappe.ui.form.on("Size List Form", {
    refresh(frm) {
        toggle_show_duplicates_button(frm);
    },
    after_save(frm) {
        toggle_show_duplicates_button(frm);
    },
    onload_post_render(frm) {
        toggle_show_duplicates_button(frm);
    },
    stone_details_add(frm) {
        setTimeout(() => toggle_show_duplicates_button(frm), 300);
    },
    stone_details_remove(frm) {
        setTimeout(() => toggle_show_duplicates_button(frm), 300);
    }
});


// --------------------------------------------------------------------
// 🔹 Function: Show the custom "Show Duplicates" button conditionally
// --------------------------------------------------------------------
function toggle_show_duplicates_button(frm) {
    try {
        frm.page.clear_custom_buttons();
    } catch (e) {}

    if (!frm.doc || !frm.doc.stone_details || frm.doc.stone_details.length === 0) return;

    // Check if any row has duplicate_flag = 1
    const has_duplicates = frm.doc.stone_details.some(r => Number(r.duplicate_flag) === 1);

    if (has_duplicates) {
        frm.add_custom_button("🔍 Show Duplicates", () => {
            show_global_duplicates_dialog(frm);
        }, "Actions");
    }
}


// --------------------------------------------------------------------
// 🔹 Function: Show all duplicates in a dialog (clickable links)
// --------------------------------------------------------------------
function show_global_duplicates_dialog(frm) {
    frappe.call({
        method: "baps.baps.doctype.size_list_form.size_list_form.get_duplicate_records_for_row",
        args: {
            row_data: {
                baps_project: frm.doc.baps_project,
                main_part: frm.doc.main_part,
                sub_part: frm.doc.sub_part
            },
            current_size_list: frm.doc.name
        },
        freeze: true,
        callback: function (r) {
            const duplicates = (r && r.message) ? r.message : [];

            if (!duplicates || duplicates.length === 0) {
                frappe.msgprint({
                    title: "No Duplicates Found",
                    message: "No duplicate records were found for this stone range.",
                    indicator: "green"
                });
                return;
            }

            // Build HTML table with clickable document links
            let rows_html = duplicates.map(d => {
                const docname = d.source_document || "";
                const source_type = d.source_type || "";
                const route = source_type === "Size List Form"
                    ? `/app/size-list-form/${docname}`
                    : `/app/size-list-creation/${docname}`;

                return `
                    <tr>
                        <td><a href="${route}" target="_blank" style="color:#1a73e8; text-decoration:none;">${frappe.utils.escape_html(docname)}</a></td>
                        <td>${frappe.utils.escape_html(source_type)}</td>
                        <td>${frappe.utils.escape_html(d.stone_name || "")}</td>
                        <td>${frappe.utils.escape_html(d.stone_code || "")}</td>
                        <td>${frappe.utils.escape_html(d.l1 || "")}</td>
                        <td>${frappe.utils.escape_html(d.l2 || "")}</td>
                        <td>${frappe.utils.escape_html(d.b1 || "")}</td>
                        <td>${frappe.utils.escape_html(d.b2 || "")}</td>
                        <td>${frappe.utils.escape_html(d.h1 || "")}</td>
                        <td>${frappe.utils.escape_html(d.h2 || "")}</td>
                    </tr>`;
            }).join("");

            const table_html = `
                <div style="max-height:400px; overflow:auto;">
                    <table class="table table-bordered table-hover">
                        <thead>
                            <tr>
                                <th>Document</th>
                                <th>Source</th>
                                <th>Stone Name</th>
                                <th>Stone Code</th>
                                <th>L1</th>
                                <th>L2</th>
                                <th>B1</th>
                                <th>B2</th>
                                <th>H1</th>
                                <th>H2</th>
                            </tr>
                        </thead>
                        <tbody>${rows_html}</tbody>
                    </table>
                </div>
                <p style="margin-top:10px;color:gray;">💡 Tip: Click any document link to open it in a new tab.</p>
            `;

            const d = new frappe.ui.Dialog({
                title: `🔍 Duplicate Records Found (${duplicates.length})`,
                size: "extra-large",
                primary_action_label: "Close",
                primary_action: () => d.hide()
            });

            d.$body.html(table_html);
            d.show();
        },
        error: function (err) {
            frappe.msgprint("Error fetching duplicates: " + (err && err.exc ? err.exc : JSON.stringify(err)));
        }
    });
}


// --------------------------------------------------------------------
// 🔹 Auto-show the button when Verify action fails due to duplicates
// --------------------------------------------------------------------
frappe.ui.form.on("Size List Form", {
    before_workflow_action(frm, action) {
        if (!action || action.toLowerCase().indexOf("verify") === -1) return;

        frappe.call({
            method: "baps.baps.doctype.size_list_form.size_list_form.check_global_duplicates",
            args: { size_list_name: frm.doc.name },
            freeze: true,
            callback: function (r) {
                const result = r.message || {};
                const has_duplicates = result.has_duplicates === true;

                if (has_duplicates) {
                    frappe.validated = false; // block verify
                    frappe.msgprint({
                        title: "Duplicates Found",
                        message: "Duplicates were detected. The document was not verified. Use 'Show Duplicates' to inspect.",
                        indicator: "orange"
                    });

                    // Refresh UI so the button appears immediately
                    frm.reload_doc();
                    setTimeout(() => toggle_show_duplicates_button(frm), 500);
                }
            }
        });
    }
});




function show_duplicate_records_dialog(duplicates) {
    if (!duplicates || duplicates.length === 0) {
        frappe.msgprint({
            title: "No Duplicates Found",
            message: "No duplicate records were found for this stone range.",
            indicator: "green"
        });
        return;
    }

    // Build HTML table with clickable document links
    let rows_html = duplicates.map(d => {
        const docname = d.source_document || "";
        const source_type = d.source_type || "";
        const route = source_type === "Size List Form"
            ? `/app/size-list-form/${docname}`
            : `/app/size-list-creation/${docname}`;

        return `
            <tr>
                <td><a href="${route}" target="_blank" style="color:#1a73e8; text-decoration:none;">${frappe.utils.escape_html(docname)}</a></td>
                <td>${frappe.utils.escape_html(source_type)}</td>
                <td>${frappe.utils.escape_html(d.stone_name || "")}</td>
                <td>${frappe.utils.escape_html(d.stone_code || "")}</td>
                <td>${frappe.utils.escape_html(d.l1 || "")}</td>
                <td>${frappe.utils.escape_html(d.l2 || "")}</td>
                <td>${frappe.utils.escape_html(d.b1 || "")}</td>
                <td>${frappe.utils.escape_html(d.b2 || "")}</td>
                <td>${frappe.utils.escape_html(d.h1 || "")}</td>
                <td>${frappe.utils.escape_html(d.h2 || "")}</td>
            </tr>`;
    }).join("");

    const table_html = `
        <div style="max-height:400px; overflow:auto;">
            <table class="table table-bordered table-hover">
                <thead>
                    <tr>
                        <th>Document</th>
                        <th>Source</th>
                        <th>Stone Name</th>
                        <th>Stone Code</th>
                        <th>L1</th>
                        <th>L2</th>
                        <th>B1</th>
                        <th>B2</th>
                        <th>H1</th>
                        <th>H2</th>
                    </tr>
                </thead>
                <tbody>${rows_html}</tbody>
            </table>
        </div>
        <p style="margin-top:10px;color:gray;">💡 Tip: Click any document link to open it in a new tab.</p>
    `;

    const d = new frappe.ui.Dialog({
        title: `🔍 Duplicate Records Found (${duplicates.length})`,
        size: "extra-large",
        primary_action_label: "Close",
        primary_action: () => d.hide()
    });

    d.$body.html(table_html);
    d.show();
}
