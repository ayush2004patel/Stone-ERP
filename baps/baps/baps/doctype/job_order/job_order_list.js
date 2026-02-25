// Copyright (c) 2025, Dhruvi and contributors
// For license information, please see license.txt

frappe.listview_settings['Job Order'] = {
	add_fields: ['status', 'vendor', 'order_date', 'expected_return_date', 'total_blocks', 'blocks_received'],
	
	get_indicator: function(doc) {
		let status_colors = {
			// 'Draft': ['Draft', 'gray', 'status,=,Draft'],
			'Sent to Vendor': ['Sent to Vendor', 'blue', 'status,=,Sent to Vendor'],
			// 'In Progress': ['In Progress', 'orange', 'status,=,In Progress'],
			// 'Partially Received': ['Partially Received', 'yellow', 'status,=,Partially Received'],
			'Completed': ['Completed', 'green', 'status,=,Completed'],
			'Cancelled': ['Cancelled', 'red', 'status,=,Cancelled']
		};
		
		// return status_colors[doc.status] || ['Unknown', 'gray'];
	},
	
	onload: function(listview) {
		// Custom filters removed as per requirement
	},
	
	formatters: {
		total_blocks: function(value, df, doc) {
			if (doc.blocks_received && doc.total_blocks) {
				return `${doc.blocks_received}/${doc.total_blocks}`;
			}
			return value;
		}
	}
};
