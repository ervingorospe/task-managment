import { getMemberName, getMemberEmail } from "./member-name";
import type { MemberDetail } from "../types/organization/member-detail.type";

const BASE_MEMBER: MemberDetail = {
  id: 1,
  firstName: "Snapshot",
  lastName: "Name",
  email: "snapshot@acmestudio.com",
  orgId: 6001,
  roleId: 1,
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  user: null,
};

describe("getMemberName", () => {
  it("prefers the linked user's current name over the snapshot", () => {
    const member: MemberDetail = {
      ...BASE_MEMBER,
      user: {
        id: 1,
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@acmestudio.com",
        avatar: null,
        isActive: true,
        isVerified: true,
        hasOnboarded: true,
      },
    };
    expect(getMemberName(member)).toBe("Jane Doe");
  });

  it("falls back to the member's own snapshot when there's no linked user", () => {
    expect(getMemberName(BASE_MEMBER)).toBe("Snapshot Name");
  });
});

describe("getMemberEmail", () => {
  it("prefers the linked user's current email", () => {
    const member: MemberDetail = {
      ...BASE_MEMBER,
      user: {
        id: 1,
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@acmestudio.com",
        avatar: null,
        isActive: true,
        isVerified: true,
        hasOnboarded: true,
      },
    };
    expect(getMemberEmail(member)).toBe("jane@acmestudio.com");
  });

  it("falls back to the member's own snapshot email", () => {
    expect(getMemberEmail(BASE_MEMBER)).toBe("snapshot@acmestudio.com");
  });
});
