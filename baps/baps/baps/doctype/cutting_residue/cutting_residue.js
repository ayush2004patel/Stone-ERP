// // Copyright (c) 2025, Amax Consultancy Pvt Ltd and contributors
// // For license information, please see license.txt

// frappe.ui.form.on("Cutting Residue", {
// 	refresh(frm) {
// 		// Make fields editable
// 		if (!frm.doc.__islocal) {
// 			frm.set_df_property('l1', 'read_only', 0);
// 			frm.set_df_property('l2', 'read_only', 0);
// 			frm.set_df_property('b1', 'read_only', 0);
// 			frm.set_df_property('b2', 'read_only', 0);
// 			frm.set_df_property('h1', 'read_only', 0);
// 			frm.set_df_property('h2', 'read_only', 0);
// 		}

// 		// Add custom button to go back to cutting 
// 		if (frm.doc.cutting_execution) {
// 			frm.add_custom_button(__('View Cutting '), function() {
// 				frappe.set_route('Form', 'Cutting ', frm.doc.cutting_execution);
// 			});
// 		}
// 	},

// 	add_button(frm) {
// 		// Add new residue block with alphabetic suffix
// 		add_residue_block(frm);
// 	},

// 	edit_button(frm) {
// 		// Edit existing residue blocks
// 		edit_residue_blocks(frm);
// 	},

// 	cutting_execution(frm) {
// 		// Load block details when Cutting is selected
// 		if (frm.doc.cutting_execution) {
// 			load_block_details(frm);
// 		}
// 	}
// });

// // Helper Functions

// function load_block_details(frm) {
// 	// Get block number from Cutting
// 	frappe.call({
// 		method: 'frappe.client.get',
// 		args: {
// 			doctype: 'Cutting ',
// 			name: frm.doc.cutting_execution
// 		},
// 		callback: function(r) {
// 			if (r.message && r.message.block_number) {
// 				// Store block number for reference
// 				frm.block_number = r.message.block_number;
// 			}
// 		}
// 	});
// }

// function add_residue_block(frm) {
// 	if (!frm.doc.l1 || !frm.doc.b1 || !frm.doc.h1) {
// 		frappe.msgprint(__('Please enter dimensions (L1, B1, H1) for the residue block'));
// 		return;
// 	}

// 	// Get next alphabetic suffix
// 	let current_alphabet = frm.doc.alphabet || '';
// 	let next_suffix = get_next_suffix(current_alphabet);

// 	// Confirm and create new block
// 	frappe.confirm(
// 		__('Create new residue block with suffix "{0}"? <br>Dimensions: L1={1}, L2={2}, B1={3}, B2={4}, H1={5}, H2={6}',
// 			[next_suffix, frm.doc.l1 || 0, frm.doc.l2 || 0, frm.doc.b1 || 0, frm.doc.b2 || 0, frm.doc.h1 || 0, frm.doc.h2 || 0]),
// 		function() {
// 			create_residue_block(frm, next_suffix);
// 		}
// 	);
// }

// function get_next_suffix(current_alphabet) {
// 	// Get the next alphabet suffix
// 	if (!current_alphabet) {
// 		return 'A';
// 	}

// 	let suffixes = current_alphabet.split(',').map(s => s.trim());
// 	let last_suffix = suffixes[suffixes.length - 1];

// 	// Increment the suffix
// 	if (last_suffix.length === 1) {
// 		let next_char = String.fromCharCode(last_suffix.charCodeAt(0) + 1);
// 		if (next_char > 'Z') {
// 			return 'AA';
// 		}
// 		return next_char;
// 	} else {
// 		// Handle multi-character suffixes
// 		let chars = last_suffix.split('');
// 		let carry = true;
// 		for (let i = chars.length - 1; i >= 0 && carry; i--) {
// 			if (chars[i] === 'Z') {
// 				chars[i] = 'A';
// 			} else {
// 				chars[i] = String.fromCharCode(chars[i].charCodeAt(0) + 1);
// 				carry = false;
// 			}
// 		}
// 		if (carry) {
// 			return 'A' + chars.join('');
// 		}
// 		return chars.join('');
// 	}
// }

// function create_residue_block(frm, suffix) {
// 	frappe.call({
// 		method: 'baps.baps.doctype.cutting_residue.cutting_residue.create_new_block',
// 		args: {
// 			residue_name: frm.doc.name,
// 			cutting_execution: frm.doc.cutting_execution,
// 			suffix: suffix,
// 			dimensions: {
// 				l1: frm.doc.l1,
// 				l2: frm.doc.l2,
// 				b1: frm.doc.b1,
// 				b2: frm.doc.b2,
// 				h1: frm.doc.h1,
// 				h2: frm.doc.h2
// 			}
// 		},
// 		callback: function(r) {
// 			if (r.message && r.message.success) {
// 				frappe.show_alert({
// 					message: __('Residue block {0} created successfully', [r.message.block_name]),
// 					indicator: 'green'
// 				});

// 				// Update alphabet list
// 				let current = frm.doc.alphabet || '';
// 				let new_alphabet = current ? current + ', ' + suffix : suffix;
// 				frm.set_value('alphabet', new_alphabet);
// 				frm.set_value('suffix', suffix);

// 				// Clear dimension fields for next entry
// 				frm.set_value('l1', 0);
// 				frm.set_value('l2', 0);
// 				frm.set_value('b1', 0);
// 				frm.set_value('b2', 0);
// 				frm.set_value('h1', 0);
// 				frm.set_value('h2', 0);

// 				frm.save();
// 			} else {
// 				frappe.msgprint({
// 					title: __('Error'),
// 					indicator: 'red',
// 					message: r.message.error || __('Failed to create residue block')
// 				});
// 			}
// 		}
// 	});
// }

// function edit_residue_blocks(frm) {
// 	if (!frm.doc.alphabet) {
// 		frappe.msgprint(__('No residue blocks to edit'));
// 		return;
// 	}

// 	// Get list of residue blocks
// 	frappe.call({
// 		method: 'baps.baps.doctype.cutting_residue.cutting_residue.get_residue_blocks',
// 		args: {
// 			residue_name: frm.doc.name,
// 			cutting_execution: frm.doc.cutting_execution
// 		},
// 		callback: function(r) {
// 			if (r.message && r.message.length > 0) {
// 				show_edit_residue_dialog(frm, r.message);
// 			} else {
// 				frappe.msgprint(__('No residue blocks found'));
// 			}
// 		}
// 	});
// }

// function show_edit_residue_dialog(frm, blocks) {
// 	let dialog = new frappe.ui.Dialog({
// 		title: __('Edit Residue Blocks'),
// 		fields: [
// 			{
// 				fieldname: 'blocks_html',
// 				fieldtype: 'HTML'
// 			}
// 		],
// 		primary_action_label: __('Save Changes'),
// 		primary_action: function() {
// 			save_residue_edits(dialog, frm);
// 		}
// 	});

// 	// Display blocks in a table
// 	let html = `
// 		<div class="residue-blocks-container">
// 			<table class="table table-bordered">
// 				<thead>
// 					<tr>
// 						<th>Block Name</th>
// 						<th>L1</th>
// 						<th>L2</th>
// 						<th>B1</th>
// 						<th>B2</th>
// 						<th>H1</th>
// 						<th>H2</th>
// 						<th>Volume</th>
// 					</tr>
// 				</thead>
// 				<tbody>
// 	`;

// 	blocks.forEach(function(block) {
// 		html += `
// 			<tr data-block-name="${block.name}">
// 				<td><strong>${block.name}</strong></td>
// 				<td><input type="number" class="form-control" data-field="l1" value="${block.l1 || 0}" /></td>
// 				<td><input type="number" class="form-control" data-field="l2" value="${block.l2 || 0}" /></td>
// 				<td><input type="number" class="form-control" data-field="b1" value="${block.b1 || 0}" /></td>
// 				<td><input type="number" class="form-control" data-field="b2" value="${block.b2 || 0}" /></td>
// 				<td><input type="number" class="form-control" data-field="h1" value="${block.h1 || 0}" /></td>
// 				<td><input type="number" class="form-control" data-field="h2" value="${block.h2 || 0}" /></td>
// 				<td class="volume-cell">${block.volume ? block.volume.toFixed(2) : '0.00'}</td>
// 			</tr>
// 		`;
// 	});

// 	html += `
// 				</tbody>
// 			</table>
// 		</div>
// 	`;

// 	dialog.fields_dict.blocks_html.$wrapper.html(html);

// 	// Add event listeners to calculate volume on dimension change
// 	dialog.$wrapper.find('input[type="number"]').on('change', function() {
// 		let row = $(this).closest('tr');
// 		let l1 = parseFloat(row.find('[data-field="l1"]').val()) || 0;
// 		let l2 = parseFloat(row.find('[data-field="l2"]').val()) || 0;
// 		let b1 = parseFloat(row.find('[data-field="b1"]').val()) || 0;
// 		let b2 = parseFloat(row.find('[data-field="b2"]').val()) || 0;
// 		let h1 = parseFloat(row.find('[data-field="h1"]').val()) || 0;
// 		let h2 = parseFloat(row.find('[data-field="h2"]').val()) || 0;

// 		let volume = ((l1 + l2) / 2) * ((b1 + b2) / 2) * ((h1 + h2) / 2) / 1000000;
// 		row.find('.volume-cell').text(volume.toFixed(2));
// 	});

// 	dialog.show();
// }

// function save_residue_edits(dialog, frm) {
// 	let updates = [];
	
// 	dialog.$wrapper.find('tbody tr').each(function() {
// 		let block_name = $(this).data('block-name');
// 		let dimensions = {
// 			l1: parseFloat($(this).find('[data-field="l1"]').val()) || 0,
// 			l2: parseFloat($(this).find('[data-field="l2"]').val()) || 0,
// 			b1: parseFloat($(this).find('[data-field="b1"]').val()) || 0,
// 			b2: parseFloat($(this).find('[data-field="b2"]').val()) || 0,
// 			h1: parseFloat($(this).find('[data-field="h1"]').val()) || 0,
// 			h2: parseFloat($(this).find('[data-field="h2"]').val()) || 0
// 		};
		
// 		updates.push({
// 			block_name: block_name,
// 			dimensions: dimensions
// 		});
// 	});

// 	frappe.call({
// 		method: 'baps.baps.doctype.cutting_residue.cutting_residue.update_residue_blocks',
// 		args: {
// 			updates: updates
// 		},
// 		callback: function(r) {
// 			if (r.message && r.message.success) {
// 				frappe.show_alert({
// 					message: __('Residue blocks updated successfully'),
// 					indicator: 'green'
// 				});
// 				dialog.hide();
// 				frm.reload_doc();
// 			} else {
// 				frappe.msgprint({
// 					title: __('Error'),
// 					indicator: 'red',
// 					message: r.message.error || __('Failed to update residue blocks')
// 				});
// 			}
// 		}
// 	});
// }
