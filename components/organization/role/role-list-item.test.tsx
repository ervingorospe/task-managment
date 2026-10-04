import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RoleListItem from "./role-list-item";
import { useAuth } from "@/providers/auth-provider";
import { PERMISSIONS } from "@/lib/data/permissions";
import type { RoleDetail } from "@/lib/types/organization/role-detail.type";

jest.mock("@/providers/auth-provider", () => {
  const actual = jest.requireActual("@/providers/auth-provider");
  return { ...actual, useAuth: jest.fn() };
});

const mockedUseAuth = useAuth as jest.Mock;

function role(overrides: Partial<RoleDetail> = {}): RoleDetail {
  return {
    id: 1,
    roleName: "Manager",
    roleDesc: "Can manage tickets",
    isDefault: false,
    orgId: 6001,
    isLocked: false,
    isDeleted: false,
    rules: [],
    ...overrides,
  };
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
  withPermissions([PERMISSIONS.ROLE_VIEW, PERMISSIONS.ROLE_UPDATE, PERMISSIONS.ROLE_REMOVE]);
});

function renderItem(overrides: Partial<React.ComponentProps<typeof RoleListItem>> = {}) {
  const onEdit = jest.fn();
  const onDelete = jest.fn();
  render(<RoleListItem role={role()} onEdit={onEdit} onDelete={onDelete} {...overrides} />);
  return { onEdit, onDelete };
}

it("shows the role name, description, and a Default badge", () => {
  renderItem({ role: role({ isDefault: true }) });
  expect(screen.getByText("Manager")).toBeInTheDocument();
  expect(screen.getByText("Can manage tickets")).toBeInTheDocument();
  expect(screen.getByText("Default")).toBeInTheDocument();
});

it("shows no Default badge for a non-default role", () => {
  renderItem();
  expect(screen.queryByText("Default")).toBeNull();
});

it("calls onEdit when Edit is clicked", async () => {
  const { onEdit } = renderItem();
  await userEvent.click(screen.getByRole("button", { name: "Edit Manager role" }));
  expect(onEdit).toHaveBeenCalledWith(role());
});

it("calls onDelete when Delete is clicked", async () => {
  const { onDelete } = renderItem();
  await userEvent.click(screen.getByRole("button", { name: "Delete Manager role" }));
  expect(onDelete).toHaveBeenCalledWith(role());
});

it("hides Edit without role.update", () => {
  withPermissions([PERMISSIONS.ROLE_VIEW, PERMISSIONS.ROLE_REMOVE]);
  renderItem();
  expect(screen.queryByRole("button", { name: /Edit/ })).toBeNull();
});

it("hides Delete without role.remove", () => {
  withPermissions([PERMISSIONS.ROLE_VIEW, PERMISSIONS.ROLE_UPDATE]);
  renderItem();
  expect(screen.queryByRole("button", { name: /Delete/ })).toBeNull();
});

it("hides both actions without role.view", () => {
  withPermissions([]);
  renderItem();
  expect(screen.queryByRole("button", { name: /Edit|Delete/ })).toBeNull();
});

it("hides both actions entirely for a locked role", () => {
  renderItem({ role: role({ isLocked: true }) });
  expect(screen.queryByRole("button", { name: /Edit|Delete/ })).toBeNull();
});

it("shows only Edit (not Delete) for a default, unlocked role", () => {
  renderItem({ role: role({ isDefault: true, isLocked: false }) });
  expect(screen.getByRole("button", { name: "Edit Manager role" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Delete/ })).toBeNull();
});
