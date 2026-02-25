

frappe.ui.form.on('Size List Creation', {
    setup: function(frm) {
        // 🔒 Only allow Published Size Lists that haven't been used yet
        frm.set_query("form_number", function() {
            return {
                query: "baps.baps.doctype.size_list_creation.size_list_creation.get_available_size_lists_for_creation",
                txt: frm.doc.form_number || ""
            };
        });
    }, 
    

    refresh: function(frm) {
        // Setup role-based permissions
        setup_role_based_permissions(frm);
        
        // No duplicate checking needed here - duplicates are handled in Size List Form
        
        // Hide the document status indicator that shows "Draft"
        setTimeout(() => {
            // Hide the status indicator in the form header
            frm.page.wrapper.find('.indicator-pill').hide();
            frm.page.wrapper.find('.form-footer .tag-text').hide();
            
            // If there's a status field, hide it
            if (frm.fields_dict.status) {
                frm.toggle_display('status', false);
            }
        }, 100);
        
        // Hide the Add Row button for stone_details table
        frm.fields_dict.stone_details.grid.custom_buttons = {};
        frm.fields_dict.stone_details.grid.add_custom_button = function() {};

        // Hide the default add row button
        setTimeout(() => {
            frm.fields_dict.stone_details.grid.wrapper.find('.grid-add-row, .btn-open-row').hide();
            frm.fields_dict.stone_details.grid.wrapper.find('[data-fieldname="stone_details"] .grid-footer .btn').hide();
        }, 100);

        // Remove any existing custom messages
        frm.fields_dict.stone_details.grid.wrapper.find('.grid-footer .text-muted').remove();

        // Make stone details table read-only
        frm.fields_dict.stone_details.grid.static_rows = true;
        frm.fields_dict.stone_details.grid.only_sortable();

        // Disable editing in stone details
        frm.fields_dict.stone_details.grid.wrapper.find('input, select, textarea').prop('disabled', true);
        frm.fields_dict.stone_details.grid.wrapper.find('.grid-row').css({
            'background-color': '#f8f9fa',
            'opacity': '0.9'
        });
    },

    form_number: function(frm) {
        if (!frm.doc.form_number) {
            // If form_number is cleared, make fields editable again
            make_fields_editable(frm);
            return;
        }

        // Auto-fill all fields and load stones from the selected Size List
        auto_fill_fields_from_size_list(frm, frm.doc.form_number);
        
        // Make all fields read-only except status
        make_fields_read_only(frm);
    }
});

// Child table events for stone_details
frappe.ui.form.on('Size List Creation Item', {
    refresh: function(frm, cdt, cdn) {
        // Show duplicate styling for rows that already have duplicate_flag set
        let row = locals[cdt][cdn];
        if (row.duplicate_flag) {
            const $row = $(frm.fields_dict.stone_details.grid.grid_rows_by_docname[row.name].wrapper);
            $row.css({
                'background-color': '#ffe6e6',
                'border-left': '4px solid #ff4444'
            });
            $row.find('.grid-row-index').css({
                'background-color': '#ff4444',
                'color': 'white'
            });
        }
    }
});

// Helper function to auto-fill all fields from selected Size List
function auto_fill_fields_from_size_list(frm, size_list_name) {
    if (!size_list_name) return;
    
    frappe.call({
        method: 'frappe.client.get',
        args: {
            doctype: 'Size List Form',
            name: size_list_name
        },
        callback: function(r) {
            if (r.message) {
                const size_list_doc = r.message;
                
                // // Auto-fill header fields
                // frm.set_value('baps_project', size_list_doc.baps_project);
                // frm.set_value('project_name', size_list_doc.project_name);
                // frm.set_value('prep_date', size_list_doc.prep_date);
                // frm.set_value('stone_type', size_list_doc.stone_type);
                // frm.set_value('main_part', size_list_doc.main_part);
                // frm.set_value('sub_part', size_list_doc.sub_part);
                // frm.set_value('cutting_region', size_list_doc.cutting_region);
                // frm.set_value('total_volume', size_list_doc.total_volume);
                
                // // Auto-fill Process Required fields (checkboxes)
                // frm.set_value('polishing', size_list_doc.polishing || 0);
                // frm.set_value('dry_fitting', size_list_doc.dry_fitting || 0);
                // frm.set_value('carving', size_list_doc.carving || 0);
                // frm.set_value('chemical', size_list_doc.chemical || 0);
                
                // Auto-fill stone details from Size List
                if (size_list_doc.stone_details && size_list_doc.stone_details.length > 0) {
                    // Clear existing stone details
                    frm.clear_table("stone_details");
                    
                    // Load stone details with range expansion
                    frappe.call({
                        method: "baps.baps.doctype.size_list_creation.size_list_creation.create_size_list_items_from_range",
                        args: { form_number: size_list_name },
                        callback: function(range_r) {
                            if (range_r.message && range_r.message.items) {
                                // Add expanded items to stone_details table
                                range_r.message.items.forEach(item => {
                                    let row = frm.add_child("stone_details");
                                    Object.assign(row, item);
                                });
                                frm.refresh_field("stone_details");
                                
                                frappe.show_alert({
                                    message: __('All fields and {0} stones loaded from Size List {1}', [range_r.message.items.length, size_list_name]),
                                    indicator: 'green'
                                });
                            } else {
                                frappe.show_alert({
                                    message: __('All fields loaded from Size List {0} (no stones found)', [size_list_name]),
                                    indicator: 'blue'
                                });
                            }
                        }
                    });
                } else {
                    frappe.show_alert({
                        message: __('All fields loaded from Size List {0} (no stones found)', [size_list_name]),
                        indicator: 'blue'
                    });
                }
            }
        }
    });
}
// Setup role-based permissions
function setup_role_based_permissions(frm) {
    const is_project_manager = frappe.user_roles.includes('Project Manager');
    
    if (is_project_manager) {
        // Project Manager: Make ALL fields read-only (view-only access)
        make_all_fields_read_only_for_project_manager(frm);
    }
}

// Make all fields read-only for Project Manager
function make_all_fields_read_only_for_project_manager(frm) {
    // List of all fields to make read-only for Project Manager
    const all_fields = [
        'form_number', 'baps_project', 'project_name', 'prep_date',
        'stone_type', 'main_part', 'sub_part', 'cutting_region',
        'total_volume', 'polishing', 'dry_fitting', 
        'carving', 'chemical', 'status'
    ];
    
    all_fields.forEach(field => {
        if (frm.fields_dict[field]) {
            frm.set_df_property(field, 'read_only', 1);
        }
    });
    
    // Make child table completely read-only
    if (frm.fields_dict.stone_details && frm.fields_dict.stone_details.grid) {
        frm.fields_dict.stone_details.grid.cannot_add_rows = true;
        frm.fields_dict.stone_details.grid.only_sortable();
        
        // Disable all editing in the grid
        setTimeout(() => {
            frm.fields_dict.stone_details.grid.wrapper.find('input, select, textarea, button').prop('disabled', true);
            frm.fields_dict.stone_details.grid.wrapper.find('.grid-row').addClass('read-only-grid');
        }, 200);
        
        frm.refresh_field('stone_details');
    }
    
    frappe.show_alert({
        message: "View-only mode: Document is read-only for Project Manager",
        indicator: 'blue'
    });
}

// Helper function to make all fields read-only (except status)
function make_fields_read_only(frm) {
    // List of fields to make read-only
    const fields_to_lock = [
        'form_number', 'baps_project', 'project_name', 'prep_date',
        'stone_type', 'main_part', 'sub_part', 'cutting_region',
        'total_volume', 'polishing', 'dry_fitting', 
        'carving', 'chemical'
    ];
    
    fields_to_lock.forEach(field => {
        if (frm.fields_dict[field]) {
            frm.set_df_property(field, 'read_only', 1);
        }
    });
    
    // Make child table read-only
    if (frm.fields_dict.stone_details && frm.fields_dict.stone_details.grid) {
        frm.fields_dict.stone_details.grid.cannot_add_rows = true;
        frm.fields_dict.stone_details.grid.only_sortable();
        frm.refresh_field('stone_details');
    }
}

// Helper function to make fields editable again
function make_fields_editable(frm) {
    const is_project_manager = frappe.user_roles.includes('Project Manager');
    
    // Project Managers should never have edit access
    if (is_project_manager) {
        frappe.show_alert({
            message: "Project Managers have view-only access to Size List Creation",
            indicator: 'red'
        });
        return;
    }
    
    // List of fields to make editable (same as the read-only list)
    const fields_to_unlock = [
        'form_number', 'baps_project', 'project_name', 'prep_date',
        'stone_type', 'main_part', 'sub_part', 'cutting_region',
        'total_volume', 'polishing', 'dry_fitting', 
        'carving', 'chemical'
    ];
    
    fields_to_unlock.forEach(field => {
        if (frm.fields_dict[field]) {
            frm.set_df_property(field, 'read_only', 0);
        }
    });
    
    // Make child table editable again
    if (frm.fields_dict.stone_details && frm.fields_dict.stone_details.grid) {
        frm.fields_dict.stone_details.grid.cannot_add_rows = false;
        frm.refresh_field('stone_details');
    }
    
    // Clear the stone details table when form_number is cleared
    frm.clear_table("stone_details");
    frm.refresh_field("stone_details");
}

// Size List Creation just displays pre-processed data from Size List Form
// All duplicate checking and validation happens in Size List Form


// Trigger Split Popup When Split Checkbox is Clicked
frappe.ui.form.on("Size List Creation Item", {
    split(frm, cdt, cdn) {
        let row = locals[cdt][cdn];

        if (!row.split) return; // Only act when checked

        open_split_dialog(frm, row);
    }
});

// -------------------------
// SPLIT POPUP UI
// -------------------------
function open_split_dialog(frm, row) {
    let d = new frappe.ui.Dialog({
        title: `Split Stone: ${row.stone_code}`,
        fields: [
            {
                fieldname: "pieces",
                label: "Split Pieces",
                fieldtype: "Table",
                cannot_add_rows: false,
                in_place_edit: true,
                reqd: 1,
                fields: [
                    { fieldtype: "Float", fieldname: "l1", label: "L1", reqd: 1 },
                    { fieldtype: "Float", fieldname: "l2", label: "L2", reqd: 1 },
                    { fieldtype: "Float", fieldname: "b1", label: "B1", reqd: 1 },
                    { fieldtype: "Float", fieldname: "b2", label: "B2", reqd: 1 },
                    { fieldtype: "Float", fieldname: "h1", label: "H1", reqd: 1 },
                    { fieldtype: "Float", fieldname: "h2", label: "H2", reqd: 1 },
                ]
            }
        ],
        primary_action_label: "Create Split Pieces",
        primary_action(values) {
            create_split_pieces(frm, row, values.pieces);
            d.hide();
        }
    });

    d.show();
}


// -------------------------
// CREATE NEW PIECES
// -------------------------
function create_split_pieces(frm, original_row, pieces) {
    if (!pieces || pieces.length === 0) {
        frappe.msgprint("Please add at least one piece.");
        return;
    }

    // Generate alphabet suffixes A, B, C, ...
    let suffixes = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

    pieces.forEach((p, index) => {
        let new_row = frm.add_child("stone_details");
        let suffix = suffixes[index] || ("X" + (index + 1)); // fallback after Z

        new_row.stone_code = original_row.stone_code + suffix;
        new_row.stone_name = original_row.stone_name + suffix;

        new_row.l1 = p.l1;
        new_row.l2 = p.l2;
        new_row.b1 = p.b1;
        new_row.b2 = p.b2;
        new_row.h1 = p.h1;
        new_row.h2 = p.h2;

        // volume = (l * b * h)
        new_row.volume = ((p.l1 || 0) * (p.b1 || 0) * (p.h1 || 0)).toFixed(3);
    });

    frm.refresh_field("stone_details");

    // Uncheck split so dialog won't reopen
    frappe.model.set_value(original_row.doctype, original_row.name, "split", 0);

    frappe.show_alert({
        message: `✅ ${pieces.length} split pieces added under ${original_row.stone_code}`,
        indicator: "green"
    });
}