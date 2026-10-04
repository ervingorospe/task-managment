import { getMentionableMembers } from "./mentionable-members";
import type { OrganizationDetail } from "@/lib/types/organization/organization-detail.type";
import type { MemberDetail } from "@/lib/types/organization/member-detail.type";
import type { RoleDetail } from "@/lib/types/organization/role-detail.type";

function user(id: number, firstName: string) {
  return {
    id,
    firstName,
    lastName: "Test",
    email: `${firstName.toLowerCase()}@test.com`,
    avatar: null,
    isActive: true,
    isVerified: true,
    hasOnboarded: true,
  };
}

function member(id: number, roleId: number, userId: number | null, firstName: string): MemberDetail {
  return {
    id,
    firstName,
    lastName: "Test",
    email: `${firstName.toLowerCase()}@test.com`,
    orgId: 6001,
    roleId,
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    user: userId == null ? null : user(userId, firstName),
  };
}

function role(id: number, actions: string[]): RoleDetail {
  return {
    id,
    roleName: `Role ${id}`,
    isDefault: false,
    orgId: 6001,
    isLocked: false,
    isDeleted: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    rules: actions.map((action, i) => ({
      id: i + 1,
      action,
      name: action,
      desc: "",
      categoryId: 1,
    })),
  };
}

// Owner (userId 1), a "view all" member (userId 2, roleId 10), a
// "view included" member who IS included (userId 3, roleId 11), a
// "view included" member who is NOT included (userId 4, roleId 11),
// and a member with no view permission at all (userId 5, roleId 12).
const OWNER_MEMBER = member(100, 20, 1, "Owner");
const VIEW_ALL_MEMBER = member(101, 10, 2, "Viewall");
const INCLUDED_MEMBER = member(102, 11, 3, "Included");
const NOT_INCLUDED_MEMBER = member(103, 11, 4, "Notincluded");
const NO_ACCESS_MEMBER = member(104, 12, 5, "Noaccess");

const ORGANIZATION = {
  owner: user(1, "Owner"),
  members: [
    OWNER_MEMBER,
    VIEW_ALL_MEMBER,
    INCLUDED_MEMBER,
    NOT_INCLUDED_MEMBER,
    NO_ACCESS_MEMBER,
  ],
  roles: [
    role(20, []),
    role(10, ["ticket.view.all"]),
    role(11, ["ticket.view.included"]),
    role(12, []),
  ],
} as unknown as OrganizationDetail;

it("always includes the org owner and the ticket's client", () => {
  const clientMember = member(105, 12, 6, "Client");
  const result = getMentionableMembers(ORGANIZATION, {
    client: clientMember,
    assignees: [],
  });
  expect(result.map((m) => m.id)).toEqual(
    expect.arrayContaining([OWNER_MEMBER.id, clientMember.id]),
  );
});

it("includes a member with ticket.view.all regardless of involvement", () => {
  const result = getMentionableMembers(ORGANIZATION, { client: null, assignees: [] });
  expect(result.map((m) => m.id)).toContain(VIEW_ALL_MEMBER.id);
});

it("includes a ticket.view.included member only when they're actually included", () => {
  const result = getMentionableMembers(ORGANIZATION, {
    client: null,
    assignees: [INCLUDED_MEMBER],
  });
  expect(result.map((m) => m.id)).toContain(INCLUDED_MEMBER.id);
  expect(result.map((m) => m.id)).not.toContain(NOT_INCLUDED_MEMBER.id);
});

it("excludes a member with no relevant view permission", () => {
  const result = getMentionableMembers(ORGANIZATION, { client: null, assignees: [] });
  expect(result.map((m) => m.id)).not.toContain(NO_ACCESS_MEMBER.id);
});

it("never lists the same member twice", () => {
  // The owner is also passed as the client here — should only appear once.
  const result = getMentionableMembers(ORGANIZATION, {
    client: OWNER_MEMBER,
    assignees: [],
  });
  const ownerOccurrences = result.filter((m) => m.id === OWNER_MEMBER.id);
  expect(ownerOccurrences).toHaveLength(1);
});

it("skips a member whose role no longer exists", () => {
  const orphanMember = member(106, 999, 7, "Orphan");
  const org = {
    ...ORGANIZATION,
    members: [...ORGANIZATION.members, orphanMember],
  } as unknown as OrganizationDetail;
  const result = getMentionableMembers(org, { client: null, assignees: [] });
  expect(result.map((m) => m.id)).not.toContain(orphanMember.id);
});

it("does not add the owner twice when no member row matches the owner's user id", () => {
  const orgWithoutOwnerMember = {
    ...ORGANIZATION,
    owner: user(999, "Ghost"),
  } as unknown as OrganizationDetail;
  const result = getMentionableMembers(orgWithoutOwnerMember, {
    client: null,
    assignees: [],
  });
  expect(result.map((m) => m.id)).not.toContain(999);
});
