// Override frappe.router.render to redirect empty route to /app/modules
frappe.router.render = function () {
    if (this.current_route[0]) {
        this.render_page();
    } else {
        // ✅ Instead of showing home, redirect to modules
        frappe.set_route("modules");
    }
};