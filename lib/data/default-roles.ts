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
    roleName: "Superadmin",
    roleDesc:
      "Full access to everything in the organization. Assigned to the owner.",
    isDefault: true,
    isLocked: true,
    orgId: null,
    isDeleted: false,
    rules: rulesFor(["*"]),
  },
  {
    id: 2,
    roleName: "Client",
    roleDesc: "Can request tickets, and view the tickets they're included in.",
    isDefault: true,
    isLocked: false,
    orgId: null,
    isDeleted: false,
    rules: rulesFor(["ticket.request", "ticket.view.included"]),
  },
  {
    id: 3,
    roleName: "Member",
    roleDesc: "Can create, edit, and work on tickets.",
    isDefault: true,
    isLocked: false,
    orgId: null,
    isDeleted: false,
    rules: rulesFor([
      "ticket.create",
      "ticket.update",
      "ticket.remove",
      "ticket.view.included",
      "ticket.change.status",
      "ticket.assign",
      "ticket.change.owner",
    ]),
  },
  {
    id: 4,
    roleName: "Admin",
    roleDesc:
      "Can manage members, tags, and reports, and has full visibility across all tickets.",
    isDefault: true,
    isLocked: false,
    orgId: null,
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
