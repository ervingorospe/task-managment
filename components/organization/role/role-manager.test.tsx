jest.mock("./role-form-modal", () => ({
  __esModule: true,
  RoleFormModal: (props: {
    open: boolean;
    onClose: () => void;
    onSubmit: (values: { roleName: string; roleDesc: string; rules: number[] }) => string | undefined;
    role?: { roleName: string };
  }) =>
    props.open ? (
      <div data-testid="role-form-modal">
        {props.role ? `Editing ${props.role.roleName}` : "Creating"}
        <button
          onClick={() => {
            const error = props.onSubmit({ roleName: "Auditor", roleDesc: "", rules: [1] });
            if (error) return;
          }}
        >
          submit-form
        </button>
        <button onClick={props.onClose}>close-form</button>
      </div>
    ) : null,
}));

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RoleManager from "./role-manager";
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
  withPermissions([
    PERMISSIONS.ROLE_VIEW,
    PERMISSIONS.ROLE_ADD,
    PERMISSIONS.ROLE_UPDATE,
    PERMISSIONS.ROLE_REMOVE,
  ]);
});

function renderManager(overrides: Partial<React.ComponentProps<typeof RoleManager>> = {}) {
  const addRole = jest.fn();
  const updateRole = jest.fn();
  const onDeleteRole = jest.fn();
  render(
    <RoleManager
      title="Roles"
      subtitle="Manage roles."
      roles={[role()]}
      capacity={10}
      addRole={addRole}
      updateRole={updateRole}
      onDeleteRole={onDeleteRole}
      {...overrides}
    />,
  );
  return { addRole, updateRole, onDeleteRole };
}

it("renders nothing without role.view", () => {
  withPermissions([]);
  renderManager();
  expect(screen.queryByText("Roles")).toBeNull();
});

it("shows the title, subtitle, capacity usage, banner, and role list", () => {
  renderManager({ banner: <p>Saved!</p> });
  expect(screen.getByText("Roles")).toBeInTheDocument();
  expect(screen.getByText("Manage roles.")).toBeInTheDocument();
  expect(screen.getByText("1 / 10 roles used")).toBeInTheDocument();
  expect(screen.getByText("Saved!")).toBeInTheDocument();
  expect(screen.getByText("Manager")).toBeInTheDocument();
});

it("hides the Add role button without role.add", () => {
  withPermissions([PERMISSIONS.ROLE_VIEW]);
  renderManager();
  expect(screen.queryByRole("button", { name: /Add role/ })).toBeNull();
});

it("disables Add role and shows a tooltip once at capacity", () => {
  renderManager({ capacity: 1 });
  const addButton = screen.getByRole("button", { name: /Add role/ });
  expect(addButton).toBeDisabled();
  expect(addButton).toHaveAttribute("title", "Role limit reached (1)");
});

describe("create flow", () => {
  it("opens the form in create mode and adds a role on success", async () => {
    const { addRole } = renderManager();
    addRole.mockReturnValue(undefined);
    await userEvent.click(screen.getByRole("button", { name: /Add role/ }));

    expect(await screen.findByText("Creating")).toBeInTheDocument();
    await userEvent.click(screen.getByText("submit-form"));

    expect(addRole).toHaveBeenCalledWith({ roleName: "Auditor", roleDesc: "", rules: [1] });
    await waitFor(() => expect(screen.queryByTestId("role-form-modal")).toBeNull());
  });

  it("closes without adding via close-form", async () => {
    const { addRole } = renderManager();
    await userEvent.click(screen.getByRole("button", { name: /Add role/ }));
    await screen.findByText("Creating");
    await userEvent.click(screen.getByText("close-form"));
    expect(addRole).not.toHaveBeenCalled();
    expect(screen.queryByTestId("role-form-modal")).toBeNull();
  });

  it("does not open the create modal once at capacity", async () => {
    renderManager({ capacity: 1 });
    expect(screen.getByRole("button", { name: /Add role/ })).toBeDisabled();
    expect(screen.queryByTestId("role-form-modal")).toBeNull();
  });
});

describe("edit flow", () => {
  it("opens the form in edit mode and updates on success", async () => {
    const { updateRole } = renderManager();
    updateRole.mockReturnValue(undefined);
    await userEvent.click(screen.getByRole("button", { name: "Edit Manager role" }));

    expect(await screen.findByText("Editing Manager")).toBeInTheDocument();
    await userEvent.click(screen.getByText("submit-form"));

    expect(updateRole).toHaveBeenCalledWith(1, { roleName: "Auditor", roleDesc: "", rules: [1] });
  });

  it("keeps the modal open when the submit returns an error", async () => {
    const { updateRole } = renderManager();
    updateRole.mockReturnValue("That role name is already taken");
    await userEvent.click(screen.getByRole("button", { name: "Edit Manager role" }));
    await screen.findByText("Editing Manager");
    await userEvent.click(screen.getByText("submit-form"));

    expect(screen.getByTestId("role-form-modal")).toBeInTheDocument();
  });
});

it("calls onDeleteRole when Delete is clicked", async () => {
  const { onDeleteRole } = renderManager();
  await userEvent.click(screen.getByRole("button", { name: "Delete Manager role" }));
  expect(onDeleteRole).toHaveBeenCalledWith(role());
});
