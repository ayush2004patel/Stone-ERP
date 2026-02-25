// Client-side validation for Stone Name uniqueness constraints
frappe.ui.form.on("Stone Name", {
    main_part: function(frm) {
        if (frm.doc.main_part) {
            check_main_part_uniqueness(frm);
        }
        // Setup Sub Part query filter
        setup_sub_part_filter(frm);
    },
    
    sub_part: function(frm) {
        if (frm.doc.main_part && frm.doc.sub_part) {
            check_main_sub_part_uniqueness(frm);
        }
    },
    
    stone_name: function(frm) {
        if (frm.doc.main_part && frm.doc.sub_part && frm.doc.stone_name) {
            check_full_combination_uniqueness(frm);
        }
    },
    
    refresh: function(frm) {
        // Setup Sub Part query filter
        setup_sub_part_filter(frm);
    }
});

// Setup Sub Part filter to show only Sub Parts for selected Main Part
function setup_sub_part_filter(frm) {
    frm.set_query("sub_part", function() {
        if (!frm.doc.main_part) {
            frappe.msgprint({
                title: 'Main Part Required',
                message: 'Please select Main Part before choosing Sub Part.',
                indicator: 'orange'
            });
            return {
                filters: {
                    name: ['=', '']  // Return no results
                }
            };
        }
        return {
            filters: {
                main_part: frm.doc.main_part
            }
        };
    });
}

// Check if Main Part already exists
function check_main_part_uniqueness(frm) {
    frappe.call({
        method: 'frappe.client.get_list',
        args: {
            doctype: 'Stone Name',
            filters: {
                main_part: frm.doc.main_part,
                name: ['!=', frm.doc.name || 'new']
            },
            fields: ['name']
        },
        callback: function(r) {
            if (r.message && r.message.length > 0) {
                // frappe.msgprint({
                //     title: 'Duplicate Main Part',
                //     // message: `⚠️ Main Part "${frm.doc.main_part}" already exists in Stone Name: ${r.message[0].name}`,
                //     indicator: 'orange'
                // });
            }
        }
    });
}

// Check if Main Part + Sub Part combination already exists
function check_main_sub_part_uniqueness(frm) {
    frappe.call({
        method: 'frappe.client.get_list',
        args: {
            doctype: 'Stone Name',
            filters: {
                main_part: frm.doc.main_part,
                sub_part: frm.doc.sub_part,
                name: ['!=', frm.doc.name || 'new']
            },
            fields: ['name']
        },
        callback: function(r) {
            if (r.message && r.message.length > 0) {
                // frappe.msgprint({
                //     title: 'Duplicate Combination',
                //     message: `Main Part "${frm.doc.main_part}" + Sub Part "${frm.doc.sub_part}" already exists in: ${r.message[0].name}`,
                //     indicator: 'orange'
                // });
            }
        }
    });
}

// Check if full combination already exists
function check_full_combination_uniqueness(frm) {
    frappe.call({
        method: 'frappe.client.get_list',
        args: {
            doctype: 'Stone Name',
            filters: {
                main_part: frm.doc.main_part,
                sub_part: frm.doc.sub_part,
                stone_name: frm.doc.stone_name,
                name: ['!=', frm.doc.name || 'new']
            },
            fields: ['name']
        },
        callback: function(r) {
            if (r.message && r.message.length > 0) {
                frappe.msgprint({
                    title: 'Duplicate Record',
                    message: `This exact combination already exists in: ${r.message[0].name}`,
                    indicator: 'red'
                });
            }
        }
    });
}
