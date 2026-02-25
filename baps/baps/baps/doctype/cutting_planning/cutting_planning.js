// // optimized cutting_planning dialog (full replacement for baps.stone_dialog)
// frappe.provide('baps.stone_dialog');

// baps.stone_dialog = {
//     show: function (frm) {
//         // Create dialog fields (including saved_filters)
//         let d = new frappe.ui.Dialog({
//             title: __('Select Stones - Filter & Search'),
//             size: 'extra-large',
//             fields: [
//                 {
//                     fieldname: 'filter_no',
//                     fieldtype: 'Data',
//                     label: __('Filter No')
//                 },
//                 {
//                     fieldname: 'saved_filters',
//                     fieldtype: 'Select',
//                     label: __('Load Saved Filter'),
//                     options: [''],
//                     default: ''
//                 },
//                 {
//                     fieldtype: 'Section Break',
//                     label: __('Filter Criteria')
//                 },
//                 {
//                     fieldname: 'project',
//                     fieldtype: 'Link',
//                     label: __('Project'),
//                     options: 'Baps Project'
//                 },
//                 {
//                     fieldname: 'main_part',
//                     fieldtype: 'Link',
//                     label: __('Main Part'),
//                     options: 'Main Part'
//                 },
//                 {
//                     fieldtype: 'Column Break'
//                 },
//                 {
//                     fieldname: 'sub_part',
//                     fieldtype: 'MultiSelectPills',
//                     label: __('Sub Part'),
//                     get_data: function(txt) {
//                         return frappe.db.get_link_options('Sub Part', txt);
//                     }
//                 },
//                 {
//                     fieldname: 'stone_name',
//                     fieldtype: 'Autocomplete',
//                     label: __('Stone Name'),
//                     options: []
//                 },

//                 {
//                     fieldtype: 'Section Break',
//                     label: __('Dimension Filters')
//                 },
//                 {
//                     fieldname: 'l1_filter_type',
//                     fieldtype: 'Select',
//                     label: __('L1 (Length) Filter'),
//                     options: ['None', 'Below', 'Between'],
//                     default: 'None',
//                     onchange: function () {
//                         baps.stone_dialog.toggle_dimension_fields(d, 'l1');
//                     }
//                 },
//                 {
//                     fieldname: 'l1_below',
//                     fieldtype: 'Float',
//                     label: __('L1 Below'),
//                     hidden: 1
//                 },
//                 {
//                     fieldname: 'l1_between_from',
//                     fieldtype: 'Float',
//                     label: __('L1 From'),
//                     hidden: 1
//                 },
//                 {
//                     fieldname: 'l1_between_to',
//                     fieldtype: 'Float',
//                     label: __('L1 To'),
//                     hidden: 1
//                 },

//                 {
//                     fieldtype: 'Column Break'
//                 },
//                 {
//                     fieldname: 'b1_filter_type',
//                     fieldtype: 'Select',
//                     label: __('B1 (Breadth) Filter'),
//                     options: ['None', 'Below', 'Between'],
//                     default: 'None',
//                     onchange: function () {
//                         baps.stone_dialog.toggle_dimension_fields(d, 'b1');
//                     }
//                 },
//                 {
//                     fieldname: 'b1_below',
//                     fieldtype: 'Float',
//                     label: __('B1 Below'),
//                     hidden: 1
//                 },
//                 {
//                     fieldname: 'b1_between_from',
//                     fieldtype: 'Float',
//                     label: __('B1 From'),
//                     hidden: 1
//                 },
//                 {
//                     fieldname: 'b1_between_to',
//                     fieldtype: 'Float',
//                     label: __('B1 To'),
//                     hidden: 1
//                 },

//                 {
//                     fieldtype: 'Column Break'
//                 },
//                 {
//                     fieldname: 'h1_filter_type',
//                     fieldtype: 'Select',
//                     label: __('H1 (Height) Filter'),
//                     options: ['None', 'Below', 'Between'],
//                     default: 'None',
//                     onchange: function () {
//                         baps.stone_dialog.toggle_dimension_fields(d, 'h1');
//                     }
//                 },
//                 {
//                     fieldname: 'h1_below',
//                     fieldtype: 'Float',
//                     label: __('H1 Below'),
//                     hidden: 1
//                 },
//                 {
//                     fieldname: 'h1_between_from',
//                     fieldtype: 'Float',
//                     label: __('H1 From'),
//                     hidden: 1
//                 },
//                 {
//                     fieldname: 'h1_between_to',
//                     fieldtype: 'Float',
//                     label: __('H1 To'),
//                     hidden: 1
//                 },

//                 {
//                     fieldtype: 'Section Break'
//                 },
//                 {
//                     fieldname: 'search_btn',
//                     fieldtype: 'Button',
//                     label: __('🔍 Search Stones'),
//                     click: function () {
//                         baps.stone_dialog.search_stones(frm, d);
//                     }
//                 },
//                 {
//                     fieldtype: 'Section Break',
//                     label: __('Available Stones')
//                 },
//                 {
//                     fieldname: 'stones_html',
//                     fieldtype: 'HTML'
//                 }
//             ],
//             primary_action_label: __('Add Selected Stones'),
//             primary_action: function(values) {
//                 baps.stone_dialog.add_selected_stones(frm, d);
//             }
//         });

//         // Show dialog
//         d.show();




//         // Create left-side footer container
//         d.$wrapper.find('.modal-footer').prepend(`
//             <div class="left-footer-buttons" style="float:left; display:flex; gap:8px;"></div>
//         `);



//         // Populate saved filters + stone names, and auto-generate filter no
//         baps.stone_dialog.load_saved_filters(d);
//         baps.stone_dialog.load_stone_names(d);

//         // Auto-generate Filter No (and ensure buttons update)
//         frappe.call({
//             method: 'baps.baps.doctype.cutting_planning.cutting_planning.generate_filter_no',
//             callback: function (r) {
//                 if (r.message) {
//                     // set and update button state
//                     d.set_value('filter_no', r.message);
//                     // ensure Save button is visible for auto-filled numbers
//                     baps.stone_dialog.update_dialog_buttons(d, null);
//                 }
//             }
//         });

//         // Wire saved_filters change -> load filter
//         d.fields_dict.saved_filters.$input.on('change', function() {
//             const selected = d.get_value('saved_filters') || '';
//             if (selected && selected.trim()) {
//                 // Load the selected saved filter
//                 baps.stone_dialog.load_filter(frm, d, selected);
//             } else {
//                 // Clear dialog (but keep auto-generated filter_no if present)
//                 // Reset to new state
//                 let curr_filter_no = d.get_value('filter_no') || '';
//                 d.clear();
//                 d.set_value('filter_no', curr_filter_no);
//                 baps.stone_dialog.update_dialog_buttons(d, null);
//             }
//         });

//         // Ensure filter_no field input toggles Save button (covers manual typing)
//         d.fields_dict.filter_no.$input.on('input', function() {
//             // if user types something, show Save New button
//             baps.stone_dialog.update_dialog_buttons(d, null);
//         });

//         // Bind show-filters small button in footer for manage filters table (inside left-footer-buttons)
//         d.$wrapper.find('.left-footer-buttons').append(`
//             <button class="btn btn-secondary btn-sm show-filters-btn" type="button">
//                 ${__('Show Filters')}
//             </button>
//         `);
//         d.$wrapper.find('.show-filters-btn').on('click', function() {
//             baps.stone_dialog.show_filters_table(frm, d);
//         });

//         // Initial search
//         setTimeout(() => {
//             baps.stone_dialog.search_stones(frm, d);
//         }, 300);
//     },

//     // Toggle dimension helper
//     toggle_dimension_fields: function (dialog, dimension) {
//         let type = dialog.get_value(`${dimension}_filter_type`);
//         // if field not defined, skip
//         if (!dialog.get_field(`${dimension}_below`)) return;
//         dialog.get_field(`${dimension}_below`).df.hidden = (type !== 'Below');
//         dialog.get_field(`${dimension}_between_from`).df.hidden = (type !== 'Between');
//         dialog.get_field(`${dimension}_between_to`).df.hidden = (type !== 'Between');
//         dialog.refresh();
//     },

//     // Loads stone names for autocomplete
//     load_stone_names: function(dialog) {
//         frappe.call({
//             method: 'baps.baps.doctype.cutting_planning.cutting_planning.get_stone_names',
//             callback: function (r) {
//                 if (r.message && r.message.length > 0) {
//                     dialog.fields_dict.stone_name.df.options = r.message;
//                     dialog.fields_dict.stone_name.refresh();
//                 }
//             }
//         });
//     },

//     // Load saved filters into the saved_filters select
//     load_saved_filters: function(dialog) {
//         frappe.call({
//             method: 'baps.baps.doctype.cutting_planning.cutting_planning.get_saved_filters',
//             callback: function (r) {
//                 // r.message expected array of filter_no strings
//                 let opts = [''];
//                 if (r.message && r.message.length) {
//                     r.message.forEach(f => opts.push(f));
//                 }
//                 dialog.set_df_property('saved_filters', 'options', opts);
//                 dialog.refresh_field('saved_filters');
//             }
//         });
//     },

   


//     // Central dialog button state manager
//     // loaded_filter_no param (string) indicates dialog loaded from an existing saved filter
//     update_dialog_buttons: function(dialog, loaded_filter_no = null) {

//     // Remove previously generated buttons
//     dialog.$wrapper.find('.btn-save-filter, .btn-add-new, .btn-save-new-filter').remove();

//     const leftContainer = dialog.$wrapper.find('.left-footer-buttons');

//     const is_loaded = !!loaded_filter_no || !!dialog.get_value('saved_filters');
//     const filter_no_value = (dialog.get_value('filter_no') || '').toString().trim();

//     // Primary button stays on the right side (default placement)
//     dialog.set_primary_action(__('Add Selected Stones'), () => {
//         dialog.primary_action && dialog.primary_action();
//     });

//     // ---- BUTTON GROUP (Left Side) ----
//     // If loaded filter → Show (Save Filter + Add New)
//     if (is_loaded) {

//         // Save existing filter
//         leftContainer.append(`
//             <button class="btn btn-success btn-sm btn-save-filter">
//                 💾 ${__('Save Filter')}
//             </button>
//         `);

//         // Add new filter
//         leftContainer.append(`
//             <button class="btn btn-info btn-sm btn-add-new">
//                 ➕ ${__('Add New')}
//             </button>
//         `);

//         dialog.$wrapper.find('.btn-save-filter').off('click').on('click', () => {
//             const existing = dialog.get_value('saved_filters') || null;
//             baps.stone_dialog.save_filter(dialog, existing);
//         });

//         dialog.$wrapper.find('.btn-add-new').off('click').on('click', () => {
//             dialog.clear();
//             dialog.set_value('saved_filters', '');
//             frappe.call({
//                 method: 'baps.baps.doctype.cutting_planning.cutting_planning.generate_filter_no',
//                 callback: function(r) {
//                     if (r.message) {
//                         dialog.set_value('filter_no', r.message);
//                         baps.stone_dialog.update_dialog_buttons(dialog, null);
//                     }
//                 }
//             });

//             dialog.fields_dict.stones_html.$wrapper.html(`
//                 <div class="text-center text-muted" style="padding: 60px;">
//                     <i class="fa fa-filter fa-3x" style="opacity: 0.3;"></i>
//                     <p style="margin-top: 20px; font-size: 16px;">Apply filters to search for stones</p>
//                 </div>
//             `);
//             frappe.show_alert({message: __('Ready to create new filter'), indicator: 'blue'}, 3);
//         });

//     // If new filter number exists → Show Save New Filter
//     } else if (filter_no_value) {

//         leftContainer.append(`
//             <button class="btn btn-success btn-sm btn-save-new-filter">
//                 💾 ${__('Save Filter')}
//             </button>
//         `);

//         dialog.$wrapper.find('.btn-save-new-filter').off('click').on('click', () => {
//             baps.stone_dialog.save_filter(dialog, null);
//         });
//     }
// },





//     // Save filter - either create new or update existing (existing_filter: name/filter_no string or null)
//     save_filter: function(dialog, existing_filter = null) {
//         // Ensure we have a filter_no
//         let filter_no = dialog.get_value('filter_no') || '';
//         if (!filter_no || !filter_no.toString().trim()) {
//             frappe.msgprint(__('Filter No is required to save a filter.'));
//             return;
//         }

//         // Collect values
//         let values = dialog.get_values();
//         if (!values) {
//             frappe.msgprint(__('No filter data available.'));
//             return;
//         }

//         // Convert sub_part array to comma-separated string
//         if (values.sub_part && Array.isArray(values.sub_part)) {
//             values.sub_part = values.sub_part.join(', ');
//         }

//         // Clean up before sending to server
//         delete values.stones_html;
//         delete values.saved_filters;
//         delete values.search_btn;

//         // If existing_filter provided (string), send it to update
//         frappe.call({
//             method: 'baps.baps.doctype.cutting_planning.cutting_planning.save_stone_filter',
//             args: {
//                 filter_name: filter_no,
//                 filter_data: values,
//                 existing_filter: existing_filter
//             },
//             callback: function (r) {
//                 if (r && r.message) {
//                     frappe.show_alert({
//                         message: existing_filter ? __('Filter updated') : __('Filter saved'),
//                         indicator: 'green'
//                     }, 3);

//                     // Refresh saved filters list and set loaded state to this filter_no
//                     baps.stone_dialog.load_saved_filters(dialog);
//                     // set saved_filters to filter_no after short delay so options update
//                     setTimeout(() => {
//                         dialog.set_value('saved_filters', filter_no);
//                         dialog.refresh_field('saved_filters');
//                         baps.stone_dialog.update_dialog_buttons(dialog, filter_no);
//                     }, 250);
//                 } else {
//                     frappe.msgprint({ title: __('Save Failed'), message: __('Could not save filter'), indicator: 'red' });
//                 }
//             },
//             error: function(err) {
//                 frappe.msgprint({ title: __('Server Error'), message: __('Error saving filter. See console for details.'), indicator: 'red' });
//                 console.error('save_filter error', err);
//             }
//         });
//     },

//     // Load saved filter by name (filter_no)
//     load_filter: function(frm, dialog, filter_name) {
//         if (!filter_name) return;

//         frappe.call({
//             method: 'baps.baps.doctype.cutting_planning.cutting_planning.load_stone_filter',
//             args: { filter_name: filter_name },
//             callback: function (r) {
//                 if (r.message) {
//                     let filter_data = r.message;

//                     // Ensure parsed object
//                     if (typeof filter_data === 'string') {
//                         try {
//                             filter_data = JSON.parse(filter_data);
//                         } catch (e) {
//                             console.error('Error parsing filter_data', e);
//                             frappe.msgprint(__('Error loading filter data'));
//                             return;
//                         }
//                     }

//                     // Apply values to dialog
//                     Object.keys(filter_data).forEach(key => {
//                         if (dialog.fields_dict[key]) {
//                             let value = filter_data[key];
                            
//                             // Convert comma-separated sub_part string back to array for MultiSelectPills
//                             if (key === 'sub_part' && value && typeof value === 'string') {
//                                 value = value.split(',').map(s => s.trim()).filter(s => s);
//                             }
                            
//                             dialog.set_value(key, value);
//                         }
//                     });

//                     // Set saved_filters to the loaded filter to indicate loaded state
//                     dialog.set_value('saved_filters', filter_name);

//                     // Trigger dimension fields refresh
//                     setTimeout(() => {
//                         ['l1', 'b1', 'h1'].forEach(dim => {
//                             baps.stone_dialog.toggle_dimension_fields(dialog, dim);
//                         });
//                         baps.stone_dialog.update_dialog_buttons(dialog, filter_name);
//                     }, 100);

//                     // Auto-search to show the filtered stones
//                     setTimeout(() => {
//                         baps.stone_dialog.search_stones(frm, dialog);
//                     }, 200);
//                 }
//             },
//             error: function(err) {
//                 console.error('load_filter error', err);
//                 frappe.msgprint(__('Error loading filter'));
//             }
//         });
//     },

//     // Show Manage Filters table - list, load, edit, delete
//     show_filters_table: function(frm, parent_dialog) {
//         frappe.call({
//             method: 'frappe.client.get_list',
//             args: {
//                 doctype: 'Cutting Filter',
//                 fields: ['name', 'filter_no', 'project', 'main_part', 'sub_part', 'stone_name'],
//                 order_by: 'modified desc',
//                 limit_page_length: 500
//             },
//             callback: function (r) {
//                 if (!r.message || r.message.length === 0) {
//                     frappe.msgprint({ title: __('No Filters'), message: __('No saved filters found.'), indicator: 'blue' });
//                     return;
//                 }

//                 let html = `
//                     <div style="max-height: 500px; overflow-y: auto;">
//                         <table class="table table-bordered table-hover" style="font-size: 12px;">
//                             <thead style="position: sticky; top: 0; background: white; z-index: 10;">
//                                 <tr style="background: #f8f9fa;">
//                                     <th style="width: 50px;">Sr.</th>
//                                     <th>Filter No</th>
//                                     <th>Project</th>
//                                     <th>Main Part</th>
//                                     <th>Sub Part</th>
//                                     <th>Stone Name</th>
//                                     <th style="width: 220px; text-align: center;">Actions</th>
//                                 </tr>
//                             </thead>
//                             <tbody>
//                 `;

//                 r.message.forEach((filter, index) => {
//                     html += `
//                         <tr>
//                             <td style="text-align:center;">${index + 1}</td>
//                             <td><strong>${filter.filter_no || filter.name}</strong></td>
//                             <td>${filter.project || '-'}</td>
//                             <td>${filter.main_part || '-'}</td>
//                             <td>${filter.sub_part || '-'}</td>
//                             <td>${filter.stone_name || '-'}</td>
//                             <td style="text-align:center;">
//                                 <button class="btn btn-xs btn-primary load-filter-btn" data-name="${filter.filter_no || filter.name}" style="margin-right:6px">${__('Load')}</button>
//                                 <button class="btn btn-xs btn-danger delete-filter-btn" data-name="${filter.name}">${__('Delete')}</button>
//                             </td>
//                         </tr>
//                     `;
//                 });

//                 html += `
//                             </tbody>
//                         </table>
//                     </div>
//                     <div style="margin-top: 10px; padding: 8px; background: #f0f4f8; border-radius: 5px;">
//                         <strong>${r.message.length}</strong> ${__('filter(s) available')}
//                     </div>
//                 `;

//                 let filters_dialog = new frappe.ui.Dialog({
//                     title: __('Manage Filters'),
//                     size: 'extra-large',
//                     fields: [
//                         { fieldtype: 'HTML', fieldname: 'filters_table', options: html }
//                     ],
//                     primary_action_label: __('Close'),
//                     primary_action: function() {
//                         filters_dialog.hide();
//                     }
//                 });

//                 filters_dialog.show();

//                 // Bind load
//                 filters_dialog.$wrapper.find('.load-filter-btn').on('click', function() {
//                     const fn = $(this).data('name');
//                     filters_dialog.hide();
//                     // call load_filter using filter_no
//                     baps.stone_dialog.load_filter(frm, parent_dialog, fn);
//                     frappe.show_alert({ message: __('Filter loaded'), indicator: 'green' }, 2);
//                 });

//                 // Bind edit (open Cutting Filter form)
//                 filters_dialog.$wrapper.find('.edit-filter-btn').on('click', function() {
//                     const name = $(this).data('name');
//                     frappe.set_route('Form', 'Cutting Filter', name);
//                 });

//                 // Bind delete
//                 filters_dialog.$wrapper.find('.delete-filter-btn').on('click', function() {
//                     const name = $(this).data('name');
//                     frappe.confirm(__('Are you sure you want to delete this filter?'), function() {
//                         frappe.call({
//                             method: 'frappe.client.delete',
//                             args: { doctype: 'Cutting Filter', name: name },
//                             callback: function() {
//                                 frappe.show_alert({ message: __('Filter deleted'), indicator: 'red' }, 2);
//                                 filters_dialog.hide();
//                                 // refresh parent dialog saved filters
//                                 baps.stone_dialog.load_saved_filters(parent_dialog);
//                             }
//                         });
//                     });
//                 });
//             }
//         });
//     },

//     // Search stones (calls server)
//     search_stones: function(frm, dialog) {
//         let filters = dialog.get_values();
//         // remove UI-only fields
//         delete filters.stones_html;
//         delete filters.saved_filters;

//         dialog.fields_dict.stones_html.$wrapper.html(`
//             <div class="text-center" style="padding: 60px;">
//                 <i class="fa fa-spinner fa-spin fa-3x text-muted"></i>
//                 <p class="text-muted" style="margin-top: 20px;">${__('Searching for stones...')}</p>
//             </div>
//         `);

//         frappe.call({
//             method: 'baps.baps.doctype.cutting_planning.cutting_planning.get_filtered_stones',
//             args: {
//                 filters: filters,
//                 block_no: frm.doc.block_no,
//                 current_plan: frm.doc.name || null
//             },
//             callback: function (r) {
//                 if (r.message && r.message.length > 0) {
//                     baps.stone_dialog.display_stones(dialog, r.message, frm);
//                 } else {
//                     dialog.fields_dict.stones_html.$wrapper.html(`
//                         <div class="text-center text-muted" style="padding: 60px;">
//                             <i class="fa fa-search fa-3x" style="opacity: 0.3;"></i>
//                             <p style="margin-top: 20px;">${__('No stones found')}</p>
//                         </div>
//                     `);
//                 }

//                 // update buttons to reflect any filter_no change
//                 baps.stone_dialog.update_dialog_buttons(dialog, dialog.get_value('saved_filters') || null);
//             },
//             error: function() {
//                 dialog.fields_dict.stones_html.$wrapper.html(`
//                     <div class="text-center text-danger" style="padding: 60px;">
//                         <i class="fa fa-exclamation-triangle fa-3x"></i>
//                         <p style="margin-top: 20px;">${__('Error loading stones')}</p>
//                     </div>
//                 `);
//             }
//         });
//     },

//     // Render stones HTML
//     // display_stones: function(dialog, stones, frm) {
//     //     let html = `
//     //         <div style="max-height: 450px; overflow-y: auto;">
//     //             <table class="table table-bordered table-hover" style="font-size: 12px;">
//     //                 <thead style="position: sticky; top: 0; background: white; z-index: 10;">
//     //                     <tr style="background: #f8f9fa;">
//     //                         <th style="width: 40px;"><input type="checkbox" id="select_all_stones" /></th>
//     //                         <th>Stone Code</th>
//     //                         <th>Stone Name</th>
//     //                         <th>Project</th>
//     //                         <th>Main Part</th>
//     //                         <th>Sub Part</th>
//     //                         <th>L1</th>
//     //                         <th>L2</th>
//     //                         <th>B1</th>
//     //                         <th>B2</th>
//     //                         <th>H1</th>
//     //                         <th>H2</th>
//     //                         <th>Volume</th>
//     //                     </tr>
//     //                 </thead>
//     //                 <tbody>
//     //     `;

//     //     stones.forEach((stone) => {
//     //         html += `
//     //             <tr style="cursor: pointer;" onclick="this.querySelector('.stone-checkbox').click();">
//     //                 <td><input type="checkbox" class="stone-checkbox" data-stone='${JSON.stringify(stone).replace(/'/g, "&apos;")}' onclick="event.stopPropagation();" /></td>
//     //                 <td><strong>${stone.stone_no || stone.stone_code || ''}</strong></td>
//     //                 <td>${stone.stone_name || '-'}</td>
//     //                 <td>${stone.project_name || '-'}</td>
//     //                 <td>${stone.main_part || '-'}</td>
//     //                 <td>${stone.sub_part || '-'}</td>
//     //                 <td>${(parseFloat(stone.l1) || 0).toFixed(2)}</td>
//     //                 <td>${(parseFloat(stone.l2) || 0).toFixed(2)}</td>
//     //                 <td>${(parseFloat(stone.b1) || 0).toFixed(2)}</td>
//     //                 <td>${(parseFloat(stone.b2) || 0).toFixed(2)}</td>
//     //                 <td>${(parseFloat(stone.h1) || 0).toFixed(2)}</td>
//     //                 <td>${(parseFloat(stone.h2) || 0).toFixed(2)}</td>
//     //                 <td><strong>${(parseFloat(stone.volume) || 0).toFixed(3)}</strong></td>
//     //             </tr>
//     //         `;
//     //     });

//     //     html += `
//     //                 </tbody>
//     //             </table>
//     //         </div>
//     //         <div style="margin-top: 15px; padding: 10px; background: #f0f4f8; border-radius: 5px;">
//     //             <strong>${stones.length}</strong> ${__('stones found')}
//     //         </div>
//     //     `;

//     //     dialog.fields_dict.stones_html.$wrapper.html(html);

//     //     // select all behavior
//     //     dialog.fields_dict.stones_html.$wrapper.find('#select_all_stones').on('change', function () {
//     //         dialog.fields_dict.stones_html.$wrapper.find('.stone-checkbox').prop('checked', $(this).is(':checked'));
//     //     });
//     // },






// // Display stones with sorting capability
// // display_stones: function(dialog, stones, frm) {
// //     // Store stones data for re-sorting
// //     dialog._stones_data = stones;
// //     dialog._current_sort = dialog._current_sort || { column: null, direction: 'asc' };
    
// //     let html = `
// //         <div style="max-height: 450px; overflow-y: auto;">
// //             <table class="table table-bordered table-hover" style="font-size: 12px;">
// //                 <thead style="position: sticky; top: 0; background: white; z-index: 10;">
// //                     <tr style="background: #f8f9fa;">
// //                         <th style="width: 40px;"><input type="checkbox" id="select_all_stones" /></th>
// //                         <th class="sortable-header" data-column="stone_no" style="cursor: pointer;">
// //                             Stone Code <i class="fa fa-sort" style="opacity: 0.3;"></i>
// //                         </th>
// //                         <th class="sortable-header" data-column="stone_name" style="cursor: pointer;">
// //                             Stone Name <i class="fa fa-sort" style="opacity: 0.3;"></i>
// //                         </th>
// //                         <th class="sortable-header" data-column="project_name" style="cursor: pointer;">
// //                             Project <i class="fa fa-sort" style="opacity: 0.3;"></i>
// //                         </th>
// //                         <th class="sortable-header" data-column="main_part" style="cursor: pointer;">
// //                             Main Part <i class="fa fa-sort" style="opacity: 0.3;"></i>
// //                         </th>
// //                         <th class="sortable-header" data-column="sub_part" style="cursor: pointer;">
// //                             Sub Part <i class="fa fa-sort" style="opacity: 0.3;"></i>
// //                         </th>
// //                         <th class="sortable-header" data-column="l1" style="cursor: pointer;">
// //                             L1 <i class="fa fa-sort" style="opacity: 0.3;"></i>
// //                         </th>
// //                         <th class="sortable-header" data-column="l2" style="cursor: pointer;">
// //                             L2 <i class="fa fa-sort" style="opacity: 0.3;"></i>
// //                         </th>
// //                         <th class="sortable-header" data-column="b1" style="cursor: pointer;">
// //                             B1 <i class="fa fa-sort" style="opacity: 0.3;"></i>
// //                         </th>
// //                         <th class="sortable-header" data-column="b2" style="cursor: pointer;">
// //                             B2 <i class="fa fa-sort" style="opacity: 0.3;"></i>
// //                         </th>
// //                         <th class="sortable-header" data-column="h1" style="cursor: pointer;">
// //                             H1 <i class="fa fa-sort" style="opacity: 0.3;"></i>
// //                         </th>
// //                         <th class="sortable-header" data-column="h2" style="cursor: pointer;">
// //                             H2 <i class="fa fa-sort" style="opacity: 0.3;"></i>
// //                         </th>
// //                         <th class="sortable-header" data-column="volume" style="cursor: pointer;">
// //                             Volume <i class="fa fa-sort" style="opacity: 0.3;"></i>
// //                         </th>
// //                     </tr>
// //                 </thead>
// //                 <tbody id="stones_tbody">
// //     `;

// //     stones.forEach((stone) => {
// //         html += `
// //             <tr style="cursor: pointer;" onclick="this.querySelector('.stone-checkbox').click();">
// //                 <td><input type="checkbox" class="stone-checkbox" data-stone='${JSON.stringify(stone).replace(/'/g, "&apos;")}' onclick="event.stopPropagation();" /></td>
// //                 <td><strong>${stone.stone_no || stone.stone_code || ''}</strong></td>
// //                 <td>${stone.stone_name || '-'}</td>
// //                 <td>${stone.project_name || '-'}</td>
// //                 <td>${stone.main_part || '-'}</td>
// //                 <td>${stone.sub_part || '-'}</td>
// //                 <td>${(parseFloat(stone.l1) || 0).toFixed(2)}</td>
// //                 <td>${(parseFloat(stone.l2) || 0).toFixed(2)}</td>
// //                 <td>${(parseFloat(stone.b1) || 0).toFixed(2)}</td>
// //                 <td>${(parseFloat(stone.b2) || 0).toFixed(2)}</td>
// //                 <td>${(parseFloat(stone.h1) || 0).toFixed(2)}</td>
// //                 <td>${(parseFloat(stone.h2) || 0).toFixed(2)}</td>
// //                 <td><strong>${(parseFloat(stone.volume) || 0).toFixed(3)}</strong></td>
// //             </tr>
// //         `;
// //     });

// //     html += `
// //                 </tbody>
// //             </table>
// //         </div>
// //         <div style="margin-top: 15px; padding: 10px; background: #f0f4f8; border-radius: 5px;">
// //             <strong>${stones.length}</strong> ${__('stones found')}
// //             <span style="margin-left: 20px; color: #666; font-size: 11px;">
// //                 <i class="fa fa-info-circle"></i> Click column headers to sort
// //             </span>
// //         </div>
// //     `;

// //     dialog.fields_dict.stones_html.$wrapper.html(html);

// //     // Bind select all
// //     dialog.fields_dict.stones_html.$wrapper.find('#select_all_stones').on('change', function () {
// //         dialog.fields_dict.stones_html.$wrapper.find('.stone-checkbox').prop('checked', $(this).is(':checked'));
// //     });

// //     // Bind sorting to column headers
// //     dialog.fields_dict.stones_html.$wrapper.find('.sortable-header').on('click', function() {
// //         const column = $(this).data('column');
// //         baps.stone_dialog.sort_stones(dialog, column, frm);
// //     });

// //     // Update sort icons if there's an active sort
// //     if (dialog._current_sort.column) {
// //         const $header = dialog.fields_dict.stones_html.$wrapper.find(`.sortable-header[data-column="${dialog._current_sort.column}"]`);
// //         const icon = dialog._current_sort.direction === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
// //         $header.find('i').removeClass('fa-sort').addClass(icon).css('opacity', '1');
// //     }
// // },

// // // Sort stones function
// // sort_stones: function(dialog, column, frm) {
// //     if (!dialog._stones_data || dialog._stones_data.length === 0) return;

// //     // Determine sort direction
// //     let direction = 'asc';
// //     if (dialog._current_sort.column === column) {
// //         // Toggle direction if same column
// //         direction = dialog._current_sort.direction === 'asc' ? 'desc' : 'asc';
// //     }

// //     // Store current sort state
// //     dialog._current_sort = { column: column, direction: direction };

// //     // Sort the stones data
// //     const sorted_stones = [...dialog._stones_data].sort((a, b) => {
// //         let valA = a[column];
// //         let valB = b[column];

// //         // Handle null/undefined values
// //         if (valA === null || valA === undefined) valA = '';
// //         if (valB === null || valB === undefined) valB = '';

// //         // Convert to appropriate type for comparison
// //         if (column === 'l1' || column === 'l2' || column === 'b1' || column === 'b2' || 
// //             column === 'h1' || column === 'h2' || column === 'volume') {
// //             valA = parseFloat(valA) || 0;
// //             valB = parseFloat(valB) || 0;
// //         } else {
// //             valA = String(valA).toLowerCase();
// //             valB = String(valB).toLowerCase();
// //         }

// //         // Compare values
// //         if (valA < valB) return direction === 'asc' ? -1 : 1;
// //         if (valA > valB) return direction === 'asc' ? 1 : -1;
// //         return 0;
// //     });

// //     // Re-render with sorted data
// //     baps.stone_dialog.display_stones(dialog, sorted_stones, frm);
// // },





// //     // Collect selected stones and add to the main form
// //     add_selected_stones: function (frm, dialog) {
// //         let selected = [];
// //         let altered = [];

// //         dialog.fields_dict.stones_html.$wrapper.find('.stone-checkbox:checked').each(function () {
// //             let stone = $(this).data('stone');
// //             selected.push(stone);
// //             if (stone.is_altered) altered.push(stone.stone_no || stone.stone_code);
// //         });

// //         if (selected.length === 0) {
// //             frappe.msgprint(__('Please select at least one stone'));
// //             return;
// //         }

// //         if (altered.length > 0) {
// //             frappe.warn(__('Altered Stones Selected'), __(`These stones have altered properties: <strong>${altered.join(', ')}</strong><br><br>Continue?`),
// //                 () => baps.stone_dialog.add_stones_to_details(frm, selected, dialog),
// //                 () => frappe.show_alert({ message: __('Cancelled'), indicator: 'orange' })
// //             );
// //         } else {
// //             baps.stone_dialog.add_stones_to_details(frm, selected, dialog);
// //         }
// //     },






//     // Updated display_stones function with pagination
//     display_stones: function(dialog, stones, frm) {
//         // Store stones data for re-sorting and pagination
//         dialog._stones_data = stones;
//         dialog._current_sort = dialog._current_sort || { column: null, direction: 'asc' };
//         dialog._current_page = dialog._current_page || 1;
//         dialog._page_size = dialog._page_size || 50; // Default 50 stones per page
        
//         // Calculate pagination
//         const total_stones = stones.length;
//         const total_pages = Math.ceil(total_stones / dialog._page_size);
        
//         // Ensure current page is valid
//         if (dialog._current_page > total_pages && total_pages > 0) {
//              dialog._current_page = 1;
//         }

//         const start_index = (dialog._current_page - 1) * dialog._page_size;
//         const end_index = Math.min(start_index + dialog._page_size, total_stones);
//         const page_stones = stones.slice(start_index, end_index);
        
//         let html = `
//             <div style="margin-bottom: 10px; padding: 8px; background: #f8f9fa; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
//                 <div>
//                     <strong>${total_stones}</strong> ${__('stones found')}
//                     <span style="margin-left: 15px; color: #666;">
//                         ${__('Showing')} ${total_stones > 0 ? start_index + 1 : 0} - ${end_index} ${__('of')} ${total_stones}
//                     </span>
//                 </div>
//                 <div style="display: flex; align-items: center; gap: 10px;">
//                     <label style="margin: 0; color: #666; font-size: 12px;">
//                         ${__('Show')}:
//                         <select id="page_size_select" style="margin-left: 5px; padding: 2px 5px; border: 1px solid #d1d8dd; border-radius: 3px;">
//                             <option value="25" ${dialog._page_size === 25 ? 'selected' : ''}>25</option>
//                             <option value="50" ${dialog._page_size === 50 ? 'selected' : ''}>50</option>
//                             <option value="100" ${dialog._page_size === 100 ? 'selected' : ''}>100</option>
//                             <option value="200" ${dialog._page_size === 200 ? 'selected' : ''}>200</option>
//                             <option value="500" ${dialog._page_size === 500 ? 'selected' : ''}>500</option>
//                         </select>
//                     </label>
//                 </div>
//             </div>
//             <div style="max-height: 400px; overflow-y: auto;">
//                 <table class="table table-bordered table-hover" style="font-size: 12px;">
//                     <thead style="position: sticky; top: 0; background: white; z-index: 10; box-shadow: 0 2px 2px -1px rgba(0,0,0,0.1);">
//                         <tr style="background: #f8f9fa;">
//                             <th style="width: 40px;"><input type="checkbox" id="select_all_stones" /></th>
//                             <th class="sortable-header" data-column="stone_no" style="cursor: pointer;">
//                                 Stone Code <i class="fa fa-sort sort-icon" style="opacity: 0.3;"></i>
//                             </th>
//                             <th class="sortable-header" data-column="stone_name" style="cursor: pointer;">
//                                 Stone Name <i class="fa fa-sort sort-icon" style="opacity: 0.3;"></i>
//                             </th>
//                             <th class="sortable-header" data-column="project_name" style="cursor: pointer;">
//                                 Project <i class="fa fa-sort sort-icon" style="opacity: 0.3;"></i>
//                             </th>
//                             <th class="sortable-header" data-column="main_part" style="cursor: pointer;">
//                                 Main Part <i class="fa fa-sort sort-icon" style="opacity: 0.3;"></i>
//                             </th>
//                             <th class="sortable-header" data-column="sub_part" style="cursor: pointer;">
//                                 Sub Part <i class="fa fa-sort sort-icon" style="opacity: 0.3;"></i>
//                             </th>
//                             <th class="sortable-header" data-column="l1" style="cursor: pointer;">
//                                 L1 <i class="fa fa-sort sort-icon" style="opacity: 0.3;"></i>
//                             </th>
//                             <th class="sortable-header" data-column="l2" style="cursor: pointer;">
//                                 L2 <i class="fa fa-sort sort-icon" style="opacity: 0.3;"></i>
//                             </th>
//                             <th class="sortable-header" data-column="b1" style="cursor: pointer;">
//                                 B1 <i class="fa fa-sort sort-icon" style="opacity: 0.3;"></i>
//                             </th>
//                             <th class="sortable-header" data-column="b2" style="cursor: pointer;">
//                                 B2 <i class="fa fa-sort sort-icon" style="opacity: 0.3;"></i>
//                             </th>
//                             <th class="sortable-header" data-column="h1" style="cursor: pointer;">
//                                 H1 <i class="fa fa-sort sort-icon" style="opacity: 0.3;"></i>
//                             </th>
//                             <th class="sortable-header" data-column="h2" style="cursor: pointer;">
//                                 H2 <i class="fa fa-sort sort-icon" style="opacity: 0.3;"></i>
//                             </th>
//                             <th class="sortable-header" data-column="volume" style="cursor: pointer;">
//                                 Volume <i class="fa fa-sort sort-icon" style="opacity: 0.3;"></i>
//                             </th>
//                         </tr>
//                     </thead>
//                     <tbody id="stones_tbody">
//         `;

//         page_stones.forEach((stone) => {
//             html += `
//                 <tr style="cursor: pointer;" onclick="this.querySelector('.stone-checkbox').click();">
//                     <td><input type="checkbox" class="stone-checkbox" data-stone='${JSON.stringify(stone).replace(/'/g, "&apos;")}' onclick="event.stopPropagation();" /></td>
//                     <td><strong>${stone.stone_no || stone.stone_code || ''}</strong></td>
//                     <td>${stone.stone_name || '-'}</td>
//                     <td>${stone.project_name || '-'}</td>
//                     <td>${stone.main_part || '-'}</td>
//                     <td>${stone.sub_part || '-'}</td>
//                     <td>${(parseFloat(stone.l1) || 0).toFixed(2)}</td>
//                     <td>${(parseFloat(stone.l2) || 0).toFixed(2)}</td>
//                     <td>${(parseFloat(stone.b1) || 0).toFixed(2)}</td>
//                     <td>${(parseFloat(stone.b2) || 0).toFixed(2)}</td>
//                     <td>${(parseFloat(stone.h1) || 0).toFixed(2)}</td>
//                     <td>${(parseFloat(stone.h2) || 0).toFixed(2)}</td>
//                     <td><strong>${(parseFloat(stone.volume) || 0).toFixed(3)}</strong></td>
//                 </tr>
//             `;
//         });

//         html += `
//                     </tbody>
//                 </table>
//             </div>
//         `;
        
//         // Add pagination controls
//         if (total_pages > 1) {
//             html += baps.stone_dialog.render_pagination(dialog._current_page, total_pages, total_stones);
//         }
        
//         html += `
//             <div style="margin-top: 10px; padding: 8px; background: #e8f4f8; border-radius: 4px; font-size: 11px; color: #666;">
//                 <i class="fa fa-info-circle"></i> ${__('Click column headers to sort')} • 
//                 <i class="fa fa-check-square"></i> ${__('Click rows to select stones')}
//             </div>
//         `;

//         dialog.fields_dict.stones_html.$wrapper.html(html);

//         // Bind select all (only for current page)
//         dialog.fields_dict.stones_html.$wrapper.find('#select_all_stones').on('change', function () {
//             dialog.fields_dict.stones_html.$wrapper.find('.stone-checkbox').prop('checked', $(this).is(':checked'));
//         });

//         // Bind page size change
//         dialog.fields_dict.stones_html.$wrapper.find('#page_size_select').on('change', function() {
//             dialog._page_size = parseInt($(this).val());
//             dialog._current_page = 1; // Reset to first page
//             baps.stone_dialog.display_stones(dialog, dialog._stones_data, frm);
//         });

//         // Bind sorting to column headers
//         dialog.fields_dict.stones_html.$wrapper.find('.sortable-header').on('click', function() {
//             const column = $(this).data('column');
//             baps.stone_dialog.sort_stones(dialog, column, frm);
//         });

//         // Bind pagination buttons
//         dialog.fields_dict.stones_html.$wrapper.find('.pagination-btn').on('click', function() {
//             const page = parseInt($(this).data('page'));
//             if (page > 0 && page <= total_pages) {
//                 dialog._current_page = page;
//                 baps.stone_dialog.display_stones(dialog, dialog._stones_data, frm);
//             }
//         });

//         // Update sort icons if there's an active sort
//         if (dialog._current_sort.column) {
//             const $header = dialog.fields_dict.stones_html.$wrapper.find(`.sortable-header[data-column="${dialog._current_sort.column}"]`);
//             const icon = dialog._current_sort.direction === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
//             $header.find('i').removeClass('fa-sort').addClass(icon).css('opacity', '1').css('color', '#2490ef');
//         }
//     },

//     // Render pagination controls (NEW FUNCTION)
//     render_pagination: function(current_page, total_pages, total_stones) {
//         let html = `
//             <div style="margin-top: 15px; padding: 10px; background: #f8f9fa; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
//                 <div style="color: #666; font-size: 12px;">
//                     ${__('Page')} <strong>${current_page}</strong> ${__('of')} <strong>${total_pages}</strong>
//                 </div>
//                 <div style="display: flex; gap: 5px;">
//         `;
        
//         // First and Previous buttons
//         html += `
//             <button class="btn btn-xs btn-default pagination-btn" data-page="1" 
//                     ${current_page === 1 ? 'disabled' : ''} 
//                     style="padding: 3px 8px;">
//                 <i class="fa fa-angle-double-left"></i>
//             </button>
//             <button class="btn btn-xs btn-default pagination-btn" data-page="${current_page - 1}" 
//                     ${current_page === 1 ? 'disabled' : ''} 
//                     style="padding: 3px 8px;">
//                 <i class="fa fa-angle-left"></i>
//             </button>
//         `;
        
//         // Page numbers (show max 7 pages)
//         let start_page = Math.max(1, current_page - 3);
//         let end_page = Math.min(total_pages, start_page + 6);
        
//         // Adjust start if we're near the end
//         if (end_page - start_page < 6) {
//             start_page = Math.max(1, end_page - 6);
//         }
        
//         if (start_page > 1) {
//             html += `<span style="padding: 3px 5px; color: #999;">...</span>`;
//         }
        
//         for (let i = start_page; i <= end_page; i++) {
//             const is_current = i === current_page;
//             html += `
//                 <button class="btn btn-xs pagination-btn ${is_current ? 'btn-primary' : 'btn-default'}" 
//                         data-page="${i}" 
//                         style="padding: 3px 10px; min-width: 32px; ${is_current ? 'font-weight: bold;' : ''}">
//                     ${i}
//                 </button>
//             `;
//         }
        
//         if (end_page < total_pages) {
//             html += `<span style="padding: 3px 5px; color: #999;">...</span>`;
//         }
        
//         // Next and Last buttons
//         html += `
//             <button class="btn btn-xs btn-default pagination-btn" data-page="${current_page + 1}" 
//                     ${current_page === total_pages ? 'disabled' : ''} 
//                     style="padding: 3px 8px;">
//                 <i class="fa fa-angle-right"></i>
//             </button>
//             <button class="btn btn-xs btn-default pagination-btn" data-page="${total_pages}" 
//                     ${current_page === total_pages ? 'disabled' : ''} 
//                     style="padding: 3px 8px;">
//                 <i class="fa fa-angle-double-right"></i>
//             </button>
//         `;
        
//         html += `
//                 </div>
//             </div>
//         `;
        
//         return html;
//     },

//     // Updated sort_stones function (keeps pagination state)
//     sort_stones: function(dialog, column, frm) {
//         if (!dialog._stones_data || dialog._stones_data.length === 0) return;

//         // Determine sort direction
//         let direction = 'asc';
//         if (dialog._current_sort.column === column) {
//             // Toggle direction if same column
//             direction = dialog._current_sort.direction === 'asc' ? 'desc' : 'asc';
//         }

//         // Store current sort state
//         dialog._current_sort = { column: column, direction: direction };

//         // Sort the stones data
//         const sorted_stones = [...dialog._stones_data].sort((a, b) => {
//             let valA = a[column];
//             let valB = b[column];

//             // Handle null/undefined values
//             if (valA === null || valA === undefined) valA = '';
//             if (valB === null || valB === undefined) valB = '';

//             // Convert to appropriate type for comparison
//             if (column === 'l1' || column === 'l2' || column === 'b1' || column === 'b2' || 
//                 column === 'h1' || column === 'h2' || column === 'volume') {
//                 valA = parseFloat(valA) || 0;
//                 valB = parseFloat(valB) || 0;
//             } else {
//                 valA = String(valA).toLowerCase();
//                 valB = String(valB).toLowerCase();
//             }

//             // Compare values
//             if (valA < valB) return direction === 'asc' ? -1 : 1;
//             if (valA > valB) return direction === 'asc' ? 1 : -1;
//             return 0;
//         });

//         // Reset to page 1 after sorting
//         dialog._current_page = 1;

//         // Re-render with sorted data
//         baps.stone_dialog.display_stones(dialog, sorted_stones, frm);
//     },

//     // Updated add_selected_stones to handle all pages
//     add_selected_stones: function (frm, dialog) {
//         let selected = [];
//         let altered = [];

//         // Get selected stones from current page only
//         dialog.fields_dict.stones_html.$wrapper.find('.stone-checkbox:checked').each(function () {
//             let stone = $(this).data('stone');
//             selected.push(stone);
//             if (stone.is_altered) altered.push(stone.stone_no || stone.stone_code);
//         });

//         if (selected.length === 0) {
//             frappe.msgprint(__('Please select at least one stone'));
//             return;
//         }

//         // Show info about pagination
//         const total_selected = selected.length;
//         const total_stones = dialog._stones_data ? dialog._stones_data.length : 0;
//         const current_page = dialog._current_page || 1;
        
//         let message = __('Adding {0} stone(s) from page {1}', [total_selected, current_page]);
        
//         if (total_stones > dialog._page_size) {
//             message += '<br><small style="color: #999;">' + 
//                     __('Note: Showing {0} of {1} total stones. Select from other pages if needed.', 
//                     [Math.min(dialog._page_size, total_stones), total_stones]) + 
//                     '</small>';
//         }

//         if (altered.length > 0) {
//             frappe.warn(
//                 __('Altered Stones Selected'),
//                 __(`These stones have altered properties: <strong>${altered.join(', ')}</strong><br><br>Continue?`),
//                 () => baps.stone_dialog.add_stones_to_details(frm, selected, dialog),
//                 () => frappe.show_alert({ message: __('Cancelled'), indicator: 'orange' })
//             );
//         } else {
//             baps.stone_dialog.add_stones_to_details(frm, selected, dialog);
//         }
//     },
    



//     // Add stones to parent form details
//     add_stones_to_details: function(frm, selected_stones, dialog) {
//         selected_stones.forEach(stone => {
//             let volume = stone.volume;
//             if (!volume || volume === 0) {
//                 let l_avg = (parseFloat(stone.l1) + parseFloat(stone.l2)) / 2;
//                 let b_avg = (parseFloat(stone.b1) + parseFloat(stone.b2)) / 2;
//                 let h_avg = (parseFloat(stone.h1) + parseFloat(stone.h2)) / 2;
//                 volume = l_avg * b_avg * h_avg;
//             }

//             frm.add_child('details', {
//                 project_name: stone.project_name || '',
//                 stone_no: stone.stone_no || stone.stone_code,
//                 l1: parseFloat(stone.l1) || 0,
//                 l2: parseFloat(stone.l2) || 0,
//                 b1: parseFloat(stone.b1) || 0,
//                 b2: parseFloat(stone.b2) || 0,
//                 h1: parseFloat(stone.h1) || 0,
//                 h2: parseFloat(stone.h2) || 0,
//                 volume: parseFloat(volume) || 0
//             });
//         });

//         frm.refresh_field('details');

//         // ensure parent summary recalculation function exists
//         if (typeof calculate_summary === 'function') {
//             calculate_summary(frm);
//         }

//         frappe.show_alert({ message: __(`Added ${selected_stones.length} stone(s)`), indicator: 'green' }, 5);
//             dialog.hide();
//         }
//     };

// // --- Form Controller ---
// frappe.ui.form.on('Cutting Planning', {
//     refresh: function (frm) {

//         	// Lock block_number after save
// 	if (!frm.doc.__islocal) {
// 		frm.set_df_property("block_no", "read_only", 1);
// 	} else {
// 		frm.set_df_property("block_no", "read_only", 0);
// 	}
//         // Store initial block_no for comparison when user changes it
//         if (!frm.doc.__last_block_no) {
//             frm.doc.__last_block_no = frm.doc.block_no;
//         }
        
//         frm.set_query("block_no", () => ({
//             filters: { 
//                 status: "Ready for Cutting Planning",
//                 //inspection_completed: 1
//             },
//             query: "baps.baps.doctype.cutting_planning.cutting_planning.get_available_blocks"
//         }));

//         // Check if cutting has started and disable form
//         // if (!frm.is_new() && frm.doc.block_no) {
//         //     frappe.db.get_value("Block", frm.doc.block_no, "cutting_started", (r) => {
//         //         if (r && r.cutting_started) {
//         //             frm.disable_form();
//         //             frm.dashboard.add_comment(__("Cutting has started for this block. Editing is disabled."), "red", true);
//         //         }
//         //     });
//         // }

//         if (frm.is_new() && !frm.doc.trial_no && frm.doc.block_no) {
//             frappe.call({
//                 method: 'baps.baps.doctype.cutting_planning.cutting_planning.get_next_trial_number',
//                 args: { block_no: frm.doc.block_no },
//                 callback: function (r) {
//                     if (r.message) {
//                         frm.set_value('trial_no', r.message);
//                     }
//                 }
//             });
//         }

//         frm.fields_dict['details'].grid.cannot_add_rows = true;
//         frm.refresh_field('details');

//         if (frm.doc.block_no) {
//             update_plan_count(frm);
//         }
//     },

//     block_no: function (frm) {
//         if (!frm.doc.block_no) {
//             frm.set_value("block_type", "");
//             // frm.set_value("site", "");
//             frm.set_value("region", "");
//             frm.set_value("block_volume", "");
//             frm.set_value("trial_no", "");
//             // Clear child table when block is removed
//             frm.clear_table("details");
//             frm.refresh_field("details");
//             return;
//         }

//         // Clear existing child table records when block changes
//         if (frm.doc.details && frm.doc.details.length > 0) {
//             frappe.confirm(
//                 __('Changing the Block No. will clear all existing stone records. Do you want to continue?'),
//                 function() {
//                     // User confirmed - proceed with clearing and updating
//                     frm.clear_table("details");
//                     frm.refresh_field("details");
                    
//                     frappe.db.get_doc("Block", frm.doc.block_no)
//                         .then(block_doc => {
//                             frm.set_value("block_type", block_doc.material_type || "");
//                             // frm.set_value("site", block_doc.site || "");
//                             frm.set_value("region", block_doc.region || "");
//                             frm.set_value("block_volume", block_doc.volume || 0);
//                             calculate_summary(frm);
//                             update_plan_count(frm);
                            
//                             // Generate trial number for new records when block changes
//                             if (frm.is_new() || !frm.doc.trial_no) {
//                                 frappe.call({
//                                     method: 'baps.baps.doctype.cutting_planning.cutting_planning.get_next_trial_number',
//                                     args: { block_no: frm.doc.block_no },
//                                     callback: function (r) {
//                                         if (r.message) {
//                                             frm.set_value('trial_no', r.message);
//                                         }
//                                     }
//                                 });
//                             }
//                         });
//                 },
//                 function() {
//                     // User cancelled - revert the block_no change
//                     frm.set_value("block_no", frm.doc.__last_block_no || "");
//                 }
//             );
//         } else {
//             // No existing records - proceed normally
//             frappe.db.get_doc("Block", frm.doc.block_no)
//                 .then(block_doc => {
//                     frm.set_value("block_type", block_doc.material_type || "");
//                     // frm.set_value("site", block_doc.site || "");
//                     frm.set_value("region", block_doc.region || "");
//                     frm.set_value("block_volume", block_doc.volume || 0);
//                     calculate_summary(frm);
//                     update_plan_count(frm);
                    
//                     // Generate trial number for new records when block changes
//                     if (frm.is_new() || !frm.doc.trial_no) {
//                         frappe.call({
//                             method: 'baps.baps.doctype.cutting_planning.cutting_planning.get_next_trial_number',
//                             args: { block_no: frm.doc.block_no },
//                             callback: function (r) {
//                                 if (r.message) {
//                                     frm.set_value('trial_no', r.message);
//                                 }
//                             }
//                         });
//                     }
//                 });
//         }
        
//         // Store the current block_no for potential revert
//         frm.doc.__last_block_no = frm.doc.block_no;
//     },
    
//     trial_no: function(frm) {
//         // Validate trial number uniqueness on change
//         if (frm.doc.block_no && frm.doc.trial_no) {
//             frappe.call({
//                 method: 'frappe.client.get_list',
//                 args: {
//                     doctype: 'Cutting Planning',
//                     filters: {
//                         block_no: frm.doc.block_no,
//                         trial_no: frm.doc.trial_no,
//                         name: ['!=', frm.doc.name || '']
//                     },
//                     fields: ['name']
//                 },
//                 callback: function(r) {
//                     if (r.message && r.message.length > 0) {
//                         frappe.msgprint({
//                             title: __('Duplicate Trial Number'),
//                             indicator: 'red',
//                             message: __('Trial No {0} already exists for Block {1}. Please use a different trial number.', 
//                                 [frm.doc.trial_no, frm.doc.block_no])
//                         });
//                     }
//                 }
//             });
//         }
//     },

//     show_stone: function (frm) {
//         if (!frm.doc.block_no) {
//             frappe.msgprint(__('Please select a Block Number first'));
//             return;
//         }
//         baps.stone_dialog.show(frm);
//     },
    
//     validate: function(frm) {
//         // Validate that at least one stone is entered
//         if (!frm.doc.details || frm.doc.details.length === 0) {
//             frappe.msgprint({
//                 title: __('Cannot Save'),
//                 indicator: 'red',
//                 message: __('Please add at least one stone in the Details table before saving.')
//             });
//             frappe.validated = false;
//             return false;
//         }
//     },
    
//     is_final_plan: function(frm) {
//         // Check if trying to mark as final plan
//         if (frm.doc.is_final_plan) {
//             // Validate that stones are entered
//             if (!frm.doc.details || frm.doc.details.length === 0) {
//                 frappe.msgprint({
//                     title: __('Cannot Mark as Final Plan'),
//                     indicator: 'red',
//                     message: __('Please add at least one stone before marking this as Final Plan.')
//                 });
//                 // Revert the checkbox
//                 frm.doc.is_final_plan = 0;
//                 frm.refresh_field('is_final_plan');
//                 return;
//             }
//         }
        
//         // Ask for confirmation before changing Is Final Plan status
//         if (!frm.is_new() && frm.doc.name) {
//             // Store the current value (after the change)
//             let new_value = frm.doc.is_final_plan;
//             let old_value = !new_value;
            
//             let message = new_value ? 
//                 __('Are you sure you want to mark this as Final Plan?') : 
//                 __('Are you sure you want to unmark this as Final Plan?');
            
//             frappe.confirm(
//                 message,
//                 function() {
//                     // User confirmed - save the document
//                     frm.save().then(() => {
//                         frappe.show_alert({
//                             message: new_value ? 
//                                 __('Marked as Final Plan') : 
//                                 __('Unmarked as Final Plan'),
//                             indicator: new_value ? 'green' : 'orange'
//                         }, 3);
//                     });
//                 },
//                 function() {
//                     // User cancelled - revert the checkbox to old value
//                     frm.doc.is_final_plan = old_value;
//                     frm.refresh_field('is_final_plan');
//                 }
//             );
//         }
//     }
// });

// // --- Child Table Events ---
// frappe.ui.form.on('Cutting Plan Details', {
//     details_add: calculate_summary,
//     details_remove: calculate_summary,
//     volume: calculate_summary,
//     l1: function (frm, cdt, cdn) { calculate_stone_volume(frm, cdt, cdn); },
//     l2: function (frm, cdt, cdn) { calculate_stone_volume(frm, cdt, cdn); },
//     b1: function (frm, cdt, cdn) { calculate_stone_volume(frm, cdt, cdn); },
//     b2: function (frm, cdt, cdn) { calculate_stone_volume(frm, cdt, cdn); },
//     h1: function (frm, cdt, cdn) { calculate_stone_volume(frm, cdt, cdn); },
//     h2: function (frm, cdt, cdn) { calculate_stone_volume(frm, cdt, cdn); }
// });

// // --- Helper Functions ---
// function calculate_stone_volume(frm, cdt, cdn) {
//     let row = locals[cdt][cdn];
//     let l1 = parseFloat(row.l1) || 0;
//     let l2 = parseFloat(row.l2) || 0;
//     let b1 = parseFloat(row.b1) || 0;
//     let b2 = parseFloat(row.b2) || 0;
//     let h1 = parseFloat(row.h1) || 0;
//     let h2 = parseFloat(row.h2) || 0;
//     let volume = ((l1 + l2) / 2) * ((b1 + b2) / 2) * ((h1 + h2) / 2);
//     frappe.model.set_value(cdt, cdn, 'volume', volume);
//     calculate_summary(frm);
// }

// function calculate_summary(frm) {
//     if (!frm.doc.details) return;

//     let total_stone_volume = 0;
//     frm.doc.details.forEach(row => {
//         total_stone_volume += parseFloat(row.volume) || 0;
//     });

//     frm.set_value('total_stone_volume', total_stone_volume);
//     let block_volume = parseFloat(frm.doc.block_volume) || 0;
//     if (block_volume > 0) {
//         let wastage = ((block_volume - total_stone_volume) / block_volume) * 100;
//         frm.set_value('waste', Math.max(0, wastage));
//     } else {
//         frm.set_value('waste', 0);
//     }
// }

// function update_plan_count(frm) {
//     if (!frm.doc.block_no) {
//         frm.set_value('plan_count', 0);
//         return;
//     }
//     frappe.call({
//         method: 'frappe.client.get_count',
//         args: {
//             doctype: 'Cutting Planning',
//             filters: { block_no: frm.doc.block_no }
//         },
//         callback: function (r) {
//             frm.set_value('plan_count', r.message || 0);
//         }
//     });
// }

// // --- List View Settings ---
// frappe.listview_settings['Cutting Planning'] = {
//     onload: function (list_view) {
//         list_view.set_column_formatter('plan_count', function (value, doc) {
//             if (!doc.block_no || !doc.plan_count) return '—';
//             const count = parseInt(doc.plan_count) || 0;
//             return `
//                 <span class="plan-count-badge btn btn-xs btn-outline-primary"
//                       data-block="${doc.block_no}"
//                       style="padding: 2px 6px; font-size: 11px; cursor: pointer;">
//                     ${count} ${count === 1 ? 'Plan' : 'Plans'}
//                 </span>
//             `;
//         });
//     },
//     refresh: function (list_view) {
//         list_view.$wrapper.off('click', '.plan-count-badge').on('click', '.plan-count-badge', function (e) {
//             e.stopPropagation();
//             e.preventDefault();
//             const block_no = $(this).data('block');
            
//             // Call the global function to show all plans for this block
//             if (window.show_all_plans_for_block) {
//                 window.show_all_plans_for_block(block_no);
//             } else {
//                 frappe.msgprint(__('Loading plans...'));
//             }
//         });
//     } 
// };




// Provide namespace
frappe.provide('baps.stone_dialog');

// =============================================================================
// 1. CUSTOM DIALOG LOGIC (Search, Filter, Display) - FINAL INTEGRATED VERSION
// =============================================================================

baps.stone_dialog = {
    show: function (frm) {
        // Define Dialog
        let d = new frappe.ui.Dialog({
            title: __('Select Stones - Filter & Search'),
            size: 'extra-large',
            fields: [
                { fieldname: 'filter_no', fieldtype: 'Data', label: __('Filter No') },
                { 
                    fieldname: 'saved_filters', fieldtype: 'Select', label: __('Load Saved Filter'), 
                    options: [''], default: '' 
                },
                { fieldtype: 'Section Break', label: __('Filter Criteria') },
                { fieldname: 'project', fieldtype: 'Link', label: __('Project'), options: 'Baps Project' },
                
                // MAIN PART: Triggers filter on Sub Part
                { 
                    fieldname: 'main_part', 
                    fieldtype: 'Link', 
                    label: __('Main Part'), 
                    options: 'Main Part',
                    onchange: function() {
                        // When Main Part changes, clear selected Sub Parts and refresh the list
                        d.set_value('sub_part', '');
                        if (d.fields_dict.sub_part && d.fields_dict.sub_part._refresh_options) {
                            d.fields_dict.sub_part._refresh_options();
                        }
                    }
                },
                
                { fieldtype: 'Column Break' },
                
                // SUB PART: Custom MultiSelect (Logic handled in setup_sub_part_multiselect)
                { 
                    fieldname: 'sub_part', 
                    fieldtype: 'Data', // Using Data to hold the comma-separated string
                    label: __('Sub Part') 
                },
                
                { 
                    fieldname: 'stone_name', 
                    fieldtype: 'Link', 
                    label: __('Stone Name'),
                    options: 'Stone Name'
                },
                
                { fieldtype: 'Section Break', label: __('Dimension Filters') },
                // L1 Filters
                { 
                    fieldname: 'l1_filter_type', fieldtype: 'Select', label: __('L1 (Length) Filter'),
                    options: ['None', 'Below', 'Above', 'Between'], default: 'None',
                    onchange: () => baps.stone_dialog.toggle_dimension_fields(d, 'l1')
                },
                { fieldname: 'l1_below', fieldtype: 'Float', label: __('L1 Below'), hidden: 1 },
                { fieldname: 'l1_above', fieldtype: 'Float', label: __('L1 Above'), hidden: 1 },
                { fieldname: 'l1_between_from', fieldtype: 'Float', label: __('L1 From'), hidden: 1 },
                { fieldname: 'l1_between_to', fieldtype: 'Float', label: __('L1 To'), hidden: 1 },
                { fieldtype: 'Column Break' },
                // B1 Filters
                { 
                    fieldname: 'b1_filter_type', fieldtype: 'Select', label: __('B1 (Breadth) Filter'),
                    options: ['None', 'Below', 'Above', 'Between'], default: 'None',
                    onchange: () => baps.stone_dialog.toggle_dimension_fields(d, 'b1')
                },
                { fieldname: 'b1_below', fieldtype: 'Float', label: __('B1 Below'), hidden: 1 },
                { fieldname: 'b1_above', fieldtype: 'Float', label: __('B1 Above'), hidden: 1 },
                { fieldname: 'b1_between_from', fieldtype: 'Float', label: __('B1 From'), hidden: 1 },
                { fieldname: 'b1_between_to', fieldtype: 'Float', label: __('B1 To'), hidden: 1 },
                { fieldtype: 'Column Break' },
                // H1 Filters
                { 
                    fieldname: 'h1_filter_type', fieldtype: 'Select', label: __('H1 (Height) Filter'),
                    options: ['None', 'Below', 'Above', 'Between'], default: 'None',
                    onchange: () => baps.stone_dialog.toggle_dimension_fields(d, 'h1')
                },
                { fieldname: 'h1_below', fieldtype: 'Float', label: __('H1 Below'), hidden: 1 },
                { fieldname: 'h1_above', fieldtype: 'Float', label: __('H1 Above'), hidden: 1 },
                { fieldname: 'h1_between_from', fieldtype: 'Float', label: __('H1 From'), hidden: 1 },
                { fieldname: 'h1_between_to', fieldtype: 'Float', label: __('H1 To'), hidden: 1 },

                { fieldtype: 'Section Break' },
                { 
                    fieldname: 'search_btn', fieldtype: 'Button', label: __('🔍 Search Stones'),
                    click: () => baps.stone_dialog.search_stones(frm, d)
                },
                { fieldtype: 'Section Break', label: __('Available Stones') },
                { fieldname: 'stones_html', fieldtype: 'HTML' }
            ],
            primary_action_label: __('Add Selected Stones'),
            primary_action: function(values) {
                baps.stone_dialog.add_selected_stones(frm, d);
            }
        });

        d.show();

        // Setup Custom Footer Buttons
        d.$wrapper.find('.modal-footer').prepend(`
            <div class="left-footer-buttons" style="float:left; display:flex; gap:8px;"></div>
        `);

        // Load Data
        baps.stone_dialog.load_saved_filters(d);
        
        // ---------------------------------------------------------------------
        // INITIALIZE CUSTOM MULTISELECT WITH DEPENDENCY LOGIC
        // ---------------------------------------------------------------------
        baps.stone_dialog.setup_sub_part_multiselect(d);

        // Auto-generate Filter No
        frappe.call({
            method: 'baps.baps.doctype.cutting_planning.cutting_planning.generate_filter_no',
            callback: function (r) {
                if (r.message) {
                    d.set_value('filter_no', r.message);
                    baps.stone_dialog.update_dialog_buttons(d, null);
                }
            }
        });

        // Bind Events
        d.fields_dict.saved_filters.$input.on('change', function() {
            const selected = d.get_value('saved_filters') || '';
            if (selected && selected.trim()) {
                baps.stone_dialog.load_filter(frm, d, selected);
            } else {
                let curr_filter_no = d.get_value('filter_no') || '';
                d.clear();
                d.set_value('filter_no', curr_filter_no);
                baps.stone_dialog.update_dialog_buttons(d, null);
            }
        });

        d.fields_dict.filter_no.$input.on('input', function() {
            baps.stone_dialog.update_dialog_buttons(d, null);
        });

        // Show Filters Management Button
        d.$wrapper.find('.left-footer-buttons').append(`
            <button class="btn btn-secondary btn-sm show-filters-btn" type="button">
                ${__('Show Filters')}
            </button>
        `);
        d.$wrapper.find('.show-filters-btn').on('click', function() {
            baps.stone_dialog.show_filters_table(frm, d);
        });

        // Initial Search
        setTimeout(() => {
            baps.stone_dialog.search_stones(frm, d);
        }, 300);
    },

    toggle_dimension_fields: function (dialog, dimension) {
        let type = dialog.get_value(`${dimension}_filter_type`);
        if (!dialog.get_field(`${dimension}_below`)) return;
        
        dialog.get_field(`${dimension}_below`).df.hidden = (type !== 'Below');
        dialog.get_field(`${dimension}_above`).df.hidden = (type !== 'Above');
        dialog.get_field(`${dimension}_between_from`).df.hidden = (type !== 'Between');
        dialog.get_field(`${dimension}_between_to`).df.hidden = (type !== 'Between');
        dialog.refresh();
    },

    // =========================================================================
    // CUSTOM MULTI-SELECT LOGIC (With Main Part Dependency)
    // =========================================================================
    setup_sub_part_multiselect: function(dialog) {
        const field = dialog.fields_dict.sub_part;
        if (!field) return;

        const $wrapper = field.$wrapper;
        const $input = field.$input;

        // Hide original input
        $input.hide();
        
        const $container = $(`
            <div class="custom-multiselect">
                <div class="selected-items" style="display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 8px; min-height: 30px;"></div>
                <div class="input-group">
                    <input type="text" class="form-control search-input" placeholder="Search and select sub parts...">
                    <button class="btn btn-default dropdown-toggle" type="button" data-toggle="dropdown">
                        <i class="fa fa-chevron-down"></i>
                    </button>
                    <ul class="dropdown-menu" style="max-height: 250px; overflow-y: auto; width: 100%;"></ul>
                </div>
            </div>
        `).insertAfter($input);

        const $selectedItems = $container.find('.selected-items');
        const $searchInput = $container.find('.search-input');
        const $dropdown = $container.find('.dropdown-menu');

        let allData = []; // Stores objects {name: 'X', main_part: 'Y'}
        let selectedValues = [];

        // Load ALL Sub Parts and their Main Part linkage
        frappe.call({
            method: 'frappe.client.get_list',
            args: {
                doctype: 'Sub Part',
                fields: ['name', 'main_part'], // FETCH MAIN PART FOR FILTERING
                limit_page_length: 1000,
                order_by: 'name asc'
            },
            callback: function(r) {
                if (r.message) {
                    allData = r.message;
                    refreshOptions(); // Initial render
                }
            }
        });

        // Function to filter options based on Main Part selection
        function refreshOptions() {
            const currentMainPart = dialog.get_value('main_part');
            let filteredOptions = allData;

            // If a Main Part is selected, filter the list
            if (currentMainPart) {
                filteredOptions = allData.filter(item => item.main_part === currentMainPart);
            }

            // Extract just the names for the dropdown
            const optionNames = filteredOptions.map(item => item.name);
            renderDropdown(optionNames);
            
            // Validate selected items (if Main Part changed, remove invalid selections)
            // Optional: Uncomment below if you want to strictly remove invalid selections immediately
            /*
            const validSet = new Set(optionNames);
            const validSelected = selectedValues.filter(v => validSet.has(v));
            if (validSelected.length !== selectedValues.length) {
                selectedValues = validSelected;
                renderSelectedItems();
            }
            */
        }

        function renderDropdown(options) {
            $dropdown.empty();
            if (options.length === 0) {
                $dropdown.append(`
                    <li class="dropdown-item disabled" style="padding: 8px 12px; color: #999;">
                        No sub parts found for selected Main Part
                    </li>
                `);
                return;
            }
            
            options.forEach(option => {
                const isSelected = selectedValues.includes(option);
                $dropdown.append(`
                    <li class="dropdown-item ${isSelected ? 'active' : ''}" data-value="${option}" style="cursor: pointer; padding: 8px 12px;">
                        <input type="checkbox" ${isSelected ? 'checked' : ''} style="margin-right: 8px; pointer-events: none;">
                        <span>${option}</span>
                    </li>
                `);
            });
        }

        function renderSelectedItems() {
            $selectedItems.empty();
            if (selectedValues.length === 0) {
                $selectedItems.html(`<span style="color: #999; font-size: 12px;">No sub parts selected</span>`);
            } else {
                selectedValues.forEach(value => {
                    $selectedItems.append(`
                        <span class="badge badge-primary remove-badge" style="padding: 6px 10px; font-size: 12px; cursor: pointer; background: #5e64ff;" data-value="${value}">
                            ${value} <i class="fa fa-times" style="margin-left: 5px;"></i>
                        </span>
                    `);
                });
            }
            // Update hidden input
            $input.val(selectedValues.join(',')).trigger('change');
        }

        // Search functionality
        $searchInput.on('input', function() {
            const searchTerm = $(this).val().toLowerCase();
            const currentMainPart = dialog.get_value('main_part');
            
            // Filter by Main Part AND Search Term
            let filtered = allData;
            if (currentMainPart) {
                filtered = filtered.filter(item => item.main_part === currentMainPart);
            }
            
            const matchingNames = filtered
                .map(item => item.name)
                .filter(name => name.toLowerCase().includes(searchTerm));
                
            renderDropdown(matchingNames);
        });

        // Dropdown item click
        $dropdown.on('click', '.dropdown-item', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if ($(this).hasClass('disabled')) return;
            
            const value = $(this).data('value');
            const index = selectedValues.indexOf(value);
            
            if (index > -1) selectedValues.splice(index, 1);
            else selectedValues.push(value);
            
            renderSelectedItems();
            
            // Re-render dropdown to update checkboxes (keeping current search)
            $searchInput.trigger('input'); 
        });

        // Remove badge
        $selectedItems.on('click', '.remove-badge', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const value = $(this).data('value');
            selectedValues = selectedValues.filter(v => v !== value);
            renderSelectedItems();
            $searchInput.trigger('input');
        });

        // Keep dropdown open
        $dropdown.on('click', function(e) { e.stopPropagation(); });

        // Expose methods for external use
        field._get_selected_values = () => selectedValues;
        field._set_selected_values = (values) => {
            selectedValues = Array.isArray(values) ? values : [];
            renderSelectedItems();
            refreshOptions(); // Ensure dropdown is correct
        };
        // Triggered by Main Part onchange
        field._refresh_options = () => {
             selectedValues = []; // Clear selection on Main Part change
             renderSelectedItems();
             refreshOptions();
        };
        
        renderSelectedItems();
    },

    load_saved_filters: function(dialog) {
        frappe.call({
            method: 'baps.baps.doctype.cutting_planning.cutting_planning.get_saved_filters',
            callback: function (r) {
                let opts = [''];
                if (r.message && r.message.length) {
                    r.message.forEach(f => opts.push(f));
                }
                dialog.set_df_property('saved_filters', 'options', opts);
                dialog.refresh_field('saved_filters');
            }
        });
    },

    update_dialog_buttons: function(dialog, loaded_filter_no = null) {
        dialog.$wrapper.find('.btn-save-filter, .btn-add-new, .btn-save-new-filter').remove();
        const leftContainer = dialog.$wrapper.find('.left-footer-buttons');
        const is_loaded = !!loaded_filter_no || !!dialog.get_value('saved_filters');
        const filter_no_value = (dialog.get_value('filter_no') || '').toString().trim();

        dialog.set_primary_action(__('Add Selected Stones'), () => {
            dialog.primary_action && dialog.primary_action();
        });

        if (is_loaded) {
            leftContainer.append(`<button class="btn btn-success btn-sm btn-save-filter">💾 ${__('Save Filter')}</button>`);
            leftContainer.append(`<button class="btn btn-info btn-sm btn-add-new">➕ ${__('Add New')}</button>`);

            dialog.$wrapper.find('.btn-save-filter').off('click').on('click', () => {
                const existing = dialog.get_value('saved_filters') || null;
                baps.stone_dialog.save_filter(dialog, existing);
            });

            dialog.$wrapper.find('.btn-add-new').off('click').on('click', () => {
                dialog.clear();
                dialog.set_value('saved_filters', '');
                frappe.call({
                    method: 'baps.baps.doctype.cutting_planning.cutting_planning.generate_filter_no',
                    callback: function(r) {
                        if (r.message) {
                            dialog.set_value('filter_no', r.message);
                            baps.stone_dialog.update_dialog_buttons(dialog, null);
                        }
                    }
                });
                dialog.fields_dict.stones_html.$wrapper.html(`<div class="text-center text-muted" style="padding: 60px;">Ready to create new filter</div>`);
            });

        } else if (filter_no_value) {
            leftContainer.append(`<button class="btn btn-success btn-sm btn-save-new-filter">💾 ${__('Save Filter')}</button>`);
            dialog.$wrapper.find('.btn-save-new-filter').off('click').on('click', () => {
                baps.stone_dialog.save_filter(dialog, null);
            });
        }
    },

    save_filter: function(dialog, existing_filter = null) {
        let filter_no = dialog.get_value('filter_no') || '';
        if (!filter_no || !filter_no.toString().trim()) {
            frappe.msgprint(__('Filter No is required.'));
            return;
        }

        let values = dialog.get_values();
        if (!values) return;

        // EXTRACT MULTI-SELECT VALUES
        const sub_part_field = dialog.fields_dict.sub_part;
        if (sub_part_field && sub_part_field._get_selected_values) {
            const selected = sub_part_field._get_selected_values();
            values.sub_part = selected.join(','); 
        }

        delete values.stones_html;
        delete values.saved_filters;
        delete values.search_btn;

        frappe.call({
            method: 'baps.baps.doctype.cutting_planning.cutting_planning.save_stone_filter',
            args: {
                filter_name: filter_no,
                filter_data: values,
                existing_filter: existing_filter
            },
            callback: function (r) {
                if (r && r.message) {
                    frappe.show_alert({
                        message: existing_filter ? __('Filter updated') : __('Filter saved'),
                        indicator: 'green'
                    }, 3);
                    baps.stone_dialog.load_saved_filters(dialog);
                    setTimeout(() => {
                        dialog.set_value('saved_filters', filter_no);
                        baps.stone_dialog.update_dialog_buttons(dialog, filter_no);
                    }, 250);
                }
            }
        });
    },

    load_filter: function(frm, dialog, filter_name) {
        if (!filter_name) return;
        frappe.call({
            method: 'baps.baps.doctype.cutting_planning.cutting_planning.load_stone_filter',
            args: { filter_name: filter_name },
            callback: function (r) {
                if (r.message) {
                    let filter_data = r.message;
                    if (typeof filter_data === 'string') filter_data = JSON.parse(filter_data);

                    Object.keys(filter_data).forEach(key => {
                        if (dialog.fields_dict[key]) {
                            let value = filter_data[key];

                            // HANDLE MULTI-SELECT LOADING
                            if (key === 'sub_part') {
                                const sub_part_field = dialog.fields_dict.sub_part;
                                if (sub_part_field && sub_part_field._set_selected_values) {
                                    const values = typeof value === 'string' 
                                        ? value.split(',').map(s => s.trim()).filter(s => s)
                                        : (Array.isArray(value) ? value : []);
                                    sub_part_field._set_selected_values(values);
                                }
                            } else {
                                dialog.set_value(key, value);
                            }
                        }
                    });

                    dialog.set_value('saved_filters', filter_name);
                    
                    setTimeout(() => {
                        ['l1', 'b1', 'h1'].forEach(dim => baps.stone_dialog.toggle_dimension_fields(dialog, dim));
                        baps.stone_dialog.update_dialog_buttons(dialog, filter_name);
                        baps.stone_dialog.search_stones(frm, dialog);
                    }, 200);
                }
            }
        });
    },

    show_filters_table: function(frm, parent_dialog) {
        frappe.call({
            method: 'frappe.client.get_list',
            args: {
                doctype: 'Cutting Filter',
                fields: ['name', 'filter_no', 'project', 'main_part', 'sub_part', 'stone_name'],
                order_by: 'modified desc',
                limit_page_length: 500
            },
            callback: function (r) {
                if (!r.message || r.message.length === 0) {
                    frappe.msgprint(__('No saved filters found.'));
                    return;
                }

                let html = `
                    <div style="max-height: 500px; overflow-y: auto;">
                        <table class="table table-bordered table-hover" style="font-size: 12px;">
                            <thead style="position: sticky; top: 0; background: white; z-index: 10;">
                                <tr style="background: #f8f9fa;">
                                    <th>Filter No</th><th>Project</th><th>Main</th><th>Sub</th><th>Stone Name</th><th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                `;

                r.message.forEach((filter) => {
                    html += `
                        <tr>
                            <td><strong>${filter.filter_no || filter.name}</strong></td>
                            <td>${filter.project || '-'}</td>
                            <td>${filter.main_part || '-'}</td>
                            <td>${filter.sub_part || '-'}</td>
                            <td>${filter.stone_name || '-'}</td>
                            <td>
                                <button class="btn btn-xs btn-primary load-filter-btn" data-name="${filter.filter_no || filter.name}">Load</button>
                                <button class="btn btn-xs btn-danger delete-filter-btn" data-name="${filter.name}">Delete</button>
                            </td>
                        </tr>
                    `;
                });

                html += `</tbody></table></div>`;

                let filters_dialog = new frappe.ui.Dialog({
                    title: __('Manage Filters'),
                    size: 'extra-large',
                    fields: [{ fieldtype: 'HTML', fieldname: 'filters_table', options: html }]
                });

                filters_dialog.show();

                filters_dialog.$wrapper.find('.load-filter-btn').on('click', function() {
                    const fn = $(this).data('name');
                    filters_dialog.hide();
                    baps.stone_dialog.load_filter(frm, parent_dialog, fn);
                });

                filters_dialog.$wrapper.find('.delete-filter-btn').on('click', function() {
                    const name = $(this).data('name');
                    frappe.confirm(__('Delete this filter?'), function() {
                        frappe.call({
                            method: 'frappe.client.delete',
                            args: { doctype: 'Cutting Filter', name: name },
                            callback: function() {
                                frappe.show_alert({ message: __('Filter deleted'), indicator: 'red' });
                                filters_dialog.hide();
                                baps.stone_dialog.load_saved_filters(parent_dialog);
                            }
                        });
                    });
                });
            }
        });
    },

    search_stones: function(frm, dialog) {
        let filters = dialog.get_values();
        
        // EXTRACT MULTI-SELECT VALUES FOR SEARCH
        const sub_part_field = dialog.fields_dict.sub_part;
        if (sub_part_field && sub_part_field._get_selected_values) {
            const selected = sub_part_field._get_selected_values();
            filters.sub_part = selected.join(',');
        }
        
        delete filters.stones_html;
        delete filters.saved_filters;

        console.log('All Filters Being Sent:', filters);

        dialog.fields_dict.stones_html.$wrapper.html(`<div class="text-center" style="padding: 60px;"><i class="fa fa-spinner fa-spin fa-3x text-muted"></i></div>`);

        frappe.call({
            method: 'baps.baps.doctype.cutting_planning.cutting_planning.get_filtered_stones',
            args: {
                filters: filters,
                block_no: frm.doc.block_no,
                current_plan: frm.doc.name || null
            },
            callback: function (r) {
                if (r.message && r.message.length > 0) {
                    baps.stone_dialog.display_stones(dialog, r.message, frm);
                } else {
                    dialog.fields_dict.stones_html.$wrapper.html(`<div class="text-center text-muted" style="padding: 60px;">No stones found</div>`);
                }
                baps.stone_dialog.update_dialog_buttons(dialog, dialog.get_value('saved_filters') || null);
            }
        });
    },

    display_stones: function(dialog, stones, frm) {
        dialog._stones_data = stones;
        dialog._current_sort = dialog._current_sort || { column: null, direction: 'asc' };
        
        let html = `
            <div style="max-height: 450px; overflow-y: auto;">
                <table class="table table-bordered table-hover" style="font-size: 12px;">
                    <thead style="position: sticky; top: 0; background: white; z-index: 10;">
                        <tr style="background: #f8f9fa;">
                            <th style="width: 40px;"><input type="checkbox" id="select_all_stones" /></th>
                            <th class="sortable-header" data-column="stone_no" style="cursor:pointer">Code <i class="fa fa-sort"></i></th>
                            <th class="sortable-header" data-column="stone_name" style="cursor:pointer">Name <i class="fa fa-sort"></i></th>
                            <th class="sortable-header" data-column="project_name" style="cursor:pointer">Project <i class="fa fa-sort"></i></th>
                            <th class="sortable-header" data-column="main_part" style="cursor:pointer">Main <i class="fa fa-sort"></i></th>
                            <th class="sortable-header" data-column="sub_part" style="cursor:pointer">Sub <i class="fa fa-sort"></i></th>
                            <th>L1</th><th>L2</th><th>B1</th><th>B2</th><th>H1</th><th>H2</th>
                            <th class="sortable-header" data-column="volume" style="cursor:pointer">Vol <i class="fa fa-sort"></i></th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        stones.forEach((stone) => {
            html += `
                <tr style="cursor: pointer;" onclick="this.querySelector('.stone-checkbox').click();">
                    <td><input type="checkbox" class="stone-checkbox" data-stone='${JSON.stringify(stone).replace(/'/g, "&apos;")}' onclick="event.stopPropagation();" /></td>
                    <td><strong>${stone.stone_no || stone.stone_code || ''}</strong></td>
                    <td>${stone.stone_name || '-'}</td>
                    <td>${stone.project_name || '-'}</td>
                    <td>${stone.main_part || '-'}</td>
                    <td>${stone.sub_part || '-'}</td>
                    <td>${(parseFloat(stone.l1) || 0).toFixed(2)}</td>
                    <td>${(parseFloat(stone.l2) || 0).toFixed(2)}</td>
                    <td>${(parseFloat(stone.b1) || 0).toFixed(2)}</td>
                    <td>${(parseFloat(stone.b2) || 0).toFixed(2)}</td>
                    <td>${(parseFloat(stone.h1) || 0).toFixed(2)}</td>
                    <td>${(parseFloat(stone.h2) || 0).toFixed(2)}</td>
                    <td><strong>${(parseFloat(stone.volume) || 0).toFixed(3)}</strong></td>
                </tr>
            `;
        });

        html += `</tbody></table></div><div style="margin-top: 15px; padding: 10px;"><strong>${stones.length}</strong> stones found</div>`;

        dialog.fields_dict.stones_html.$wrapper.html(html);

        dialog.fields_dict.stones_html.$wrapper.find('#select_all_stones').on('change', function () {
            dialog.fields_dict.stones_html.$wrapper.find('.stone-checkbox').prop('checked', $(this).is(':checked'));
        });

        dialog.fields_dict.stones_html.$wrapper.find('.sortable-header').on('click', function() {
            baps.stone_dialog.sort_stones(dialog, $(this).data('column'), frm);
        });
    },

    sort_stones: function(dialog, column, frm) {
        if (!dialog._stones_data || dialog._stones_data.length === 0) return;
        let direction = 'asc';
        if (dialog._current_sort.column === column) {
            direction = dialog._current_sort.direction === 'asc' ? 'desc' : 'asc';
        }
        dialog._current_sort = { column: column, direction: direction };

        const sorted_stones = [...dialog._stones_data].sort((a, b) => {
            let valA = a[column] || '';
            let valB = b[column] || '';
            
            if (['l1','l2','b1','b2','h1','h2','volume'].includes(column)) {
                valA = parseFloat(valA) || 0;
                valB = parseFloat(valB) || 0;
            } else {
                valA = String(valA).toLowerCase();
                valB = String(valB).toLowerCase();
            }

            if (valA < valB) return direction === 'asc' ? -1 : 1;
            if (valA > valB) return direction === 'asc' ? 1 : -1;
            return 0;
        });

        baps.stone_dialog.display_stones(dialog, sorted_stones, frm);
    },

    add_selected_stones: function (frm, dialog) {
        let selected = [];
        let altered = [];

        dialog.fields_dict.stones_html.$wrapper.find('.stone-checkbox:checked').each(function () {
            let stone = $(this).data('stone');
            selected.push(stone);
            if (stone.is_altered) altered.push(stone.stone_no || stone.stone_code);
        });

        if (selected.length === 0) {
            frappe.msgprint(__('Please select at least one stone'));
            return;
        }

        if (altered.length > 0) {
            frappe.warn(__('Altered Stones Selected'), __(`These stones have altered properties: <strong>${altered.join(', ')}</strong><br><br>Continue?`),
                () => baps.stone_dialog.add_stones_to_details(frm, selected, dialog),
                () => frappe.show_alert({ message: __('Cancelled'), indicator: 'orange' })
            );
        } else {
            baps.stone_dialog.add_stones_to_details(frm, selected, dialog);
        }
    },

    add_stones_to_details: function(frm, selected_stones, dialog) {
        selected_stones.forEach(stone => {
            let volume = stone.volume;
            if (!volume || volume === 0) {
                let l_avg = (parseFloat(stone.l1) + parseFloat(stone.l2)) / 2;
                let b_avg = (parseFloat(stone.b1) + parseFloat(stone.b2)) / 2;
                let h_avg = (parseFloat(stone.h1) + parseFloat(stone.h2)) / 2;
                volume = l_avg * b_avg * h_avg;
            }

            frm.add_child('details', {
                project_name: stone.project_name || '',
                stone_no: stone.stone_no || stone.stone_code,
                l1: parseFloat(stone.l1) || 0,
                l2: parseFloat(stone.l2) || 0,
                b1: parseFloat(stone.b1) || 0,
                b2: parseFloat(stone.b2) || 0,
                h1: parseFloat(stone.h1) || 0,
                h2: parseFloat(stone.h2) || 0,
                volume: parseFloat(volume) || 0
            });
        });

        frm.refresh_field('details');
        calculate_summary(frm);

        frappe.show_alert({ message: __(`Added ${selected_stones.length} stone(s)`), indicator: 'green' }, 5);
        dialog.hide();
    }
};

// =============================================================================
// 2. FORM CONTROLLER (Cutting Planning) - UNCHANGED
// =============================================================================

frappe.ui.form.on('Cutting Planning', {
    refresh: function (frm) {
        frm.set_df_property("block_no", "read_only", !frm.doc.__islocal ? 1 : 0);

        if (!frm.doc.__last_block_no) {
            frm.doc.__last_block_no = frm.doc.block_no;
        }
        
        frm.set_query("block_no", () => ({
            filters: { status: "Ready for Cutting Planning" },
            query: "baps.baps.doctype.cutting_planning.cutting_planning.get_available_blocks"
        }));

        if (frm.is_new() && !frm.doc.trial_no && frm.doc.block_no) {
            frappe.call({
                method: 'baps.baps.doctype.cutting_planning.cutting_planning.get_next_trial_number',
                args: { block_no: frm.doc.block_no },
                callback: function (r) {
                    if (r.message) frm.set_value('trial_no', r.message);
                }
            });
        }

        frm.fields_dict['details'].grid.cannot_add_rows = true;
        frm.refresh_field('details');

        if (frm.doc.block_no) update_plan_count(frm);
    },

    block_no: function (frm) {
        if (!frm.doc.block_no) {
            frm.set_value("block_type", "");
            frm.set_value("region", "");
            frm.set_value("block_volume", "");
            frm.set_value("trial_no", "");
            frm.clear_table("details");
            frm.refresh_field("details");
            return;
        }

        if (frm.doc.details && frm.doc.details.length > 0) {
            frappe.confirm(
                __('Changing the Block No. will clear all existing stone records. Do you want to continue?'),
                function() {
                    frm.clear_table("details");
                    frm.refresh_field("details");
                    update_block_details(frm);
                },
                function() {
                    frm.set_value("block_no", frm.doc.__last_block_no || "");
                }
            );
        } else {
            update_block_details(frm);
        }
        frm.doc.__last_block_no = frm.doc.block_no;
    },
    
    trial_no: function(frm) {
        if (frm.doc.block_no && frm.doc.trial_no) {
            frappe.call({
                method: 'frappe.client.get_list',
                args: {
                    doctype: 'Cutting Planning',
                    filters: {
                        block_no: frm.doc.block_no,
                        trial_no: frm.doc.trial_no,
                        name: ['!=', frm.doc.name || '']
                    },
                    fields: ['name']
                },
                callback: function(r) {
                    if (r.message && r.message.length > 0) {
                        frappe.msgprint({
                            title: __('Duplicate Trial Number'),
                            indicator: 'red',
                            message: __('Trial No {0} already exists for Block {1}.', [frm.doc.trial_no, frm.doc.block_no])
                        });
                    }
                }
            });
        }
    },

    show_stone: function (frm) {
        if (!frm.doc.block_no) {
            frappe.msgprint(__('Please select a Block Number first'));
            return;
        }
        baps.stone_dialog.show(frm);
    },
    
    validate: function(frm) {
        if (!frm.doc.details || frm.doc.details.length === 0) {
            frappe.msgprint({
                title: __('Cannot Save'), indicator: 'red',
                message: __('Please add at least one stone in the Details table before saving.')
            });
            frappe.validated = false;
            return false;
        }
    },
    
    is_final_plan: function(frm) {
        if (frm.doc.is_final_plan) {
            if (!frm.doc.details || frm.doc.details.length === 0) {
                frappe.msgprint({ title: __('Cannot Mark as Final Plan'), indicator: 'red', message: __('Please add at least one stone first.') });
                frm.set_value('is_final_plan', 0);
                return;
            }
        }
        
        if (!frm.is_new() && frm.doc.name) {
            let new_value = frm.doc.is_final_plan;
            let old_value = !new_value;
            frappe.confirm(
                new_value ? __('Mark as Final Plan?') : __('Unmark as Final Plan?'),
                function() {
                    frm.save().then(() => {
                        frappe.show_alert({ message: new_value ? __('Marked as Final') : __('Unmarked'), indicator: new_value ? 'green' : 'orange' }, 3);
                    });
                },
                function() {
                    frm.set_value('is_final_plan', old_value);
                }
            );
        }
    }
});

// =============================================================================
// 3. CHILD TABLE EVENTS
// =============================================================================

frappe.ui.form.on('Cutting Plan Details', {
    details_add: calculate_summary,
    details_remove: calculate_summary,
    volume: calculate_summary,
    l1: (frm, cdt, cdn) => calculate_stone_volume(frm, cdt, cdn),
    l2: (frm, cdt, cdn) => calculate_stone_volume(frm, cdt, cdn),
    b1: (frm, cdt, cdn) => calculate_stone_volume(frm, cdt, cdn),
    b2: (frm, cdt, cdn) => calculate_stone_volume(frm, cdt, cdn),
    h1: (frm, cdt, cdn) => calculate_stone_volume(frm, cdt, cdn),
    h2: (frm, cdt, cdn) => calculate_stone_volume(frm, cdt, cdn)
});

// =============================================================================
// 4. HELPER FUNCTIONS
// =============================================================================

function update_block_details(frm) {
    frappe.db.get_doc("Block", frm.doc.block_no).then(block_doc => {
        frm.set_value("block_type", block_doc.material_type || "");
        frm.set_value("region", block_doc.region || "");
        frm.set_value("block_volume", block_doc.volume || 0);
        calculate_summary(frm);
        update_plan_count(frm);
        
        if (frm.is_new() || !frm.doc.trial_no) {
            frappe.call({
                method: 'baps.baps.doctype.cutting_planning.cutting_planning.get_next_trial_number',
                args: { block_no: frm.doc.block_no },
                callback: function (r) {
                    if (r.message) frm.set_value('trial_no', r.message);
                }
            });
        }
    });
}

function calculate_stone_volume(frm, cdt, cdn) {
    let row = locals[cdt][cdn];
    let l1 = parseFloat(row.l1) || 0;
    let l2 = parseFloat(row.l2) || 0;
    let b1 = parseFloat(row.b1) || 0;
    let b2 = parseFloat(row.b2) || 0;
    let h1 = parseFloat(row.h1) || 0;
    let h2 = parseFloat(row.h2) || 0;
    
    let volume = ((l1 + l2) / 2) * ((b1 + b2) / 2) * ((h1 + h2) / 2);
    frappe.model.set_value(cdt, cdn, 'volume', volume);
    calculate_summary(frm);
}

function calculate_summary(frm) {
    if (!frm.doc.details) return;
    let total_stone_volume = 0;
    frm.doc.details.forEach(row => {
        total_stone_volume += parseFloat(row.volume) || 0;
    });

    frm.set_value('total_stone_volume', total_stone_volume);
    let block_volume = parseFloat(frm.doc.block_volume) || 0;
    if (block_volume > 0) {
        let wastage = ((block_volume - total_stone_volume) / block_volume) * 100;
        frm.set_value('waste', Math.max(0, wastage));
    } else {
        frm.set_value('waste', 0);
    }
}

function update_plan_count(frm) {
    if (!frm.doc.block_no) {
        frm.set_value('plan_count', 0);
        return;
    }
    frappe.call({
        method: 'frappe.client.get_count',
        args: {
            doctype: 'Cutting Planning',
            filters: { block_no: frm.doc.block_no }
        },
        callback: function (r) {
            frm.set_value('plan_count', r.message || 0);
        }
    });
}

// =============================================================================
// 5. LIST VIEW SETTINGS
// =============================================================================

frappe.listview_settings['Cutting Planning'] = {
    onload: function (list_view) {
        list_view.set_column_formatter('plan_count', function (value, doc) {
            if (!doc.block_no || !doc.plan_count) return '—';
            const count = parseInt(doc.plan_count) || 0;
            return `
                <span class="plan-count-badge btn btn-xs btn-outline-primary"
                      data-block="${doc.block_no}"
                      style="padding: 2px 6px; font-size: 11px; cursor: pointer;">
                    ${count} ${count === 1 ? 'Plan' : 'Plans'}
                </span>
            `;
        });
    },
    refresh: function (list_view) {
        list_view.$wrapper.off('click', '.plan-count-badge').on('click', '.plan-count-badge', function (e) {
            e.stopPropagation();
            e.preventDefault();
            const block_no = $(this).data('block');
            if (window.show_all_plans_for_block) {
                window.show_all_plans_for_block(block_no);
            } else {
                frappe.set_route('List', 'Cutting Planning', { block_no: block_no });
            }
        });
    }
};