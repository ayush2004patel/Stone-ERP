# Copyright (c) 2025, Amax Consultancy Pvt Ltd and contributors
# For license information, please see license.txt

import frappe
from frappe import _

def execute(filters=None):
    columns = get_columns()
    data = get_data(filters)
    return columns, data

def get_columns():
    return [
        # {"label": _("Form No."), "fieldname": "form_number", "fieldtype": "Link", "options": "Size List Form", "width": 130},
        {"label": _("Project Name"), "fieldname": "project_name", "fieldtype": "Data", "width": 150},
        {"label": _("Prep Date"), "fieldname": "prep_date", "fieldtype": "Date", "width": 100},
        {"label": _("Material Type"), "fieldname": "stone_type", "fieldtype": "Link", "options": "Material Type", "width": 120},
        {"label": _("Main Part"), "fieldname": "main_part", "fieldtype": "Link", "options": "Main Part", "width": 110},
        {"label": _("Sub Part"), "fieldname": "sub_part", "fieldtype": "Link", "options": "Sub Part", "width": 110},
        # {"label": _("Total Volume (CFT)"), "fieldname": "total_volume", "fieldtype": "Float", "width": 120},
        {"label": _("Cutting Region"), "fieldname": "cutting_region", "fieldtype": "Link", "options": "Region", "width": 120},
        # {"label": _("Split"), "fieldname": "split", "fieldtype": "Check", "width": 100},

        {"label": _("Stone Code"), "fieldname": "stone_code", "fieldtype": "Data", "width": 110},
        {"label": _("Stone Name"), "fieldname": "stone_name", "fieldtype": "Data", "width": 130},
        # {"label": _("Range"), "fieldname": "range", "fieldtype": "Data", "width": 90},
        {"label": _("L1"), "fieldname": "l1", "fieldtype": "Int", "width": 60},
        {"label": _("L2"), "fieldname": "l2", "fieldtype": "Float", "width": 60},
        {"label": _("B1"), "fieldname": "b1", "fieldtype": "Int", "width": 60},
        {"label": _("B2"), "fieldname": "b2", "fieldtype": "Float", "width": 60},
        {"label": _("H1"), "fieldname": "h1", "fieldtype": "Int", "width": 60},
        {"label": _("H2"), "fieldname": "h2", "fieldtype": "Float", "width": 60},
        {"label": _("Volume "), "fieldname": "volume", "fieldtype": "Float", "width": 110},
        # {"label": _("Split "), "fieldname": "split", "fieldtype": "Check", "width": 100},

    ]

def get_data(filters):
    conditions = []
    values = {}

    # if filters.get("form_number"):
    #     conditions.append("p.form_number = %(form_number)s")
    #     values["form_number"] = filters["form_number"]

    if filters.get("baps_project"):
        conditions.append("p.baps_project = %(baps_project)s")
        values["baps_project"] = filters["baps_project"]

    if filters.get("stone_type"):
        conditions.append("p.stone_type = %(stone_type)s")
        values["stone_type"] = filters["stone_type"]

    if filters.get("main_part"):
        conditions.append("p.main_part = %(main_part)s")
        values["main_part"] = filters["main_part"]

    if filters.get("sub_part"):
        conditions.append("p.sub_part = %(sub_part)s")
        values["sub_part"] = filters["sub_part"]

    if filters.get("cutting_region"):
        conditions.append("p.cutting_region = %(cutting_region)s")
        values["cutting_region"] = filters["cutting_region"]

    if filters.get("prep_date_from"):
        conditions.append("p.prep_date >= %(prep_date_from)s")
        values["prep_date_from"] = filters["prep_date_from"]

    if filters.get("prep_date_to"):
        conditions.append("p.prep_date <= %(prep_date_to)s")
        values["prep_date_to"] = filters["prep_date_to"]

    if filters.get("stone_name"):
        conditions.append("c.stone_name LIKE %(stone_name)s")
        values["stone_name"] = f"%{filters['stone_name']}%"

    where_clause = " AND ".join(conditions) if conditions else "1=1"

    query = f"""
        SELECT
            p.form_number,
            p.project_name,
            p.prep_date,
            p.stone_type,
            p.main_part,
            p.sub_part,
            p.total_volume,
            p.cutting_region,
            c.stone_code,
            c.stone_name,
            c.range,
            c.l1,
            c.l2,
            c.b1,
            c.b2,
            c.h1,
            c.h2,
            c.volume
        FROM
            `tabSize List Creation` p
        INNER JOIN
            `tabSize List Creation Item` c ON c.parent = p.name
        WHERE {where_clause}
        ORDER BY p.prep_date DESC, p.form_number, c.idx
    """

    return frappe.db.sql(query, values, as_dict=1)