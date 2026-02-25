def calculate_stone_status(stone):
    """
    Decide stone status based on references
    """

    if stone.parent_stone:
        return "Split"

    if stone.get("is_residue"):
        return "Residue"

    if stone.polishing_id or stone.carving_id:
        return "Under Process"

    if stone.cutting_planning_id:
        return "Under Cutting"

    if stone.order_id or stone.lot_order_id:
        return "Under Order"

    if stone.selection_id:
        return "Under Selection"

    return "Available"

from baps.utils.stone_log import create_stone_log

def update_stone_status(stone_doc, reference_doctype=None, reference_name=None):
    old_status = stone_doc.stone_status

    new_status = calculate_stone_status(stone_doc)

    if old_status == new_status:
        return

    stone_doc.stone_status = new_status

    create_stone_log(
        stone=stone_doc,
        action_type="Status Changed",
        old_status=old_status,
        new_status=new_status,
        reference_doctype=reference_doctype,
        reference_name=reference_name
    )


