//==================================================
// 2. HELPER: Filter 'Gate Pass No'
//==================================================
function apply_gate_pass_no_filter(frm) {
    if (frm.doc.gate_pass_bookno) {
        frm.set_query("gate_pass_no", function () {
            return {
                query: "baps.baps.doctype.transportation.transportation.get_available_gate_passes",
                filters: {
                    'gate_pass_bookno': frm.doc.gate_pass_bookno
                }
            };
        });
    }
}

//==================================================
// 3. MAIN EVENT HANDLERS
// (All logic is merged into this one block)
//==================================================
frappe.ui.form.on("Transportation", {
    /**
     * ONLOAD: Runs when the form wrapper is first created.
     */
    onload: function (frm) {
        // Auto-set Sender Name
        if (frm.is_new() && !frm.doc.sender_name) {
            frm.set_value("sender_name", frappe.session.user);
        }
    },

    /**
     * REFRESH: Runs when the form is loaded or re-rendered.
     */

    refresh: function (frm) {
        toggle_header_fields(frm);
        lock_transport_grid(frm);
        set_child_status_options(frm);
        
        // Check if any items have been processed by receiver
        const processedStatuses = ['Received', 'Not in this', 'Send to site'];
        const anyProcessed = (frm.doc.transport_item || []).some(r => processedStatuses.includes(r.status));
        
        // Disable Show Items button if receiver has processed any items
        if (anyProcessed) {
            frm.set_df_property('show_items', 'read_only', 1);
        } else {
            frm.set_df_property('show_items', 'read_only', 0);
        }
        
        // --- HIDE "ADD ROW" FOR TRANSPORT ITEM ---
        if (frm.fields_dict.transport_item && frm.fields_dict.transport_item.grid) {
            frm.fields_dict.transport_item.grid.cannot_add_rows = true;
            // frm.fields_dict.transport_item.grid.cannot_delete_rows = true;
            // frm.get_field("transport_item").grid.cannot_delete_all_rows = true;
            // frm.get_field("transport_item").grid.cannot_delete_rows = true;
            frm.refresh_field("transport_item");
        }
        // --- END OF FIX ---
        // in Transportation refresh handler, after cannot_add_rows
        if (frm.fields_dict.transport_item && frm.fields_dict.transport_item.grid) {
            const grid = frm.fields_dict.transport_item.grid;

            const is_sender = frappe.user_roles.includes('Transportation Sender') || frappe.user_roles.includes('Administrator');
            const processedStatuses = ['Received', 'Not in this', 'Send to site'];
            const parentLocked = ['Full Received', 'Partially Received'].includes(frm.doc.status || '');
            const anyProcessed = (frm.doc.transport_item || []).some(r => processedStatuses.includes(r.status));

            // Sender may delete only:
            // - while creating (unsaved), or
            // - saved but parent not locked AND no processed child statuses
            const allowSenderDelete = is_sender && (frm.is_new() || (!parentLocked && !anyProcessed));

            // Toggle grid-level deletion affordances
            grid.cannot_delete_rows = !allowSenderDelete;
            frm.refresh_field('transport_item');

            // Hide or show bulk “Remove”
            const bulkBtn = $(grid.wrapper).find('.grid-remove-rows');
            allowSenderDelete ? bulkBtn.show() : bulkBtn.hide();

            // Intercept per-row delete clicks as a hard stop
            // Buttons have class .grid-delete-row
            $(grid.wrapper)
                .off('click.transport_delete_guard') // avoid duplicates
                .on('click.transport_delete_guard', '.grid-delete-row', function (e) {
                    if (!allowSenderDelete) {
                        e.stopImmediatePropagation();
                        frappe.msgprint(__('Row deletion is not allowed for this document.'));
                        return false;
                    }
                });
        }

        // ==============================
        // CHILD SCRIPT: Transportation Status R
        // ==============================

        frappe.ui.form.on('Transportation Status R', {
            status: function (frm, cdt, cdn) {
                let row = locals[cdt][cdn];

                // If status is "Send to site" → show Site field
                if (row.status === "Send to site") {
                    frappe.meta.get_docfield("Transportation Status R", "site", cur_frm.doc.name).hidden = 0;
                }
                // If "Received" or "Not in this" → hide and clear Site field
                else {
                    frappe.model.set_value(cdt, cdn, "site", "");
                    frappe.meta.get_docfield("Transportation Status R", "site", cur_frm.doc.name).hidden = 1;
                }

                // Refresh the child table to apply the change immediately
                cur_frm.refresh_field("transport_item");
            }
        });
        // Filter 'from_site' to exclude 'Project Site'

        // frm.set_query("from_site", function() {
        //     return {
        //         filters: {
        //             'site_type': ['!=', 'Project Site']
        //         }
        //     };
        // });

        // --- [NEW] 'TO SITE' DYNAMIC FILTER LOGIC ---
        // This logic is run on load, in case 'from_site' is already populated
        if (frm.doc.from_site) {
            // 'from_site' has a value. Fetch its 'site_type' from the server.
            // ASSUMPTION: Your DocType is 'Site' and field is 'site_type'
            frappe.db.get_value('Site', frm.doc.from_site, 'site_type', (r) => {
                let filters = {};
                filters['name'] = ['!=', frm.doc.from_site]; // Base filter

                // *** YOUR NEW LOGIC ***
                // ASSUMPTION: Your value is 'trade_partner'
                if (r.site_type === 'trade_partner') {
                    filters['site_type'] = ['!=', 'trade_partner'];
                }
                // *** END OF NEW LOGIC ***

                frm.set_query('to_site', () => {
                    return { filters: filters };
                });
            });
        } else {
            // 'from_site' is empty. Remove all filters from 'to_site'.
            frm.set_query('to_site', () => {
                return { filters: {} };
            });
        }
        // --- [END NEW] 'TO SITE' DYNAMIC FILTER LOGIC ---

        // Filter 'Gate Pass BookNo'
        frm.set_query("gate_pass_bookno", function () {
            return {
                query: "baps.baps.doctype.transportation.transportation.get_available_gate_pass_books",
                filters: {
                    'assigned_to': frappe.session.user
                }
            };
        });

        // Filter 'Gate Pass No'
        apply_gate_pass_no_filter(frm);

        // Filter 'Site' in child table 'transport_item'
        frm.fields_dict['transport_item'].grid.get_field('site').get_query = function (doc, cdt, cdn) {
            let exclude_sites = [];
            if (frm.doc.from_site) {
                exclude_sites.push(frm.doc.from_site);
            }
            if (frm.doc.to_site) {
                exclude_sites.push(frm.doc.to_site);
            }

            return {
                filters: {
                    'name': ['not in', exclude_sites.length ? exclude_sites : ['']]
                }
            };
        };

        // --- DYNAMIC READ-ONLY FOR CHILD TABLE ---
        let is_locked = (frm.doc.status === "Full Received" ||
            frm.doc.status === "Partially Received" ||
            frm.doc.status === "Receiving");

        if (frm.fields_dict.transport_item && frm.fields_dict.transport_item.grid) {
            frm.get_field("transport_item").grid.update_docfield_property("item_no", "read_only", is_locked);
            frm.get_field("transport_item").grid.update_docfield_property("baps_project", "read_only", is_locked);
            frm.get_field("transport_item").grid.update_docfield_property("item_type", "read_only", is_locked);

            let receiver_can_edit = frappe.user.has_role("Transportation Receiver") && frm.doc.status !== "Full Received";

            frm.get_field("transport_item").grid.update_docfield_property("status", "read_only", !receiver_can_edit);
            frm.get_field("transport_item").grid.update_docfield_property("site", "read_only", !receiver_can_edit);
        }
    },

    /**
     * VALIDATE: Runs before saving.
     */
    validate: function (frm) {
        // Merged Date Validation
        if (frm.doc.date) {
            let today = frappe.datetime.get_today();
            let past5 = frappe.datetime.add_days(today, -5);
            let tomorrow = frappe.datetime.add_days(today, 1);

            if (frm.doc.date < past5) {
                frappe.throw(__("Date cannot be older than 5 days. Please select a valid date."));
            }

            if (frm.doc.date > tomorrow) {
                frappe.throw(__("You can select only up to tomorrow’s date."));
            }
        }
    },

    //==================================================
    // Field-level Event Handlers
    //==================================================

    from_site: function (frm) {
        // 1. Clear the 'To Site' field. This is critical.
        frm.set_value('to_site', '');

        // 2. Check for same-site conflict (from your old code)
        if (frm.doc.from_site && frm.doc.to_site && frm.doc.from_site === frm.doc.to_site) {
            frappe.msgprint(__("From Site and To Site cannot be the same."));
            frm.set_value("from_site", "");
            // Since we cleared from_site, we must also clear the 'to_site' filter
            frm.set_query('to_site', () => {
                return { filters: {} };
            });
            return; // Exit the function early
        }

        // --- [NEW] 'TO SITE' DYNAMIC FILTER LOGIC ---
        if (frm.doc.from_site) {
            // 'from_site' has a value. Fetch its 'site_type' from the server.
            // ASSUMPTION: Your DocType is 'Site' and field is 'site_type'
            frappe.db.get_value('Site', frm.doc.from_site, 'site_type', (r) => {
                let filters = {};
                filters['name'] = ['!=', frm.doc.from_site]; // Base filter

                // *** YOUR NEW LOGIC ***
                // ASSUMPTION: Your value is 'trade_partner'
                // if (r.site_type === 'trade_partner') {
                //     filters['site_type'] = ['!=', 'trade_partner'];
                // }
                // *** END OF NEW LOGIC ***

                frm.set_query('to_site', () => {
                    return { filters: filters };
                });
            });

        } else {
            // 'from_site' is empty. Remove all filters from 'to_site'.
            frm.set_query('to_site', () => {
                return { filters: {} };
            });
        }
        // // --- [END NEW] 'TO SITE' DYNAMIC FILTER LOGIC ---
    },

    to_site: function (frm) {
        if (frm.doc.from_site && frm.doc.to_site && frm.doc.from_site === frm.doc.to_site) {
            frappe.msgprint(__("From Site and To Site cannot be the same."));
            frm.set_value("to_site", "");
        }
    },

    date: function (frm) {
        // Merged Date Validation (on change)
        if (frm.doc.date) {
            let today = frappe.datetime.get_today();
            let past5 = frappe.datetime.add_days(today, -5);
            let tomorrow = frappe.datetime.add_days(today, 1);

            if (frm.doc.date < past5) {
                frappe.show_alert({
                    message: __("Date cannot be older than 5 days."),
                    indicator: "red",
                });
                frm.set_value("date", "");
            }
            else if (frm.doc.date > tomorrow) {
                frappe.show_alert({
                    message: __("You can select only up to tomorrow’s date."),
                    indicator: "red",
                });
                frm.set_value("date", "");
            }
        }
    },

    gate_pass_bookno: function (frm) {
        frm.set_value("gate_pass_no", "");
        apply_gate_pass_no_filter(frm);
    },

    show_items: function (frm) {
        if (!frm.doc.from_site || !frm.doc.baps_project || !frm.doc.item_type) {
            frappe.throw(__("Please select a From Site, Baps Project, and Item Type first."));
            return;
        }
        show_items_dialog(frm);
    },

    // Using 'driver_mobile_no' as per your Doctype JSON
    driver_mobile_no: function (frm) {
        let field_name = 'driver_mobile_no';
        let phone_number = frm.doc[field_name] || "";

        let national_number = phone_number.substring(3).trim();
        let digits = national_number.replace(/\D/g, "");

        if (digits.length > 0 && "012345".includes(digits[0])) {
            digits = digits.substring(1);
        }
        if (digits.length > 10) {
            digits = digits.substring(0, 10);
        }

        let corrected_number = "+91 " + digits;
        if (frm.doc[field_name] !== corrected_number) {
            frm.set_value(field_name, corrected_number);
        }
    },

});


//==================================================
// 4. 'Show Items' Dialog Functions
//==================================================

function show_items_dialog(frm) {
    const d = new frappe.ui.Dialog({
        title: 'Select Items to Add',
        fields: [{
            label: 'Baps Project',
            fieldname: 'baps_project',
            fieldtype: 'Link',
            options: 'Baps Project',
            reqd: true,
            default: frm.doc.baps_project,
            read_only: 1
        },
        {
            label: 'Item Type',
            fieldname: 'item_type',
            fieldtype: 'Link',
            options: 'Item Type',
            reqd: true,
            default: frm.doc.item_type,
            read_only: 1
        },
        { fieldtype: 'Section Break', label: `Available Blocks at ${frm.doc.from_site}` },
        { fieldname: 'items_html', fieldtype: 'HTML' }
        ],
        primary_action_label: 'Add Selected',
        primary_action: function () {
            const values = d.get_values();
            const selected_items = [];

            const checkedBoxes = d.$wrapper.find('input[data-item-checkbox="1"]:checked');
            checkedBoxes.each(function () {
                selected_items.push({
                    item_no: $(this).data('item-id'),
                    baps_project: values.baps_project,
                    item_type: values.item_type
                });
            });

            if (selected_items.length === 0) {
                frappe.msgprint(__('Please select at least one item.'));
                return;
            }

            const existing_items = (frm.doc.transport_item || []).map(row => row.item_no);
            let added_count = 0;
            selected_items.forEach(item => {
                if (!existing_items.includes(item.item_no)) {
                    let child_row = frm.add_child('transport_item');
                    child_row.baps_project = item.baps_project;
                    child_row.item_type = item.item_type;
                    child_row.item_no = item.item_no;
                    added_count++;
                }
            });

            frm.refresh_field('transport_item');
            frappe.show_alert({ message: __(added_count + " item(s) added to the table."), indicator: 'green' });
            d.hide();
        }
    });

    update_items_list(d, frm);
    d.show();
}

function lock_transport_grid(frm) {
    if (!frm.fields_dict.transport_item || !frm.fields_dict.transport_item.grid) {
        return;
    }

    const grid = frm.fields_dict.transport_item.grid;

    // Never allow adding rows manually in the grid UI
    grid.cannot_add_rows = true;

    const is_sender   = frappe.user_roles.includes('Transportation Sender') || frappe.user_roles.includes('Administrator');
    const is_receiver = frappe.user_roles.includes('Transportation Receiver');

    const parent_status = frm.doc.status || "Pending To Receive";
    const processedStatuses = ['Received', 'Not in this', 'Send to site'];

    const anyProcessed = (frm.doc.transport_item || []).some(r =>
        processedStatuses.includes(r.status)
    );

    const parentLocked = ['Full Received', 'Partially Received'].includes(parent_status);

    // Sender may delete only:
    // - while creating (unsaved), OR
    // - saved but parent not locked AND no processed child statuses
    const allowSenderDelete =
        is_sender &&
        (frm.is_new() || (!parentLocked && !anyProcessed));

    // Apply delete permissions on the grid
    grid.cannot_delete_rows = !allowSenderDelete;
    grid.cannot_delete_all_rows = !allowSenderDelete;

    frm.refresh_field('transport_item');

    // Hide / show bulk “Remove” button(s)
    const $wrapper = $(grid.wrapper);
    const $bulkRemoveBtn = $wrapper.find('.grid-remove-rows, .grid-remove-all-rows');
    allowSenderDelete ? $bulkRemoveBtn.show() : $bulkRemoveBtn.hide();

    // Intercept per-row delete clicks as a hard stop
    $wrapper
        .off('click.transport_delete_guard')
        .on('click.transport_delete_guard', '.grid-delete-row', function (e) {
            if (!allowSenderDelete) {
                e.stopImmediatePropagation();
                frappe.msgprint(__('Row deletion is not allowed for this document.'));
                return false;
            }
        });

    // =======================
    // Make child cells read-only
    // =======================

    // 1) Everyone: core fields are always read-only (no one edits data directly)
    const gridField = frm.get_field("transport_item").grid;
    ['item_no', 'item_type', 'baps_project'].forEach(f => {
        gridField.update_docfield_property(f, 'read_only', 1);
    });

    // 2) Receiver: can edit status + site until parent is locked
    //    (you can add 'Receiving' to parentLocked above if you want)
    const receiverCanEdit = is_receiver && !parentLocked;

    gridField.update_docfield_property('status', 'read_only', !receiverCanEdit);
    gridField.update_docfield_property('site',   'read_only', !receiverCanEdit);
    
    // 3) Hide the grid row edit button (form view button) for all rows
    gridField.grid_rows.forEach(function(row) {
        if (row.doc && row.wrapper) {
            $(row.wrapper).find('.grid-row-open').hide();
        }
    });
}

frappe.ui.form.on("Transportation Status R", {
    status: function (frm, cdt, cdn) {
        let row = locals[cdt][cdn];

        if (row.status === "Send to site") {
            frappe.model.set_value(cdt, cdn, "site", row.site || "");
            frappe.meta.get_docfield("Transportation Status R", "site", frm.doc.name).hidden = 0;
        } else {
            frappe.model.set_value(cdt, cdn, "site", "");
            frappe.meta.get_docfield("Transportation Status R", "site", frm.doc.name).hidden = 1;
        }

        frm.refresh_field("transport_item");
    },

    transport_item_add: function (frm) {
        toggle_header_fields(frm);
        lock_transport_grid(frm);
    },

    transport_item_remove: function (frm) {
        toggle_header_fields(frm);
        lock_transport_grid(frm);
    }
});

/**
 * This function fetches blocks or stones for the 'Show Items' dialog
 */
function update_items_list(dialog, frm) {
    const values = dialog.get_values();
    const $items_wrapper = dialog.fields_dict.items_html.$wrapper;
    const project = values?.baps_project;
    const item_type = values?.item_type;
    const from_site = frm.doc.from_site;

    if (!project || !item_type || !from_site) {
        $items_wrapper.html(`<p class="text-muted">Error: Missing Project, Item Type, or From Site.</p>`);
        return;
    }

    if (item_type === "Block") {
        fetch_blocks(dialog, frm, project, from_site, $items_wrapper);
    } else if (item_type === "Stone") {
        fetch_stones(dialog, frm, project, from_site, $items_wrapper);
    } else {
        $items_wrapper.html(`<p class="text-muted">Item type '${item_type}' is not currently supported.</p>`);
    }
}

/**
 * Fetch and display available Blocks
 */
function fetch_blocks(dialog, frm, project, from_site, $items_wrapper) {
    const existing_items = (frm.doc.transport_item || [])
        .filter(row => row.item_type === "Block")
        .map(row => row.item_no);

    frappe.call({
        method: "frappe.client.get_list",
        args: {
            doctype: "Block",
            filters: {
                'baps_project': project,
                'site': from_site,
                'transportation_status': 'Can Transit',
                'internal_status': 'Available'  // Only show Available blocks, not Consumed
            },
            fields: ["name", "block_number", "site", "transportation_status", "internal_status"],
            limit_page_length: 1000
        },
        callback: function (r) {
            let blocks = r.message || [];
            const new_blocks = blocks.filter(b => !existing_items.includes(b.name));

            if (new_blocks.length === 0) {
                if (blocks.length > 0) {
                    $items_wrapper.html(`<p class="text-muted">All available blocks from this site have already been added.</p>`);
                } else {
                    $items_wrapper.html(`<p class="text-muted">No available blocks found at ${from_site}. Make sure blocks have 'Can Transit' status and are 'Available'.</p>`);
                }
                return;
            }

            let html = `<table class="table table-bordered table-sm" style="font-size: 12px;">
                            <thead class="text-muted">
                                <tr>
                                    <th style="width: 30px;"></th>
                                    <th>Block Number</th>
                                    <th>Site</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>`;
            new_blocks.forEach(block => {
                const block_id = frappe.utils.escape_html(block.name);
                const block_number = frappe.utils.escape_html(block.block_number || block.name);
                const site = frappe.utils.escape_html(block.site || "");
                const status = frappe.utils.escape_html(block.internal_status || "");

                html += `
                    <tr>
                        <td><input type="checkbox" data-item-checkbox="1" data-item-id="${block_id}" /></td>
                        <td>${block_number}</td>
                        <td>${site}</td>
                        <td>${status}</td>
                    </tr>`;
            });
            html += `</tbody></table>`;

            $items_wrapper.html(`<div class="p-2 border rounded" style="max-height: 300px; overflow-y: auto;">${html}</div>`);
        }
    });
}

/**
 * Fetch and display available Stones from Size List Creation
 */
function fetch_stones(dialog, frm, project, from_site, $items_wrapper) {
    const existing_items = (frm.doc.transport_item || [])
        .filter(row => row.item_type === "Stone")
        .map(row => row.item_no);

    frappe.call({
        method: "baps.baps.doctype.transportation.transportation.get_available_stones",
        args: {
            'project': project,
            'site': from_site
        },
        callback: function (r) {
            let stones = r.message || [];
            const new_stones = stones.filter(s => !existing_items.includes(s.stone_id));

            if (new_stones.length === 0) {
                if (stones.length > 0) {
                    $items_wrapper.html(`<p class="text-muted">All available stones from this site have already been added.</p>`);
                } else {
                    $items_wrapper.html(`<p class="text-muted">No available stones found at ${from_site} for this project.</p>`);
                }
                return;
            }

            let html = `<table class="table table-bordered table-sm" style="font-size: 12px;">
                            <thead class="text-muted">
                                <tr>
                                    <th style="width: 30px;"></th>
                                    <th>Stone ID</th>
                                    <th>Stone Name</th>
                                    <th>Site</th>
                                    <th>Block No</th>
                                </tr>
                            </thead>
                            <tbody>`;
            new_stones.forEach(stone => {
                const stone_id = frappe.utils.escape_html(stone.stone_id);
                const stone_name = frappe.utils.escape_html(stone.stone_name || "-");
                const site = frappe.utils.escape_html(stone.site || "");
                const block_no = frappe.utils.escape_html(stone.block_no || "-");

                html += `
                    <tr>
                        <td><input type="checkbox" data-item-checkbox="1" data-item-id="${stone_id}" /></td>
                        <td>${stone_id}</td>
                        <td>${stone_name}</td>
                        <td>${site}</td>
                        <td>${block_no}</td>
                    </tr>`;
            });
            html += `</tbody></table>`;

            $items_wrapper.html(`<div class="p-2 border rounded" style="max-height: 300px; overflow-y: auto;">${html}</div>`);
        }
    });
}
frappe.ui.form.on('Transportation', {
    refresh(frm) {
        // Set query for child table field: item_number in "additional_items"
        frm.set_query('item_number', 'additional_items', function (doc, cdt, cdn) {
            let row = locals[cdt][cdn];
            let item_type = (row.item_type || "").trim();
            let from_site = (doc.from_site || "").trim();

            // Force dependencies
            if (!from_site) {
                frappe.msgprint(__("Please set 'From Site' on the main form first."));
                // return a query that yields no records
                return {
                    filters: {
                        name: ["=", "___no_result___"]
                    }
                };
            }

            if (!item_type) {
                frappe.msgprint(__("Please select 'Item Type' in this row first."));
                return {
                    filters: {
                        name: ["=", "___no_result___"]
                    }
                };
            }

            // NOTE:
            // Right now your child field `item_number` has options = "Block".
            // That means this query ALWAYS runs on DocType "Block".
            // If you later switch to Dynamic Link, this filter still works.

            return {
                // For a normal Link, you only need filters; doctype is taken from field.options.
                filters: {
                    site: from_site,
                    transportation_status: "Can Transit"
                }
            };
        });
    }
});
frappe.ui.form.on("Transportation Status R", {
    // Runs when a row is added
    transport_item_add: function (frm) {
        toggle_header_fields(frm);
    },
    // Runs when a row is removed
    transport_item_remove: function (frm) {
        toggle_header_fields(frm);
    }
});

// 3. The Logic Function
    function toggle_header_fields(frm) {
    // Check if there are any rows in the table
    let has_items = (frm.doc.transport_item || []).length > 0;

    // List of fields to lock
    let fields_to_lock = [
        "gate_pass_bookno",
        "gate_pass_no",
        "from_site",
        "to_site",
        "date",
        "sender_name",
        "vehicle_service_provider",
        "vehicle_number",
        "driver_name",
        "driver_mobile_no",
        "driver_name_manual",
        "driver_mobile_no_manual"
    ];

    // Loop through fields and set property based on 'has_items'
    // If has_items is true, read_only becomes 1. If false, 0.
    fields_to_lock.forEach(field => {
        frm.set_df_property(field, "read_only", has_items ? 1 : 0);
    });
}

frappe.ui.form.on('Additional Material Received', {
    accept: function (frm, cdt, cdn) {
        const row = locals[cdt][cdn];

        if (!frm.doc.to_site) {
            frappe.msgprint(__('Please set "To Site" on Transportation before accepting.'));
            return;
        }

        if (!row.item_type || !row.item_number) {
            frappe.msgprint(__('Item Type and Item Number are required before accepting.'));
            return;
        }

        if (row.decision_status && row.decision_status !== 'Pending') {
            frappe.msgprint(__('This row is already {0}.').format(row.decision_status));
            return;
        }

        frappe.call({
            method: 'baps.baps.doctype.transportation.transportation.accept_additional_item',
            args: {
                transportation: frm.doc.name,
                row_name: row.name
            },
            freeze: true,
            freeze_message: __('Accepting item...'),
            callback: function (r) {
                if (r.message) {
                    frappe.model.set_value(cdt, cdn, 'decision_status', r.message.decision_status);
                }

                frappe.show_alert({
                    message: __('Item accepted and moved to {0}.').format(frm.doc.to_site),
                    indicator: 'green'
                });

                frm.reload_doc(); // ensures grid re-renders with buttons disabled/hidden
            }
        });
    },

    reject: function (frm, cdt, cdn) {
        const row = locals[cdt][cdn];

        if (row.decision_status && row.decision_status !== 'Pending') {
            frappe.msgprint(__('This row is already {0}.').format(row.decision_status));
            return;
        }

        frappe.confirm(
            __('Are you sure you want to reject this additional item?'),
            function () {
                frappe.call({
                    method: 'baps.baps.doctype.transportation.transportation.reject_additional_item',
                    args: {
                        transportation: frm.doc.name,
                        row_name: row.name
                    },
                    freeze: true,
                    freeze_message: __('Rejecting item...'),
                    callback: function (r) {
                        if (r.message) {
                            frappe.model.set_value(cdt, cdn, 'decision_status', r.message.decision_status);
                        }

                        frappe.show_alert({
                            message: __('Item has been rejected.'),
                            indicator: 'orange'
                        });

                        frm.reload_doc();
                    }
                });
            }
        );
    },

    // Optional: per-row UI guard – disable buttons if already processed
    refresh: function (frm, cdt, cdn) {
        const row = locals[cdt][cdn];
        if (!frm.fields_dict.additional_items || !frm.fields_dict.additional_items.grid) {
            return;
        }

        const grid_row = frm.fields_dict.additional_items.grid.get_row(row.name);
        if (!grid_row) {
            return;
        }

        const processed = row.decision_status && row.decision_status !== 'Pending';

        // If processed, disable buttons at row level
        grid_row.toggle_enable('accept', !processed);
        grid_row.toggle_enable('reject', !processed);
    }
});
function set_child_status_options(frm) {
    // Check the fetched status from the receiving site
    var is_main_site = frm.doc.is_main_site_receiver; 
    
    // Get the base options list from the DocType (Transportation Status R > Status field)
    // Original options: Received\nNot in this\nSend to site
    var original_options = [
        "Received",
        "Not in this"
    ];

    if (is_main_site == 1) {
        // If it IS a Main Site, include "Send to site"
        original_options.push("Send to site");
    }

    var options_string = original_options.join('\n');
    
    // Apply the filtered options to the 'status' field in the child table DocType
    frm.set_df_property('transport_item', 'options', options_string, 'status');
    
    // Refresh the table view to show the updated options immediately
    frm.refresh_field('transport_item');
}


//==================================================
    // LOGIC FOR 'Additional Material Received'
    //==================================================
    // 'additional_items' is the fieldname for the table in Transportation
    // 'item_number' is the fieldname in the child table "Additional Material Received"
    // additional_items_item_number: function (frm, cdt, cdn) {
    //     let row = locals[cdt][cdn];

    //     // Get all required values
    //     let item_number = (row.item_number || "").trim();
    //     let item_type = (row.item_type || "").trim();
    //     let from_site = frm.doc.from_site;

    //     // 1. Clear fields if item_number is erased
    //     if (!item_number) {
    //         frappe.model.set_value(cdt, cdn, 'baps_project', '');
    //         return;
    //     }

    //     // 2. Check for dependencies
    //     if (!from_site) {
    //         frappe.msgprint(__("Please set the 'From Site' on the main form first."));
    //         frappe.model.set_value(cdt, cdn, 'item_number', '');
    //         return;
    //     }

    //     if (!item_type) {
    //         frappe.msgprint(__("Please select an 'Item Type' in this row first."));
    //         frappe.model.set_value(cdt, cdn, 'item_number', '');
    //         return;
    //     }

    //     // 3. Fetch the item from the server to validate it and get details
    //     frappe.call({
    //         method: "frappe.client.get_list",
    //         args: {
    //             doctype: item_type, // <-- DYNAMIC, not hardcoded "Block"
    //             filters: {
    //                 'name': item_number,
    //                 'site': from_site,
    //                 'transportation_status': 'Can Transit'
    //             },
    //             fields: ["name", "baps_project"] // Fetch fields to auto-fill
    //         },
    //         callback: function (r) {
    //             if (r.message && r.message.length > 0) {
    //                 // --- Success ---
    //                 let item = r.message[0];

    //                 // Auto-fill baps_project if it's not already set
    //                 if (!row.baps_project) {
    //                     frappe.model.set_value(cdt, cdn, 'baps_project', item.baps_project);
    //                 }

    //                 frappe.show_alert({
    //                     message: __("Item {0} ({1}) validated at site {2}.").format(item_number, item_type, from_site),
    //                     indicator: 'green'
    //                 });

    //             } else {
    //                 // --- Failure ---
    //                 frappe.msgprint(
    //                     __("Error: Item {0} ({1}) Was not at site '{2}' .")
    //                         .format(item_number, item_type, from_site)
    //                 );
    //                 frappe.model.set_value(cdt, cdn, 'item_number', ''); // Clear invalid entry
    //                 frappe.model.set_value(cdt, cdn, 'baps_project', '');
    //             }
    //         },
    //         error: function (r) {
    //             // This will catch errors if 'item_type' is not a real DocType
    //             // or if it's missing 'site'/'transportation_status' fields.
    //             frappe.msgprint(__("Error validating Item Type '{0}'. Check if it is a valid DocType with 'site' and 'transportation_status' fields.").format(item_type));
    //             frappe.model.set_value(cdt, cdn, 'item_number', '');
    //         }
    //     });
    // }