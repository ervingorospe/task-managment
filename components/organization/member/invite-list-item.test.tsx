import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InviteListItem from "./invite-list-item";
import { useAuth } from "@/providers/auth-provider";
import { PERMISSIONS } from "@/lib/data/permissions";
import type { MemberInviteDetail } from "@/lib/types/organization/member-invite-detail.type";
import type { RoleDetail } from "@/lib/types/organization/role-detail.type";

jest.mock("@/providers/auth-provider", () => {
  const actual = jest.requireActual("@/providers/auth-provider");
  return { ...actual, useAuth: jest.fn() };
});

const mockedUseAuth = useAuth as jest.Mock;

const INVITE: MemberInviteDetail = { id: 1, email: "new@acmestudio.com", roleId: 1 };
const MANAGER: RoleDetail = {
  id: 1,
  roleName: "Manager",
  roleDesc: "Can manage tickets",
  isDefault: false,
  orgId: 6001,
  isLocked: false,
  isDeleted: false,
  rules: [],
};

function withPermissions(actions: string[]) {
  mockedUseAuth.mockReturnValue({
    activeMembership: {
      role: {
        rules: actions.map((action, i) => ({ id: i, action, name: action, desc: "", categoryId: 1 })),
      },
    },
    isPersonalMode: false,
  });
}

beforeEach(() => {
  withPermissions([PERMISSIONS.MEMBER_INVITE, PERMISSIONS.MEMBER_REMOVE]);
});

function renderItem(overrides: Partial<React.ComponentProps<typeof InviteListItem>> = {}) {
  const onRemove = jest.fn();
  const onChangeRole = jest.fn();
  render(
    <InviteListItem invite={INVITE} role={MANAGER} onRemove={onRemove} onChangeRole={onChangeRole} {...overrides} />,
  );
  return { onRemove, onChangeRole };
}

it("shows the invite email and role description", () => {
  renderItem();
  expect(screen.getByText("new@acmestudio.com")).toBeInTheDocument();
  expect(screen.getByText("Can manage tickets")).toBeInTheDocument();
  expect(screen.getByText("Manager")).toBeInTheDocument();
});

it("shows a fallback when there's no role", () => {
  renderItem({ role: undefined });
  expect(screen.getByText("No role set")).toBeInTheDocument();
  expect(screen.getByText("No role")).toBeInTheDocument();
});

it("calls onChangeRole when the role button is clicked", async () => {
  const { onChangeRole } = renderItem();
  await userEvent.click(screen.getByRole("button", { name: /Manager/ }));
  expect(onChangeRole).toHaveBeenCalledWith(1);
});

it("calls onRemove when Remove is clicked", async () => {
  const { onRemove } = renderItem();
  await userEvent.click(screen.getByRole("button", { name: "Remove new@acmestudio.com" }));
  expect(onRemove).toHaveBeenCalledWith(1);
});

it("hides the role button without member.invite or member.update_role", () => {
  withPermissions([PERMISSIONS.MEMBER_REMOVE]);
  renderItem();
  expect(screen.queryByRole("button", { name: /Manager/ })).toBeNull();
});

it("shows the role button with only member.update_role", () => {
  withPermissions([PERMISSIONS.MEMBER_UPDATE_ROLE]);
  renderItem();
  expect(screen.getByRole("button", { name: /Manager/ })).toBeInTheDocument();
});

it("hides Remove without member.remove", () => {
  withPermissions([PERMISSIONS.MEMBER_INVITE]);
  renderItem();
  expect(screen.queryByRole("button", { name: /Remove/ })).toBeNull();
});
