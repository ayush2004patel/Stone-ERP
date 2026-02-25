frappe.listview_settings['Block'] = {
    onload: function(listview) {
        // Add Filter dropdown with options
        listview.page.add_inner_button(__('Show All'), function() {
            // Clear all filters
            listview.filter_area.clear();
            listview.refresh();
        }, __('Record Type'));

        listview.page.add_inner_button(__('Block Only'), function() {
            // Show only blocks (stone_id is not set)
            listview.filter_area.clear();
            listview.filter_area.add([[listview.doctype, 'stone_id', 'is', 'not set']]);
            listview.refresh();
        }, __('Record Type'));

        listview.page.add_inner_button(__('Stone Only'), function() {
            // Show only stones (stone_id has value)
            listview.filter_area.clear();
            listview.filter_area.add([[listview.doctype, 'stone_id', 'is', 'set']]);
            listview.refresh();
        }, __('Record Type'));

        listview.page.add_inner_button(__('Residue Only'), function() {
            // Show only residues (stone_id is not set and some other condition)
            listview.filter_area.clear();
            listview.filter_area.add([[listview.doctype, 'parent_residue_block_id','is', 'set']]);
            listview.refresh();
        }, __('Record Type'));

        // Add Status Filter dropdowns
        listview.page.add_inner_button(__('Show All Status'), function() {
            listview.filter_area.clear();
            listview.refresh();
        }, __('Internal Status'));

        listview.page.add_inner_button(__('Available Only'), function() {
            // Clear existing filters and set new filter
            listview.filter_area.clear();
            setTimeout(function() {
                listview.filter_area.add([
                    ['Block', 'internal_status', '=', 'Available']
                ]);
            }, 100);
        }, __('Internal Status'));

        listview.page.add_inner_button(__('In Use Only'), function() {
            listview.filter_area.clear();
            setTimeout(function() {
                listview.filter_area.add([
                    ['Block', 'internal_status', '=', 'In Use']
                ]);
            }, 100);
        }, __('Internal Status'));

        listview.page.add_inner_button(__('Consumed Only'), function() {
            listview.filter_area.clear();
            setTimeout(function() {
                listview.filter_area.add([
                    ['Block', 'internal_status', '=', 'Consumed']
                ]);
            }, 100);
        }, __('Internal Status'));

        listview.page.add_inner_button(__('Wastage Only'), function() {
            listview.filter_area.clear();
            setTimeout(function() {
                listview.filter_area.add([
                    ['Block', 'internal_status', '=', 'Wastage']
                ]);
            }, 100);
        }, __('Internal Status'));
    }
};
