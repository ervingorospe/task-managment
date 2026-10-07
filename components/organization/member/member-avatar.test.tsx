import { render, screen } from "@testing-library/react";
import MemberAvatar from "./member-avatar";
import type { MemberDetail } from "@/lib/types/organization/member-detail.type";

function member(overrides: Partial<MemberDetail> = {}): MemberDetail {
  const base = {
    id: 1,
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@acmestudio.com",
    orgId: 6001,
    roleId: 1,
    isActive: true,
    ...overrides,
  };
  return {
    ...base,
    user: {
      id: base.id,
      firstName: base.firstName,
      lastName: base.lastName,
      email: base.email,
    } as MemberDetail["user"],
  };
}

it("renders initials from the live user for an active member", () => {
  render(<MemberAvatar member={member()} />);
  expect(screen.getByText("JD")).toBeInTheDocument();
});

it("falls back to a '?' placeholder when user is null (a removed member)", () => {
  const removed: MemberDetail = { ...member({ firstName: "Priya", lastName: "Kapoor" }), user: null };
  render(<MemberAvatar member={removed} />);
  expect(screen.getByText("?")).toBeInTheDocument();
  expect(screen.getByLabelText("Removed member")).toBeInTheDocument();
});

it("defaults to size md when no size is given", () => {
  const removed: MemberDetail = { ...member(), user: null };
  render(<MemberAvatar member={removed} />);
  expect(screen.getByLabelText("Removed member")).toHaveClass("h-8", "w-8");
});

it("applies a custom size and className", () => {
  const removed: MemberDetail = { ...member(), user: null };
  render(<MemberAvatar member={removed} size="lg" className="ring-2" />);
  const el = screen.getByLabelText("Removed member");
  expect(el).toHaveClass("h-11", "w-11", "ring-2");
});
