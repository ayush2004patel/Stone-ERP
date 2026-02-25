frappe.listview_settings['Size List Form'] = {
    onload(listview) {
        const roles = frappe.user_roles;

        if (roles.includes("Size List Data Entry Operator")) {
            listview.filter_area.add([[ "Size List Form", "workflow_state", "in", ["Draft", "Submitted"] ]]);
        } else if (roles.includes("Size List Data Checker")) {
            listview.filter_area.add([[ "Size List Form", "workflow_state", "in", ["Submitted", "Verified", "Under Verification"] ]]);
        } else if (roles.includes("Project Manager")) {
            listview.filter_area.add([[ "Size List Form", "workflow_state", "in", ["Verified", "Published"] ]]);
        }
    }
};