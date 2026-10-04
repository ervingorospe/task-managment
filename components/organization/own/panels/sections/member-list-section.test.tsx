import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MemberListSection from "./member-list-section";
import { useAuth, usePermission } from "@/providers/auth-provider";
import { PERMISSIONS } from "@/lib/data/permissions";
import type { MemberDetail } from "@/lib/types/organization/member-detail.type";
import type { RoleDetail } from "@/lib/types/organization/role-detail.type";

jest.mock("@/providers/auth-provider", () => {
  const actual = jest.requireActual("@/providers/auth-provider");
  return { ...actual, useAuth: jest.fn(), usePermission: jest.fn() };
});

const mockedUseAuth = useAuth as jest.Mock;
const mockedUsePermission = usePermission as jest.Mock;

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
    user: { id: base.id, firstName: base.firstName, lastName: base.lastName, email: base.email } as MemberDetail["user"],
  };
}

const MANAGER: RoleDetail = {
  id: 1,
  roleName: "Manager",
  roleDesc: "",
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
  mockedUsePermission.mockImplementation((action: string) => actions.includes(action));
}

beforeEach(() => {
  withPermissions([
    PERMISSIONS.MEMBER_VIEW_MEMBERS,
    PERMISSIONS.MEMBER_UPDATE_ROLE,
    PERMISSIONS.MEMBER_SET_ACTIVE,
    PERMISSIONS.MEMBER_REMOVE,
  ]);
});

function renderList(overrides: Partial<React.ComponentProps<typeof MemberListSection>> = {}) {
  const onToggleActive = jest.fn();
  const onRemove = jest.fn();
  const onChangeRole = jest.fn();
  render(
    <MemberListSection
      members={[member()]}
      roles={[MANAGER]}
      onToggleActive={onToggleActive}
      onRemove={onRemove}
      onChangeRole={onChangeRole}
      {...overrides}
    />,
  );
  return { onToggleActive, onRemove, onChangeRole };
}

it("shows the default empty state with no members", () => {
  renderList({ members: [] });
  expect(screen.getByText("No members yet")).toBeInTheDocument();
  expect(
    screen.getByText("Members who accept an invitation will appear here."),
  ).toBeInTheDocument();
});

it("shows a custom empty title, subtitle, and action", () => {
  renderList({
    members: [],
    emptyTitle: "No matches",
    emptySubtitle: "Try a different filter.",
    emptyAction: <button>Clear filters</button>,
  });
  expect(screen.getByText("No matches")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Clear filters" })).toBeInTheDocument();
});

it("renders nothing without member.view_members", () => {
  withPermissions([]);
  renderList();
  expect(screen.queryByText("Jane Doe")).toBeNull();
});

it("shows the member's name, email, and resolved role", () => {
  renderList();
  expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  expect(screen.getByText("jane@acmestudio.com")).toBeInTheDocument();
  expect(screen.getByText("Manager")).toBeInTheDocument();
});

it("shows a Deactivated badge for an inactive member", () => {
  renderList({ members: [member({ isActive: false })] });
  expect(screen.getByText("Deactivated")).toBeInTheDocument();
});

it("falls back to 'No role' when the role can't be resolved", () => {
  renderList({ roles: [] });
  expect(screen.getByText("No role")).toBeInTheDocument();
});

describe("role", () => {
  it("calls onChangeRole via the role button with member.update_role", async () => {
    const { onChangeRole } = renderList();
    await userEvent.click(screen.getByRole("button", { name: /Manager/ }));
    expect(onChangeRole).toHaveBeenCalledWith(member());
  });

  it("shows a read-only role badge without member.update_role", () => {
    withPermissions([PERMISSIONS.MEMBER_VIEW_MEMBERS]);
    renderList();
    expect(screen.queryByRole("button", { name: /Manager/ })).toBeNull();
    expect(screen.getByText("Manager")).toBeInTheDocument();
  });

  it("falls back to 'No role' in the read-only badge when the role can't be resolved", () => {
    withPermissions([PERMISSIONS.MEMBER_VIEW_MEMBERS]);
    renderList({ roles: [] });
    expect(screen.getByText("No role")).toBeInTheDocument();
  });
});

describe("activate/deactivate", () => {
  it("calls onToggleActive and shows 'Deactivate' label for an active member", async () => {
    const { onToggleActive } = renderList();
    await userEvent.click(screen.getByRole("button", { name: "Deactivate Jane Doe" }));
    expect(onToggleActive).toHaveBeenCalledWith(member());
  });

  it("shows 'Activate' label for an inactive member", () => {
    renderList({ members: [member({ isActive: false })] });
    expect(screen.getByRole("button", { name: "Activate Jane Doe" })).toBeInTheDocument();
  });

  it("hides the toggle without member.set_active", () => {
    withPermissions([PERMISSIONS.MEMBER_VIEW_MEMBERS]);
    renderList();
    expect(screen.queryByRole("button", { name: /Deactivate|Activate/ })).toBeNull();
  });
});

describe("remove", () => {
  it("calls onRemove", async () => {
    const { onRemove } = renderList();
    await userEvent.click(screen.getByRole("button", { name: "Remove Jane Doe" }));
    expect(onRemove).toHaveBeenCalledWith(member());
  });

  it("hides Remove without member.remove", () => {
    withPermissions([PERMISSIONS.MEMBER_VIEW_MEMBERS]);
    renderList();
    expect(screen.queryByRole("button", { name: /Remove/ })).toBeNull();
  });
});
