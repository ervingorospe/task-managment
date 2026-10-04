import {
  adaptUser,
  adaptRole,
  adaptTag,
  adaptProject,
  adaptMember,
  adaptSettings,
  adaptAttachment,
  adaptInvite,
  adaptComment,
  adaptTicket,
  adaptCurrentUser,
  adaptTicketRequest,
} from "./adapters";
import type {
  RawUser,
  RawRole,
  RawTag,
  RawProject,
  RawMember,
  RawOrganizationSettings,
  RawMemberInvite,
  RawTicketComment,
  RawTicket,
  RawCurrentUser,
  RawTicketRequest,
} from "./raw-types";

const RAW_USER: RawUser = {
  id: 1,
  firstName: "Jane",
  lastName: "Doe",
  email: "jane@acmestudio.com",
  avatar: null,
  isActive: true,
  isDeleted: false,
  isVerified: true,
  hasOnboarded: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("adaptUser", () => {
  it("maps a raw user straight across", () => {
    expect(adaptUser(RAW_USER)).toEqual({
      id: 1,
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@acmestudio.com",
      avatar: null,
      isActive: true,
      isVerified: true,
      hasOnboarded: true,
    });
  });

  it("normalizes a missing avatar to null", () => {
    const user = adaptUser({ ...RAW_USER, avatar: undefined as never });
    expect(user.avatar).toBeNull();
  });
});

describe("adaptTag", () => {
  const RAW_TAG: RawTag = {
    id: 5,
    orgId: 6001,
    tagName: "In Progress",
    color: "#00FA9A",
    isDefault: false,
    isDeleted: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };

  it("maps orgId to undefined when null (personal/global tags)", () => {
    expect(adaptTag({ ...RAW_TAG, orgId: null }).orgId).toBeUndefined();
  });

  it("keeps a real orgId as-is", () => {
    expect(adaptTag(RAW_TAG).orgId).toBe(6001);
  });

  it("defaults isDeleted to false when omitted", () => {
    const tag = adaptTag({ ...RAW_TAG, isDeleted: undefined as never });
    expect(tag.isDeleted).toBe(false);
  });
});

describe("adaptAttachment", () => {
  it("leaves an already-absolute URL (e.g. S3) untouched", () => {
    const attachment = adaptAttachment({
      id: 1,
      name: "receipt.pdf",
      url: "https://bucket.s3.amazonaws.com/receipt.pdf",
      size: 1024,
    });
    expect(attachment.url).toBe("https://bucket.s3.amazonaws.com/receipt.pdf");
  });

  it("resolves a backend-relative path against the backend origin", () => {
    const attachment = adaptAttachment({
      id: 2,
      name: "screenshot.png",
      url: "/uploads/screenshot.png",
      size: 2048,
    });
    expect(attachment.url).toBe("http://localhost:3001/uploads/screenshot.png");
  });
});

describe("adaptInvite", () => {
  const RAW_INVITE: RawMemberInvite = {
    id: 10,
    orgId: 6001,
    roleId: 2,
    email: "alex@clientco.com",
    token: "abc123",
    expiry: "2026-02-01T00:00:00.000Z",
    resentCount: 0,
    lastSentAt: null,
    type: "MEMBERSHIP",
    status: "PENDING",
    isDeleted: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };

  it("lowercases MEMBERSHIP to membership", () => {
    expect(adaptInvite(RAW_INVITE).type).toBe("membership");
  });

  it("maps OWNERSHIP to ownership", () => {
    expect(adaptInvite({ ...RAW_INVITE, type: "OWNERSHIP" }).type).toBe(
      "ownership",
    );
  });

  it("lowercases the status", () => {
    expect(adaptInvite({ ...RAW_INVITE, status: "ACCEPTED" }).status).toBe(
      "accepted",
    );
  });

  it("defaults a null token/expiry to undefined", () => {
    const invite = adaptInvite({ ...RAW_INVITE, token: null, expiry: null });
    expect(invite.token).toBeUndefined();
    expect(invite.expiry).toBeUndefined();
  });
});

describe("adaptRole", () => {
  const RAW_ROLE: RawRole = {
    id: 1,
    roleName: "Admin",
    roleDesc: "Full access",
    isDefault: true,
    orgId: 6001,
    isLocked: false,
    isDeleted: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    rules: [{ id: 1, action: "ticket.view", name: "View tickets", desc: "", categoryId: 1 }],
  };

  it("maps every field including rules", () => {
    const role = adaptRole(RAW_ROLE);
    expect(role.roleDesc).toBe("Full access");
    expect(role.orgId).toBe(6001);
    expect(role.rules).toHaveLength(1);
  });

  it("defaults roleDesc to undefined and orgId to null when absent", () => {
    const role = adaptRole({ ...RAW_ROLE, roleDesc: null, orgId: null });
    expect(role.roleDesc).toBeUndefined();
    expect(role.orgId).toBeNull();
  });

  it("defaults isDeleted to false and rules to [] when omitted", () => {
    const role = adaptRole({
      ...RAW_ROLE,
      isDeleted: undefined as never,
      rules: undefined as never,
    });
    expect(role.isDeleted).toBe(false);
    expect(role.rules).toEqual([]);
  });
});

describe("adaptProject", () => {
  const RAW_MEMBER_FOR_PROJECT: RawMember = {
    id: 1,
    userId: 1,
    firstName: "Alex",
    lastName: "Reyes",
    email: "alex@clientco.com",
    orgId: 6001,
    roleId: 3,
    isActive: true,
    isDeleted: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };

  const RAW_PROJECT: RawProject = {
    id: 1,
    orgId: 6001,
    name: "Website Revamp",
    description: "Redo the marketing site",
    clientId: 1,
    client: RAW_MEMBER_FOR_PROJECT,
    assignees: [RAW_MEMBER_FOR_PROJECT],
    isDeleted: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };

  it("adapts a project with a client and assignees", () => {
    const project = adaptProject(RAW_PROJECT);
    expect(project.client?.id).toBe(1);
    expect(project.assignees).toHaveLength(1);
    expect(project.description).toBe("Redo the marketing site");
  });

  it("maps a null client to null and undefined description", () => {
    const project = adaptProject({
      ...RAW_PROJECT,
      client: null,
      description: null,
    });
    expect(project.client).toBeNull();
    expect(project.description).toBeUndefined();
  });

  it("defaults assignees to [] when omitted", () => {
    const project = adaptProject({
      ...RAW_PROJECT,
      assignees: undefined as never,
    });
    expect(project.assignees).toEqual([]);
  });
});

describe("adaptMember", () => {
  const RAW_MEMBER: RawMember = {
    id: 1,
    userId: 1,
    firstName: "Alex",
    lastName: "Reyes",
    email: "alex@clientco.com",
    orgId: 6001,
    roleId: 3,
    isActive: true,
    isDeleted: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    user: RAW_USER,
    role: {
      id: 3,
      roleName: "Client",
      roleDesc: null,
      isDefault: false,
      orgId: 6001,
      isLocked: false,
      isDeleted: false,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      rules: [],
    },
  };

  it("adapts a member with a linked user and role", () => {
    const member = adaptMember(RAW_MEMBER);
    expect(member.user?.id).toBe(1);
    expect(member.role?.id).toBe(3);
  });

  it("maps a null user to null and an absent role to undefined", () => {
    const member = adaptMember({ ...RAW_MEMBER, user: null, role: undefined });
    expect(member.user).toBeNull();
    expect(member.role).toBeUndefined();
  });
});

describe("adaptSettings", () => {
  const RAW_SETTINGS: RawOrganizationSettings = {
    id: 1,
    orgId: 6001,
    slug: "acme-studio",
    logo: "https://cdn/logo.png",
    timezone: "Asia/Manila",
    inviteExpiration: "7d",
    sendEmailNotif: true,
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };

  it("maps every field and forces isDeleted to false", () => {
    const settings = adaptSettings(RAW_SETTINGS);
    expect(settings.logo).toBe("https://cdn/logo.png");
    expect(settings.isDeleted).toBe(false);
  });

  it("defaults a null logo to undefined", () => {
    expect(adaptSettings({ ...RAW_SETTINGS, logo: null }).logo).toBeUndefined();
  });
});

describe("adaptComment", () => {
  const RAW_COMMENT: RawTicketComment = {
    id: 1,
    ticketId: 1,
    userId: 1,
    comment: "Looks good",
    author: RAW_USER,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };

  it("maps the comment and its author", () => {
    const comment = adaptComment(RAW_COMMENT);
    expect(comment.comment).toBe("Looks good");
    expect(comment.author.firstName).toBe("Jane");
  });
});

describe("adaptTicket", () => {
  const RAW_TAG_FOR_TICKET: RawTag = {
    id: 1,
    orgId: 6001,
    tagName: "To Do",
    color: "#000",
    isDefault: true,
    isDeleted: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };

  const RAW_TICKET: RawTicket = {
    id: 1,
    referenceId: "TCK-1",
    orgId: 6001,
    ownerId: null,
    projectId: 5,
    project: {
      id: 5,
      orgId: 6001,
      name: "Website Revamp",
      description: null,
      clientId: null,
      client: null,
      assignees: [],
      isDeleted: false,
    },
    title: "Fix the login page",
    description: "It redirects to a blank page",
    attachments: [{ id: 1, name: "screenshot.png", url: "/uploads/screenshot.png", size: 100 }],
    tag: RAW_TAG_FOR_TICKET,
    client: null,
    assignees: [],
    dueDate: "2026-02-01T00:00:00.000Z",
    starred: true,
    comments: [
      {
        id: 1,
        ticketId: 1,
        userId: 1,
        comment: "Looks good",
        author: { id: 1, firstName: "Jane", lastName: "Doe", avatar: null },
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  } as unknown as RawTicket;

  it("adapts a fully-populated ticket, including its project and comments", () => {
    const ticket = adaptTicket(RAW_TICKET);
    expect(ticket.project?.id).toBe(5);
    expect(ticket.attachments).toHaveLength(1);
    expect(ticket.comments).toHaveLength(1);
  });

  it("maps a null project/client to null and undefined comments to undefined", () => {
    const ticket = adaptTicket({
      ...RAW_TICKET,
      projectId: null,
      project: null,
      client: null,
      comments: undefined,
    } as unknown as RawTicket);
    expect(ticket.project).toBeNull();
    expect(ticket.client).toBeNull();
    expect(ticket.comments).toBeUndefined();
  });

  it("defaults attachments to [] when omitted", () => {
    const ticket = adaptTicket({
      ...RAW_TICKET,
      attachments: undefined,
    } as unknown as RawTicket);
    expect(ticket.attachments).toEqual([]);
  });

  it("adapts a ticket's client when present and defaults assignees when omitted", () => {
    const rawClient: RawMember = {
      id: 9,
      userId: 9,
      firstName: "Alex",
      lastName: "Reyes",
      email: "alex@clientco.com",
      orgId: 6001,
      roleId: 3,
      isActive: true,
      isDeleted: false,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    const ticket = adaptTicket({
      ...RAW_TICKET,
      client: rawClient,
      assignees: undefined,
    } as unknown as RawTicket);
    expect(ticket.client?.id).toBe(9);
    expect(ticket.assignees).toEqual([]);
  });

  it("defaults description to undefined and dueDate/ownerId to null when absent", () => {
    const ticket = adaptTicket({
      ...RAW_TICKET,
      description: null,
      dueDate: null,
      ownerId: null,
    } as unknown as RawTicket);
    expect(ticket.description).toBeUndefined();
    expect(ticket.dueDate).toBeNull();
    expect(ticket.ownerId).toBeNull();
  });
});

describe("adaptCurrentUser", () => {
  const RAW_CURRENT_USER: RawCurrentUser = {
    ...RAW_USER,
    hasPassword: true,
    createdViaInvite: false,
    memberships: [
      {
        id: 1,
        isActive: true,
        role: {
          id: 1,
          roleName: "Owner",
          roleDesc: null,
          isDefault: true,
          orgId: 6001,
          isLocked: false,
          isDeleted: false,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
          rules: [],
        },
        organization: {
          id: 6001,
          organizationName: "Acme Studio",
          organizationDesc: "A design studio",
          email: "hello@acmestudio.com",
          website: "https://acmestudio.com",
          ownerId: 1,
          settings: {
            id: 1,
            orgId: 6001,
            slug: "acme-studio",
            logo: null,
            timezone: "Asia/Manila",
            inviteExpiration: "7d",
            sendEmailNotif: true,
            isActive: true,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        },
      },
    ],
  } as unknown as RawCurrentUser;

  it("adapts the user plus every membership's org and role", () => {
    const user = adaptCurrentUser(RAW_CURRENT_USER);
    expect(user.hasPassword).toBe(true);
    expect(user.memberships).toHaveLength(1);
    expect(user.memberships[0].organization.organizationName).toBe("Acme Studio");
    expect(user.memberships[0].role.roleName).toBe("Owner");
  });

  it("maps a membership's optional org fields to undefined when absent", () => {
    const raw = {
      ...RAW_CURRENT_USER,
      memberships: [
        {
          ...RAW_CURRENT_USER.memberships[0],
          organization: {
            ...RAW_CURRENT_USER.memberships[0].organization,
            organizationDesc: null,
            email: null,
            website: null,
          },
        },
      ],
    } as unknown as RawCurrentUser;
    const user = adaptCurrentUser(raw);
    expect(user.memberships[0].organization.organizationDesc).toBeUndefined();
    expect(user.memberships[0].organization.email).toBeUndefined();
    expect(user.memberships[0].organization.website).toBeUndefined();
  });

  it("defaults memberships to [] when omitted", () => {
    const user = adaptCurrentUser({
      ...RAW_CURRENT_USER,
      memberships: undefined as never,
    });
    expect(user.memberships).toEqual([]);
  });
});

describe("adaptTicketRequest", () => {
  const RAW_CLIENT: RawMember = {
    id: 1,
    userId: 1,
    firstName: "Alex",
    lastName: "Reyes",
    email: "alex@clientco.com",
    orgId: 6001,
    roleId: 3,
    isActive: true,
    isDeleted: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };

  const RAW_REQUEST: RawTicketRequest = {
    id: 1,
    referenceId: "REQ-1",
    orgId: 6001,
    title: "Fix the login page",
    description: "It redirects to a blank page",
    attachments: [{ id: 1, name: "screenshot.png", url: "/uploads/screenshot.png", size: 100 }],
    client: RAW_CLIENT,
    ticketId: null,
    remarks: "Not enough detail",
    status: "REJECTED",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  } as unknown as RawTicketRequest;

  it("lowercases the status and maps every field", () => {
    const request = adaptTicketRequest(RAW_REQUEST);
    expect(request.status).toBe("rejected");
    expect(request.remarks).toBe("Not enough detail");
    expect(request.attachments).toHaveLength(1);
  });

  it("defaults description/remarks/attachments when absent", () => {
    const request = adaptTicketRequest({
      ...RAW_REQUEST,
      description: null,
      remarks: null,
      attachments: undefined,
    } as unknown as RawTicketRequest);
    expect(request.description).toBeUndefined();
    expect(request.remarks).toBeUndefined();
    expect(request.attachments).toEqual([]);
  });
});
