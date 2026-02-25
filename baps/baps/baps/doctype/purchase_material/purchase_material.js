(function () {
    // ======================================================
    // ALWAYS HIDE TOP 5 BUTTONS (Cut, Carved, Polish, Block, Lot)
    // ======================================================
    function hide_top_buttons(frm) {
        [
            "direct_cut_stone",
            "direct_carved_stone",
            "direct_polish_stone",
            "block_order",
            "lot_order"
        ].forEach(id => {
            if (frm.fields_dict[id]) {
                frm.fields_dict[id].$wrapper.hide();
            }
        });
    }

    // ======================================================
    // REMOVE AUTO-FOCUS UI ON ALL BUTTONS
    // ======================================================
    document.addEventListener("focusin", function (e) {
        const btn = e.target;
        if (btn.tagName === "BUTTON") {
            btn.blur();
            btn.style.outline = "none";
            btn.style.boxShadow = "none";
        }
    }, true);

    // ======================================================
    // SECTION CONFIG
    // ======================================================
    const SECTIONS = {
        direct_cut: {
            top_button: "direct_cut_stone",
            section: "direct_cut_stone_section",
            section_break: "section_break_mjkj",
            project_field: "baps_project",
            child_table: "direct_cut_stone_details",
            api_mode: "cut",
            show_field: "show_stones",
            pm_order_field: "order_id",
            required_fields: ["date", "trade_partner", "material_type", "baps_project"]
        },
        direct_carved: {
            top_button: "direct_carved_stone",
            section: "direct_carved_stone_section",
            section_break: "section_break_omra",
            project_field: "baps_projectt",
            child_table: "direct_carved_stone_details",
            api_mode: "carve",
            show_field: "show_stoness",
            pm_order_field: "carving_id",
            required_fields: ["date1", "trade_partnerr", "material_typee", "baps_projectt"]
        },
        direct_polish: {
            top_button: "direct_polish_stone",
            section: "direct_polish_stone_section",
            section_break: "section_break_vnpr",
            project_field: "baps_projecttt",
            child_table: "direct_polish_stone_details",
            api_mode: "polish",
            show_field: "show_stonesss",
            pm_order_field: "polishing_id",
            required_fields: ["dateee", "trade_partnerrr", "material_typeee", "baps_projecttt"]
        },
        block: {
            top_button: "block_order",
            section: "block_orderr_section",
            section_breaks: ["section_break_yoyc", "section_break_ekeb", "section_break_laae"],
            project_field: "baps_projectttt",
            child_table: "order_detail",
            pm_order_field: "block_order_id",
            required_fields: ["dateeee", "trade_partnerrrr", "site", "baps_projectttt", "item_type"]
        },
        lot: {
            top_button: "lot_order",
            section: "lot_orderr",
            section_breaks: ["section_break_wnhc", "section_break_ohdy", "section_break_tdyo", "section_break_dxlp"],
            project_field: "baps_projecttttt",
            pm_order_field: "lot_order_id",
            required_fields: ["dateeeee", "trade_partnerrrrr", "sitee", "baps_projecttttt", "item_typee"]
        }
    };

    const TOP_BUTTONS = [
        SECTIONS.direct_cut.top_button,
        SECTIONS.direct_carved.top_button,
        SECTIONS.direct_polish.top_button,
        SECTIONS.block.top_button,
        SECTIONS.lot.top_button
    ];

    function safe(fn) {
        try { fn(); } catch (e) { /* swallow */ }
    }

    // ======================================================
    // ⭐ UNIVERSAL CANCEL BUTTON
    // ======================================================
    function add_cancel_button_for_section(frm, section_key) {
        if (frm.custom_buttons && frm.custom_buttons["Cancel"]) {
            frm.custom_buttons["Cancel"].remove();
            delete frm.custom_buttons["Cancel"];
        }
        frm.add_custom_button(__("Cancel"), () => {
            frappe.confirm("Are you sure you want to cancel and go back?", () => {
                const s = SECTIONS[section_key];
                safe(() => frm.set_df_property(s.section, "hidden", 1));
                if (s.section_break) safe(() => frm.set_df_property(s.section_break, "hidden", 1));
                if (s.section_breaks)
                    s.section_breaks.forEach(sb =>
                        safe(() => frm.set_df_property(sb, "hidden", 1))
                    );
                show_top_buttons(frm);
                if (frm.custom_buttons["Cancel"]) {
                    frm.custom_buttons["Cancel"].remove();
                    delete frm.custom_buttons["Cancel"];
                }
                Object.keys(SECTIONS).forEach(k => {
                    (SECTIONS[k].required_fields || []).forEach(f => {
                        safe(() => frm.set_df_property(f, "reqd", 0));
                    });
                });
                frm.refresh();
            });
        }).addClass("btn-danger");
    }

    // ======================================================
    // REQUIRED FIELD HANDLER
    // ======================================================
    function apply_required_fields(frm, section_key) {
        Object.keys(SECTIONS).forEach(k => {
            (SECTIONS[k].required_fields || []).forEach(f => {
                if (frm.fields_dict[f]) frm.set_df_property(f, "reqd", 0);
            });
        });
        (SECTIONS[section_key].required_fields || []).forEach(f => {
            if (frm.fields_dict[f]) frm.set_df_property(f, "reqd", 1);
        });
    }

    // ======================================================
    // SHOW/HIDE SECTIONS
    // ======================================================
    function show_top_buttons(frm) {
        TOP_BUTTONS.forEach(id => safe(() => frm.fields_dict[id]?.$wrapper.show()));
    }

    function hide_sections_except(frm, key) {
        Object.keys(SECTIONS).forEach(k => {
            const s = SECTIONS[k];
            const hide = (k !== key);
            safe(() => frm.set_df_property(s.section, "hidden", hide));
            if (s.section_break) safe(() => frm.set_df_property(s.section_break, "hidden", hide));
            if (s.section_breaks)
                s.section_breaks.forEach(sb => safe(() => frm.set_df_property(sb, "hidden", hide)));
        });
    }

    function show_section(frm, key) {
        const s = SECTIONS[key];
        safe(() => {
            frm.set_df_property(s.section, "hidden", 0);
            if (s.section_break) frm.set_df_property(s.section_break, "hidden", 0);
            if (s.section_breaks)
                s.section_breaks.forEach(sb => frm.set_df_property(sb, "hidden", 0));
        });
        if (s.child_table && frm.fields_dict[s.child_table]) {
            frm.set_df_property(s.child_table, "hidden", 0);
        }
        safe(() => frm.scroll_to_field(s.section));
    }

    // ======================================================
    // AUTO DEFAULTS FOR BLOCK & LOT
    // ======================================================
    function auto_fill_block_order_defaults(frm) {
        if (!frm.doc.dateeee) frm.set_value("dateeee", frappe.datetime.get_today());
        if (!frm.doc.ordered_byyyy) frm.set_value("ordered_byyyy", frappe.session.user);
    }

    function auto_fill_lot_order_defaults(frm) {
        if (!frm.doc.dateeeee) frm.set_value("dateeeee", frappe.datetime.get_today());
        if (!frm.doc.ordered_byyyyy) frm.set_value("ordered_byyyyy", frappe.session.user);
    }

    // ======================================================
    // TOP BUTTON CLICK HANDLER
    // ======================================================
    function bind_top_buttons(frm) {
        TOP_BUTTONS.forEach(id => {
            safe(() => {
                const wrapper = frm.fields_dict[id]?.$wrapper;
                if (!wrapper) return;
                wrapper.show();
                const btn = wrapper.find("button");
                if (!btn.length) return;
                btn.off(`click.baps.${id}`);
                btn.on(`click.baps.${id}`, () => {
                    TOP_BUTTONS.forEach(h =>
                        safe(() => frm.fields_dict[h]?.$wrapper.hide())
                    );
                    const key = Object.keys(SECTIONS)
                        .find(k => SECTIONS[k].top_button === id);
                    hide_sections_except(frm, key);
                    show_section(frm, key);
                    add_cancel_button_for_section(frm, key);
                    apply_required_fields(frm, key);
                    if (key === "direct_cut") frm.set_value("ordered_by", frappe.session.user);
                    if (key === "direct_carved") frm.set_value("ordered_byy", frappe.session.user);
                    if (key === "direct_polish") frm.set_value("ordered_byyy", frappe.session.user);
                    if (key === "block") {
                        auto_fill_block_order_defaults(frm);
                        frm.set_value("ordered_byyyy", frappe.session.user);
                    }
                    if (key === "lot") {
                        auto_fill_lot_order_defaults(frm);
                        frm.set_value("ordered_byyyyy", frappe.session.user);
                    }
                });
            });
        });
    }

    // ======================================================
    // SHOW STONES BUTTON (CUT / CARVE / POLISH)
    // ======================================================
    function bind_show_stone_fields(frm) {
        Object.keys(SECTIONS).forEach(sectionKey => {
            const s = SECTIONS[sectionKey];
            if (!s.show_field) return;
            const field = frm.fields_dict[s.show_field];
            if (!field) return;
            field.$wrapper.off('click.baps_show_stones');
            field.$wrapper.on('click.baps_show_stones', function () {
                if (
                    frm.doc.order_id ||
                    frm.doc.carving_id ||
                    frm.doc.polishing_id ||
                    frm.doc.block_order_id ||
                    frm.doc.lot_order_id
                ) {
                    return frappe.msgprint("Order already placed. You cannot fetch stones now.");
                }
                if (!frm.doc[s.project_field]) {
                    return frappe.msgprint("Please select Project first.");
                }
                if (sectionKey === "direct_cut") return fetch_cut_stones_and_open_dialog(frm);
                if (sectionKey === "direct_carved") return fetch_carved_stones_and_open_dialog(frm);
                if (sectionKey === "direct_polish") return fetch_polish_stones_and_open_dialog(frm);
            });
        });
    }

    // ======================================================
    // FETCH FUNCTIONS
    // ======================================================
    function fetch_cut_stones_and_open_dialog(frm) {
        const proj = frm.doc[SECTIONS.direct_cut.project_field];
        if (!proj) return frappe.msgprint("Please select Project first.");
        frappe.call({
            method: "baps.baps.doctype.purchase_material.purchase_material.get_filtered_size_list_items",
            args: { baps_project: proj },
            freeze: true,
            freeze_message: "Fetching stones...",
            callback(r) {
                const stones = r.message || [];
                if (!stones.length) return frappe.msgprint("No stones found.");
                open_stone_selection_dialog(frm, "cut", stones);
            }
        });
    }

    function fetch_carved_stones_and_open_dialog(frm) {
        const proj = frm.doc[SECTIONS.direct_carved.project_field];
        if (!proj) return frappe.msgprint("Please select Project first.");
        frappe.call({
            method: "baps.baps.doctype.purchase_material.purchase_material.get_carving_required_stones",
            args: { baps_project: proj },
            freeze: true,
            freeze_message: "Loading carving stones...",
            callback(r) {
                const stones = r.message || [];
                if (!stones.length) return frappe.msgprint("No carving stones found.");
                open_stone_selection_dialog(frm, "carve", stones);
            }
        });
    }

    function fetch_polish_stones_and_open_dialog(frm) {
        const proj = frm.doc[SECTIONS.direct_polish.project_field];
        if (!proj) return frappe.msgprint("Please select Project first.");
        frappe.call({
            method: "baps.baps.doctype.purchase_material.purchase_material.get_polishing_required_stones",
            args: { baps_project: proj },
            freeze: true,
            freeze_message: "Loading polishing stones...",
            callback(r) {
                const stones = r.message || [];
                if (!stones.length) return frappe.msgprint("No polishing stones found.");
                open_stone_selection_dialog(frm, "polish", stones);
            }
        });
    }

    // ======================================================
    // FETCH ALL MAIN & SUB PARTS (MASTER DATA)
    // ======================================================
    function get_all_main_and_sub_parts(callback) {
        frappe.call({
            method: "baps.baps.doctype.purchase_material.purchase_material.get_all_main_and_sub_parts",
            callback(r) {
                callback(r.message || { main_parts: [], sub_parts: [] });
            }
        });
    }

    // ======================================================
    // UNIFIED DIALOG — WITH FULL MAIN PART & SUB PART LIST
    // ======================================================
    function open_stone_selection_dialog(frm, mode, stones) {
        if (frm._stone_dialog) {
            try { frm._stone_dialog.hide(); frm._stone_dialog.$wrapper.remove(); } catch (e) {}
            delete frm._stone_dialog;
        }

        const config = {
            cut: { title: "Select Stones (Cut)", child_table: "direct_cut_stone_details" },
            carve: { title: "Select Stones (Carving)", child_table: "direct_carved_stone_details" },
            polish: { title: "Select Stones (Polish)", child_table: "direct_polish_stone_details" }
        };

        const c = config[mode];
        if (!c) return frappe.msgprint("Invalid mode.");

        const d = new frappe.ui.Dialog({
            title: c.title,
            size: "extra-large",
            fields: [
                { fieldname: "filters_html", fieldtype: "HTML" },
                { fieldname: "stones_html", fieldtype: "HTML" }
            ],
            primary_action_label: "Add Selected Stones",
            primary_action() {
                // NOTE: main/sub are NOT mandatory now (per request) — allow empty values.
                const main = d._controls.main.get_value();
                const sub = d._controls.sub.get_value();
                const code = d._controls.code.get_value();
                const name = d._controls.name.get_value();

                const selected = d.$wrapper.find(".stone-checkbox:checked")
                    .map((i, el) => $(el).data("code")).get();

                if (!selected.length)
                    return frappe.msgprint("Select at least one stone.");

                let added = 0;

                selected.forEach(codeSelected => {
                    const st = stones.find(s => s.stone_code === codeSelected);
                    if (!st) return;

                    const row = frm.add_child(c.child_table);
                    // allow blank main/sub — assign if present
                    row.main_part = main || "";
                    row.sub_part = sub || "";
                    row.stone_code = st.stone_code || "";
                    row.stone_name = st.stone_name || "";
                    ["l1","l2","b1","b2","h1","h2","volume"].forEach(k => row[k] = st[k]);
                    added++;
                });

                frm.refresh_field(c.child_table);
                frappe.show_alert(`${added} stone(s) added.`);
                d.hide();
            }
        });

        frm._stone_dialog = d;
        d.show();

        // ======================================================
        // LOAD ALL MAIN PARTS & SUB PARTS (MASTER LISTS)
        // ======================================================
        // We still fetch master lists (all projects) to offer global values,
        // but CODE & NAME dropdowns will be built from the `stones` array (project-specific).
        get_all_main_and_sub_parts(function (lists) {

            const uniqueMainParts = lists.main_parts || [];
            const uniqueSubParts = lists.sub_parts || [];

            // Precompute unique codes & names from stones (project-specific)
            const uniqueCodes = [...new Set(stones.map(s => s.stone_code).filter(Boolean))];
            const uniqueNames = [...new Set(stones.map(s => s.stone_name).filter(Boolean))];

            d.fields_dict.filters_html.$wrapper.html(`
                <div style="display:flex; gap:10px; margin-bottom:10px; align-items:flex-end; flex-wrap:wrap;">

                    <div style="width:20%;">
                        <label>Main Part</label>
                        <select id="main_part_select" class="form-control">
                            <option value=""></option>
                            ${uniqueMainParts.map(m => `<option value="${m}">${m}</option>`).join('')}
                        </select>
                    </div>

                    <div style="width:20%;">
                        <label>Sub Part</label>
                        <select id="sub_part_select" class="form-control">
                            <option value=""></option>
                            ${uniqueSubParts.map(s => `<option value="${s}">${s}</option>`).join('')}
                        </select>
                    </div>

                    <div style="width:20%;">
                        <label>Stone Code</label>
                        <select id="stone_code_select" class="form-control">
                            <option value=""></option>
                            ${uniqueCodes.map(c => `<option value="${c}">${c}</option>`).join('')}
                        </select>
                    </div>

                    <div style="width:20%;">
                        <label>Stone Name</label>
                        <select id="stone_name_select" class="form-control">
                            <option value=""></option>
                            ${uniqueNames.map(n => `<option value="${n}">${n}</option>`).join('')}
                        </select>
                    </div>

                    <div style="width:10%; padding-top:22px;">
                        <button class="btn btn-sm btn-light" id="clear_filters_btn">Clear</button>
                    </div>

                </div>
                <hr>
            `);

            // Store controls
            d._controls = {
                main: { get_value: () => d.$wrapper.find("#main_part_select").val() },
                sub: { get_value: () => d.$wrapper.find("#sub_part_select").val() },
                code: { get_value: () => d.$wrapper.find("#stone_code_select").val() },
                name: { get_value: () => d.$wrapper.find("#stone_name_select").val() }
            };

            // Bind change events for all filters
            d.$wrapper.find("#main_part_select, #sub_part_select, #stone_code_select, #stone_name_select")
                .on("change", () => update_stones_table(d, stones));

            // Clear filter button: reset all four selects and refresh table
            d.$wrapper.find("#clear_filters_btn").on("click", function () {
                d.$wrapper.find("#main_part_select").val("");
                d.$wrapper.find("#sub_part_select").val("");
                d.$wrapper.find("#stone_code_select").val("");
                d.$wrapper.find("#stone_name_select").val("");
                update_stones_table(d, stones);
            });

            // initial render
            update_stones_table(d, stones);
        });

        d.onhide = () => {
            try { d.$wrapper.remove(); } catch (e) {}
            delete frm._stone_dialog;
        };
    }

    // ======================================================
    // STONE TABLE RENDERER — FILTER BY MAIN / SUB / STONE CODE / STONE NAME
    // ======================================================
    function update_stones_table(dialog, stones) {
        // Defensive: ensure controls exist
        if (!dialog._controls) {
            dialog.fields_dict.stones_html.$wrapper.html(`<p style="text-align:center;padding:20px;color:#777;">Loading...</p>`);
            return;
        }

        const main = dialog._controls.main.get_value();
        const sub = dialog._controls.sub.get_value();

        // Build unique code/name lists from the stones source (project-specific)
        const uniqueCodes = [...new Set(stones.map(s => s.stone_code).filter(Boolean))];
        const uniqueNames = [...new Set(stones.map(s => s.stone_name).filter(Boolean))];

     // Always show FULL stone code & stone name list (master list)
const $code = dialog.$wrapper.find("#stone_code_select");
const $name = dialog.$wrapper.find("#stone_name_select");

// Store current selected values (so we don't lose selection)
const selectedCode = $code.val();
const selectedName = $name.val();

// Rebuild dropdowns fresh (full list)
$code.empty().append(`<option value=""></option>`);
$name.empty().append(`<option value=""></option>`);

uniqueCodes.forEach(c => {
    $code.append(`<option value="${c}">${c}</option>`);
});

uniqueNames.forEach(n => {
    $name.append(`<option value="${n}">${n}</option>`);
});

// Restore user selection after rebuild
if (selectedCode) $code.val(selectedCode);
if (selectedName) $name.val(selectedName);

        const filterCode = $code.val();
        const filterName = $name.val();

        // Apply filters progressively
        let filtered = stones.slice();

        if (main) filtered = filtered.filter(s => s.main_part === main);
        if (sub) filtered = filtered.filter(s => s.sub_part === sub);
        if (filterCode) filtered = filtered.filter(s => s.stone_code === filterCode);
        if (filterName) filtered = filtered.filter(s => s.stone_name === filterName);

        // Build table HTML
        let html = `<div style="max-height:420px;overflow:auto;border:1px solid #ddd;border-radius:6px;">`;

        if (!filtered.length) {
            html += `<p style="text-align:center;padding:20px;color:#777;">No stones found.</p>`;
        } else {
            html += `
                <table class="table table-bordered table-sm">
                    <thead>
                        <tr>
                            <th style="width:40px;">Select</th>
                            <th>Stone Code</th>
                            <th>Stone Name</th>
                            <th>L1</th><th>L2</th>
                            <th>B1</th><th>B2</th>
                            <th>H1</th><th>H2</th>
                            <th>Volume</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            filtered.forEach(s => {
                html += `
                    <tr>
                        <td style="text-align:center;"><input type="checkbox" class="stone-checkbox" data-code="${s.stone_code}"></td>
                        <td>${s.stone_code || ""}</td>
                        <td>${s.stone_name || ""}</td>
                        <td>${s.l1 ?? ""}</td><td>${s.l2 ?? ""}</td>
                        <td>${s.b1 ?? ""}</td><td>${s.b2 ?? ""}</td>
                        <td>${s.h1 ?? ""}</td><td>${s.h2 ?? ""}</td>
                        <td>${s.volume ?? ""}</td>
                    </tr>
                `;
            });
            html += `</tbody></table>`;
        }

        html += `</div>`;

        dialog.fields_dict.stones_html.$wrapper.html(html);

        // Ensure filter selects still bound (re-bind change events to keep responsive)
        if ($code.length && $name.length) {
            $code.off("change").on("change", () => update_stones_table(dialog, stones));
            $name.off("change").on("change", () => update_stones_table(dialog, stones));
        }
    }

    // ======================================================
    // BLOCK / LOT UTILITY
    // ======================================================
    function calculate_volume_and_validate_pm(frm, cdt, cdn) {
        try {
            const row = locals[cdt][cdn];
            const length = row.length || 0;
            const breadth = row.breadth || 0;
            const height = row.height || 0;
            const qty = row.block_quantity || 0;
            frappe.model.set_value(cdt, cdn, "volume", length * breadth * height * qty);
        } catch (e) { }
    }

    function calculate_volumes_pm(frm) {
        if (!frm.doc.order_detail) return;
        frm.doc.order_detail.forEach(row =>
            calculate_volume_and_validate_pm(frm, row.doctype, row.name)
        );
    }

    // ======================================================
    // CHILD TABLE GRID LOCKER
    // ======================================================
    function lock_grid(frm, tablefield) {
        frappe.after_ajax(() => {
            const field = frm.fields_dict[tablefield];
            if (!field) return;
            const grid = field.grid;
            const $w = $(grid.wrapper);
            $w.find(".grid-add-row, .grid-footer, .btn-open-row").hide();
            grid.cannot_add_rows = true;
            grid.cannot_delete_rows = false;
            setTimeout(() => $w.find(".grid-add-row").hide(), 200);
        });
    }

    // ======================================================
    // HIDE AMEND & MENU BUTTONS
    // ======================================================
    function hide_amend_buttons(frm) {
        try {
            const $page = frm.page.wrapper;
            $page.find("button").each(function () {
                const txt = $(this).text().trim().toLowerCase();
                if (txt === "amend" || txt === "…" || txt === "...") $(this).hide();
            });
            $page.find(".menu-btn-group, .btn-default.dropdown-toggle").hide();
            $page.find(".dropdown-menu a").each(function () {
                if ($(this).text().trim().toLowerCase() === "amend")
                    $(this).closest("li").hide();
            });
        } catch (e) { }
    }

    // ======================================================
    // MAIN FORM EVENTS
    // ======================================================
    const CHILD_TABLES_LOCK_ONLY = [
        "direct_cut_stone_details",
        "direct_carved_stone_details",
        "direct_polish_stone_details"
    ];

    frappe.ui.form.on("Purchase Material", {
        refresh(frm) {
            hide_amend_buttons(frm);
            if (frm.is_new()) {
                show_top_buttons(frm);
                bind_top_buttons(frm);
                bind_show_stone_fields(frm);
                CHILD_TABLES_LOCK_ONLY.forEach(name => lock_grid(frm, name));
                frm.enable_save();
                $(frm.page.wrapper).find(".primary-action").show();
                return;
            }

            TOP_BUTTONS.forEach(id => {
                if (frm.fields_dict[id]) frm.fields_dict[id].$wrapper.hide();
            });

            let showSection = "";
            if (frm.doc.order_id) showSection = "direct_cut";
            else if (frm.doc.carving_id) showSection = "direct_carved";
            else if (frm.doc.polishing_id) showSection = "direct_polish";
            else if (frm.doc.block_order_id) showSection = "block";
            else if (frm.doc.lot_order_id) showSection = "lot";
            else if (frm.doc.direct_cut_stone_details?.length > 0) showSection = "direct_cut";
            else if (frm.doc.direct_carved_stone_details?.length > 0) showSection = "direct_carved";
            else if (frm.doc.direct_polish_stone_details?.length > 0) showSection = "direct_polish";
            else if (frm.doc.order_detail?.length > 0) showSection = "block";

            Object.keys(SECTIONS).forEach(k => {
                const s = SECTIONS[k];
                safe(() => frm.set_df_property(s.section, "hidden", 1));
                if (s.section_break) safe(() => frm.set_df_property(s.section_break, "hidden", 1));
                if (s.section_breaks)
                    s.section_breaks.forEach(sb => safe(() => frm.set_df_property(sb, "hidden", 1)));
                if (s.child_table && frm.fields_dict[s.child_table]) {
                    frm.set_df_property(s.child_table, "hidden", 1);
                }
            });

            if (showSection) show_section(frm, showSection);
            CHILD_TABLES_LOCK_ONLY.forEach(name => lock_grid(frm, name));

            const orderPlaced =
                frm.doc.order_id ||
                frm.doc.carving_id ||
                frm.doc.polishing_id ||
                frm.doc.block_order_id ||
                frm.doc.lot_order_id;

            if (orderPlaced) {
                frm.disable_save();
                $(frm.page.wrapper).find(".primary-action").hide();
            } else {
                frm.enable_save();
                $(frm.page.wrapper).find(".primary-action").show();
            }

            frm.page.add_menu_item("Place Order", () => {
                let section = "";
                if (frm.doc.direct_cut_stone_details?.length > 0) section = "cut";
                else if (frm.doc.direct_carved_stone_details?.length > 0) section = "carve";
                else if (frm.doc.direct_polish_stone_details?.length > 0) section = "polish";
                else if (frm.doc.order_detail?.length > 0) section = "block";
                else return frappe.msgprint("No stones / data to place order.");
                frappe.call({
                    method: "baps.baps.doctype.purchase_material.purchase_material.place_section_order",
                    args: { purchase_material_name: frm.doc.name, section: section },
                    freeze: true,
                    freeze_message: "Placing order...",
                    callback(r) {
                        if (r.message) frappe.show_alert("Order Created: " + r.message);
                    }
                });
            });

            ["order_detail", "lot_order_details"].forEach(field => {
                const f = frm.fields_dict[field];
                if (f) {
                    const g = f.grid;
                    g.cannot_add_rows = false;
                    g.cannot_delete_rows = false;
                    $(g.wrapper).find(".grid-add-row, .btn-open-row, .grid-remove-row").show();
                }
            });

            setTimeout(() => hide_amend_buttons(frm), 500);
        }
    });

    // ======================================================
    // INVOICE POPUP (BLOCK & LOT)
    // ======================================================
    frappe.ui.form.on("Purchase Material", {
        invoice_to_be_paid_after_block_receipt(frm) {
            if (frm.doc.invoice_to_be_paid_after_block_receipt) {
                frappe.msgprint({
                    title: __("Notice"),
                    message: __("This will be handled after payment method."),
                    indicator: "orange"
                });
            }
        },
        invoice_to_be_paid_after_block_receiptt(frm) {
            if (frm.doc.invoice_to_be_paid_after_block_receiptt) {
                frappe.msgprint({
                    title: __("Notice"),
                    message: __("This will be handled after payment method."),
                    indicator: "orange"
                });
            }
        }
    });

    // ======================================================
    // REALTIME ORDER ID UPDATE
    // ======================================================
    frappe.realtime.on("pm_order_created", (data) => {
        const frm = cur_frm;
        if (!frm || !data?.order_id) return;
        const new_id = data.order_id;
        if (frm.doc.direct_cut_stone_details?.length > 0)
            frm.set_value("order_id", new_id);
        else if (frm.doc.direct_carved_stone_details?.length > 0)
            frm.set_value("carving_id", new_id);
        else if (frm.doc.direct_polish_stone_details?.length > 0)
            frm.set_value("polishing_id", new_id);
        else if (frm.doc.order_detail?.length > 0)
            frm.set_value("block_order_id", new_id);
        else
            frm.set_value("lot_order_id", new_id);
        frappe.show_alert("Order ID Generated: " + new_id);
    });

    // ======================================================
    // DIRECT CUT STONE — SHOW STONES FUNCTIONALITY
    // ======================================================
    frappe.ui.form.on("Direct Cut Stone", {
        refresh(frm) {
            // Bind Show Stones button
            setTimeout(() => {
                const btn = $('button:contains("Show Stones")');
                if (btn.length) {
                    btn.off("click").on("click", () => fetch_and_show_stones_for_direct_cut(frm));
                }
            }, 300);
        },

        onload(frm) {
            // Auto Ordered By
            if (!frm.doc.ordered_by) {
                frm.set_value("ordered_by", frappe.session.user_fullname || frappe.session.user);
            }

            // Hide grid buttons (Add Row, Bulk Edit, etc)
            frappe.after_ajax(() => {
                if (frm.fields_dict.direct_cut_stone_details) {
                    let grid = frm.fields_dict.direct_cut_stone_details.grid;
                    $(grid.wrapper).find(".grid-add-row").hide();
                    $(grid.wrapper).find(".grid-add-row-container").hide();
                    $(grid.wrapper).find(".btn-open-row").hide();
                    $(grid.wrapper).find(".grid-empty").hide();
                    grid.cannot_add_rows = true;
                }
            });
        }
    });

    // ===================================================================
    // FETCH STONES FOR DIRECT CUT
    // ===================================================================
    function fetch_and_show_stones_for_direct_cut(frm) {
        if (!frm.doc.baps_project) {
            frappe.msgprint("Please select BAPS Project first.");
            return;
        }

        frappe.call({
            method: "baps.baps.doctype.purchase_material.purchase_material.get_published_stones",
            args: {
                baps_project: frm.doc.baps_project
            },
            freeze: true,
            freeze_message: "Fetching stones...",
            callback(r) {
                const stones = r.message || [];
                if (!stones.length) {
                    frappe.msgprint("No stones found for this project.");
                    return;
                }
                show_stone_selection_dialog_for_direct_cut(frm, stones);
            }
        });
    }

    // ===================================================================
    // STONE SELECTION DIALOG FOR DIRECT CUT
    // ===================================================================
    function show_stone_selection_dialog_for_direct_cut(frm, stones) {
        const d = new frappe.ui.Dialog({
            title: "Select Stones",
            size: "extra-large",
            fields: [
                { fieldname: "filters_html", fieldtype: "HTML" },
                { fieldname: "stones_html", fieldtype: "HTML" }
            ],
            primary_action_label: "Add Selected Stones",
            primary_action() {
                const main = d.$wrapper.find("#main_part_box input").val();
                const sub = d.$wrapper.find("#sub_part_box input").val();

                if (!main || !sub) {
                    frappe.msgprint("Main Part & Sub Part are required.");
                    return;
                }

                const selected_codes = [];
                d.$wrapper.find(".stone-checkbox:checked").each(function () {
                    selected_codes.push($(this).data("code"));
                });

                if (!selected_codes.length) {
                    frappe.msgprint("Select at least one stone.");
                    return;
                }

                let added = 0;
                selected_codes.forEach(code => {
                    const stone = stones.find(s => s.stone_code === code);
                    if (stone) {
                        let row = frm.add_child("direct_cut_stone_details");
                        row.main_part = main;
                        row.sub_part = sub;
                        row.stone_code = stone.stone_code;
                        row.l1 = stone.l1;
                        row.l2 = stone.l2;
                        row.b1 = stone.b1;
                        row.b2 = stone.b2;
                        row.h1 = stone.h1;
                        row.h2 = stone.h2;
                        row.volume = stone.volume;
                        added++;
                    }
                });

                frm.refresh_field("direct_cut_stone_details");
                frappe.show_alert(`${added} stone(s) added.`);
                d.hide();
            }
        });

        const filters_ui = `
            <div style="display:flex; gap:10px; margin-bottom:10px; align-items:center;">
                <div id="main_part_box" style="width:25%;"></div>
                <div id="sub_part_box" style="width:25%;"></div>
            </div>
            <hr>
        `;

        d.fields_dict.filters_html.$wrapper.html(filters_ui);

        frappe.ui.form.make_control({
            parent: d.$wrapper.find("#main_part_box"),
            df: {
                fieldtype: "Link",
                label: "Main Part",
                options: "Main Part",
                reqd: 1,
                onchange: () => update_stones_table_for_direct_cut(d, stones)
            },
            render_input: true
        });

        frappe.ui.form.make_control({
            parent: d.$wrapper.find("#sub_part_box"),
            df: {
                fieldtype: "Link",
                label: "Sub Part",
                options: "Sub Part",
                reqd: 1,
                onchange: () => update_stones_table_for_direct_cut(d, stones)
            },
            render_input: true
        });

        d.show();
        update_stones_table_for_direct_cut(d, stones);
    }

    // ===================================================================
    // UPDATE STONES TABLE FOR DIRECT CUT
    // ===================================================================
    function update_stones_table_for_direct_cut(dialog, stones) {
        const main = dialog.fields_dict.filters_html.$wrapper.find("#main_part_box input").val();
        const sub = dialog.fields_dict.filters_html.$wrapper.find("#sub_part_box input").val();

        let filtered = stones;
        if (main) filtered = filtered.filter(s => s.main_part === main);
        if (sub) filtered = filtered.filter(s => s.sub_part === sub);

        if (!filtered.length) {
            dialog.fields_dict.stones_html.$wrapper.html(
                `<p style="text-align:center;">No stones found.</p>`
            );
            return;
        }

        let html = `
            <div style="max-height:420px;overflow:auto;border:1px solid #ddd;border-radius:6px;">
            <table class="table table-bordered table-sm">
                <thead>
                    <tr>
                        <th>Select</th>
                        <th>Stone Code</th>
                        <th>L1</th><th>L2</th>
                        <th>B1</th><th>B2</th>
                        <th>H1</th><th>H2</th>
                        <th>Volume</th>
                    </tr>
                </thead>
                <tbody>
        `;

        filtered.forEach(s => {
            html += `
                <tr>
                    <td><input type="checkbox" class="stone-checkbox" data-code="${s.stone_code}"></td>
                    <td>${s.stone_code}</td>
                    <td>${s.l1}</td><td>${s.l2}</td>
                    <td>${s.b1}</td><td>${s.b2}</td>
                    <td>${s.h1}</td><td>${s.h2}</td>
                    <td>${s.volume}</td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
            </div>
            <div style="text-align:right;padding:5px;font-weight:600;">
                ${filtered.length} stone(s) found.
            </div>
        `;

        dialog.fields_dict.stones_html.$wrapper.html(html);
    }

})();