frappe.pages['user-proxy-manager'].on_page_load = function(wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'User Proxy Manager',
		single_column: true
	});

	// Show the proxy management dialog
	baps.proxy.show_dialog();
}
