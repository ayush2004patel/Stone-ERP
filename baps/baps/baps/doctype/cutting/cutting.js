// Copyright (c) 2025, Amax Consultancy Pvt Ltd and contributors
// For license information, please see license.txt

frappe.ui.form.on("Cutting", {
	refresh(frm) {

		// Lock block_number after save
	if (!frm.doc.__islocal) {
		frm.set_df_property("block_number", "read_only", 1);
	} else {
		frm.set_df_property("block_number", "read_only", 0);
	}

		// Hide Add Row button from stones_table child table
		hide_add_row_button(frm);
			
		// Setup typing search
		if (frm.doc.typing_search) {
			filter_stones_table(frm, frm.doc.typing_search);
		}
	

		// Setup custom query for block_number field to show blocks from Job Order or regular blocks
		setup_block_number_query(frm);
		
		// Initialize the tracker object if it doesn't exist
		if (!frm._ignore_tracker) {
			frm._ignore_tracker = {};
		}
		
		// Only lock values if document is already saved
		if (!frm.doc.__islocal) {
			// Apply readonly to rows with CUT/IGNORE and store their values
			apply_saved_status_lock(frm);
		}
		
		// Hide add row button again after a delay to ensure it's hidden
		setTimeout(function() {
			hide_add_row_button(frm);
		}, 500);

		// Check for single stone and manage buttons
		setTimeout(function() {
			manage_save_assign_buttons(frm);
		}, 100);
	},
	
	site(frm) {
		// When site changes, reset block_number and refresh query
		if (frm.doc.block_number) {
			frm.set_value('block_number', '');
		}
		setup_block_number_query(frm);
	},
	
	validate(frm) {
		// Show confirmation dialog before saving
		return new Promise(function(resolve, reject) {
			frappe.confirm(
				__('Are you sure you want to save these changes?'),
				function() {
					// User clicked Yes
					resolve();
				},
				function() {
					// User clicked No
					frappe.validated = false;
					reject();
				}
			);
		});
	},
	


	onload(frm) {
		// Also setup query on form load
		setup_block_number_query(frm);
		// Hide add row button on load
		hide_add_row_button(frm);
		
		// Initialize the IGNORE tracker
		if (!frm._ignore_tracker) {
			frm._ignore_tracker = {};
		}

		// Check for single stone and manage buttons
		setTimeout(function() {
			manage_save_assign_buttons(frm);
		}, 100);
	},


	block_number(frm) {
    // CASE 1: BLOCK NUMBER DELETED BY USER
    if (!frm.doc.block_number) {

        // Clear dependent fields (but not site)
        frm.set_value("block_volume", "");
        frm.set_value("machine_no", "");
		frm.set_value("form_number", "");

        // Clear stones table
        frm.clear_table("stones_table");
        frm.refresh_field("stones_table");

        // Manage save/assign buttons after clearing
        manage_save_assign_buttons(frm);

        frappe.show_alert({
            message: __("Cleared: Block details & Stones"),
            indicator: "orange"
        });

        return; // IMPORTANT: Stop further code
    }

    // CASE 2: BLOCK NUMBER IS SELECTED → LOAD VALUES
    frappe.call({
        method: 'frappe.client.get',
        args: {
            doctype: 'Block',
            name: frm.doc.block_number
        },
        callback: function(r) {
            if (r.message) {
                // Set site if not already set
                if (!frm.doc.site) {
                    frm.set_value('site', r.message.site);
                }
                frm.set_value('block_volume', r.message.volume);
				frm.set_value('machine_no', r.message.machine_no || '');

                // Load stones ONLY if the block has a final plan
                check_final_plan_and_load_stones(frm);
            }
        }
    });

    // Disable machine number for non-BAPS sites
    check_site_for_machine_no(frm);
},



	

	add_new_stone(frm) {
		// Show dialog to add new stone
		show_add_stone_dialog(frm);
	},

	// Called when child table is updated
	stones_table: function(frm) {
		manage_save_assign_buttons(frm);
	},

	
	
});

// Child table events
// frappe.ui.form.on("Cutting Item", {
// 	cut_ignore: function(frm, cdt, cdn) {
// 		// When cut_ignore changes, apply readonly if IGNORE
// 		let row = locals[cdt][cdn];
// 		if (row.cut_ignore === 'IGNORE') {
// 			// Make the row readonly
// 			frappe.model.set_df_property(cdt, 'stone_project', 'read_only', 1, cdn);
// 			frappe.model.set_df_property(cdt, 'stone_number', 'read_only', 1, cdn);
// 			frappe.model.set_df_property(cdt, 'cut_ignore', 'read_only', 1, cdn);
			
// 			frappe.show_alert({
// 				message: __('Row marked as IGNORE - now readonly'),
// 				indicator: 'orange'
// 			});
// 		}
// 		frm.refresh_field('stones_table');
// 	}
// });


// Child table events
frappe.ui.form.on("Cutting Item", {
	cut_ignore: function(frm, cdt, cdn) {
		let row = locals[cdt][cdn];
		
		// Show notification when stone is marked as CUT (only on new documents)
		if (frm.doc.__islocal && row.cut_ignore === 'CUT') {
			frappe.show_alert({
				message: __('Stone {0} marked as CUT - will be added to Block records when saved', [row.stone_number || 'Unknown']),
				indicator: 'blue'
			});
		}
		
		// Only enforce lock if document is already saved
		if (!frm.doc.__islocal) {
			// Initialize tracker if it doesn't exist
			if (!frm._ignore_tracker) {
				frm._ignore_tracker = {};
			}
			
			// Check if the row was previously set to IGNORE
			if (frm._ignore_tracker[cdn] === 'IGNORE' && row.cut_ignore !== 'IGNORE') {
				// Prevent the change - revert back to IGNORE immediately
				setTimeout(() => {
					frappe.model.set_value(cdt, cdn, 'cut_ignore', 'IGNORE');
				}, 10);
				
				frappe.show_alert({
					message: __('Once saved as IGNORE, this cannot be changed'),
					indicator: 'red'
				});
				
				frappe.msgprint({
					title: __('Cannot Change Status'),
					indicator: 'red',
					message: __('Stone {0} was saved as IGNORE and cannot be changed.', [row.stone_number || 'Unknown'])
				});
				
				return false;
			}
			
			// Check if the row was previously set to CUT
			if (frm._ignore_tracker[cdn] === 'CUT' && row.cut_ignore === 'IGNORE') {
				// Prevent the change - revert back to CUT immediately
				setTimeout(() => {
					frappe.model.set_value(cdt, cdn, 'cut_ignore', 'CUT');
				}, 10);
				
				frappe.show_alert({
					message: __('Once saved as CUT, this cannot be changed'),
					indicator: 'red'
				});
				
				frappe.msgprint({
					title: __('Cannot Change Status'),
					indicator: 'red',
					message: __('Stone {0} was saved as CUT and cannot be changed.', [row.stone_number || 'Unknown'])
				});
				
				return false;
			}
		}
	},

	// When a stone row is added (this gets called after child row is added)
	stone_number: function(frm, cdt, cdn) {
		// Trigger button management when stone number is set
		manage_save_assign_buttons(frm);
	}
});

// Helper Functions

function hide_add_row_button(frm) {
	// Hide the "Add Row" button from stones_table child table
	// Stones should only be added via "Add New Stone" button or loaded from cutting plan
	if (frm.fields_dict.stones_table && frm.fields_dict.stones_table.grid) {
		// Method 1: Use Frappe's built-in method
		frm.fields_dict.stones_table.grid.cannot_add_rows = true;
		
		// Method 2: Hide using jQuery - multiple selectors to be thorough
		var grid_wrapper = frm.fields_dict.stones_table.grid.wrapper;
		
		// Hide all possible add row elements
		grid_wrapper.find('.grid-add-row').hide();
		grid_wrapper.find('.grid-footer').hide();
		grid_wrapper.find('.btn-open-row').hide();
		grid_wrapper.find('[data-label="Add Row"]').hide();
		grid_wrapper.find('button:contains("Add Row")').hide();
		
		// Method 3: Add CSS to completely remove the button
		grid_wrapper.find('.grid-add-row').css('display', 'none !important');
		grid_wrapper.find('.grid-footer').css('display', 'none !important');
		
		// Method 4: Remove the button from DOM entirely
		grid_wrapper.find('.grid-add-row').remove();
		grid_wrapper.find('.grid-footer .grid-add-row').parent().remove();
	}
}

function setup_block_number_query(frm) {
	// Set custom query for block_number based on selected site
	frm.set_query('block_number', function() {
		return {
			query: 'baps.baps.doctype.cutting.cutting.get_blocks_for_site',
			filters: {
				'site': frm.doc.site || null,
				'name': frm.doc.name || null
			}
		};
	});
}

function setup_custom_buttons(frm) {
	if (!frm.doc.__islocal) {
		// Add button to view cutting planning
		frm.add_custom_button(__('View Cutting Planning'), function() {
			if (frm.doc.block_number) {
				frappe.set_route('Form', 'Cutting Planning', {'block_no': frm.doc.block_number});
			}
		});

		// Add button to view residue if exists
		if (frm.doc.residue_link) {
			frm.add_custom_button(__('View Residue'), function() {
				frappe.set_route('Form', 'Cutting Residue', frm.doc.residue_link);
			});
		}
	}
}


function check_final_plan_and_load_stones(frm) {
	if (!frm.doc.block_number) {
		return;
	}

	// Check if block has a final cutting plan
	frappe.call({
		method: 'baps.baps.doctype.cutting.cutting.check_block_has_final_plan',
		args: {
			block_number: frm.doc.block_number
		},
		callback: function(r) {
			if (r.message && r.message.has_final_plan) {
				// Block has final plan, load stones
				load_stones_from_planning(frm);
			} else {
				// No final plan exists
				frappe.msgprint({
					title: __('No Final Cutting Plan'),
					indicator: 'orange',
					message: __('Block {0} does not have a final cutting plan. You can still proceed with cutting, but no stones will be pre-loaded.', [frm.doc.block_number])
				});
				// Clear stones table
				frm.clear_table('stones_table');
				frm.refresh_field('stones_table');
				
				// Manage save/assign buttons after clearing stones
				manage_save_assign_buttons(frm);
			}
		}
	});
}

function load_stones_from_planning(frm) {
	if (!frm.doc.block_number) {
		return;
	}

	frappe.call({
		method: 'baps.baps.doctype.cutting.cutting.get_stones_for_execution',
		args: {
			block_number: frm.doc.block_number,
			is_new: frm.doc.__islocal ? 1 : 0,
			execution_name: frm.doc.name || null
		},
		callback: function(r) {
			if (r.message && r.message.length > 0) {
				// Clear existing stones
				frm.clear_table('stones_table');
				
				// Add stones to table
				r.message.forEach(function(stone) {
					let row = frm.add_child('stones_table');
					row.stone_project = stone.project_name;
					row.stone_number = stone.stone_no;
					row.cut_ignore = '';
				});

				frm.refresh_field('stones_table');
				
				// Manage save/assign buttons after loading stones
				manage_save_assign_buttons(frm);
				
				frappe.show_alert({
					message: __('Loaded {0} stones from final cutting plan', [r.message.length]),
					indicator: 'green'
				});
			} else {
				frappe.msgprint({
					title: __('No Stones Found'),
					indicator: 'orange',
					message: __('No stones found in the final cutting plan for this block.')
				});
			}
		}
	});
}

function filter_stones_table(frm, search_text) {
	// Hide rows that don't match search
	let search_lower = search_text.toLowerCase();
	
	frm.fields_dict.stones_table.grid.grid_rows.forEach(function(row) {
		let stone_project = (row.doc.stone_project || '').toLowerCase();
		let stone_number = (row.doc.stone_number || '').toLowerCase();
		
		if (stone_project.includes(search_lower) || stone_number.includes(search_lower)) {
			$(row.wrapper).show();
		} else {
			$(row.wrapper).hide();
		}
	});
}

function show_all_stones(frm) {
	// Show all rows in the table
	frm.fields_dict.stones_table.grid.grid_rows.forEach(function(row) {
		$(row.wrapper).show();
	});
}

function show_add_stone_dialog(frm) {
	if (!frm.doc.block_number) {
		frappe.msgprint(__('Please select a Block Number first'));
		return;
	}

	// Get block details to filter stones
	frappe.call({
		method: 'frappe.client.get',
		args: {
			doctype: 'Block',
			name: frm.doc.block_number
		},
		callback: function(r) {
			if (r.message) {
				let block_type = r.message.material_type;
				
				// Show dialog to search and add stones
				let dialog = new frappe.ui.Dialog({
					title: __('Add New Stone'),
					fields: [
						{
							fieldname: 'filter_section',
							fieldtype: 'Section Break',
							label: __('Search Filters')
						},
						{
							fieldname: 'stone_code_search',
							label: __('Stone Code'),
							fieldtype: 'Data',
							description: __('Enter stone code to search')
						},
						{
							fieldname: 'col_break_1',
							fieldtype: 'Column Break'
						},
						{
							fieldname: 'project_filter',
							label: __('Project'),
							fieldtype: 'Link',
							options: 'Baps Project'
						},
						{
							fieldname: 'col_break_2',
							fieldtype: 'Column Break'
						},
						{
							fieldname: 'stone_type_filter',
							label: __('Stone Type'),
							fieldtype: 'Data',
							read_only: 1,
							default: block_type
						},
						{
							fieldname: 'search_section',
							fieldtype: 'Section Break'
						},
						{
							fieldname: 'search_btn',
							fieldtype: 'Button',
							label: __('Search'),
							click: function() {
								search_available_stones(dialog, frm, block_type);
							}
						},
						{
							fieldname: 'results_section',
							fieldtype: 'Section Break',
							label: __('Available Stones')
						},
						{
							fieldname: 'stones_html',
							fieldtype: 'HTML'
						}
					],
					primary_action_label: __('Add Selected'),
					primary_action: function() {
						add_selected_stones(dialog, frm);
					}
				});

				dialog.show();
			}
		}
	});
}

function search_available_stones(dialog, frm, block_type) {
	let stone_code_search = dialog.get_value('stone_code_search') || '';
	let project_filter = dialog.get_value('project_filter') || '';

	dialog.fields_dict.stones_html.$wrapper.html(`
		<div class="text-center" style="padding: 40px;">
			<i class="fa fa-spinner fa-spin fa-2x text-muted"></i>
			<p class="text-muted" style="margin-top: 15px;">Searching for stones...</p>
		</div>
	`);

	frappe.call({
		method: 'baps.baps.doctype.cutting.cutting.get_available_stones_for_addition',
		args: {
			block_number: frm.doc.block_number,
			stone_type: block_type,
			search_text: stone_code_search,
			project_filter: project_filter
		},
		callback: function(r) {
			if (r.message && r.message.length > 0) {
				display_available_stones(dialog, r.message);
			} else {
				dialog.fields_dict.stones_html.$wrapper.html(`
					<div class="text-center text-muted" style="padding: 40px;">
						<i class="fa fa-inbox fa-2x"></i>
						<p style="margin-top: 15px;"><strong>No stones found matching the criteria</strong></p>
						<div style="margin-top: 20px; font-size: 11px; text-align: left; max-width: 500px; margin-left: auto; margin-right: auto;">
							<p><strong>Available stones must meet ALL these conditions:</strong></p>
							<ul style="list-style: none; padding-left: 0;">
								<li>✓ Same stone type as selected block</li>
								<li>✓ Not cut (is_cut = 0)</li>
								<li>✓ Not in any final cutting plan</li>
								<li>✓ Not in any cutting </li>
								<li>✓ No order assigned (order_id is NULL)</li>
								<li>✓ No selection assigned (selection_id is NULL)</li>
								<li>✓ No lot assigned (lot_id is NULL)</li>
								<li>✓ No cutting planning assigned</li>
								<li>✓ Size List Form status: Verified or Published</li>
							</ul>
						</div>
					</div>
				`);
			}
		}
	});
}

function display_available_stones(dialog, stones) {
	let html = `
		<div class="alert alert-info" style="margin-bottom: 15px; font-size: 11px;">
			<strong><i class="fa fa-info-circle"></i> Available Stones (${stones.length} found)</strong><br>
			These stones are FREE to use - not assigned to any order, selection, lot, or cutting plan.
		</div>
		<div class="stone-results-container" style="max-height: 400px; overflow-y: auto;">
			<table class="table table-bordered table-hover" style="font-size: 12px;">
				<thead style="position: sticky; top: 0; background: white; z-index: 10;">
					<tr>
						<th style="width: 40px;">
							<input type="checkbox" id="select-all-stones" />
						</th>
						<th>Stone Number</th>
						<th>Project</th>
						<th>Stone Name</th>
						<th>L1</th>
						<th>L2</th>
						<th>B1</th>
						<th>B2</th>
						<th>H1</th>
						<th>H2</th>
						<th>Volume</th>
					</tr>
				</thead>
				<tbody>
	`;

	stones.forEach(function(stone) {
		html += `
			<tr>
				<td>
					<input type="checkbox" class="stone-checkbox" 
						data-stone-number="${stone.stone_code}" 
						data-project="${stone.project_name || ''}" />
				</td>
				<td><strong>${stone.stone_code}</strong></td>
				<td>${stone.project_name || '-'}</td>
				<td>${stone.stone_name || '-'}</td>
				<td>${stone.l1 || 0}</td>
				<td>${stone.l2 || 0}</td>
				<td>${stone.b1 || 0}</td>
				<td>${stone.b2 || 0}</td>
				<td>${stone.h1 || 0}</td>
				<td>${stone.h2 || 0}</td>
				<td>${stone.volume ? stone.volume.toFixed(2) : '0.00'}</td>
			</tr>
		`;
	});

	html += `
				</tbody>
			</table>
		</div>
	`;

	dialog.fields_dict.stones_html.$wrapper.html(html);

	// Setup select all checkbox
	dialog.$wrapper.find('#select-all-stones').on('change', function() {
		let checked = $(this).is(':checked');
		dialog.$wrapper.find('.stone-checkbox').prop('checked', checked);
	});
}

function add_selected_stones(dialog, frm) {
	let selected = [];
	dialog.$wrapper.find('.stone-checkbox:checked').each(function() {
		selected.push({
			stone_number: $(this).data('stone-number'),
			project: $(this).data('project')
		});
	});

	if (selected.length === 0) {
		frappe.msgprint(__('Please select at least one stone'));
		return;
	}

	// Add stones to the table
	selected.forEach(function(stone) {
		let row = frm.add_child('stones_table');
		row.stone_project = stone.project;
		row.stone_number = stone.stone_number;
		row.cut_ignore = '';
	});

	frm.refresh_field('stones_table');
	
	// Manage save/assign buttons after adding stones
	manage_save_assign_buttons(frm);
	
	dialog.hide();
	frappe.show_alert({
		message: __('Added {0} stone(s)', [selected.length]),
		indicator: 'green'
	});
}

function open_residue_dialog(frm) {
	if (!frm.doc.name) {
		frappe.msgprint(__('Please save the document first'));
		return;
	}

	// Check if residue document exists
	if (frm.doc.residue_link) {
		// Open existing residue document
		frappe.set_route('Form', 'Cutting Residue', frm.doc.residue_link);
	} else {
		// Create new residue document
		frappe.call({
			method: 'baps.baps.doctype.cutting.cutting.create_residue_document',
			args: {
				execution_name: frm.doc.name,
				block_number: frm.doc.block_number
			},
			callback: function(r) {
				if (r.message) {
					frm.set_value('residue_link', r.message);
					frm.save();
					frappe.set_route('Form', 'Cutting Residue', r.message);
				}
			}
		});
	}
}

function validate_before_save(frm) {
	return new Promise(function(resolve, reject) {
		// Check for uncut planned stones
		frappe.call({
			method: 'baps.baps.doctype.cutting.cutting.check_uncut_stones',
			args: {
				block_number: frm.doc.block_number,
				execution_name: frm.doc.name,
				stones_table: frm.doc.stones_table
			},
			callback: function(r) {
				if (r.message && r.message.has_uncut) {
					// Show warning about uncut stones
					frappe.confirm(
						__('There are {0} UNCUT PLANNED STONES. These stones will be marked as IGNORED and released from cutting planning. Do you want to continue?', 
							[r.message.uncut_count]),
						function() {
							// Check for residue reminder
							check_residue_reminder(frm, resolve, reject);
						},
						function() {
							reject();
						}
					);
				} else {
					// No uncut stones, check residue
					check_residue_reminder(frm, resolve, reject);
				}
			}
		});
	});
}

// function check_residue_reminder(frm, resolve, reject) {
// 	// Remind about residue entry
// 	if (!frm.doc.residue_link) {
// 		frappe.confirm(
// 			__('Have you entered the RESIDUE details for this block? It is recommended to enter residue information.'),
// 			function() {
// 				// User confirms they have entered or don't need residue
// 				resolve();
// 			},
// 			function() {
// 				// User wants to add residue
// 				open_residue_dialog(frm);
// 				reject();
// 			}
// 		);
// 	} else {
// 		resolve();
// 	}
// }

function release_cutting_planning(frm) {
	// Release cutting planning for ignored stones
	frappe.call({
		method: 'baps.baps.doctype.cutting.cutting.release_cutting_planning',
		args: {
			execution_name: frm.doc.name,
			block_number: frm.doc.block_number,
			stones_table: frm.doc.stones_table
		},
		callback: function(r) {
			if (r.message && r.message.success) {
				frappe.show_alert({
					message: __('Cutting Planning released for ignored stones'),
					indicator: 'green'
				});
			}
		}
	});
}

function validate_before_cancel(frm) {
	// Check if stones are transported or have pre-carving QC
	return new Promise(function(resolve, reject) {
		frappe.call({
			method: 'baps.baps.doctype.cutting.cutting.validate_before_delete',
			args: {
				execution_name: frm.doc.name,
				stones_table: frm.doc.stones_table
			},
			callback: function(r) {
				if (r.message && r.message.can_delete) {
					resolve();
				} else {
					frappe.msgprint({
						title: __('Cannot Delete'),
						indicator: 'red',
						message: r.message.error || __('This execution cannot be deleted')
					});
					reject();
				}
			}
		});
	});
}
function apply_saved_status_lock(frm) {
	// This function locks CUT/IGNORE values after the document is saved
	// Initialize tracker if it doesn't exist
	if (!frm._ignore_tracker) {
		frm._ignore_tracker = {};
	}
	
	if (frm.doc.stones_table && Array.isArray(frm.doc.stones_table)) {
		frm.doc.stones_table.forEach(function(row) {
			// Store the saved status in the tracker to prevent changes
			if (row.cut_ignore === 'IGNORE') {
				frm._ignore_tracker[row.name] = 'IGNORE';
				console.log('Locked IGNORE status for row:', row.name, row.stone_number);
			} else if (row.cut_ignore === 'CUT') {
				frm._ignore_tracker[row.name] = 'CUT';
				console.log('Locked CUT status for row:', row.name, row.stone_number);
			}
		});
	}
	frm.refresh_field('stones_table');
}


//residue 
frappe.ui.form.on("Cutting", {
    refresh(frm) {
        if (frm.doc.residual) {
            frm.doc.residual.forEach(row => {
                // We pass cdt and cdn to ensure set_value works correctly
                calculate_residue_volume(frm, row.doctype, row.name, row);
            });
            frm.refresh_field("residual");
        }
    }
});

// Child table events
frappe.ui.form.on("Cutting Residue", {
    // When row added
    residual_add: function(frm, cdt, cdn) {
        let row = frappe.get_doc(cdt, cdn);
        auto_assign_residue_suffix(frm, row);
        frm.refresh_field("residual");
    },

    // Auto volume calculation trigger when dimension changed
    l1: function(frm, cdt, cdn) { calc(frm, cdt, cdn, 'l1'); },
    l2: function(frm, cdt, cdn) { calc(frm, cdt, cdn, 'l2'); },
    b1: function(frm, cdt, cdn) { calc(frm, cdt, cdn, 'b1'); },
    b2: function(frm, cdt, cdn) { calc(frm, cdt, cdn, 'b2'); },
    h1: function(frm, cdt, cdn) { calc(frm, cdt, cdn, 'h1'); },
    h2: function(frm, cdt, cdn) { calc(frm, cdt, cdn, 'h2'); }
});

function calc(frm, cdt, cdn, field_name) {
    let row = frappe.get_doc(cdt, cdn);

    // 1. VALIDATION: Check Inches > 12 immediately
    if (['l2', 'b2', 'h2'].includes(field_name)) {
        let value = flt(row[field_name]);
        if (value > 12) {
            frappe.msgprint({
                title: __('Invalid Dimension'),
                indicator: 'red',
                message: __(field_name.toUpperCase() + ' cannot be greater than 12 inches.')
            });
            // Reset the invalid field to 0
            frappe.model.set_value(cdt, cdn, field_name, 0);
            return;
        }
    }

    // 2. Calculate Volume
    calculate_residue_volume(frm, cdt, cdn, row);
}

function calculate_residue_volume(frm, cdt, cdn, row) {
    const l1 = flt(row.l1);
    const l2 = flt(row.l2);
    const b1 = flt(row.b1);
    const b2 = flt(row.b2);
    const h1 = flt(row.h1);
    const h2 = flt(row.h2);

    // Ensure main dimensions exist before calculating
    if (l1 <= 0 || b1 <= 0 || h1 <= 0) {
        // If mandatory fields are missing, volume is 0
        frappe.model.set_value(cdt, cdn, "residue_volume", 0);
        return;
    }

    // --- FORMULA CHANGE HERE ---
    // Old: ((l1 + l2) / 2) * ... (Average method)
    // New: (l1 + l2/12) * ...    (Feet/Inch method)
    
    const l_total = l1 + (l2 / 12.0);
    const b_total = b1 + (b2 / 12.0);
    const h_total = h1 + (h2 / 12.0);

    const volume = l_total * b_total * h_total;

    // Use frappe.model.set_value to ensure changes are detected
    frappe.model.set_value(cdt, cdn, "residue_volume", flt(volume, 3));
}

function auto_assign_residue_suffix(frm, row) {
    if (!frm.doc.block_number) {
        frappe.msgprint("Please select Block Number first");
        return;
    }

    let used = [];
    (frm.doc.residual || []).forEach(r => {
        if (r.block_number && r.block_number.length > frm.doc.block_number.length) {
            // Check if it actually starts with the parent block number
            if (r.block_number.startsWith(frm.doc.block_number)) {
                let suffix = r.block_number.slice(frm.doc.block_number.length);
                used.push(suffix);
            }
        }
    });

    let charCode = 65; // ASCII 'A'
    let suffix = "";
    
    // Find next available suffix (A, B, C...)
    while (true) {
        suffix = String.fromCharCode(charCode);
        if (!used.includes(suffix)) {
            break;
        }
        charCode++;
        // Safety break to prevent infinite loop
        if (charCode > 90) break; 
    }

    // Directly set on the object since it's a new row (add_child)
    row.block_number = frm.doc.block_number + suffix;
}

function manage_save_assign_buttons(frm) {
	// Remove any existing custom buttons first
	frm.remove_custom_button('Assign Stone');
	
	// Count valid stones in the table (non-empty rows)
	let stone_count = 0;
	if (frm.doc.stones_table) {
		stone_count = frm.doc.stones_table.filter(row => row.stone_number && row.stone_number.trim()).length;
	}
	
	// Only show assign button for new documents with exactly one stone
	if (stone_count === 1 && frm.doc.__islocal && frm.doc.block_number) {
		// Single stone and new document - show Assign button instead of Save
		frm.add_custom_button(__('Assign Stone'), function() {
			assign_single_stone(frm);
		}).addClass('btn-primary');
		
		// Hide the standard save button
		if (frm.page.btn_primary) {
			frm.page.btn_primary.hide();
		}
		
		frappe.show_alert({
			message: __('Single stone detected - use "Assign Stone" to save directly'),
			indicator: 'blue'
		}, 3);
		
	} else {
		// Multiple stones, no stones, or saved document - show normal save functionality
		if (frm.page.btn_primary) {
			frm.page.btn_primary.show();
		}
		
		// Show helpful message for different scenarios
		if (stone_count === 0 && frm.doc.__islocal) {
			frappe.show_alert({
				message: __('Add stones to begin cutting'),
				indicator: 'orange'
			}, 2);
		} else if (stone_count > 1 && frm.doc.__islocal) {
			frappe.show_alert({
				message: __('Multiple stones - use Save to proceed'),
				indicator: 'green'
			}, 2);
		}
	}
}

function assign_single_stone(frm) {
	// Validation checks
	if (!frm.doc.block_number) {
		frappe.msgprint(__('Please select a Block Number first'));
		return;
	}
	
	if (!frm.doc.stones_table || frm.doc.stones_table.length === 0) {
		frappe.msgprint(__('No stones found to assign'));
		return;
	}
	
	// Get the single stone from the table
	let stone = frm.doc.stones_table[0];
	
	if (!stone || !stone.stone_number) {
		frappe.msgprint(__('No valid stone found to assign'));
		return;
	}
	
	// Validate required fields before saving
	if (!frm.doc.date) {
		frappe.msgprint(__('Please set the Date before assigning'));
		return;
	}
	
	if (!frm.doc.form_number) {
		frappe.msgprint(__('Please set the Form Number before assigning'));
		return;
	}
	
	if (!frm.doc.machine_no) {
		frappe.msgprint(__('Please set the M/C No before assigning'));
		return;
	}
	
	// Check the cut_ignore status
	let cut_status = stone.cut_ignore;
	
	// Validate that a status is selected
	if (!cut_status) {
		frappe.msgprint(__('Please select CUT or IGNORE status for the stone'));
		return;
	}
	
	// Set flag for direct assignment in backend
	frm.doc._direct_assign = true;
	
	// Handle based on status
	if (cut_status === 'IGNORE') {
		// Show confirmation dialog for IGNORE
		frappe.confirm(
			__('Are you sure you want to mark stone <strong>{0}</strong> as IGNORE?<br><br>This will release the stone from cutting planning and make it available again.', [stone.stone_number]),
			function() {
				// User confirmed - save the document
				frm.save().then(() => {
					frappe.show_alert({
						message: __('Stone {0} marked as IGNORE - released from cutting planning', [stone.stone_number]),
						indicator: 'orange'
					}, 5);
					
					// Refresh the form to show updated state
					frm.reload_doc();
				}).catch((error) => {
					frappe.msgprint({
						title: __('Error'),
						message: __('Failed to process stone: {0}', [error.message || error]),
						indicator: 'red'
					});
				});
			}
		);
	} else if (cut_status === 'CUT') {
		// Show confirmation dialog for CUT
		frappe.confirm(
			__('Are you sure you want to assign stone <strong>{0}</strong> to block <strong>{1}</strong>?<br><br>This will directly assign the stone with updated dimensions to the block.', [stone.stone_number, frm.doc.block_number]),
			function() {
				// User confirmed - save the document with direct assign flag
				frm.save().then(() => {
					frappe.show_alert({
						message: __('Stone {0} successfully assigned to block {1} with updated dimensions', [stone.stone_number, frm.doc.block_number]),
						indicator: 'green'
					}, 5);
					
					// Refresh the form to show updated state
					frm.reload_doc();
				}).catch((error) => {
					frappe.msgprint({
						title: __('Error'),
						message: __('Failed to assign stone: {0}', [error.message || error]),
						indicator: 'red'
					});
				});
			}
		);
	}
}