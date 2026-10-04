import { isTicketIncluded } from "./ticket-access";
import type { MemberDetail } from "../types/organization/member-detail.type";

function member(userId: number | null): MemberDetail {
  return {
    id: userId ?? 0,
    firstName: "X",
    lastName: "Y",
    email: "x@y.com",
    orgId: 6001,
    roleId: 1,
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    user:
      userId == null
        ? null
        : {
            id: userId,
            firstName: "X",
            lastName: "Y",
            email: "x@y.com",
            avatar: null,
            isActive: true,
            isVerified: true,
            hasOnboarded: true,
          },
  };
}

it("is false when userId is undefined or null", () => {
  expect(isTicketIncluded({ client: null, assignees: [] }, undefined)).toBe(false);
  expect(isTicketIncluded({ client: null, assignees: [] }, null)).toBe(false);
});

it("is true when the user is the client", () => {
  expect(isTicketIncluded({ client: member(5), assignees: [] }, 5)).toBe(true);
});

it("is true when the user is one of the assignees", () => {
  expect(
    isTicketIncluded({ client: null, assignees: [member(3), member(5)] }, 5),
  ).toBe(true);
});

it("is false when the user is neither the client nor an assignee", () => {
  expect(
    isTicketIncluded({ client: member(3), assignees: [member(4)] }, 5),
  ).toBe(false);
});
