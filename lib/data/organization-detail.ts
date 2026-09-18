// Mock data shaped directly after the DB tables (Users, Organization, Roles,
// Tags, Members, Member_Invites, Organization_Settings, Rules, Role_Rules).
// No types applied yet, per your note — this is just the field-accurate shape.
// A real API response would likely look close to this, possibly with the
// role/tag/rule relations already joined and nested like this, or returned
// as flat tables the client joins itself — worth deciding once we do the
// type pass.

// to be remove

import { rules } from "@/lib/data/default-rules";
import { TicketDetail } from "../types/ticket/ticket-detail.type";

const now = "2026-01-15T09:00:00.000Z";

function rulesForRole(actions: string[]) {
  if (actions[0] === "*") return rules;
  return rules.filter((rule) => actions.includes(rule.action));
}

function addDays(base: string, days: number): string {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function addDaysIso(base: string, days: number): string {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

// Acme Studio's tags/members, duplicated as plain data here (rather than
// referencing the literal below) so this generator can build tickets that
// point at real tag/member ids without restructuring the org literal.
const genTags = [
  { id: 201, tagName: "Backlog", color: "#94A39D", isDefault: true, orgId: 1, isDeleted: false },
  { id: 202, tagName: "To Do", color: "#64748B", isDefault: true, orgId: 1, isDeleted: false },
  { id: 203, tagName: "In-Progress", color: "#3B82C4", isDefault: true, orgId: 1, isDeleted: false },
  { id: 204, tagName: "Blocked", color: "#E5484D", isDefault: true, orgId: 1, isDeleted: false },
  { id: 205, tagName: "Done", color: "#28A428", isDefault: true, orgId: 1, isDeleted: false },
];

const genMembers = [
  {
    id: 2,
    firstName: "Marco",
    lastName: "Cruz",
    email: "marco@acmestudio.com",
    orgId: 1,
    roleId: 4,
    isActive: true,
    user: {
      id: 2,
      firstName: "Marco",
      lastName: "Cruz",
      email: "marco@acmestudio.com",
      isActive: true,
      avatar: "https://i.pravatar.cc/64?u=jane",
      accountType: "member" as const,
    },
  },
  {
    id: 3,
    firstName: "Priya",
    lastName: "Nair",
    email: "priya@acmestudio.com",
    orgId: 1,
    roleId: 3,
    isActive: true,
    user: {
      id: 3,
      firstName: "Priya",
      lastName: "Nair",
      email: "priya@acmestudio.com",
      isActive: true,
      avatar: "https://i.pravatar.cc/64?u=jane",
      accountType: "member" as const,
    },
  },
];

const genClient = {
  id: 4,
  firstName: "Alex",
  lastName: "Rivera",
  email: "alex@clientco.com",
  orgId: 1,
  roleId: 2,
  isActive: false,
  user: {
    id: 4,
    firstName: "Alex",
    lastName: "Rivera",
    email: "alex@clientco.com",
    isActive: false,
    avatar: "https://i.pravatar.cc/64?u=jane",
    accountType: "member" as const,
  },
};

const ticketTitlePool = [
  "Fix broken image upload on profile page",
  "Improve loading state for dashboard widgets",
  "Login form doesn't show validation errors",
  "Add dark mode toggle to settings",
  "Export button missing on mobile layout",
  "Slow query on the tickets list endpoint",
  "Typo in the welcome email subject line",
  "Add pagination to the members table",
  "Search doesn't match partial email addresses",
  "Broken link in the invoice PDF footer",
  "Notification bell shows stale unread count",
  "Add bulk-assign action to the ticket list",
  "Timezone picker resets after saving",
  "Duplicate tags can be created with different casing",
  "Add keyboard shortcuts for common actions",
  "Avatar upload fails for files over 2MB",
  "Client portal shows tickets from other orgs",
  "Add CSV import for bulk ticket creation",
  "Improve empty states across the dashboard",
  "Rate limit the invite-resend endpoint",
  "Add audit log for role permission changes",
  "Comment mentions don't trigger a notification",
  "Due date picker allows selecting past dates",
  "Add a weekly digest email for open tickets",
  "Tag colors are hard to distinguish for colorblind users",
  "Session expires too quickly on the mobile app",
  "Add drag-and-drop file attachments to tickets",
  "Reports page crashes when there is no data",
  "Add a \"my tickets\" filter shortcut",
  "Improve error messaging on failed invites",
];

// Deterministic pseudo-random pick, so the mock data is stable across runs.
function pick<T>(pool: T[], seed: number): T {
  return pool[seed % pool.length];
}

function generateMockTickets(count: number, startId: number): TicketDetail[] {
  return Array.from({ length: count }, (_, i) => {
    const id = startId + i;
    const tag = pick(genTags, i);
    const repeatIndex = Math.floor(i / ticketTitlePool.length);
    const baseTitle = pick(ticketTitlePool, i);
    const title = repeatIndex > 0 ? `${baseTitle} (${repeatIndex + 1})` : baseTitle;

    const assigneeCount = i % 3;
    const assignees =
      assigneeCount === 0 ? [] : genMembers.slice(0, assigneeCount);
    const hasClient = i % 4 === 0;

    const dueOffset = (i % 21) - 10; // spread roughly ±10 days around `now`
    const dueDate = i % 6 === 5 ? null : addDays(now, dueOffset);

    const createdAt = addDaysIso(now, -((i % 30) + 1));
    const updatedAt = addDaysIso(now, -(i % 5));

    return {
      id,
      orgId: 1,
      title,
      description:
        i % 3 === 0
          ? undefined
          : `Auto-generated ticket #${id} for testing pagination, filters, and search.`,
      attachments: [],
      tag,
      client: hasClient ? genClient : null,
      assignees,
      dueDate,
      starred: i % 11 === 0,
      createdAt,
      updatedAt,
    };
  });
}

const mockOrganizationDetails: Record<string, any> = {
  "acme-studio": {
    // Organization
    id: 1,
    organizationName: "Acme Studio",
    organizationDesc: "A small studio building tools for independent creators.",
    email: "hello@acmestudio.com",
    ownerId: 1,
    createdAt: now,
    updatedAt: now,

    // Organization_Settings (orgId: 1, one-to-one)
    settings: {
      id: 1,
      slug: "acme-studio",
      logo: "https://i.pravatar.cc/64?u=acme",
      timezone: "Asia/Manila",
      inviteExpiration: "1_day",
      sendEmailNotif: true,
      orgId: 1,
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

    // Users (accountType: "owner", joined via ownerId above)
    owner: {
      id: 1,
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@acmestudio.com",
      avatar: "https://i.pravatar.cc/64?u=jane",
      accountType: "owner",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },

    // Roles (orgId: 1 — this org's own copies, not the global templates)
    roles: [
      {
        id: 1,
        roleName: "Superadmin",
        roleDesc:
          "Full access to everything in the organization. Assigned to the owner.",
        isDefault: true,
        orgId: 1,
        isLocked: true,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
        rules: rulesForRole(["*"]),
      },
      {
        id: 2,
        roleName: "Client",
        roleDesc: "Can request tickets, and view the tickets they're included in.",
        isDefault: true,
        orgId: 1,
        isLocked: false,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
        rules: rulesForRole(["ticket.request", "ticket.view.included"]),
      },
      {
        id: 3,
        roleName: "Member",
        roleDesc: "Can create, edit, and work on tickets.",
        isDefault: true,
        orgId: 1,
        isLocked: false,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
        rules: rulesForRole([
          "ticket.create",
          "ticket.update",
          "ticket.view.included",
          "ticket.change.status",
          "ticket.change.owner",
          "ticket.assign",
        ]),
      },
      {
        id: 4,
        roleName: "Admin",
        roleDesc:
          "Can manage members, tags, and reports, and has full visibility across all tickets.",
        isDefault: true,
        orgId: 1,
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

    // Tags (orgId: 1)
    tags: [
      {
        id: 201,
        tagName: "Backlog",
        color: "#94A39D",
        isDefault: true,
        orgId: 1,
        isDeleted: false,
      },
      {
        id: 202,
        tagName: "To Do",
        color: "#64748B",
        isDefault: true,
        orgId: 1,
        isDeleted: false,
      },
      {
        id: 203,
        tagName: "In-Progress",
        color: "#3B82C4",
        isDefault: true,
        orgId: 1,
        isDeleted: false,
      },
      {
        id: 204,
        tagName: "Blocked",
        color: "#E5484D",
        isDefault: true,
        orgId: 1,
        isDeleted: false,
      },
      {
        id: 205,
        tagName: "Done",
        color: "#28A428",
        isDefault: true,
        orgId: 1,
        isDeleted: false,
      },
    ],

    // Members (join of Users <-> Organization, includes roleId)
    members: [
      {
        id: 1,
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@acmestudio.com",
        userId: 1,
        orgId: 1,
        roleId: 1,
        isActive: true,
        user: {
          id: 1,
          firstName: "Jane",
          lastName: "Doe",
          email: "jane@acmestudio.com",
          isActive: true,
        },
      },
      {
        id: 2,
        firstName: "Marco",
        lastName: "Cruz",
        email: "marco@acmestudio.com",
        userId: 2,
        orgId: 1,
        roleId: 4,
        isActive: true,
        user: {
          id: 2,
          firstName: "Marco",
          lastName: "Cruz",
          email: "marco@acmestudio.com",
          isActive: true,
        },
      },
      {
        id: 3,
        firstName: "Priya",
        lastName: "Nair",
        email: "priya@acmestudio.com",
        userId: 3,
        orgId: 1,
        roleId: 103,
        isActive: true,
        createdAt: now,
        updatedAt: now,
        user: {
          id: 3,
          firstName: "Priya",
          lastName: "Nair",
          email: "priya@acmestudio.com",
          isActive: true,
        },
      },
      {
        id: 4,
        firstName: "Alex",
        lastName: "Rivera",
        email: "alex@clientco.com",
        userId: 4,
        orgId: 1,
        roleId: 2,
        isActive: false,
        user: {
          id: 4,
          firstName: "Alex",
          lastName: "Rivera",
          email: "alex@clientco.com",
          isActive: false,
        },
      },
    ],

    // Member_Invites (type: "membership" | "ownership", orgId: 1)
    pendingInvites: [
      {
        id: 1,
        email: "sam@newhire.com",
        token: "tok_sam123",
        expiry: "2026-01-16T09:00:00.000Z",
        resentCount: 0,
        type: "membership",
        status: "pending",
        roleId: 1,
        orgId: 1,
      },
      {
        id: 2,
        email: "taylor@clientco.com",
        token: "tok_taylor456",
        expiry: "2026-01-16T09:00:00.000Z",
        resentCount: 1,
        type: "membership",
        status: "pending",
        roleId: 2,
        orgId: 1,
      },
      {
        id: 3,
        email: "unassigned@acmestudio.com",
        token: "tok_unassigned000",
        expiry: "2026-01-20T09:00:00.000Z",
        resentCount: 0,
        type: "membership",
        status: "pending",
        roleId: 3,
        orgId: 1,
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
        roleId: 2,
        orgId: 1,
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
      roleId: 1,
      orgId: 1,
    },
    tickets: [
      {
        id: 1001,
        orgId: 1,
        title: "Checkout button not responding on mobile Safari",
        description:
          "## Steps to reproduce\n1. Open checkout on an iPhone\n2. Tap **Pay now**\n3. Nothing happens\n\nSeen on iOS 17.4, Safari. Doesn't repro on Chrome.",
        attachments: [
          { id: 1, name: "screen-recording.mov", url: "#", size: 4_200_000 },
        ],
        tag: {
          id: 203,
          tagName: "In-Progress",
          color: "#3B82C4",
          isDefault: true,
          orgId: 1,
          isDeleted: false,
        },
        client: null,
        assignees: [
          {
            id: 2,
            firstName: "Marco",
            lastName: "Cruz",
            email: "marco@acmestudio.com",
            orgId: 1,
            roleId: 4,
            isActive: true,
            user: {
              id: 2,
              firstName: "Marco",
              lastName: "Cruz",
              email: "marco@acmestudio.com",
              isActive: true,
              avatar: "https://i.pravatar.cc/64?u=jane",
              accountType: "member",
            },
          },
        ],
        dueDate: "2026-01-14", // in the past relative to `now` — renders as Overdue
        starred: true,
        comments: [
          {
            id: 1,
            ticketId: 1001,
            userId: 2,
            comment:
              "Reproduced on iOS 17.4 as well. Looks like the tap handler isn't attached until the page fully hydrates on slower connections.",
            author: {
              id: 2,
              firstName: "Marco",
              lastName: "Cruz",
              avatar: "https://i.pravatar.cc/64?u=jane",
            },
            createdAt: "2026-01-09T10:00:00.000Z",
            updatedAt: "2026-01-09T10:00:00.000Z",
          },
          {
            id: 2,
            ticketId: 1001,
            userId: 1,
            comment:
              "Any update on this? The client is asking since it's blocking checkout on mobile.",
            author: {
              id: 1,
              firstName: "Jane",
              lastName: "Doe",
              avatar: "https://i.pravatar.cc/64?u=jane",
            },
            createdAt: "2026-01-12T14:30:00.000Z",
            updatedAt: "2026-01-12T14:30:00.000Z",
          },
        ],
        createdAt: "2026-01-08T09:00:00.000Z",
        updatedAt: "2026-01-13T09:00:00.000Z",
      },
      {
        id: 1002,
        orgId: 1,
        title: "Add CSV export to the reports page",
        description:
          "Client asked for a way to export monthly reports as CSV, not just view them in-app.",
        attachments: [],
        tag: {
          id: 202,
          tagName: "To Do",
          color: "#64748B",
          isDefault: true,
          orgId: 1,
          isDeleted: false,
        },
        client: {
          id: 4,
          firstName: "Alex",
          lastName: "Rivera",
          email: "alex@clientco.com",
          orgId: 1,
          roleId: 2,
          isActive: false,
          user: {
            id: 4,
            firstName: "Alex",
            lastName: "Rivera",
            email: "alex@clientco.com",
            isActive: false,
            avatar: "https://i.pravatar.cc/64?u=jane",
            accountType: "member",
          },
        },
        assignees: [],
        dueDate: "2026-01-15", // renders as Due today
        starred: false,
        createdAt: "2026-01-15T08:00:00.000Z",
        updatedAt: "2026-01-15T08:00:00.000Z",
      },
      {
        id: 1003,
        orgId: 1,
        title: "Investigate flaky invite-email delivery",
        description:
          "Some invited members report never receiving the invite email. Happens intermittently — not tied to a specific email provider so far.\n\n- Checked SPF/DKIM: looks fine\n- Checked spam folder reports: inconclusive\n- Next: add delivery logging on the mail service",
        attachments: [],
        tag: {
          id: 204,
          tagName: "Blocked",
          color: "#E5484D",
          isDefault: true,
          orgId: 1,
          isDeleted: false,
        },
        client: null,
        assignees: [
          {
            id: 2,
            firstName: "Marco",
            lastName: "Cruz",
            email: "marco@acmestudio.com",
            orgId: 1,
            roleId: 4,
            isActive: true,
            user: {
              id: 2,
              firstName: "Marco",
              lastName: "Cruz",
              email: "marco@acmestudio.com",
              isActive: true,
              avatar: "https://i.pravatar.cc/64?u=jane",
              accountType: "member",
            },
          },
          {
            id: 3,
            firstName: "Priya",
            lastName: "Nair",
            email: "priya@acmestudio.com",
            orgId: 1,
            roleId: 3,
            isActive: true,
            user: {
              id: 3,
              firstName: "Priya",
              lastName: "Nair",
              email: "priya@acmestudio.com",
              isActive: true,
              avatar: "https://i.pravatar.cc/64?u=jane",
              accountType: "member",
            },
          },
        ],
        dueDate: "2026-01-20", // upcoming — no chip
        starred: true,
        createdAt: "2026-01-12T10:00:00.000Z",
        updatedAt: "2026-01-14T16:00:00.000Z",
      },
      {
        id: 1004,
        orgId: 1,
        title: "Update onboarding copy for new logo",
        description: undefined,
        attachments: [],
        tag: {
          id: 205,
          tagName: "Done",
          color: "#28A428",
          isDefault: true,
          orgId: 1,
          isDeleted: false,
        },
        client: null,
        assignees: [
          {
            id: 3,
            firstName: "Priya",
            lastName: "Nair",
            email: "priya@acmestudio.com",
            orgId: 1,
            roleId: 3,
            isActive: true,
            user: {
              id: 3,
              firstName: "Priya",
              lastName: "Nair",
              email: "priya@acmestudio.com",
              isActive: true,
              avatar: "https://i.pravatar.cc/64?u=jane",
              accountType: "member",
            },
          },
        ],
        dueDate: null, // no timeframe at all — tests the "—" fallback
        starred: false,
        createdAt: "2026-01-05T09:00:00.000Z",
        updatedAt: "2026-01-09T09:00:00.000Z",
      },
      {
        id: 1005,
        orgId: 1,
        title: "Backlog: explore dark mode support",
        description: "Not urgent — just capturing the idea while it's fresh.",
        attachments: [],
        tag: {
          id: 201,
          tagName: "Backlog",
          color: "#94A39D",
          isDefault: true,
          orgId: 1,
          isDeleted: false,
        },
        client: null,
        assignees: [],
        dueDate: null,
        starred: false,
        createdAt: "2026-01-11T09:00:00.000Z",
        updatedAt: "2026-01-11T09:00:00.000Z",
      },
      ...generateMockTickets(100, 2001),
    ] satisfies TicketDetail[],
  },

  "acme-studio2": {
    // Organization
    id: 1,
    organizationName: "Acme Studio2",
    organizationDesc: "A small studio building tools for independent creators.",
    email: "hello@acmestudio.com",
    ownerId: 1,
    createdAt: now,
    updatedAt: now,

    // Organization_Settings (orgId: 1, one-to-one)
    settings: {
      id: 1,
      slug: "acme-studio",
      logo: "https://i.pravatar.cc/64?u=acme",
      timezone: "Asia/Manila",
      inviteExpiration: "1_day",
      sendEmailNotif: true,
      orgId: 1,
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

    // Users (accountType: "owner", joined via ownerId above)
    owner: {
      id: 1,
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@acmestudio.com",
      avatar: "https://i.pravatar.cc/64?u=jane",
      accountType: "owner",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },

    // Roles (orgId: 1 — this org's own copies, not the global templates)
    roles: [
      {
        id: 1,
        roleName: "Superadmin",
        roleDesc:
          "Full access to everything in the organization. Assigned to the owner.",
        isDefault: true,
        orgId: 1,
        isLocked: true,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
        rules: rulesForRole(["*"]),
      },
      {
        id: 2,
        roleName: "Client",
        roleDesc: "Can request tickets, and view the tickets they're included in.",
        isDefault: true,
        orgId: 1,
        isLocked: false,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
        rules: rulesForRole(["ticket.request", "ticket.view.included"]),
      },
      {
        id: 3,
        roleName: "Member",
        roleDesc: "Can create, edit, and work on tickets.",
        isDefault: true,
        orgId: 1,
        isLocked: false,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
        rules: rulesForRole([
          "ticket.create",
          "ticket.update",
          "ticket.view.included",
          "ticket.change.status",
          "ticket.change.owner",
          "ticket.assign",
        ]),
      },
      {
        id: 4,
        roleName: "Admin",
        roleDesc:
          "Can manage members, tags, and reports, and has full visibility across all tickets.",
        isDefault: true,
        orgId: 1,
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

    // Tags (orgId: 1)
    tags: [
      {
        id: 201,
        tagName: "Backlog",
        color: "#94A39D",
        isDefault: true,
        orgId: 1,
        isDeleted: false,
      },
      {
        id: 202,
        tagName: "To Do",
        color: "#64748B",
        isDefault: true,
        orgId: 1,
        isDeleted: false,
      },
      {
        id: 203,
        tagName: "In-Progress",
        color: "#3B82C4",
        isDefault: true,
        orgId: 1,
        isDeleted: false,
      },
      {
        id: 204,
        tagName: "Blocked",
        color: "#E5484D",
        isDefault: true,
        orgId: 1,
        isDeleted: false,
      },
      {
        id: 205,
        tagName: "Done",
        color: "#28A428",
        isDefault: true,
        orgId: 1,
        isDeleted: false,
      },
    ],

    // Members (join of Users <-> Organization, includes roleId)
    members: [
      {
        id: 1,
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@acmestudio.com",
        userId: 1,
        orgId: 1,
        roleId: 1,
        isActive: true,
        user: {
          id: 1,
          firstName: "Jane",
          lastName: "Doe",
          email: "jane@acmestudio.com",
          isActive: true,
        },
      },
      {
        id: 2,
        firstName: "Marco",
        lastName: "Cruz",
        email: "marco@acmestudio.com",
        userId: 2,
        orgId: 1,
        roleId: 4,
        isActive: true,
        user: {
          id: 2,
          firstName: "Marco",
          lastName: "Cruz",
          email: "marco@acmestudio.com",
          isActive: true,
        },
      },
      {
        id: 3,
        firstName: "Priya",
        lastName: "Nair",
        email: "priya@acmestudio.com",
        userId: 3,
        orgId: 1,
        roleId: 103,
        isActive: true,
        createdAt: now,
        updatedAt: now,
        user: {
          id: 3,
          firstName: "Priya",
          lastName: "Nair",
          email: "priya@acmestudio.com",
          isActive: true,
        },
      },
      {
        id: 4,
        firstName: "Alex",
        lastName: "Rivera",
        email: "alex@clientco.com",
        userId: 4,
        orgId: 1,
        roleId: 2,
        isActive: false,
        user: {
          id: 4,
          firstName: "Alex",
          lastName: "Rivera",
          email: "alex@clientco.com",
          isActive: false,
        },
      },
    ],

    // Member_Invites (type: "membership" | "ownership", orgId: 1)
    pendingInvites: [
      {
        id: 1,
        email: "sam@newhire.com",
        token: "tok_sam123",
        expiry: "2026-01-16T09:00:00.000Z",
        resentCount: 0,
        type: "membership",
        status: "pending",
        roleId: 1,
        orgId: 1,
      },
      {
        id: 2,
        email: "taylor@clientco.com",
        token: "tok_taylor456",
        expiry: "2026-01-16T09:00:00.000Z",
        resentCount: 1,
        type: "membership",
        status: "pending",
        roleId: 2,
        orgId: 1,
      },
      {
        id: 3,
        email: "unassigned@acmestudio.com",
        token: "tok_unassigned000",
        expiry: "2026-01-20T09:00:00.000Z",
        resentCount: 0,
        type: "membership",
        status: "pending",
        roleId: 3,
        orgId: 1,
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
        roleId: 2,
        orgId: 1,
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
      roleId: 1,
      orgId: 1,
    },
  },
  tickets: [
    {
      id: 1001,
      orgId: 1,
      title: "Checkout button not responding on mobile Safari",
      description:
        "## Steps to reproduce\n1. Open checkout on an iPhone\n2. Tap **Pay now**\n3. Nothing happens\n\nSeen on iOS 17.4, Safari. Doesn't repro on Chrome.",
      attachments: [
        { id: 1, name: "screen-recording.mov", url: "#", size: 4_200_000 },
      ],
      tag: {
        id: 203,
        tagName: "In-Progress",
        color: "#3B82C4",
        isDefault: true,
        orgId: 1,
        isDeleted: false,
      },
      client: null,
      assignees: [
        {
          id: 2,
          firstName: "Marco",
          lastName: "Cruz",
          email: "marco@acmestudio.com",
          orgId: 1,
          roleId: 4,
          isActive: true,
          user: {
            id: 2,
            firstName: "Marco",
            lastName: "Cruz",
            email: "marco@acmestudio.com",
            isActive: true,
            avatar: "https://i.pravatar.cc/64?u=jane",
            accountType: "member",
          },
        },
      ],
      dueDate: "2026-01-14", // in the past relative to `now` — renders as Overdue
      starred: true,
      createdAt: "2026-01-08T09:00:00.000Z",
      updatedAt: "2026-01-13T09:00:00.000Z",
    },
    {
      id: 1002,
      orgId: 1,
      title: "Add CSV export to the reports page",
      description:
        "Client asked for a way to export monthly reports as CSV, not just view them in-app.",
      attachments: [],
      tag: {
        id: 202,
        tagName: "To Do",
        color: "#64748B",
        isDefault: true,
        orgId: 1,
        isDeleted: false,
      },
      client: {
        id: 4,
        firstName: "Alex",
        lastName: "Rivera",
        email: "alex@clientco.com",
        orgId: 1,
        roleId: 2,
        isActive: false,
        user: {
          id: 4,
          firstName: "Alex",
          lastName: "Rivera",
          email: "alex@clientco.com",
          isActive: false,
          avatar: "https://i.pravatar.cc/64?u=jane",
          accountType: "member",
        },
      },
      assignees: [],
      dueDate: "2026-01-15", // renders as Due today
      starred: false,
      createdAt: "2026-01-15T08:00:00.000Z",
      updatedAt: "2026-01-15T08:00:00.000Z",
    },
    {
      id: 1003,
      orgId: 1,
      title: "Investigate flaky invite-email delivery",
      description:
        "Some invited members report never receiving the invite email. Happens intermittently — not tied to a specific email provider so far.\n\n- Checked SPF/DKIM: looks fine\n- Checked spam folder reports: inconclusive\n- Next: add delivery logging on the mail service",
      attachments: [],
      tag: {
        id: 204,
        tagName: "Blocked",
        color: "#E5484D",
        isDefault: true,
        orgId: 1,
        isDeleted: false,
      },
      client: null,
      assignees: [
        {
          id: 2,
          firstName: "Marco",
          lastName: "Cruz",
          email: "marco@acmestudio.com",
          orgId: 1,
          roleId: 4,
          isActive: true,
          user: {
            id: 2,
            firstName: "Marco",
            lastName: "Cruz",
            email: "marco@acmestudio.com",
            isActive: true,
            avatar: "https://i.pravatar.cc/64?u=jane",
            accountType: "member",
          },
        },
        {
          id: 3,
          firstName: "Priya",
          lastName: "Nair",
          email: "priya@acmestudio.com",
          orgId: 1,
          roleId: 3,
          isActive: true,
          user: {
            id: 3,
            firstName: "Priya",
            lastName: "Nair",
            email: "priya@acmestudio.com",
            isActive: true,
            avatar: "https://i.pravatar.cc/64?u=jane",
            accountType: "member",
          },
        },
      ],
      dueDate: "2026-01-20", // upcoming — no chip
      starred: true,
      createdAt: "2026-01-12T10:00:00.000Z",
      updatedAt: "2026-01-14T16:00:00.000Z",
    },
    {
      id: 1004,
      orgId: 1,
      title: "Update onboarding copy for new logo",
      description: undefined,
      attachments: [],
      tag: {
        id: 205,
        tagName: "Done",
        color: "#28A428",
        isDefault: true,
        orgId: 1,
        isDeleted: false,
      },
      client: null,
      assignees: [
        {
          id: 3,
          firstName: "Priya",
          lastName: "Nair",
          email: "priya@acmestudio.com",
          orgId: 1,
          roleId: 3,
          isActive: true,
          user: {
            id: 3,
            firstName: "Priya",
            lastName: "Nair",
            email: "priya@acmestudio.com",
            isActive: true,
            avatar: "https://i.pravatar.cc/64?u=jane",
            accountType: "member",
          },
        },
      ],
      dueDate: null, // no timeframe at all — tests the "—" fallback
      starred: false,
      createdAt: "2026-01-05T09:00:00.000Z",
      updatedAt: "2026-01-09T09:00:00.000Z",
    },
    {
      id: 1005,
      orgId: 1,
      title: "Backlog: explore dark mode support",
      description: "Not urgent — just capturing the idea while it's fresh.",
      attachments: [],
      tag: {
        id: 201,
        tagName: "Backlog",
        color: "#94A39D",
        isDefault: true,
        orgId: 1,
        isDeleted: false,
      },
      client: null,
      assignees: [],
      dueDate: null,
      starred: false,
      createdAt: "2026-01-11T09:00:00.000Z",
      updatedAt: "2026-01-11T09:00:00.000Z",
    },
  ] satisfies TicketDetail[],
};

export async function getOrganizationBySlug(slug: string): Promise<any | null> {
  // TODO: GET /organizations/:slug
  return mockOrganizationDetails[slug] ?? null;
}

export async function getOrganizationById(id: number): Promise<any | null> {
  // TODO: GET /organizations/:slug
  return mockOrganizationDetails["acme-studio"] ?? null;
}

export async function getTicketById(
  id: number,
): Promise<{ ticket: TicketDetail; organization: any } | null> {
  // TODO: GET /tickets/:id (with its organization joined/included)
  for (const organization of Object.values(mockOrganizationDetails)) {
    const ticket = organization?.tickets?.find(
      (t: TicketDetail) => t.id === id,
    );
    if (ticket) return { ticket, organization };
  }
  return null;
}
