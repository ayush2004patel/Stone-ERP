// Copyright (c) 2025, Amax Consultancy Pvt Ltd and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Size List", {
// 	refresh(frm) {

// 	},
// });





frappe.ui.form.on('Size List', {
    refresh: function(frm) {
        // Highlight split stones in the form
        if (frm.doc.split_rows && frm.doc.split_rows.length > 0) {
            frm.dashboard.add_indicator(__('Split Stone'), 'orange');
        }
    }
});

frappe.ui.form.on('Size List', {
    split: function(frm) {
        // Validate that the stone is not already split
        if (frm.doc.split_rows && frm.doc.split_rows.length > 0) {
            frappe.confirm(
                'This stone has already been split. Do you want to re-split it? This will clear existing split data.',
                function() {
                    // User confirmed, clear existing splits and proceed
                    frm.doc.split_rows = [];
                    show_split_dialog(frm);
                }
            );
            return;
        }
        
        show_split_dialog(frm);
    }
});

function show_split_dialog(frm) {
    // Calculate original volume
    const original_volume = calculate_volume(
        frm.doc.l1 || 0,
        frm.doc.l2 || 0,
        frm.doc.b1 || 0,
        frm.doc.b2 || 0,
        frm.doc.h1 || 0,
        frm.doc.h2 || 0
    );

    // First, ensure the child doctype is loaded
    frappe.model.with_doctype('Size List Split Part', function() {
        // Create the dialog
        let d = new frappe.ui.Dialog({
            title: 'Split Stone: ' + frm.doc.stone_code,
            fields: [
                {
                    fieldname: 'info_section',
                    fieldtype: 'HTML',
                    options: `
                        <div style="padding: 10px; background: #f8f9fa; border-radius: 5px; margin-bottom: 15px;">
                            <strong>Original Stone:</strong> ${frm.doc.stone_code}<br>
                            <strong>Stone Name:</strong> ${frm.doc.stone_name || 'N/A'}<br>
                            <strong>Original Dimensions:</strong> 
                            L(${frm.doc.l1}+${frm.doc.l2}) × 
                            B(${frm.doc.b1}+${frm.doc.b2}) × 
                            H(${frm.doc.h1}+${frm.doc.h2})<br>
                        </div>
                    `
                },
                {
                    fieldname: 'split_pieces',
                    fieldtype: 'Table',
                    label: 'Split Pieces (Minimum 2 required)',
                    cannot_add_rows: false,
                    cannot_delete_rows: false,
                    in_place_edit: true,
                    data: [],
                    fields: [
                        {
                            fieldname: 'l1',
                            fieldtype: 'Int',
                            label: 'L1',
                            in_list_view: 1,
                            columns: 1,
                            onchange: function() {
                                calculate_row_volume(this);
                            }
                        },
                        {
                            fieldname: 'l2',
                            fieldtype: 'Float',
                            label: 'L2',
                            in_list_view: 1,
                            columns: 1,
                            onchange: function() {
                                calculate_row_volume(this);
                            }
                        },
                        {
                            fieldname: 'b1',
                            fieldtype: 'Int',
                            label: 'B1',
                            in_list_view: 1,
                            columns: 1,
                            onchange: function() {
                                calculate_row_volume(this);
                            }
                        },
                        {
                            fieldname: 'b2',
                            fieldtype: 'Float',
                            label: 'B2',
                            in_list_view: 1,
                            columns: 1,
                            onchange: function() {
                                calculate_row_volume(this);
                            }
                        },
                        {
                            fieldname: 'h1',
                            fieldtype: 'Int',
                            label: 'H1',
                            in_list_view: 1,
                            columns: 1,
                            onchange: function() {
                                calculate_row_volume(this);
                            }
                        },
                        {
                            fieldname: 'h2',
                            fieldtype: 'Float',
                            label: 'H2',
                            in_list_view: 1,
                            columns: 1,
                            onchange: function() {
                                calculate_row_volume(this);
                            }
                        },
                        {
                            fieldname: 'volume',
                            fieldtype: 'Float',
                            label: 'Volume',
                            in_list_view: 1,
                            read_only: 1,
                            columns: 2,
                            precision: 6
                        }
                    ]
                },
                {
                    fieldtype: 'Section Break'
                },
                {
                    fieldname: 'original_volume_display',
                    fieldtype: 'Float',
                    label: 'Original Volume',
                    read_only: 1,
                    default: original_volume,
                    precision: 3
                },
                {
                    fieldname: 'col_break_1',
                    fieldtype: 'Column Break'
                },
                {
                    fieldname: 'total_volume',
                    fieldtype: 'Float',
                    label: 'Total Split Volume',
                    read_only: 1,
                    default: 0,
                    precision: 3
                },
                {
                    fieldname: 'col_break_2',
                    fieldtype: 'Column Break'
                },
                {
                    fieldname: 'volume_difference',
                    fieldtype: 'Float',
                    label: 'Difference',
                    read_only: 1,
                    default: original_volume,
                    precision: 3
                },
                {
                    fieldname: 'col_break_3',
                    fieldtype: 'Column Break'
                },
                {
                    fieldname: 'percentage_difference',
                    fieldtype: 'Percent',
                    label: 'Difference %',
                    read_only: 1,
                    default: 0,
                    precision: 2
                }
            ],
            size: 'extra-large',
            primary_action_label: 'Split & Save',
            primary_action(values) {
                let rows = values.split_pieces || [];

                // Validation 1: Minimum 2 rows
                if (rows.length < 2) {
                    frappe.msgprint({
                        title: 'Validation Error',
                        message: '⚠️ Minimum 2 split pieces required to split a stone.',
                        indicator: 'red'
                    });
                    return;
                }

                // Validation 2: All rows must have valid dimensions
                let invalid_rows = [];
                
                rows.forEach((r, idx) => {
                    // Check if l1, b1, h1 are present
                    if (!r.l1 || !r.b1 || !r.h1) {
                        invalid_rows.push(`Row ${idx + 1}: Missing L1, B1, or H1`);
                    }
                    
                    // Check if inches are valid (≤ 12)
                    if ((r.l2 || 0) > 12) {
                        invalid_rows.push(`Row ${idx + 1}: L2 cannot be greater than 12`);
                    }
                    if ((r.b2 || 0) > 12) {
                        invalid_rows.push(`Row ${idx + 1}: B2 cannot be greater than 12`);
                    }
                    if ((r.h2 || 0) > 12) {
                        invalid_rows.push(`Row ${idx + 1}: H2 cannot be greater than 12`);
                    }
                    
                    // Check if volume is 0
                    let vol = calculate_volume(
                        r.l1 || 0, r.l2 || 0,
                        r.b1 || 0, r.b2 || 0,
                        r.h1 || 0, r.h2 || 0
                    );
                    if (vol === 0) {
                        invalid_rows.push(`Row ${idx + 1}: Volume cannot be 0`);
                    }
                });
                
                if (invalid_rows.length > 0) {
                    frappe.msgprint({
                        title: 'Validation Errors',
                        message: '⚠️ Please fix the following errors:<br><br>' + invalid_rows.join('<br>'),
                        indicator: 'red'
                    });
                    return;
                }

                // Clean the rows data - remove Frappe metadata
                let clean_rows = [];
                rows.forEach(r => {
                    let clean_row = {
                        l1: parseInt(r.l1) || 0,
                        l2: parseFloat(r.l2) || 0,
                        b1: parseInt(r.b1) || 0,
                        b2: parseFloat(r.b2) || 0,
                        h1: parseInt(r.h1) || 0,
                        h2: parseFloat(r.h2) || 0
                    };
                    
                    // Calculate volume
                    clean_row.volume = calculate_volume(
                        clean_row.l1,
                        clean_row.l2,
                        clean_row.b1,
                        clean_row.b2,
                        clean_row.h1,
                        clean_row.h2
                    );
                    
                    clean_rows.push(clean_row);
                });

                // Validation 3: Validate total volume with tolerance
                let total_volume = clean_rows.reduce((sum, r) => sum + r.volume, 0);
                total_volume = Math.round(total_volume * 1000) / 1000;
                
                let difference = Math.abs(original_volume - total_volume);
                let percentage_difference = (difference / original_volume) * 100;
                
                // Allow up to 10% difference
                if (percentage_difference > 10) {
                    frappe.msgprint({
                        title: 'Volume Difference Too Large',
                        message: `⚠️ Volume difference is too large!<br><br>
                            <strong>Original Volume:</strong> ${original_volume.toFixed(3)} cft<br>
                            <strong>Total Split Volume:</strong> ${total_volume.toFixed(3)} cft<br>
                            <strong>Difference:</strong> ${difference.toFixed(3)} cft (${percentage_difference.toFixed(2)}%)<br><br>
                            <span style="color: red;">Maximum allowed difference: 10%</span><br>
                            <span style="color: green;">Your difference: ${percentage_difference.toFixed(2)}%</span>`,
                        indicator: 'red'
                    });
                    return;
                }
                
                // Show warning if difference is between 5-10%
                if (percentage_difference > 5 && percentage_difference <= 10) {
                    frappe.confirm(
                        `⚠️ <strong>Volume Difference Warning</strong><br><br>
                        Original Volume: ${original_volume.toFixed(3)} cft<br>
                        Total Split Volume: ${total_volume.toFixed(3)} cft<br>
                        Difference: ${difference.toFixed(3)} cft (${percentage_difference.toFixed(2)}%)<br><br>
                        <span style="color: orange;">This is within the acceptable range (≤10%), but it's recommended to keep the difference as small as possible.</span><br><br>
                        Do you want to proceed with this split?`,
                        function() {
                            // User confirmed, proceed with split
                            proceed_with_split();
                        },
                        function() {
                            // User cancelled
                            frappe.msgprint('Split cancelled. Please adjust the dimensions.');
                        }
                    );
                    return;
                }
                
                // If difference is ≤ 5%, proceed without warning
                proceed_with_split();
                
                function proceed_with_split() {

                // All validations passed - proceed with split
                frappe.confirm(
                    `You are about to split <strong>${frm.doc.stone_code}</strong> into <strong>${clean_rows.length}</strong> pieces.<br><br>
                    New stone codes will be: ${generate_preview_codes(frm.doc.stone_code, clean_rows.length).join(', ')}<br><br>
                    This action cannot be undone easily. Continue?`,
                    function() {
                        // Send to backend
                        frappe.call({
                            method: "baps.baps.doctype.size_list.size_list.create_split_records",
                            freeze: true,
                            freeze_message: 'Splitting stone...',
                            args: {
                                size_list_name: frm.doc.name,
                                parts: clean_rows  // Send clean data without Frappe metadata
                            },
                            callback: function(r) {
                                if (r.message && r.message.success) {
                                    frappe.show_alert({
                                        message: `✅ Successfully split into ${clean_rows.length} pieces`,
                                        indicator: 'green'
                                    }, 5);
                                    
                                    d.hide();
                                    frm.reload_doc();
                                } else {
                                    frappe.msgprint({
                                        title: 'Split Failed',
                                        message: "❌ " + (r.message.error || "Unknown server error"),
                                        indicator: 'red'
                                    });
                                }
                            },
                            error: function(r) {
                                frappe.msgprint({
                                    title: 'Server Error',
                                    message: '❌ Failed to communicate with server. Please try again.',
                                    indicator: 'red'
                                });
                            }
                        });
                    }
                );
                } // End of proceed_with_split function
            }
        });

        // Function to calculate volume for a single row
        function calculate_row_volume(field) {
            let grid_row = field.grid_row;
            if (!grid_row) return;

            let doc = grid_row.doc;
            
            // Calculate volume
            let volume = calculate_volume(
                doc.l1 || 0,
                doc.l2 || 0,
                doc.b1 || 0,
                doc.b2 || 0,
                doc.h1 || 0,
                doc.h2 || 0
            );
            
            // Set the volume in the row
            frappe.model.set_value(doc.doctype, doc.name, 'volume', volume);
            
            // Refresh the grid to show updated value
            grid_row.refresh();
            
            // Calculate and update totals
            update_totals();
        }

        // Function to update total volume and difference
        function update_totals() {
            let table_field = d.fields_dict.split_pieces;
            let data = table_field.grid.get_data();
            
            let total = 0;
            data.forEach(row => {
                total += parseFloat(row.volume) || 0;
            });
            
            total = Math.round(total * 1000) / 1000;
            let difference = original_volume - total;
            let percentage_diff = original_volume > 0 ? Math.abs((difference / original_volume) * 100) : 0;
            
            // Update the fields
            d.set_value('total_volume', total);
            d.set_value('volume_difference', difference);
            d.set_value('percentage_difference', percentage_diff);
            
            // Visual feedback based on percentage difference
            let diff_field = d.fields_dict.volume_difference;
            let percent_field = d.fields_dict.percentage_difference;
            
            if (diff_field && diff_field.$wrapper) {
                if (percentage_diff <= 5) {
                    // Good - green
                    diff_field.$wrapper.find('.control-value').css('color', 'green');
                    if (percent_field && percent_field.$wrapper) {
                        percent_field.$wrapper.find('.control-value').css('color', 'green');
                    }
                } else if (percentage_diff <= 10) {
                    // Warning - orange
                    diff_field.$wrapper.find('.control-value').css('color', 'orange');
                    if (percent_field && percent_field.$wrapper) {
                        percent_field.$wrapper.find('.control-value').css('color', 'orange');
                    }
                } else {
                    // Error - red
                    diff_field.$wrapper.find('.control-value').css('color', 'red');
                    if (percent_field && percent_field.$wrapper) {
                        percent_field.$wrapper.find('.control-value').css('color', 'red');
                    }
                }
            }
        }

        // Listen to grid changes using proper Frappe events
        d.fields_dict.split_pieces.grid.on_grid_refresh = function() {
            // Recalculate all rows when grid refreshes
            let grid = d.fields_dict.split_pieces.grid;
            grid.data.forEach((row, index) => {
                let volume = calculate_volume(
                    row.l1 || 0,
                    row.l2 || 0,
                    row.b1 || 0,
                    row.b2 || 0,
                    row.h1 || 0,
                    row.h2 || 0
                );
                row.volume = volume;
            });
            grid.refresh();
            update_totals();
        };

        // Override grid's data change event
        let original_on_change = d.fields_dict.split_pieces.grid.on_change;
        d.fields_dict.split_pieces.grid.on_change = function() {
            if (original_on_change) {
                original_on_change.apply(this, arguments);
            }
            
            // Recalculate volumes for all rows
            d.fields_dict.split_pieces.grid.data.forEach((row) => {
                let volume = calculate_volume(
                    row.l1 || 0,
                    row.l2 || 0,
                    row.b1 || 0,
                    row.b2 || 0,
                    row.h1 || 0,
                    row.h2 || 0
                );
                row.volume = volume;
            });
            
            d.fields_dict.split_pieces.grid.refresh();
            update_totals();
        };

        // Listen to any field changes in the grid
        d.fields_dict.split_pieces.grid.wrapper.on('change', 'input, select', function() {
            setTimeout(() => {
                // Recalculate volumes
                d.fields_dict.split_pieces.grid.data.forEach((row) => {
                    let volume = calculate_volume(
                        row.l1 || 0,
                        row.l2 || 0,
                        row.b1 || 0,
                        row.b2 || 0,
                        row.h1 || 0,
                        row.h2 || 0
                    );
                    row.volume = volume;
                });
                
                d.fields_dict.split_pieces.grid.refresh();
                update_totals();
            }, 300);
        });

        // If there are existing split rows, populate them
        if (frm.doc.split_rows && frm.doc.split_rows.length > 0) {
            d.fields_dict.split_pieces.df.data = frm.doc.split_rows;
            d.fields_dict.split_pieces.grid.refresh();
            
            // Calculate totals for existing data
            setTimeout(() => {
                update_totals();
            }, 100);
        }

        d.show();
    });
}

// Helper function to calculate volume
// Formula: (l1 + l2/12) × (b1 + b2/12) × (h1 + h2/12)
// l2, b2, h2 are in inches (must be ≤ 12)
function calculate_volume(l1, l2, b1, b2, h1, h2) {
    let length = (parseFloat(l1) || 0) + (parseFloat(l2) || 0) / 12;
    let breadth = (parseFloat(b1) || 0) + (parseFloat(b2) || 0) / 12;
    let height = (parseFloat(h1) || 0) + (parseFloat(h2) || 0) / 12;
    
    return Math.round(length * breadth * height * 1000) / 1000;
}

// Helper function to generate preview of new stone codes
function generate_preview_codes(original_code, count) {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    
    // Remove any existing letter suffix from the stone code
    let base_code = original_code;
    while (base_code && base_code[base_code.length - 1].match(/[A-Z]/) && 
           base_code.length > 0 && 
           !base_code[base_code.length - 1].match(/[0-9]/)) {
        base_code = base_code.slice(0, -1);
    }
    
    let codes = [];
    for (let i = 0; i < Math.min(count, 26); i++) {
        codes.push(base_code + letters[i]);
    }
    
    return codes;
}

// Add custom list view formatting to highlight split stones
frappe.listview_settings['Size List'] = {
    onload: function(listview) {
        // Add custom CSS for split stones
        const style = document.createElement('style');
        style.innerHTML = `
            .list-row.split-stone {
                background-color: #fff9e6 !important;
                border-left: 4px solid #ff8c00 !important;
            }
            .list-row.split-stone:hover {
                background-color: #fff3cc !important;
            }
            .split-badge {
                display: inline-block;
                padding: 2px 8px;
                background: #ff8c00;
                color: white;
                border-radius: 3px;
                font-size: 10px;
                font-weight: 600;
                margin-left: 8px;
                text-transform: uppercase;
            }
            .split-icon {
                color: #ff8c00;
                font-weight: bold;
                margin-left: 5px;
            }
        `;
        document.head.appendChild(style);
        
        // Add indicator after rows are rendered
        listview.$result.on('DOMNodeInserted', function() {
            mark_split_stones();
        });
        
        // Initial marking
        setTimeout(() => mark_split_stones(), 500);
        
        function mark_split_stones() {
            listview.$result.find('.list-row').each(function() {
                let $row = $(this);
                let docname = $row.attr('data-name');
                
                if (docname) {
                    // Get the document data
                    frappe.db.get_value('Size List', docname, ['split_rows', 'stone_code'], function(r) {
                        if (r && r.split_rows) {
                            try {
                                let split_data = JSON.parse(r.split_rows);
                                if (split_data && split_data.length > 0) {
                                    // Add split class
                                    $row.addClass('split-stone');
                                    
                                    // Add split badge to stone code
                                    let $stone_code = $row.find('.level-item.ellipsis').first();
                                    if ($stone_code.length && !$stone_code.find('.split-badge').length) {
                                        $stone_code.append(`<span class="split-badge" title="This stone has been split into ${split_data.length} pieces">Split ⚡</span>`);
                                    }
                                }
                            } catch (e) {
                                // Ignore parsing errors
                            }
                        }
                    });
                }
            });
        }
    },
    
    get_indicator: function(doc) {
        // Show orange indicator for split stones
        if (doc.split_rows) {
            try {
                let split_data = typeof doc.split_rows === 'string' ? JSON.parse(doc.split_rows) : doc.split_rows;
                if (split_data && split_data.length > 0) {
                    return [__("Split"), "orange", "split_rows,!=,null"];
                }
            } catch (e) {
                // Ignore parsing errors
            }
        }
    },
    
    formatters: {
        stone_code: function(value, df, doc) {
            // Add split icon to stone code
            if (doc.split_rows) {
                try {
                    let split_data = typeof doc.split_rows === 'string' ? JSON.parse(doc.split_rows) : doc.split_rows;
                    if (split_data && split_data.length > 0) {
                        return `<span style="font-weight: 600; color: #ff8c00;" title="Split into ${split_data.length} pieces">${value} <span class="split-icon">⚡</span></span>`;
                    }
                } catch (e) {
                    // Ignore parsing errors
                }
            }
            return value;
        }
    },
    
    // Add custom button in list view
    button: {
        show: function(doc) {
            return doc.split_rows && JSON.parse(doc.split_rows || '[]').length > 0;
        },
        get_label: function() {
            return __('View Split Pieces');
        },
        get_description: function(doc) {
            let count = JSON.parse(doc.split_rows || '[]').length;
            return __('Split into {0} pieces', [count]);
        },
        action: function(doc) {
            // Open the document to show split details
            frappe.set_route('Form', 'Size List', doc.name);
        }
    },
};

// ============================================================================
// STATUS AUTO-UPDATE ON FORM LOAD AND INTERVAL CHECK
// ============================================================================
frappe.ui.form.on('Size List', {
    after_load: function(frm) {
        // Refresh status when form loads
        refresh_size_list_status(frm);
        
        // Set interval to check for status updates every 10 seconds
        if (!frm.status_check_interval) {
            frm.status_check_interval = setInterval(function() {
                refresh_size_list_status(frm);
            }, 10000); // Check every 10 seconds
        }
    }
});

// Function to refresh status from backend
function refresh_size_list_status(frm) {
    frappe.call({
        method: 'baps.baps.doctype.size_list.size_list.update_size_list_status_by_code',
        args: {
            stone_code: frm.doc.stone_code
        },
        callback: function(r) {
            if (r.message && r.message.success) {
                const new_status = r.message.status;
                
                // Update the form if status changed
                if (frm.doc.status !== new_status) {
                    frm.set_value('status', new_status);
                    
                    // Show a subtle notification
                    frappe.show_alert({
                        message: __('Status updated: <strong>{0}</strong>', [new_status]),
                        indicator: 'blue'
                    }, 3);
                }
            }
        }
    });
}
