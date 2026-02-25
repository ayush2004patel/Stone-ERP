// frappe.listview_settings['Cutting'] = {
// 	add_fields: ["block_number", "site", "machine_no", "form_number"],
	
// 	get_indicator: function(doc) {
// 		// Check if this cutting is from a final cutting plan
// 		// This can be determined if block_number has a final plan
// 		if (doc.block_number) {
// 			// Green indicator for cuttings with block from final plan
// 			return [__("From Final Plan"), "green", "block_number,!=,''"];
// 		} else {
// 			// Blue indicator for manually added cuttings
// 			return [__("Manual"), "blue", "block_number,=,''"];
// 		}
// 	},
	
// 	// Add custom buttons or filters if needed
// 	onload: function(listview) {
// 		// You can add custom list view buttons here if needed
// 	}
// };
