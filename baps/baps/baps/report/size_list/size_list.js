// Copyright (c) 2025, Amax Consultancy Pvt Ltd and contributors
// For license information, please see license.txt

frappe.query_reports["Size List"] = {
	"filters": [
		
		{
			"fieldname": "baps_project",
			"label": __("BAPS Project"),
			"fieldtype": "Link",
			"options": "Baps Project"
		},
		{
			"fieldname": "stone_type",
			"label": __("Material Type"),
			"fieldtype": "Link",
			"options": "Material Type"
		},
		{
			"fieldname": "main_part",
			"label": __("Main Part"),
			"fieldtype": "Link",
			"options": "Main Part"
		},
		{
			"fieldname": "sub_part",
			"label": __("Sub Part"),
			"fieldtype": "Link",
			"options": "Sub Part"
		},
		{
			"fieldname": "cutting_region",
			"label": __("Cutting Region"),
			"fieldtype": "Link",
			"options": "Region"
		},
		{
			"fieldname": "prep_date_from",
			"label": __("Prep Date From"),
			"fieldtype": "Date"
		},
		{
			"fieldname": "prep_date_to",
			"label": __("Prep Date To"),
			"fieldtype": "Date"
		},
		{
			"fieldname": "stone_name",
			"label": __("Stone Name"),
			"fieldtype": "Data"
		}
	]
};
