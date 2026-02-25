import frappe
from frappe.model.document import Document
from frappe.model.naming import make_autoname
from frappe.utils import nowdate


class PurchaseMaterial(Document):
    def before_save(self):
        # ------------------------------------------------------------------
        # DIRECT CUT  -> rename doc when stones are added AND name is random
        # ------------------------------------------------------------------
        if self.direct_cut_stone_details and self.is_new() and not self.order_id:
            new_id = make_autoname("ORDNO-.####")
            self.order_id = new_id
            self.name = new_id
            return

        # ------------------------------------------------------------------
        # CARVED
        # ------------------------------------------------------------------
        if self.direct_carved_stone_details and self.is_new() and not self.carving_id:
            new_id = make_autoname("CARORDNO-.####")
            self.carving_id = new_id
            self.name = new_id
            return

        # ------------------------------------------------------------------
        # POLISH
        # ------------------------------------------------------------------
        if self.direct_polish_stone_details and self.is_new() and not self.polishing_id:
            new_id = make_autoname("POLORDNO-.####")
            self.polishing_id = new_id
            self.name = new_id
            return

        # ------------------------------------------------------------------
        # BLOCK ORDER (no child table required on PM)
        # ------------------------------------------------------------------
        if self.is_new() and not self.block_order_id:
            if getattr(self, "baps_projectttt", None):
                new_id = make_autoname("BLOCKORDNO-.####")
                self.block_order_id = new_id
                self.name = new_id
            return

        # ------------------------------------------------------------------
        # LOT ORDER  (no child table)
        # ------------------------------------------------------------------
        if self.is_new() and not self.lot_order_id:
            if getattr(self, "baps_projecttttt", None):
                new_id = make_autoname("LOTORDNO-.####")
                self.lot_order_id = new_id
                self.name = new_id
            return

    def on_update(self):
        """
        Sync order_id to Size List Creation Items for Direct Cut Stone orders.
        """
        # Only sync if this is a Direct Cut Stone order with details
        if self.direct_cut_stone_details and self.order_id and self.baps_project:
            self.sync_direct_cut_order_id_to_size_list()

    def sync_direct_cut_order_id_to_size_list(self):
        """
        Sync order_id from Purchase Material (Direct Cut Stone) to matching 
        Size List Creation Items.
        Updates only the items that have matching stone codes.
        """
        try:
            order_id = self.order_id
            
            # Get list of selected stone codes from Direct Cut Stone details
            selected_stones = [row.stone_code for row in self.direct_cut_stone_details if row.stone_code]
            
            if not selected_stones:
                return
            
            # Find Size List Creation for this project
            size_list_creation = frappe.db.get_value(
                "Size List Creation",
                {"baps_project": self.baps_project},
                "name"
            )
            
            if not size_list_creation:
                frappe.log_error(
                    f"No Size List Creation found for BAPS Project '{self.baps_project}'",
                    "Direct Cut Stone Sync"
                )
                return
            
            # Get the Size List Creation document
            sl_doc = frappe.get_doc("Size List Creation", size_list_creation)
            
            # Update only the matching child rows (stone_details table)
            updated_count = 0
            for item in sl_doc.stone_details:
                if item.stone_code in selected_stones:
                    item.order_id = order_id
                    updated_count += 1
            
            if updated_count > 0:
                # Save the Size List Creation document
                sl_doc.save(ignore_permissions=True)
                frappe.db.commit()
                frappe.logger().info(f"Synced order_id {order_id} to {updated_count} Size List items")
            
        except Exception as e:
            frappe.log_error(f"Error syncing order_id to Size List Items: {str(e)}", "Direct Cut Stone Sync")


# ------------------------------------------------------------------
# SIZE LIST HELPERS (GET / CREATE / SYNC / CLEAR)
# ------------------------------------------------------------------
def _get_size_list_for_project(baps_project):
    return frappe.db.get_value("Size List Creation", {"baps_project": baps_project}, "name")


def _create_size_list_for_project(baps_project, order_id=None):
    """
    Create Size List Creation and Size List Form.
    IMPORTANT: per user's request we DO NOT set parent.order_id here.
    """
    form_name = make_autoname("SLF-.####")

    size_list_form = frappe.new_doc("Size List Form")
    size_list_form.name = form_name
    if hasattr(size_list_form, "project"):
        size_list_form.project = baps_project
    size_list_form.insert(ignore_permissions=True)

    new_doc = frappe.new_doc("Size List Creation")
    new_doc.baps_project = baps_project
    new_doc.prep_date = nowdate()
    new_doc.form_number = form_name
    # Do NOT set new_doc.order_id (parent) — leave empty per request.
    new_doc.insert(ignore_permissions=True)

    frappe.logger().info(f"Created Size List Creation {new_doc.name} for project {baps_project}")
    return new_doc.name


def _sync_order_id_to_size_list(baps_project, order_id, auto_create=False, tag=""):
    """
    Legacy helper: update parent Size List Creation.order_id.
    Kept for backward compatibility but not used in section item-sync flows.
    """
    try:
        size_list = _get_size_list_for_project(baps_project)

        if size_list:
            frappe.db.set_value("Size List Creation", size_list, "order_id", order_id)
            frappe.logger().info(f"Updated Size List Creation {size_list} with order_id {order_id} [{tag}]")
        elif auto_create:
            size_list = _create_size_list_for_project(baps_project, order_id)
        else:
            frappe.throw(f"Size List Creation not found for project {baps_project}.")

        frappe.db.commit()
        return size_list

    except Exception as e:
        frappe.log_error(f"_sync_order_id_to_size_list error: {e}", "Size List Sync")
        raise


def _clear_order_id_from_size_list(order_id):
    try:
        frappe.db.sql("""
            UPDATE `tabSize List Creation`
            SET order_id = NULL
            WHERE order_id = %s
        """, (order_id,))
        frappe.db.commit()
        frappe.logger().info(f"Cleared order_id {order_id} from Size List Creation")
    except Exception as e:
        frappe.log_error(f"_clear_order_id_from_size_list error: {e}", "Size List Clear")
        raise


def _sync_item_field_for_project(baps_project, field_name, order_id, only_for_codes=None):
    """
    Set `field_name` (a column on Size List Creation Item) to order_id for items
    that belong to the Size List Creation of the given project.
    If only_for_codes is provided (list of stone_code), only those child rows will be updated.
    Returns number of updated rows (best-effort).
    """
    if not baps_project:
        return 0

    size_list_name = _get_size_list_for_project(baps_project)
    if not size_list_name:
        return 0

    try:
        if only_for_codes:
            codes = [c for c in only_for_codes if c]
            if not codes:
                return 0
            placeholders = ",".join(["%s"] * len(codes))
            query = f"""
                UPDATE `tabSize List Creation Item`
                SET `{field_name}` = %s
                WHERE parent = %s
                  AND stone_code IN ({placeholders})
            """
            params = [order_id, size_list_name] + codes
            frappe.db.sql(query, tuple(params))
            frappe.db.commit()
            frappe.logger().info(f"_sync_item_field_for_project: updated {field_name} for {len(codes)} items in {size_list_name}")
            return len(codes)
        else:
            query = f"""
                UPDATE `tabSize List Creation Item`
                SET `{field_name}` = %s
                WHERE parent = %s
            """
            frappe.db.sql(query, (order_id, size_list_name))
            frappe.db.commit()
            frappe.logger().info(f"_sync_item_field_for_project: set {field_name}={order_id} for all items in {size_list_name}")
            # We can't reliably know affected row count via frappe.db.sql across DB backends, return 1 as success marker.
            return 1
    except Exception as e:
        frappe.log_error(f"_sync_item_field_for_project error: {e}", "Size List Item Sync")
        raise


def _clear_item_field_for_project_by_order(field_name, order_id):
    """
    Clear `field_name` from Size List Creation Item where it equals order_id.
    """
    try:
        frappe.db.sql(f"""
            UPDATE `tabSize List Creation Item`
            SET `{field_name}` = NULL
            WHERE `{field_name}` = %s
        """, (order_id,))
        frappe.db.commit()
        frappe.logger().info(f"Cleared {field_name} = {order_id} from Size List Creation Item")
    except Exception as e:
        frappe.log_error(f"_clear_item_field_for_project_by_order error: {e}", "Size List Item Clear")
        raise


def _clear_item_field_for_project_by_order_and_codes(field_name, order_id, baps_project, codes):
    """
    Clear `field_name` for specific stone codes in a project where it equals order_id.
    """
    if not baps_project or not codes:
        return

    size_list_name = _get_size_list_for_project(baps_project)
    if not size_list_name:
        return

    try:
        placeholders = ",".join(["%s"] * len(codes))
        query = f"""
            UPDATE `tabSize List Creation Item`
            SET `{field_name}` = NULL
            WHERE parent = %s
              AND `{field_name}` = %s
              AND stone_code IN ({placeholders})
        """
        params = [size_list_name, order_id] + codes
        frappe.db.sql(query, tuple(params))
        frappe.db.commit()
        frappe.logger().info(f"Cleared {field_name}={order_id} for {len(codes)} items in project {baps_project}")
    except Exception as e:
        frappe.log_error(f"_clear_item_field_for_project_by_order_and_codes error: {e}", "Size List Item Clear")
        raise


# ------------------------------------------------------------------
# BASE STONE QUERY + VOLUME CALC
# ------------------------------------------------------------------
def _base_stone_query(baps_project, main_part=None, sub_part=None, limit=500, offset=0):
    if not baps_project:
        return []

    where = ["parent.docstatus IN (0,1)", "parent.baps_project = %s"]
    params = [baps_project]

    if main_part:
        where.append("LOWER(parent.main_part) LIKE %s")
        params.append(f"%{main_part.lower()}%")

    if sub_part:
        where.append("LOWER(parent.sub_part) LIKE %s")
        params.append(f"%{sub_part.lower()}%")

    sql = f"""
        SELECT item.name AS stone_detail_id, item.stone_code, item.stone_name,
               item.l1, item.l2, item.b1, item.b2, item.h1, item.h2,
               COALESCE(item.volume, item.size_list_volume) AS size_list_volume,
               item.cutting_planning_id, item.carving_id, item.polishing_id, item.order_id,
               parent.carving, parent.polishing, parent.main_part, parent.sub_part
        FROM `tabSize List Creation Item` item
        JOIN `tabSize List Creation` parent ON item.parent = parent.name
        WHERE {" AND ".join(where)}
        ORDER BY item.stone_code ASC
        LIMIT %s OFFSET %s
    """

    params.extend([limit, offset])
    return frappe.db.sql(sql, tuple(params), as_dict=True)


def _compute_volume(stones):
    for s in stones:
        vol = s.get("size_list_volume")
        if not vol:
            try:
                l = ((s.get("l1") or 0) + (s.get("l2") or 0)) / 2
                b = ((s.get("b1") or 0) + (s.get("b2") or 0)) / 2
                h = ((s.get("h1") or 0) + (s.get("h2") or 0)) / 2
                vol = round((l * b * h) / 1728, 3)
            except:
                vol = None
        s["volume"] = vol
    return stones


# ------------------------------------------------------------------
# STONE FETCH APIS
# ------------------------------------------------------------------
@frappe.whitelist()
def get_published_stones(baps_project=None, main_part=None, sub_part=None, limit=500, offset=0):
    try:
        limit = int(limit or 500)
        offset = int(offset or 0)
        stones = _base_stone_query(baps_project, main_part=main_part, sub_part=sub_part, limit=limit, offset=offset)
        stones = [
            s for s in stones
            if not s.get("carving_id")
            and not s.get("polishing_id")
            and not s.get("cutting_planning_id")
            and not s.get("order_id")
        ]
        return _compute_volume(stones)
    except Exception as e:
        frappe.log_error(f"get_published_stones error: {e}", "Purchase Material API")
        return []


@frappe.whitelist()
def get_carving_required_stones(baps_project):
    if not baps_project:
        return []
    stones = frappe.db.sql("""
        SELECT
            item.stone_code,
            MAX(item.stone_name) AS stone_name,
            MAX(item.l1) AS l1,
            MAX(item.l2) AS l2,
            MAX(item.b1) AS b1,
            MAX(item.b2) AS b2,
            MAX(item.h1) AS h1,
            MAX(item.h2) AS h2,
            MAX(item.volume) AS size_list_volume,
            MAX(parent.main_part) AS main_part,
            MAX(parent.sub_part) AS sub_part
        FROM `tabSize List Creation Item` item
        JOIN `tabSize List Creation` parent
            ON parent.name = item.parent
        WHERE parent.baps_project = %s
          AND COALESCE(parent.carving, 0) = 1
          AND COALESCE(item.stone_code, '') != ''
        GROUP BY item.stone_code
        ORDER BY item.stone_code ASC
    """, (baps_project,), as_dict=True)
    return _compute_volume(stones)


@frappe.whitelist()
def get_polishing_required_stones(baps_project):
    if not baps_project:
        return []
    stones = frappe.db.sql("""
        SELECT
            item.stone_code,
            MAX(item.stone_name) AS stone_name,
            MAX(item.l1) AS l1,
            MAX(item.l2) AS l2,
            MAX(item.b1) AS b1,
            MAX(item.b2) AS b2,
            MAX(item.h1) AS h1,
            MAX(item.h2) AS h2,
            MAX(item.volume) AS size_list_volume,
            MAX(parent.main_part) AS main_part,
            MAX(parent.sub_part) AS sub_part
        FROM `tabSize List Creation Item` item
        JOIN `tabSize List Creation` parent
            ON parent.name = item.parent
        WHERE parent.baps_project = %s
          AND COALESCE(parent.polishing, 0) = 1
          AND COALESCE(item.stone_code, '') != ''
        GROUP BY item.stone_code
        ORDER BY item.stone_code ASC
    """, (baps_project,), as_dict=True)
    return _compute_volume(stones)


# ------------------------------------------------------------------
# SECTION MAPPING + PROJECT FIELD MAP
# ------------------------------------------------------------------
_SECTION_MAP = {
    "cut": {
        "child_table_field": "direct_cut_stone_details",
        "size_list_field": "order_id",
        "pm_order_field": "order_id",
        "id_prefix": "ORDNO-.####",
    },
    "carve": {
        "child_table_field": "direct_carved_stone_details",
        "size_list_field": "carving_id",
        "pm_order_field": "carving_id",
        "id_prefix": "CARORDNO-.####",
    },
    "polish": {
        "child_table_field": "direct_polish_stone_details",
        "size_list_field": "polishing_id",
        "pm_order_field": "polishing_id",
        "id_prefix": "POLORDNO-.####",
    },
}

_PROJECT_FIELD_BY_SECTION = {
    "cut": "baps_project",
    "carve": "baps_projectt",
    "polish": "baps_projecttt",
}


def _ensure_purchase_material_exists(name):
    if not frappe.db.exists("Purchase Material", name):
        frappe.throw("Purchase Material not found.")

@frappe.whitelist()
def place_section_order(purchase_material_name, section):
    """
    Place order for CUT / CARVE / POLISH
    - Generate order id
    - Sync order_id into Size List Creation Item child table
    """
    try:
        pm = frappe.get_doc("Purchase Material", purchase_material_name)

        if section not in _SECTION_MAP:
            frappe.throw("Invalid section.")

        cfg = _SECTION_MAP[section]

        child_table_field = cfg["child_table_field"]
        size_list_field = cfg["size_list_field"]
        pm_order_field = cfg["pm_order_field"]

        # get project for this section
        project_field = _PROJECT_FIELD_BY_SECTION[section]
        project = pm.get(project_field)

        if not project:
            frappe.throw("Project is missing.")

        # get selected stone codes
        selected_codes = [
            r.stone_code for r in pm.get(child_table_field)
            if r.stone_code
        ]

        if not selected_codes:
            frappe.throw("No stones selected.")

        # generate or reuse order number
        if not pm.get(pm_order_field):
            order_no = make_autoname(cfg["id_prefix"])
            pm.db_set(pm_order_field, order_no)
        else:
            order_no = pm.get(pm_order_field)

        # UPDATE SIZE LIST CREATION ITEM
        updated = _sync_item_field_for_project(
            project,
            size_list_field,   # order_id
            order_no,
            only_for_codes=selected_codes
        )

        frappe.msgprint(f"Order Placed: {order_no}<br>Updated {updated} size list items.")
        return order_no

    except Exception as e:
        frappe.throw(f"Place Order failed: {e}")


@frappe.whitelist()
def clear_section_order(purchase_material_name, section):
    """
    Clear section order: remove the order id from Size List Creation Item child rows
    (only for rows matching the order id and selected stone codes if provided).
    Also clears the id on the PurchaseMaterial record.
    """
    try:
        _ensure_purchase_material_exists(purchase_material_name)
        if section not in _SECTION_MAP:
            frappe.throw("Invalid section.")

        pm = frappe.get_doc("Purchase Material", purchase_material_name)
        cfg = _SECTION_MAP[section]

        child_field = cfg["child_table_field"]
        size_list_field = cfg["size_list_field"]
        pm_order_field = cfg["pm_order_field"]

        order_id = pm.get(pm_order_field)
        if not order_id:
            frappe.throw("No order ID found.")

        project = pm.get(_PROJECT_FIELD_BY_SECTION[section])
        if not project:
            frappe.throw("Project not found.")

        selected = [r.get("stone_code") for r in pm.get(child_field) if r.get("stone_code")]

        if not selected:
            _clear_item_field_for_project_by_order(size_list_field, order_id)
        else:
            _clear_item_field_for_project_by_order_and_codes(size_list_field, order_id, project, selected)

        pm.db_set(pm_order_field, None)
        frappe.msgprint(f"Order cleared: {order_id}")
        return "OK"

    except Exception as e:
        frappe.throw(f"Error clearing section order: {e}")


# ------------------------------------------------------------------
# BLOCK & LOT ORDERS
# ------------------------------------------------------------------
@frappe.whitelist()
def place_block_order_and_sync(purchase_material_name):
    """
    Place block order and sync block_order_id to Size List Creation Item rows (selected or all for project).
    Parent Size List Creation.order_id is NOT modified.
    """
    if not frappe.db.exists("Purchase Material", purchase_material_name):
        frappe.throw("Purchase Material not found.")

    pm = frappe.get_doc("Purchase Material", purchase_material_name)

    if not pm.baps_projectttt:
        frappe.throw("Project is required for Block Order.")

    if not pm.block_order_id:
        block_id = make_autoname("BLOCKORDNO-.####")
        pm.db_set("block_order_id", block_id)
    else:
        block_id = pm.block_order_id

    selected_codes = [r.get("stone_code") for r in pm.get("order_detail") if r.get("stone_code")]

    if not selected_codes:
        _sync_item_field_for_project(pm.baps_projectttt, "block_order_id", block_id, only_for_codes=None)
    else:
        _sync_item_field_for_project(pm.baps_projectttt, "block_order_id", block_id, only_for_codes=selected_codes)

    frappe.msgprint(f"Block Order Created: {block_id}")
    return block_id


@frappe.whitelist()
def cancel_block_order(purchase_material_name):
    if not frappe.db.exists("Purchase Material", purchase_material_name):
        frappe.throw("Purchase Material not found.")

    pm = frappe.get_doc("Purchase Material", purchase_material_name)
    if not pm.block_order_id:
        frappe.throw("No Block Order ID found.")

    block_id = pm.block_order_id
    _clear_item_field_for_project_by_order("block_order_id", block_id)
    pm.db_set("block_order_id", None)

    frappe.msgprint(f"Block Order Cancelled: {block_id}")
    return "OK"


@frappe.whitelist()
def place_lot_order_and_sync(purchase_material_name):
    """
    Place lot order and set lot_order_id on ALL Size List Creation Item rows for this project.
    Parent Size List Creation.order_id is NOT modified.
    """
    if not frappe.db.exists("Purchase Material", purchase_material_name):
        frappe.throw("Purchase Material not found.")

    doc = frappe.get_doc("Purchase Material", purchase_material_name)

    if not doc.baps_projecttttt:
        frappe.throw("Project is required for Lot Order.")

    if not doc.lot_order_id:
        lot_id = make_autoname("LOTORDNO-.####")
        doc.db_set("lot_order_id", lot_id)
    else:
        lot_id = doc.lot_order_id

    _sync_item_field_for_project(doc.baps_projecttttt, "lot_order_id", lot_id, only_for_codes=None)

    frappe.msgprint(f"Lot Order Created: {lot_id}")
    return lot_id


@frappe.whitelist()
def cancel_lot_order(purchase_material_name):
    if not frappe.db.exists("Purchase Material", purchase_material_name):
        frappe.throw("Purchase Material not found.")

    doc = frappe.get_doc("Purchase Material", purchase_material_name)
    if not doc.lot_order_id:
        frappe.throw("No Lot Order ID found.")

    lot_id = doc.lot_order_id
    _clear_item_field_for_project_by_order("lot_order_id", lot_id)
    doc.db_set("lot_order_id", None)

    frappe.msgprint(f"Lot Order Cancelled: {lot_id}")
    return "OK"


# ------------------------------------------------------------------
# Generate single-section order ID (helper)
# ------------------------------------------------------------------
@frappe.whitelist()
def generate_section_order_id(purchase_material_name, section):
    try:
        if not frappe.db.exists("Purchase Material", purchase_material_name):
            frappe.throw("Purchase Material not found.")

        if section not in ("cut", "carve", "polish"):
            frappe.throw("Invalid section.")

        pm = frappe.get_doc("Purchase Material", purchase_material_name)

        section_map = {
            "cut": {"pm_field": "order_id", "prefix": "ORDNO-.####"},
            "carve": {"pm_field": "carving_id", "prefix": "CARORDNO-.####"},
            "polish": {"pm_field": "polishing_id", "prefix": "POLORDNO-.####"},
        }

        cfg = section_map[section]
        current = pm.get(cfg["pm_field"])

        if current:
            return current

        new_id = make_autoname(cfg["prefix"])
        pm.db_set(cfg["pm_field"], new_id)
        frappe.db.commit()
        frappe.msgprint(f"Generated {new_id}")
        return new_id

    except Exception as e:
        frappe.throw(f"Error generating order id: {e}")


# ------------------------------------------------------------------
# Utility: main parts / sub parts / filtered stones (for UI)
# ------------------------------------------------------------------
@frappe.whitelist()
def get_main_parts(baps_project=None):
    if not baps_project:
        return []
    rows = frappe.db.sql("""
        SELECT DISTINCT main_part
        FROM `tabSize List Creation`
        WHERE baps_project = %s
          AND IFNULL(main_part, '') != ''
    """, (baps_project,), as_dict=True)
    return [r.main_part for r in rows]


@frappe.whitelist()
def get_sub_parts(baps_project=None, main_part=None):
    if not baps_project:
        return []
    where = ["baps_project = %s"]
    params = [baps_project]
    if main_part:
        where.append("main_part = %s")
        params.append(main_part)
    sql = f"""
        SELECT DISTINCT sub_part
        FROM `tabSize List Creation`
        WHERE {" AND ".join(where)}
          AND IFNULL(sub_part, '') != ''
    """
    rows = frappe.db.sql(sql, tuple(params), as_dict=True)
    return [r.sub_part for r in rows]

@frappe.whitelist()
def get_all_main_and_sub_parts():
    """
    Returns ALL unique main_part and sub_part values from the MASTER DOCTYPES.
    Main parts are fetched from 'Main Part' doctype (document names).
    Sub parts are fetched from 'Sub Part' doctype (document names).
    """
    # Fetch all Main Part document names
    main_parts = frappe.get_all(
        "Main Part",
        filters={"docstatus": 0},  # Only active/unsaved documents
        pluck="name",
        order_by="name"
    )
    
    # Fetch all Sub Part document names  
    sub_parts = frappe.get_all(
        "Sub Part", 
        filters={"docstatus": 0},  # Only active/unsaved documents
        pluck="name",
        order_by="name"
    )

    return {
        "main_parts": main_parts,
        "sub_parts": sub_parts
    }

@frappe.whitelist()
def get_filtered_size_list_items(baps_project, main_part="", sub_part="", stone_name=""):
    if not baps_project:
        return []

    rows = frappe.db.sql("""
    SELECT
        item.stone_code,
        MAX(item.stone_name) AS stone_name,
        MAX(item.l1) AS l1,
        MAX(item.l2) AS l2,
        MAX(item.b1) AS b1,
        MAX(item.b2) AS b2,
        MAX(item.h1) AS h1,
        MAX(item.h2) AS h2,
        MAX(item.volume) AS size_list_volume,
        MAX(parent.main_part) AS main_part,
        MAX(parent.sub_part) AS sub_part,
        MAX(parent.carving) AS carving_required,
        MAX(parent.polishing) AS polishing_required,
        MAX(item.cutting_planning_id) AS cutting_planning_id,
        MAX(item.carving_id) AS carving_id,
        MAX(item.polishing_id) AS polishing_id,
        MAX(item.order_id) AS order_id
    FROM `tabSize List Creation Item` item
    JOIN `tabSize List Creation` parent
        ON parent.name = item.parent
    WHERE parent.baps_project = %s
      AND parent.docstatus IN (0, 1)
      AND COALESCE(item.stone_code, '') != ''
    GROUP BY item.stone_code
    ORDER BY item.stone_code ASC
    """, (baps_project,), as_dict=True)

    stones = [
        s for s in rows
        if not s.carving_required
        and not s.polishing_required
        and not s.cutting_planning_id
    ]

    if main_part:
        stones = [s for s in stones if s.main_part == main_part]
    if sub_part:
        stones = [s for s in stones if s.sub_part == sub_part]
    if stone_name:
        stones = [s for s in stones if stone_name.lower() in (s.stone_name or "").lower()]

    return _compute_volume(stones)


@frappe.whitelist()
def get_published_stones(baps_project=None):
    """
    Get published stones from Size List Creation for a specific BAPS Project.
    Used by frontend (Direct Cut Stone form) to show available stones for ordering.
    """
    if not baps_project:
        return []

    try:
        stones = frappe.db.sql("""
            SELECT
                item.name AS stone_detail_id,
                item.stone_code,
                item.stone_name,
                item.l1, item.l2,
                item.b1, item.b2,
                item.h1, item.h2,
                item.volume AS size_list_volume,
                parent.main_part,
                parent.sub_part
            FROM `tabSize List Creation Item` item
            JOIN `tabSize List Creation` parent
                ON item.parent = parent.name
            WHERE parent.docstatus IN (0,1)
                AND parent.baps_project = %s
            ORDER BY item.stone_code ASC
        """, (baps_project,), as_dict=True)

        # Calculate volume if missing
        for s in stones:
            if not s.get("size_list_volume"):
                l = ((s.l1 or 0) + (s.l2 or 0) / 12.0)
                b = ((s.b1 or 0) + (s.b2 or 0) / 12.0)
                h = ((s.h1 or 0) + (s.h2 or 0) / 12.0)
                s["volume"] = round((l * b * h), 3)
            else:
                s["volume"] = s["size_list_volume"]

        return stones
    except Exception as e:
        frappe.log_error(f"Error fetching published stones: {str(e)}", "Get Published Stones")
        return []