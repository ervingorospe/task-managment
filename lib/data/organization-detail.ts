// Mock data shaped directly after the DB tables (Users, Organization, Roles,
// Tags, Members, Member_Invites, Organization_Settings, Rules, Role_Rules).
// No types applied yet, per your note — this is just the field-accurate shape.
// A real API response would likely look close to this, possibly with the
// role/tag/rule relations already joined and nested like this, or returned
// as flat tables the client joins itself — worth deciding once we do the
// type pass.

// to be remove

import { rules } from "@/lib/data/default-rules";

const now = "2026-01-15T09:00:00.000Z";

function rulesForRole(actions: string[]) {
  if (actions[0] === "*") return rules;
  return rules.filter((rule) => actions.includes(rule.action));
}

const mockOrganizationDetails: Record<string, any> = {
  "acme-studio": {
    // Organization
    id: 1,
    organization_name: "Acme Studio",
    organization_desc:
      "A small studio building tools for independent creators.",
    email: "hello@acmestudio.com",
    website: "https://acmestudio.com",
    owner_id: 1,
    createdAt: now,
    updatedAt: now,

    // Organization_Settings (org_id: 1, one-to-one)
    settings: {
      id: 1,
      slug: "acme-studio",
      logo: "https://i.pravatar.cc/64?u=acme",
      timezone: "Asia/Manila",
      inviteExpiration: "1_day",
      sendEmailNotif: true,
      org_id: 1,
      isActive: true,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    },

    capacity: {
      members: 10,
      tags: 20,
      roles: 20,
      tickets: 500,
      projects: 100,
    },

    // Users (account_type: "owner", joined via owner_id above)
    owner: {
      id: 1,
      first_name: "Jane",
      last_name: "Doe",
      email: "jane@acmestudio.com",
      avatar: "https://i.pravatar.cc/64?u=jane",
      account_type: "owner",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },

    // Roles (org_id: 1 — this org's own copies, not the global templates)
    roles: [
      {
        id: 1,
        role_name: "Superadmin",
        role_desc:
          "Full access to everything in the organization. Assigned to the owner.",
        isDefault: true,
        org_id: 1,
        isLocked: true,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
        rules: rulesForRole(["*"]),
      },
      {
        id: 2,
        role_name: "Client",
        role_desc:
          "Can request tickets, and view the tickets and projects they're included in.",
        isDefault: true,
        org_id: 1,
        isLocked: false,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
        rules: rulesForRole([
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
        org_id: 1,
        isLocked: false,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
        rules: rulesForRole([
          "ticket.create",
          "ticket.update",
          "ticket.remove",
          "ticket.view.included",
          "ticket.change.status",
          "ticket.change.owner",
          "ticket.assign",
          "project.create",
          "project.update",
          "project.remove",
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
        org_id: 1,
        isDeleted: false,
        isLocked: false,
        createdAt: now,
        updatedAt: now,
        rules: rulesForRole([
          "ticket.create",
          "ticket.update",
          "ticket.remove",
          "ticket.view.included",
          "ticket.view.all",
          "ticket.change.status",
          "ticket.change.owner",
          "ticket.assign",
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
    ],

    // Tags (org_id: 1)
    tags: [
      {
        id: 201,
        tag_name: "Backlog",
        color: "#94A39D",
        isDefault: true,
        org_id: 1,
        isDeleted: false,
      },
      {
        id: 202,
        tag_name: "To Do",
        color: "#64748B",
        isDefault: true,
        org_id: 1,
        isDeleted: false,
      },
      {
        id: 203,
        tag_name: "In-Progress",
        color: "#3B82C4",
        isDefault: true,
        org_id: 1,
        isDeleted: false,
      },
      {
        id: 204,
        tag_name: "Blocked",
        color: "#E5484D",
        isDefault: true,
        org_id: 1,
        isDeleted: false,
      },
      {
        id: 205,
        tag_name: "Done",
        color: "#28A428",
        isDefault: true,
        org_id: 1,
        isDeleted: false,
      },
    ],

    // Members (join of Users <-> Organization, includes role_id)
    members: [
      {
        id: 1,
        first_name: "Jane",
        last_name: "Doe",
        email: "jane@acmestudio.com",
        user_id: 1,
        org_id: 1,
        role_id: 1,
        isActive: true,
        user: {
          id: 1,
          first_name: "Jane",
          last_name: "Doe",
          email: "jane@acmestudio.com",
          isActive: true,
        },
      },
      {
        id: 2,
        first_name: "Marco",
        last_name: "Cruz",
        email: "marco@acmestudio.com",
        user_id: 2,
        org_id: 1,
        role_id: 4,
        isActive: true,
        user: {
          id: 2,
          first_name: "Marco",
          last_name: "Cruz",
          email: "marco@acmestudio.com",
          isActive: true,
        },
      },
      {
        id: 3,
        first_name: "Priya",
        last_name: "Nair",
        email: "priya@acmestudio.com",
        user_id: 3,
        org_id: 1,
        role_id: 103,
        isActive: true,
        createdAt: now,
        updatedAt: now,
        user: {
          id: 3,
          first_name: "Priya",
          last_name: "Nair",
          email: "priya@acmestudio.com",
          isActive: true,
        },
      },
      {
        id: 4,
        first_name: "Alex",
        last_name: "Rivera",
        email: "alex@clientco.com",
        user_id: 4,
        org_id: 1,
        role_id: 2,
        isActive: false,
        user: {
          id: 4,
          first_name: "Alex",
          last_name: "Rivera",
          email: "alex@clientco.com",
          isActive: false,
        },
      },
    ],

    // Member_Invites (type: "membership" | "ownership", org_id: 1)
    pendingInvites: [
      {
        id: 1,
        email: "sam@newhire.com",
        token: "tok_sam123",
        expiry: "2026-01-16T09:00:00.000Z",
        resentCount: 0,
        type: "membership",
        status: "pending",
        role_id: 1,
        org_id: 1,
      },
      {
        id: 2,
        email: "taylor@clientco.com",
        token: "tok_taylor456",
        expiry: "2026-01-16T09:00:00.000Z",
        resentCount: 1,
        type: "membership",
        status: "pending",
        role_id: 2,
        org_id: 1,
      },
      {
        id: 3,
        email: "unassigned@acmestudio.com",
        token: "tok_unassigned000",
        expiry: "2026-01-20T09:00:00.000Z",
        resentCount: 0,
        type: "membership",
        status: "pending",
        role_id: 3,
        org_id: 1,
      },
      // Ownership transfer — same table, distinguished by `type`, feeds
      // the pending-transfer notice on the Settings > Information section.
      {
        id: 4,
        email: "marco@acmestudio.com",
        token: "tok_owner789",
        expiry: "2026-01-22T09:00:00.000Z",
        resentCount: 0,
        type: "ownership",
        status: "pending",
        role_id: 2,
        org_id: 1,
      },
    ],
    pendingOwnershipTransfer: {
      id: 1,
      email: "sam@newhire.com",
      token: "tok_sam123",
      expiry: "2026-01-16T09:00:00.000Z",
      resentCount: 0,
      type: "ownership",
      status: "pending",
      role_id: 1,
      org_id: 1,
    },
  },
};

export async function getOrganizationBySlug(slug: string): Promise<any | null> {
  // TODO: GET /organizations/:slug
  return mockOrganizationDetails[slug] ?? null;
}
