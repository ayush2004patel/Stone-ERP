// Copyright (c) 2025, shruti parikh and contributors
// For license information, please see license.txt

frappe.ui.form.on("Block", {
    refresh(frm) {
        // Hide Save button for existing docs
        if (!frm.is_new()) {
            frm.disable_save();
        } else {
            frm.enable_save();
        }

        // Auto update status based on stage or conditions
        if (frm.doc.project_name === "Baps Project") {
            if (frm.doc.status !== "Selected" && frm.doc.status !== "Transport") {
                // For example, check if block_custom_code or some other field indicates its stage
                if (frm.doc.block_custom_code && frm.doc.block_custom_code.startsWith("BAPS")) {
                    frm.set_value("status", "Selected");
                }
            }
        }

        // Example: if block is in transportation
        if (frm.doc.is_in_transportation) {
            frm.set_value("status", "Transport");
        }
    },
});
