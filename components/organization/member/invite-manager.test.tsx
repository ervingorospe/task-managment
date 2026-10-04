import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InviteManager from "./invite-manager";
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
const CLIENT: RoleDetail = {
  id: 2,
  roleName: "Client",
  roleDesc: "Can view own tickets",
  isDefault: true,
  orgId: 6001,
  isLocked: true,
  isDeleted: false,
  rules: [],
};

function invite(overrides: Partial<MemberInviteDetail> = {}): MemberInviteDetail {
  return { id: 1, email: "jane@acmestudio.com", roleId: 1, ...overrides };
}

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
  withPermissions([
    PERMISSIONS.MEMBER_VIEW_MEMBERS,
    PERMISSIONS.MEMBER_INVITE,
    PERMISSIONS.MEMBER_REMOVE,
  ]);
});

function renderManager(overrides: Partial<React.ComponentProps<typeof InviteManager>> = {}) {
  const onAdd = jest.fn();
  const onRemove = jest.fn();
  const onChangeRole = jest.fn();
  render(
    <InviteManager
      title="Invites"
      subtitle="Invite new members."
      invites={[invite()]}
      roles={[MANAGER, CLIENT]}
      capacity={10}
      totalInvites={1}
      onAdd={onAdd}
      onRemove={onRemove}
      onChangeRole={onChangeRole}
      {...overrides}
    />,
  );
  return { onAdd, onRemove, onChangeRole };
}

it("renders nothing without member.view_members", () => {
  withPermissions([]);
  renderManager();
  expect(screen.queryByText("Invites")).toBeNull();
});

it("defaults totalInvites to 0 when omitted", () => {
  // totalInvites isn't marked optional in the prop type, but a caller
  // bypassing TS (plain JS, or a loosely-typed integration) could still
  // omit it — exercises the component's own runtime default.
  const InviteManagerAny = InviteManager as unknown as React.ComponentType<
    Omit<React.ComponentProps<typeof InviteManager>, "totalInvites">
  >;
  render(
    <InviteManagerAny
      title="Invites"
      subtitle="Invite new members."
      invites={[]}
      roles={[MANAGER]}
      capacity={10}
      onAdd={jest.fn()}
      onRemove={jest.fn()}
      onChangeRole={jest.fn()}
    />,
  );
  expect(screen.getByText("0 / 10 invite used")).toBeInTheDocument();
});

it("shows title, subtitle, capacity usage, and banner", () => {
  renderManager({ banner: <p>Saved!</p> });
  expect(screen.getByText("Invites")).toBeInTheDocument();
  expect(screen.getByText("Invite new members.")).toBeInTheDocument();
  expect(screen.getByText("1 / 10 invite used")).toBeInTheDocument();
  expect(screen.getByText("Saved!")).toBeInTheDocument();
});

it("adds emails via the chip input", async () => {
  const { onAdd } = renderManager({ invites: [], totalInvites: 0 });
  const input = screen.getByPlaceholderText("Type an email and press space");
  await userEvent.type(input, "new@acmestudio.com ");
  await userEvent.click(screen.getByRole("button", { name: "Add" }));
  expect(onAdd).toHaveBeenCalledWith(["new@acmestudio.com"]);
});

it("marks the chip input at capacity once totalInvites reaches capacity", async () => {
  const { onAdd } = renderManager({ capacity: 1, totalInvites: 1 });
  const input = screen.getByPlaceholderText("Type an email and press space");
  await userEvent.type(input, "new@acmestudio.com ");
  await userEvent.click(screen.getByRole("button", { name: "Add" }));
  expect(screen.getByText("Reached invite capacity")).toBeInTheDocument();
  expect(onAdd).not.toHaveBeenCalled();
});

it("shows no invite list when there are no invites", () => {
  renderManager({ invites: [], totalInvites: 0 });
  expect(screen.queryByText("jane@acmestudio.com")).toBeNull();
});

it("lists invites and removes one", async () => {
  const { onRemove } = renderManager();
  expect(screen.getByText("jane@acmestudio.com")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Remove jane@acmestudio.com" }));
  expect(onRemove).toHaveBeenCalledWith(1);
});

describe("changing an invite's role", () => {
  it("opens the role modal preselecting the invite's current role", async () => {
    renderManager();
    await userEvent.click(screen.getByRole("button", { name: /Manager/ }));
    expect(screen.getByText("Set role")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Manager/ })).toBeChecked();
  });

  it("confirms a new role and closes the modal", async () => {
    const { onChangeRole } = renderManager();
    await userEvent.click(screen.getByRole("button", { name: /Manager/ }));
    await userEvent.click(screen.getByRole("radio", { name: /Client/ }));
    await userEvent.click(screen.getByRole("button", { name: "Confirm" }));

    expect(onChangeRole).toHaveBeenCalledWith(1, 2);
    expect(screen.queryByText("Set role")).toBeNull();
  });

  it("closes without confirming on Cancel", async () => {
    const { onChangeRole } = renderManager();
    await userEvent.click(screen.getByRole("button", { name: /Manager/ }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onChangeRole).not.toHaveBeenCalled();
    expect(screen.queryByText("Set role")).toBeNull();
  });
});
