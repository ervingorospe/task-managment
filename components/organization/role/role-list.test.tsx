import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RoleList from "./role-list";
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

beforeEach(() => {
  mockedUseAuth.mockReturnValue({
    activeMembership: {
      role: {
        rules: [PERMISSIONS.ROLE_VIEW, PERMISSIONS.ROLE_UPDATE, PERMISSIONS.ROLE_REMOVE].map(
          (action, i) => ({ id: i, action, name: action, desc: "", categoryId: 1 }),
        ),
      },
    },
    isPersonalMode: false,
  });
});

it("renders one item per role", () => {
  render(
    <RoleList
      roles={[role({ id: 1, roleName: "Manager" }), role({ id: 2, roleName: "Client" })]}
      onEdit={jest.fn()}
      onDelete={jest.fn()}
    />,
  );
  expect(screen.getByText("Manager")).toBeInTheDocument();
  expect(screen.getByText("Client")).toBeInTheDocument();
});

it("renders an empty list with none", () => {
  render(<RoleList roles={[]} onEdit={jest.fn()} onDelete={jest.fn()} />);
  expect(screen.queryByRole("listitem")).toBeNull();
});

it("wires onEdit/onDelete through to the right role", async () => {
  const onEdit = jest.fn();
  const onDelete = jest.fn();
  render(
    <RoleList
      roles={[role({ id: 1, roleName: "Manager" }), role({ id: 2, roleName: "Client" })]}
      onEdit={onEdit}
      onDelete={onDelete}
    />,
  );
  await userEvent.click(screen.getByRole("button", { name: "Edit Client role" }));
  expect(onEdit).toHaveBeenCalledWith(role({ id: 2, roleName: "Client" }));

  await userEvent.click(screen.getByRole("button", { name: "Delete Manager role" }));
  expect(onDelete).toHaveBeenCalledWith(role({ id: 1, roleName: "Manager" }));
});
