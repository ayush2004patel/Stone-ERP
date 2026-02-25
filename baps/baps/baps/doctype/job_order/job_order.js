// Copyright (c) 2025, Dhruvi and contributors
// For license information, please see license.txt

frappe.ui.form.on('Job Order', {
	refresh: function(frm) {
		// Set block query filter
		set_block_query(frm);
		
		// Set query for trade partner site
		if (frm.doc.vendor) {
			frm.set_query('trade_partner_site', function() {
				return {
					query: 'baps.baps.doctype.job_order.job_order.get_trade_partner_sites',
					filters: {
						'trade_partner': frm.doc.vendor
					}
				};
			});
		}
		
		// Add Mark Block Received button (available when submitted and not completed/cancelled)
		if (frm.doc.docstatus === 1 && frm.doc.status !== "Completed" && frm.doc.status !== "Cancelled") {
			frm.add_custom_button(__('Mark Block Received'), function() {
				show_receive_dialog(frm);
			});
		}
	},
	
	vendor: function(frm) {
		// Auto-fetch vendor details when vendor is selected
		if (frm.doc.vendor) {
			frm.trigger('fetch_vendor_details');
			
			// Set query for trade partner site when vendor changes
			frm.set_query('trade_partner_site', function() {
				return {
					query: 'baps.baps.doctype.job_order.job_order.get_trade_partner_sites',
					filters: {
						'trade_partner': frm.doc.vendor
					}
				};
			});
			
			// Clear trade partner site if vendor changed
			if (frm.doc.trade_partner_site) {
				frm.set_value('trade_partner_site', '');
			}
		}
	},
	
	fetch_vendor_details: function(frm) {
		frappe.call({
			method: 'frappe.client.get',
			args: {
				doctype: 'Trade Partner',
				name: frm.doc.vendor
			},
			callback: function(r) {
				if (r.message) {
					// frm.set_value('vendor_name', r.message.trade_partner_name);
					frm.set_value('vendor_contact', r.message.phone);
				}
			}
		});
	}
});

frappe.ui.form.on('Job Order Item', {
	blocks_add: function(frm, cdt, cdn) {
		// Set query for block field when row is added
		set_block_query(frm, cdt, cdn);
	},
	
	block: function(frm, cdt, cdn) {
		// Auto-fetch block details when block is selected
		let row = locals[cdt][cdn];
		if (row.block) {
			// Check for duplicate block
			let duplicate = false;
			frm.doc.blocks.forEach(function(item) {
				if (item.name !== row.name && item.block === row.block) {
					duplicate = true;
				}
			});
			
			if (duplicate) {
				frappe.model.set_value(cdt, cdn, 'block', '');
				frappe.msgprint(__('Block {0} is already added to this job order', [row.block]));
				return;
			}
			
			frappe.call({
				method: 'frappe.client.get',
				args: {
					doctype: 'Block',
					name: row.block
				},
				callback: function(r) {
					if (r.message) {
						frappe.model.set_value(cdt, cdn, 'block_custom_code', r.message.block_custom_code);
						frappe.model.set_value(cdt, cdn, 'material_type', r.message.material_type);
						frappe.model.set_value(cdt, cdn, 'colour', r.message.colour);
						frappe.model.set_value(cdt, cdn, 'volume', r.message.volume);
						frappe.model.set_value(cdt, cdn, 'weight', r.message.wt);
						frappe.model.set_value(cdt, cdn, 'l1', r.message.l1);
						frappe.model.set_value(cdt, cdn, 'l2', r.message.l2);
						frappe.model.set_value(cdt, cdn, 'b1', r.message.b1);
						frappe.model.set_value(cdt, cdn, 'b2', r.message.b2);
						frappe.model.set_value(cdt, cdn, 'h1', r.message.h1);
						frappe.model.set_value(cdt, cdn, 'h2', r.message.h2);
					}
				}
			});
		}
	},
	
	received: function(frm, cdt, cdn) {
		// Auto-set received date when marked as received
		let row = locals[cdt][cdn];
		if (row.received && !row.received_date) {
			frappe.model.set_value(cdt, cdn, 'received_date', frappe.datetime.get_today());
		}
	},
	
	blocks_remove: function(frm) {
		// Recalculate totals when row is removed
		frm.trigger('calculate_totals');
	}
});

function set_block_query(frm, cdt, cdn) {
	// Set filter for block field - only show eligible blocks
	frm.fields_dict['blocks'].grid.get_field('block').get_query = function(doc, cdt, cdn) {
		// Get list of already selected blocks
		let selected_blocks = [];
		if (frm.doc.blocks) {
			frm.doc.blocks.forEach(function(row) {
				if (row.block) {
					selected_blocks.push(row.block);
				}
			});
		}
		
		let filters = [
			['Block', 'internal_status', 'in', ['Available', 'In Use']],
			['Block', 'parent_residue_block_id', 'in', ['', null]],
			['Block', 'cutting_started', 'in', [0, null]]
		];
		
		// Exclude already selected blocks
		if (selected_blocks.length > 0) {
			filters.push(['Block', 'name', 'not in', selected_blocks]);
		}
		
		return { filters: filters };
	};
}

function show_receive_dialog(frm) {
	// Show dialog to mark blocks as received
	let pending_blocks = frm.doc.blocks.filter(b => !b.received);
	
	if (pending_blocks.length === 0) {
		frappe.msgprint(__('All blocks have been received'));
		return;
	}
	
	let fields = [{
		fieldname: 'block',
		fieldtype: 'Select',
		label: __('Select Block'),
		options: pending_blocks.map(b => b.block).join('\n'),
		reqd: 1
	}, {
		fieldname: 'received_date',
		fieldtype: 'Date',
		label: __('Received Date'),
		default: frappe.datetime.get_today(),
		reqd: 1
	}, {
		fieldname: 'remarks',
		fieldtype: 'Small Text',
		label: __('Remarks')
	}];
	
	let d = new frappe.ui.Dialog({
		title: __('Mark Block as Received'),
		fields: fields,
		primary_action_label: __('Mark Received'),
		primary_action: function() {
			let values = d.get_values();
			frappe.call({
				method: 'baps.baps.doctype.job_order.job_order.mark_block_received',
				args: {
					job_order: frm.doc.name,
					block_name: values.block
				},
				callback: function(r) {
					if (r.message) {
						frm.reload_doc();
						d.hide();
					}
				}
			});
		}
	});
	
	d.show();
}


function load_available_blocks(dialog, frm) {
	let filters = {
		baps_project: dialog.get_value('baps_project'),
		region: dialog.get_value('region'),
		site: dialog.get_value('site'),
		material_type: dialog.get_value('material_type')
	};
	
	frappe.call({
		method: 'baps.baps.doctype.job_order.job_order.get_available_blocks',
		args: { filters: filters },
		callback: function(r) {
			if (r.message && r.message.length > 0) {
				let html = '<div class="block-selector">';
				html += '<table class="table table-bordered" style="margin-top: 10px;">';
				html += '<thead><tr>';
				html += '<th><input type="checkbox" id="select-all-blocks"></th>';
				html += '<th>Block Number</th>';
				html += '<th>Custom Code</th>';
				html += '<th>Material Type</th>';
				html += '<th>Colour</th>';
				html += '<th>Volume</th>';
				html += '<th>Type</th>';
				html += '<th>Status</th>';
				html += '</tr></thead><tbody>';
				
				r.message.forEach(function(block) {
					let block_type = block.stone_id ? 'Planned' : 'Unplanned';
					let type_badge = block.stone_id ? 'badge-success' : 'badge-warning';
					
					html += '<tr>';
					html += `<td><input type="checkbox" class="block-checkbox" data-block="${block.block_number}" data-block-data='${JSON.stringify(block)}'></td>`;
					html += `<td>${block.block_number}</td>`;
					html += `<td>${block.block_custom_code || ''}</td>`;
					html += `<td>${block.material_type || ''}</td>`;
					html += `<td>${block.colour || ''}</td>`;
					html += `<td>${block.volume || 0}</td>`;
					html += `<td><span class="badge ${type_badge}">${block_type}</span></td>`;
					html += `<td><span class="badge badge-info">${block.internal_status}</span></td>`;
					html += '</tr>';
				});
				
				html += '</tbody></table></div>';
				
				dialog.fields_dict.blocks_html.$wrapper.html(html);
				
				// Add select all functionality
				dialog.$wrapper.find('#select-all-blocks').on('change', function() {
					dialog.$wrapper.find('.block-checkbox').prop('checked', $(this).prop('checked'));
				});
			} else {
				dialog.fields_dict.blocks_html.$wrapper.html(
					'<p class="text-muted" style="margin-top: 20px;">No available blocks found</p>'
				);
			}
		}
	});
}

frappe.ui.form.on("Job Order", {
    refresh(frm) {
        if (frm.doc.docstatus === 1) {
            // Disable delete icon
            frm.fields_dict["blocks"].grid.cannot_delete_rows = true;

            // Disable editing cell values
            frm.fields_dict["blocks"].grid.only_sortable = true;
            frm.fields_dict["blocks"].grid.editable_fields = [];
        }
    }
});

