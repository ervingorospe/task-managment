// Mirrors the `action` strings in lib/data/rules.ts exactly — this file
// exists so every permission check goes through autocomplete instead of
// a raw string, catching typos at compile time instead of failing silently
// as "permission denied."

export const PERMISSIONS = {
  // Tag Rules
  TAG_VIEW: "tag.view",
  TAG_ADD: "tag.add",
  TAG_UPDATE: "tag.update",
  TAG_REMOVE: "tag.remove",

  // Member Rules
  MEMBER_INVITE: "member.invite",
  MEMBER_REMOVE: "member.remove",
  MEMBER_VIEW_MEMBERS: "member.view.members",
  MEMBER_VIEW_ADMINS: "member.view.admins",
  MEMBER_VIEW_OWNER: "member.view.owner",
  MEMBER_VIEW_CLIENTS: "member.view.clients",
  MEMBER_SET_ACTIVE: "member.set.active",

  // Role Rules
  ROLE_VIEW: "role.view",
  ROLE_ADD: "role.add",
  ROLE_UPDATE: "role.update",
  ROLE_REMOVE: "role.remove",

  // Project Rules
  PROJECT_VIEW: "project.view",
  PROJECT_VIEW_OWN: "project.view.own",
  PROJECT_CREATE: "project.create",
  PROJECT_UPDATE: "project.update",
  PROJECT_REMOVE: "project.remove",
  PROJECT_CHANGE_STATUS: "project.change.status",
  PROJECT_INVITE: "project.invite",
  PROJECT_UPDATE_TAGS: "project.update.tags",

  // Ticket Rules
  TICKET_REQUEST: "ticket.request",
  TICKET_CREATE: "ticket.create",
  TICKET_UPDATE: "ticket.update",
  TICKET_REMOVE: "ticket.remove",
  TICKET_VIEW_ALL: "ticket.view.all",
  TICKET_VIEW_INCLUDED: "ticket.view.included",
  TICKET_CHANGE_STATUS: "ticket.change.status",
  TICKET_CHANGE_OWNER: "ticket.change.owner",
  TICKET_ASSIGN: "ticket.assign",

  // Report Rules
  REPORT_GENERATE: "report.generate",
  REPORT_VIEW: "report.view",
  REPORT_DOWNLOAD: "report.download",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
