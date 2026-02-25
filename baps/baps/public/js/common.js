function hide_child_table_buttons_for_role(frm, fieldname) {
    console.log('=== Starting hide_child_table_buttons_for_role ===');
    console.log('Field name:', fieldname);
    console.log('User roles:', frappe.user_roles);
    
    if (!frm || !frm.fields_dict || !frm.fields_dict[fieldname]) {
        console.log('Field not found:', fieldname);
        return;
    }
    
    const grid = frm.fields_dict[fieldname].grid;
    if (!grid) {
        console.log('Grid not found for field:', fieldname);
        return;
    }

    // Check multiple possible role names
    const is_checker = frappe.user_roles.includes("Size List Data Checker") || 
                      frappe.user_roles.includes("Data Entry Checker") ||
                      frappe.user_roles.includes("Size List Data Entry Checker");
    const is_project_manager = frappe.user_roles.includes("Size List Project Manager") ||
                              frappe.user_roles.includes("Project Manager");
    const is_admin = frappe.user_roles.includes("Administrator");
    
    // Get document workflow state
    const workflow_state = frm.doc.workflow_state || '';
    const is_verified_or_published = workflow_state === 'Verified' || workflow_state === 'Published';

    // Hide for:
    // 1. Checkers (always)
    // 2. Project Managers when document is Verified or Published
    // 3. But never for Admin
    const should_hide = !is_admin && (
        is_checker || 
        (is_project_manager && is_verified_or_published)
    );
    
    console.log('Is checker:', is_checker);
    console.log('Is project manager:', is_project_manager);
    console.log('Is admin:', is_admin);
    console.log('Workflow state:', workflow_state);
    console.log('Is verified or published:', is_verified_or_published);
    console.log('Should hide:', should_hide);
    
    const wrapper = $(grid.wrapper);
    
    if (!wrapper.length) {
        console.log('Grid wrapper not found');
        return;
    }

    function hide_button_selectors() {
        console.log('Hiding button selectors...');
        const selectors = [
            '.grid-add-row',
            '.grid-duplicate-row',
            '.grid-remove-rows',
            '.grid-delete-row',
            '.btn.open-row',
            '.btn-open-row',
            '[data-action="delete_row"]',
            '.btn-delete-row',
            '.grid-row .btn-delete',
            '.grid-add-multiple-rows'
        ];

        selectors.forEach(s => {
            const found = wrapper.find(s);
            if (found.length > 0) {
                console.log('Found and hiding:', s, found.length, 'elements');
                found.hide();
            }
        });

        // Hide add/delete buttons in grid footer
        wrapper.find('.grid-footer .btn, .grid-buttons .btn').each(function() {
            const $b = $(this);
            const text = ($b.text() || "").toLowerCase();
            const title = ($b.attr('title') || "").toLowerCase();
            
            if (text.includes('add') || text.includes('duplicate') || 
                text.includes('delete') || text.includes('remove') ||
                title.includes('add') || title.includes('delete')) {
                console.log('Hiding button with text/title:', text, title);
                $b.hide();
            }
        });
    }

    function hard_disable_delete() {
        try {
            if (grid.can_add_rows !== undefined) {
                grid.can_add_rows = !should_hide;
                console.log('Set can_add_rows to:', !should_hide);
            }
            
            if (grid.allow_delete !== undefined) {
                grid.allow_delete = !should_hide;
                console.log('Set allow_delete to:', !should_hide);
            }

            // Override delete functions
            if (should_hide && grid.delete_row && typeof grid.delete_row === 'function') {
                if (!grid._orig_delete_row) {
                    grid._orig_delete_row = grid.delete_row;
                }
                grid.delete_row = function() {
                    console.warn('Delete blocked by role policy');
                    frappe.msgprint(__('You are not allowed to delete rows'));
                    return false;
                };
            } else if (!should_hide && grid._orig_delete_row) {
                grid.delete_row = grid._orig_delete_row;
                delete grid._orig_delete_row;
            }
        } catch (e) {
            console.warn('hard_disable_delete error:', e);
        }
    }

    // Main execution
    if (should_hide) {
        console.log('Applying restrictions...');
        hide_button_selectors();
        hard_disable_delete();
        
        // Prevent clicks
        wrapper.off('click.baps_block_delete');
        wrapper.on('click.baps_block_delete', '.grid-add-row, .grid-delete-row, .grid-remove-rows, [data-action="delete_row"]', function(e) {
            e.stopImmediatePropagation();
            e.preventDefault();
            frappe.msgprint(__('You are not allowed to modify rows'));
            return false;
        });
    } else {
        console.log('Restoring normal functionality...');
        wrapper.find('.grid-add-row, .grid-duplicate-row, .grid-remove-rows, .grid-delete-row').show();
        wrapper.off('click.baps_block_delete');
    }

    // Re-apply after delays
    setTimeout(() => {
        if (should_hide) {
            hide_button_selectors();
        }
    }, 500);

    console.log('=== Completed hide_child_table_buttons_for_role ===');
}

function hide_buttons_with_css(frm) {
    console.log('=== CSS Button Hide Debug ===');
    console.log('User roles:', frappe.user_roles);
    console.log('Current user:', frappe.session.user);
    console.log('Document type:', frm ? frm.doctype : 'No form');
    console.log('Document status:', frm ? frm.doc.workflow_state : 'No workflow state');
    
    const is_checker = frappe.user_roles.includes("Size List Data Checker") ||
                      frappe.user_roles.includes("Data Entry Checker") ||
                      frappe.user_roles.includes("Size List Data Entry Checker");
    const is_project_manager = frappe.user_roles.includes("Size List Project Manager") ||
                              frappe.user_roles.includes("Project Manager");
    const is_admin = frappe.user_roles.includes("Administrator");
    
    // Check if document is in verification or verified state
    const is_size_list = frm && frm.doctype === 'Size List Form';
    const doc_status = frm ? frm.doc.workflow_state : '';
    const is_verification_stage = doc_status === 'Under Verification' || 
                                 doc_status === 'Verified' || 
                                 doc_status === 'Published';
    
    console.log('Is checker:', is_checker);
    console.log('Is project manager:', is_project_manager);
    console.log('Is admin:', is_admin);
    console.log('Is Size List:', is_size_list);
    console.log('Is verification stage:', is_verification_stage);
    
    // Hide buttons for:
    // 1. Checkers in any Size List (always)
    // 2. Project Managers when document is Verified or Published
    // 3. But never for Admin
    const should_hide = !is_admin && is_size_list && (
        is_checker || 
        (is_project_manager && (doc_status === 'Verified' || doc_status === 'Published'))
    );
    
    console.log('Should hide buttons:', should_hide);
    
    if (should_hide) {
        console.log('Adding CSS to hide buttons for restricted role/status');
        // Remove existing style first
        $('#baps-hide-buttons-style').remove();
        
        // Add CSS to hide buttons with more specific selectors
        $('<style id="baps-hide-buttons-style">')
            .html(`
                /* Hide Delete and Duplicate buttons in grid rows */
                .grid-row .btn-danger,
                .grid-row .btn[title*="Delete"],
                .grid-row .btn[title*="Remove"],
                .grid-row button:contains("Delete"),
                .grid-row button:contains("Duplicate"),
                
                /* Hide specific button classes */
                .grid-add-row,
                .grid-duplicate-row,
                .grid-remove-rows,
                .grid-delete-row,
                .btn-delete-row,
                [data-action="delete_row"],
                .grid-add-multiple-rows,
                
                /* Hide buttons by text content */
                .btn:contains("Delete"),
                .btn:contains("Duplicate Row"),
                .btn:contains("Add Row"),
                
                /* Hide grid footer buttons */
                .grid-footer .btn-danger,
                .grid-footer .btn-primary:contains("Add"),
                .grid-footer .btn:contains("Delete"),
                .grid-footer .btn:contains("Duplicate") {
                    display: none !important;
                    visibility: hidden !important;
                }
                
                /* Specific targeting for the buttons shown in image */
                .frappe-control .btn-danger,
                .frappe-control .btn-warning {
                    display: none !important;
                }
            `)
            .appendTo('head');
            
        console.log('CSS styles added to hide buttons');
    } else {
        console.log('Removing CSS restrictions for non-restricted role');
        $('#baps-hide-buttons-style').remove();
    }
}

// Aggressive button hiding function
function aggressive_hide_buttons() {
    console.log('=== Aggressive Button Hiding ===');
    
    const is_checker = frappe.user_roles.includes("Size List Data Checker") ||
                      frappe.user_roles.includes("Data Entry Checker") ||
                      frappe.user_roles.includes("Size List Data Entry Checker");
    const is_project_manager = frappe.user_roles.includes("Size List Project Manager") ||
                              frappe.user_roles.includes("Project Manager");
    const is_admin = frappe.user_roles.includes("Administrator");
    
    if ((is_checker || is_project_manager) && !is_admin) {
        console.log('Hiding buttons aggressively for checker/project manager role');
        
        // Hide all buttons with specific text content
        $('button, .btn').each(function() {
            const $btn = $(this);
            const text = $btn.text().trim().toLowerCase();
            const title = ($btn.attr('title') || '').toLowerCase();
            
            if (text.includes('delete') || text.includes('duplicate row') || 
                text.includes('add row') || title.includes('delete') || 
                title.includes('duplicate') || title.includes('add')) {
                
                console.log('Hiding button with text:', text, 'title:', title);
                $btn.hide();
                $btn.css('display', 'none !important');
                
                // Also disable click events
                $btn.off('click').on('click', function(e) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    frappe.msgprint('You are not allowed to modify rows');
                    return false;
                });
            }
        });
        
        // Hide buttons by class (red/orange buttons are typically delete/duplicate)
        $('.btn-danger, .btn-warning').each(function() {
            const $btn = $(this);
            console.log('Hiding danger/warning button:', $btn.text());
            $btn.hide();
        });
    }
}

// Simple and direct button hiding function
function simple_hide_buttons() {
    console.log('=== Simple Hide Buttons ===');
    console.log('User roles:', frappe.user_roles);
    
    const should_hide = frappe.user_roles.includes("Size List Data Checker") ||
                       frappe.user_roles.includes("Data Entry Checker") ||
                       frappe.user_roles.includes("Size List Data Entry Checker") ||
                       frappe.user_roles.includes("Size List Project Manager") ||
                       frappe.user_roles.includes("Project Manager");
    
    const is_admin = frappe.user_roles.includes("Administrator");
    
    console.log('Should hide:', should_hide);
    console.log('Is admin:', is_admin);
    
    if (should_hide && !is_admin) {
        console.log('Hiding buttons...');
        
        // Force hide with multiple methods
        const hideButtons = () => {
            // Method 1: Hide by button text
            $('button').each(function() {
                const text = $(this).text().trim();
                if (text === 'Delete' || text === 'Duplicate Row') {
                    console.log('Hiding button:', text);
                    $(this).hide();
                    $(this).remove(); // Remove completely
                }
            });
            
            // Method 2: Hide by CSS classes
            $('.btn-danger, .btn-warning').each(function() {
                const text = $(this).text().trim();
                if (text === 'Delete' || text === 'Duplicate Row') {
                    console.log('Hiding CSS button:', text);
                    $(this).hide();
                    $(this).remove(); // Remove completely
                }
            });
            
            // Method 3: Add CSS to force hide
            if (!$('#force-hide-buttons').length) {
                $('head').append(`
                    <style id="force-hide-buttons">
                        button:contains("Delete"),
                        button:contains("Duplicate Row"),
                        .btn:contains("Delete"),
                        .btn:contains("Duplicate Row") {
                            display: none !important;
                            visibility: hidden !important;
                        }
                    </style>
                `);
            }
        };
        
        // Execute immediately
        hideButtons();
        
        // Execute after small delays to catch dynamic buttons
        setTimeout(hideButtons, 100);
        setTimeout(hideButtons, 300);
        setTimeout(hideButtons, 500);
        setTimeout(hideButtons, 1000);
        setTimeout(hideButtons, 2000);
    }
}

// Single event handler to avoid conflicts
frappe.ui.form.on('*', {
    refresh(frm) {
        console.log('refresh triggered for:', frm.doctype);
        
        if (frm.doctype === 'Size List Form') {
            simple_hide_buttons();
        }
    },
    
    onload_post_render(frm) {
        console.log('onload_post_render triggered for:', frm.doctype);
        
        if (frm.doctype === 'Size List Form') {
            setTimeout(() => {
                simple_hide_buttons();
            }, 500);
        }
    }
});

// Continuous button monitoring
$(document).ready(function() {
    console.log('Document ready - setting up button monitoring');
    
    const should_hide = frappe.user_roles.includes("Size List Data Checker") ||
                       frappe.user_roles.includes("Data Entry Checker") ||
                       frappe.user_roles.includes("Size List Data Entry Checker") ||
                       frappe.user_roles.includes("Size List Project Manager") ||
                       frappe.user_roles.includes("Project Manager");
    
    const is_admin = frappe.user_roles.includes("Administrator");
    
    if (should_hide && !is_admin) {
        console.log('Starting continuous button monitoring...');
        
        // Function to remove buttons
        const removeButtons = () => {
            $('button, .btn').each(function() {
                const text = $(this).text().trim();
                if (text === 'Delete' || text === 'Duplicate Row') {
                    console.log('Removing button:', text);
                    $(this).remove();
                }
            });
        };
        
        // Run every 500ms to catch any new buttons
        setInterval(removeButtons, 500);
        
        // Also use MutationObserver for immediate detection
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) {
                        const $node = $(node);
                        $node.find('button, .btn').each(function() {
                            const text = $(this).text().trim();
                            if (text === 'Delete' || text === 'Duplicate Row') {
                                console.log('Observer removing button:', text);
                                $(this).remove();
                            }
                        });
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
});