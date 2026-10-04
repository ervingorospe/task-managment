import { buildCreateOrganizationPayload } from "./build-create-organization-payload";
import type { RoleDetail } from "@/lib/types/organization/role-detail.type";
import type { TagDetail } from "@/lib/types/organization/tag-detail.type";
import type { MemberInviteDetail } from "@/lib/types/organization/member-invite-detail.type";

const ROLE: RoleDetail = {
  id: 1,
  roleName: "Admin",
  roleDesc: "Full access",
  isDefault: true,
  orgId: null,
  isLocked: false,
  isDeleted: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  rules: [{ id: 1, action: "ticket.view.all", name: "View all", desc: "", categoryId: 1 }],
};

const TAG: TagDetail = {
  id: 1,
  tagName: "To Do",
  color: "#000",
  isDefault: true,
  isDeleted: false,
};

const INVITE: MemberInviteDetail = {
  id: 1,
  email: "alex@clientco.com",
  resentCount: 0,
  type: "membership",
  status: "pending",
  roleId: 1,
  orgId: 6001,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

it("shapes a fully-populated formData into the create payload", () => {
  const payload = buildCreateOrganizationPayload({
    organizationName: "Acme Studio",
    email: "hello@acmestudio.com",
    website: "https://acmestudio.com",
    organizationDesc: "A design studio",
    logo: "https://cdn/logo.png",
    timezone: "Asia/Manila",
    roles: [ROLE],
    invites: [INVITE],
    tags: [TAG],
  });

  expect(payload).toEqual({
    organizationName: "Acme Studio",
    email: "hello@acmestudio.com",
    website: "https://acmestudio.com",
    organizationDesc: "A design studio",
    logo: "https://cdn/logo.png",
    timezone: "Asia/Manila",
    roles: [
      {
        id: 1,
        isDefault: true,
        roleName: "Admin",
        roleDesc: "Full access",
        rules: [{ id: 1 }],
      },
    ],
    invites: [{ email: "alex@clientco.com", roleId: 1 }],
    tags: [{ id: 1, tagName: "To Do", color: "#000", isDefault: true }],
  });
});

it("defaults every collection and required string field when formData is empty", () => {
  const payload = buildCreateOrganizationPayload({});
  expect(payload.organizationName).toBe("");
  expect(payload.timezone).toBe("");
  expect(payload.roles).toEqual([]);
  expect(payload.invites).toEqual([]);
  expect(payload.tags).toEqual([]);
  expect(payload.email).toBeUndefined();
});
