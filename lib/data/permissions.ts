// Mirrors the `action` strings in lib/data/rules.ts exactly — this file
// exists so every permission check goes through autocomplete instead of
// a raw string, catching typos at compile time instead of failing silently
// as "permission denied."
//
// Fully rule-based, per-organization — there is no accountType/owner
// special case. "Owner" is still a real, structural concept
// (Organization.ownerId — see hooks/use-is-organization-owner.ts), but it
// grants nothing on its own; the org's creator is simply assigned the
// Superadmin role like any other member would be.

// DONT'T REMOVE VERY IMPORTANT
export const PERMISSIONS = {
  // Organization Rules
  ORGANIZATION_CREATE: "organization.create",
  ORGANIZATION_UPDATE_BASIC_INFO: "organization.update.basicInfo",
  ORGANIZATION_UPDATE_LOGO: "organization.update.logo",
  ORGANIZATION_UPDATE_TIMEZONE: "organization.update.timezone",
  ORGANIZATION_UPDATE_INVITE_EXPIRATION:
    "organization.update.invite.expiration",
  ORGANIZATION_UPDATE_NOTIFICATIONS: "organization.update.notifications",
  ORGANIZATION_DEACTIVATE: "organization.deactivate",
  ORGANIZATION_DELETE: "organization.delete",
  ORGANIZATION_CHANGE_OWNERSHIP: "organization.change.ownership",

  // Tag Rules
  TAG_VIEW: "tag.view",
  TAG_ADD: "tag.add",
  TAG_UPDATE: "tag.update",
  TAG_REMOVE: "tag.remove",

  // Member Rules
  MEMBER_INVITE: "member.invite",
  MEMBER_REMOVE: "member.remove",
  MEMBER_UPDATE_ROLE: "member.update.role",
  MEMBER_VIEW_MEMBERS: "member.view.members",
  MEMBER_VIEW_OWNER: "member.view.owner",
  MEMBER_VIEW_CLIENT: "member.view.client",
  MEMBER_SET_ACTIVE: "member.set.active",

  // Role Rules
  ROLE_VIEW: "role.view",
  ROLE_ADD: "role.add",
  ROLE_UPDATE: "role.update",
  ROLE_REMOVE: "role.remove",

  // Ticket Rules
  TICKET_CREATE: "ticket.create",
  TICKET_UPDATE: "ticket.update",
  TICKET_REMOVE: "ticket.remove",
  TICKET_VIEW_ALL: "ticket.view.all",
  TICKET_VIEW_INCLUDED: "ticket.view.included",
  TICKET_CHANGE_TAG: "ticket.change.tag",
  TICKET_ASSIGN: "ticket.assign",
  TICKET_ASSIGN_VIEW: "ticket.assign.view",
  TICKET_COMMENT: "ticket.comment",
  TICKET_EDIT_COMMENT: "ticket.edit.comment",
  TICKET_REMOVE_COMMENT: "ticket.remove.comment",

  // Request Rules
  REQUEST_ALL_CREATE: "request.all.create",
  REQUEST_ALL_CANCEL: "request.all.cancel",
  REQUEST_ALL_APPROVE: "request.all.approve",
  REQUEST_ALL_REJECT: "request.all.reject",
  REQUEST_ALL_UPDATE: "request.all.update",
  REQUEST_OWN_CREATE: "request.own.create",
  REQUEST_OWN_CANCEL: "request.own.cancel",
  REQUEST_OWN_UPDATE: "request.own.update",

  // Report Rules
  REPORT_DOWNLOAD: "report.download",
  REPORT_VIEW_ALL: "report.view.all",
  REPORT_VIEW_OWN: "report.view.own",

  // Activity Log Rules
  ACTIVITY_LOG_VIEW_ALL: "activity.log.view.all",
  ACTIVITY_LOG_VIEW_INCLUDED: "activity.log.view.included",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// Grouped here (not in hooks/use-can-view-request.ts, which is a "use
// client" module) so Server Components can import them too — a Server
// Component reading a plain export out of a client module throws ("Only
// named exports are supported on a client module imported on the
// server"), since every export of a "use client" file is treated as a
// component reference, not a real value.
/** Holding any "all" tier request permission sees every request; "own"
 * tier only sees the ones they submitted themselves. Neither tier means
 * no access. */
export const REQUEST_ALL_PERMISSIONS: Permission[] = [
  PERMISSIONS.REQUEST_ALL_CREATE,
  PERMISSIONS.REQUEST_ALL_CANCEL,
  PERMISSIONS.REQUEST_ALL_APPROVE,
  PERMISSIONS.REQUEST_ALL_REJECT,
  PERMISSIONS.REQUEST_ALL_UPDATE,
];

export const REQUEST_OWN_PERMISSIONS: Permission[] = [
  PERMISSIONS.REQUEST_OWN_CREATE,
  PERMISSIONS.REQUEST_OWN_CANCEL,
  PERMISSIONS.REQUEST_OWN_UPDATE,
];
