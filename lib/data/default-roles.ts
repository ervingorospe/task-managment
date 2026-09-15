// to be remove

import type { RoleDetail } from "../types/organization/role-detail.type";
import { rules } from "./default-rules";

function rulesFor(actions: string[]): typeof rules {
  if (actions[0] === "*") return rules;
  return rules.filter((rule) => actions.includes(rule.action));
}

export const mockDefaultRoles: RoleDetail[] = [
  {
    id: 1,
    role_name: "Superadmin",
    role_desc:
      "Full access to everything in the organization. Assigned to the owner.",
    isDefault: true,
    isLocked: true,
    org_id: null,
    isDeleted: false,
    rules: rulesFor(["*"]),
  },
  {
    id: 2,
    role_name: "Client",
    role_desc:
      "Can request tickets, and view the tickets and projects they're included in.",
    isDefault: true,
    isLocked: false,
    org_id: null,
    isDeleted: false,
    rules: rulesFor([
      "ticket.request",
      "ticket.view.included",
      "project.view.own",
    ]),
  },
  {
    id: 3,
    role_name: "Member",
    role_desc: "Can create, edit, and work on tickets and projects.",
    isDefault: true,
    isLocked: false,
    org_id: null,
    isDeleted: false,
    rules: rulesFor([
      "ticket.create",
      "ticket.update",
      "ticket.remove",
      "ticket.view.included",
      "ticket.change.status",
      "ticket.assign",
      "ticket.change.owner",
      "project.update",
      "project.change.status",
      "project.invite",
      "project.update.tags",
      "project.view",
    ]),
  },
  {
    id: 4,
    role_name: "Admin",
    role_desc:
      "Can manage members, tags, and reports, and has full visibility across all tickets and projects.",
    isDefault: true,
    isLocked: false,
    org_id: null,
    isDeleted: false,
    rules: rulesFor([
      "ticket.create",
      "ticket.update",
      "ticket.remove",
      "ticket.view.included",
      "ticket.view.all",
      "ticket.change.status",
      "ticket.assign",
      "ticket.change.owner",
      "project.create",
      "project.update",
      "project.remove",
      "project.change.status",
      "project.invite",
      "project.update.tags",
      "project.view",
      "report.generate",
      "report.view",
      "report.download",
      "tag.view",
      "tag.add",
      "tag.update",
      "tag.remove",
      "member.invite",
      "member.remove",
      "member.view.members",
      "member.view.admins",
      "member.view.owner",
      "member.view.clients",
      "member.set.active",
    ]),
  },
];
