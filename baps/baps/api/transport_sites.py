# import frappe

# @frappe.whitelist()
# def get_user_sites():
#     """
#     Return list of Site names that the current user is allocated to
#     as sender and/or receiver based on their roles.
#     """
#     user = frappe.session.user

#     # roles of the user
#     roles = set(r.role for r in frappe.get_all("Has Role",
#                                               filters={"parent": user},
#                                               fields=["role"]))

#     want_sender = "Transportation Sender" in roles
#     want_receiver = "Transportation Receiver" in roles

#     if not (want_sender or want_receiver):
#         return []

#     # parent doc uses field person_name (Link to User)
#     parents = frappe.get_all("Transport Site Allocation",
#                              filters={"person_name": user},
#                              pluck="name")
#     if not parents:
#         return []

#     allowed_sites = set()

#     # child doctype name is "Site Allocation Child" (istable)
#     child_doctype = "Site Allocation Child"

#     if want_sender:
#         rows = frappe.get_all(child_doctype,
#                               filters={"parent": ["in", parents], "sender": 1},
#                               fields=["site"])
#         allowed_sites.update(r.site for r in rows)

#     if want_receiver:
#         rows = frappe.get_all(child_doctype,
#                               filters={"parent": ["in", parents], "receiver": 1},
#                               fields=["site"])
#         allowed_sites.update(r.site for r in rows)

#     # return sorted list (or list(allowed_sites))
#     return sorted(allowed_sites)


#######################################################
import frappe

@frappe.whitelist()
def get_user_sites():
    """Return Site names allocated to the current user as Sender and/or Receiver."""
    user = frappe.session.user

    roles = {r.role for r in frappe.get_all("Has Role",
                                            filters={"parent": user},
                                            fields=["role"])}
    want_sender = "Transportation Sender" in roles
    want_receiver = "Transportation Receiver" in roles
    if not (want_sender or want_receiver):
        return []

    parents = frappe.get_all("Transport Site Allocation",
                             filters={"person_name": user},  # your parent field
                             pluck="name")
    if not parents:
        return []

    allowed = set()
    child = "Site Allocation Child"

    if want_sender:
        for r in frappe.get_all(child, filters={"parent": ["in", parents], "sender": 1},
                                fields=["site"]):
            allowed.add(r.site)

    if want_receiver:
        for r in frappe.get_all(child, filters={"parent": ["in", parents], "receiver": 1},
                                fields=["site"]):
            allowed.add(r.site)

    return sorted(allowed)
