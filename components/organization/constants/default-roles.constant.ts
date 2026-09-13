import { OrgRole } from "@/lib/types/organization.type";

export const defaultRoles: OrgRole[] = [
  {
    id: "superadmin",
    name: "Superadmin",
    description:
      "Full access to everything in the organization. Assigned to the owner.",
    permissions: ["*"],
    isDefault: true,
  },
  {
    id: "client",
    name: "Client",
    description:
      "Can request tickets, and view and comment on their own tickets.",
    permissions: ["request_ticket", "view_own_tickets", "comment_ticket"],
    isDefault: true,
  },
  {
    id: "member",
    name: "member",
    description: "Can create, edit, and work on tickets and projects.",
    permissions: [
      "create_ticket",
      "edit_ticket",
      "view_own_tickets",
      "comment_ticket",
    ],
    isDefault: true,
  },
];
