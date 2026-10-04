import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InviteList from "./invite-list";
import { useAuth } from "@/providers/auth-provider";
import { PERMISSIONS } from "@/lib/data/permissions";
import type { MemberInviteDetail } from "@/lib/types/organization/member-invite-detail.type";
import type { RoleDetail } from "@/lib/types/organization/role-detail.type";

jest.mock("@/providers/auth-provider", () => {
  const actual = jest.requireActual("@/providers/auth-provider");
  return { ...actual, useAuth: jest.fn() };
});

const mockedUseAuth = useAuth as jest.Mock;

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

beforeEach(() => {
  mockedUseAuth.mockReturnValue({
    activeMembership: {
      role: {
        rules: [PERMISSIONS.MEMBER_INVITE, PERMISSIONS.MEMBER_REMOVE].map((action, i) => ({
          id: i,
          action,
          name: action,
          desc: "",
          categoryId: 1,
        })),
      },
    },
    isPersonalMode: false,
  });
});

it("renders one item per invite, resolving its role", () => {
  render(
    <InviteList
      invites={[
        { id: 1, email: "jane@acmestudio.com", roleId: 1 },
        { id: 2, email: "marco@acmestudio.com", roleId: 2 },
      ]}
      roles={[MANAGER]}
      onRemove={jest.fn()}
      onChangeRole={jest.fn()}
    />,
  );
  expect(screen.getByText("jane@acmestudio.com")).toBeInTheDocument();
  expect(screen.getByText("marco@acmestudio.com")).toBeInTheDocument();
  expect(screen.getByText("No role set")).toBeInTheDocument();
});

it("renders nothing with no invites", () => {
  render(<InviteList invites={[]} roles={[]} onRemove={jest.fn()} onChangeRole={jest.fn()} />);
  expect(screen.queryByRole("listitem")).toBeNull();
});

it("wires onRemove/onChangeRole through to the right invite", async () => {
  const onRemove = jest.fn();
  const onChangeRole = jest.fn();
  render(
    <InviteList
      invites={[
        { id: 1, email: "jane@acmestudio.com", roleId: 1 },
        { id: 2, email: "marco@acmestudio.com", roleId: 1 },
      ]}
      roles={[MANAGER]}
      onRemove={onRemove}
      onChangeRole={onChangeRole}
    />,
  );
  await userEvent.click(screen.getByRole("button", { name: "Remove marco@acmestudio.com" }));
  expect(onRemove).toHaveBeenCalledWith(2);

  const roleButtons = screen.getAllByRole("button", { name: /Manager/ });
  await userEvent.click(roleButtons[0]);
  expect(onChangeRole).toHaveBeenCalledWith(1);
});
