jest.mock("@/providers/organization-defaults.provider", () => ({
  useOrganizationDefaults: jest.fn(),
}));

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RolesSection from "./roles-section";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { useLogActivity } from "@/hooks/use-log-activity";
import { useOrganizationDefaults } from "@/providers/organization-defaults.provider";
import { createRole, updateRoleInfo, updateRoleRules, deleteRole } from "@/lib/api/roles";
import { PERMISSIONS } from "@/lib/data/permissions";
import type { RoleDetail } from "@/lib/types/organization/role-detail.type";
import type { Rule } from "@/lib/types/rule/rule.type";

jest.mock("@/providers/auth-provider", () => {
  const actual = jest.requireActual("@/providers/auth-provider");
  return { ...actual, useAuth: jest.fn() };
});
jest.mock("@/providers/toast-provider", () => ({ useToast: jest.fn() }));
jest.mock("@/hooks/use-log-activity", () => ({ useLogActivity: jest.fn() }));
jest.mock("@/lib/api/roles", () => ({
  createRole: jest.fn(),
  updateRoleInfo: jest.fn(),
  updateRoleRules: jest.fn(),
  deleteRole: jest.fn(),
}));

const mockedUseAuth = useAuth as jest.Mock;
const mockedUseToast = useToast as jest.Mock;
const mockedUseLogActivity = useLogActivity as jest.Mock;
const mockedUseOrgDefaults = useOrganizationDefaults as jest.Mock;
const mockedCreateRole = createRole as jest.Mock;
const mockedUpdateRoleInfo = updateRoleInfo as jest.Mock;
const mockedUpdateRoleRules = updateRoleRules as jest.Mock;
const mockedDeleteRole = deleteRole as jest.Mock;

const toast = jest.fn();
const logActivity = jest.fn();

const TICKET_VIEW: Rule = { id: 1, action: "ticket.view", name: "View tickets", desc: "", categoryId: 1 };

function role(overrides: Partial<RoleDetail> = {}): RoleDetail {
  return {
    id: 1,
    roleName: "Manager",
    roleDesc: "Can manage tickets",
    isDefault: false,
    orgId: 6001,
    isLocked: false,
    isDeleted: false,
    rules: [TICKET_VIEW],
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
  jest.clearAllMocks();
  withPermissions([PERMISSIONS.ROLE_VIEW, PERMISSIONS.ROLE_ADD, PERMISSIONS.ROLE_UPDATE, PERMISSIONS.ROLE_REMOVE]);
  mockedUseToast.mockReturnValue(toast);
  mockedUseLogActivity.mockReturnValue(logActivity);
  mockedUseOrgDefaults.mockReturnValue({ permissionOptions: [TICKET_VIEW], ruleCategories: [{ id: 1, name: "Tickets" }] });
});

function renderSection(overrides: Partial<React.ComponentProps<typeof RolesSection>> = {}) {
  render(<RolesSection roles={[role()]} capacity={10} orgId={6001} {...overrides} />);
}

it("shows the role manager with the given roles", () => {
  renderSection();
  expect(screen.getByText("Manager")).toBeInTheDocument();
});

describe("add", () => {
  it("adds a role optimistically, confirms via the API, logs activity, and shows an alert", async () => {
    mockedCreateRole.mockResolvedValue(role({ id: 99, roleName: "Auditor" }));
    renderSection();
    await userEvent.click(screen.getByRole("button", { name: /Add role/ }));
    await userEvent.type(screen.getByLabelText(/Role name/), "Auditor");
    await userEvent.click(screen.getByLabelText("View tickets"));
    await userEvent.click(screen.getByRole("button", { name: "Create role" }));

    expect(screen.getByText("Auditor")).toBeInTheDocument();
    await waitFor(() =>
      expect(mockedCreateRole).toHaveBeenCalledWith(6001, {
        roleName: "Auditor",
        roleDesc: "",
        ruleIds: [1],
      }),
    );
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ orgId: 6001, action: "created", entityId: 99 }),
    );
    expect(await screen.findByText('Role "Auditor" added')).toBeInTheDocument();
  });

  it("rejects a duplicate name before calling the API", async () => {
    renderSection();
    await userEvent.click(screen.getByRole("button", { name: /Add role/ }));
    await userEvent.type(screen.getByLabelText(/Role name/), "Manager");
    await userEvent.click(screen.getByLabelText("View tickets"));
    await userEvent.click(screen.getByRole("button", { name: "Create role" }));

    expect(
      (await screen.findAllByText('A role named "Manager" already exists')).length,
    ).toBeGreaterThan(0);
    expect(mockedCreateRole).not.toHaveBeenCalled();
  });

  it("reverts the optimistic add and toasts on failure", async () => {
    mockedCreateRole.mockRejectedValue(new Error("boom"));
    renderSection();
    await userEvent.click(screen.getByRole("button", { name: /Add role/ }));
    await userEvent.type(screen.getByLabelText(/Role name/), "Auditor");
    await userEvent.click(screen.getByLabelText("View tickets"));
    await userEvent.click(screen.getByRole("button", { name: "Create role" }));

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith('Failed to create role "Auditor"', "error"),
    );
    expect(screen.queryByText("Auditor")).toBeNull();
  });
});

describe("update", () => {
  it("updates a role optimistically, confirms via both API calls, logs activity, and shows an alert", async () => {
    mockedUpdateRoleInfo.mockResolvedValue(undefined);
    mockedUpdateRoleRules.mockResolvedValue(undefined);
    renderSection({ roles: [role({ id: 1, roleName: "Manager" }), role({ id: 2, roleName: "Auditor" })] });
    await userEvent.click(screen.getByRole("button", { name: "Edit Manager role" }));
    const nameInput = screen.getByDisplayValue("Manager");
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "Senior Manager");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(screen.getByText("Senior Manager")).toBeInTheDocument();
    expect(screen.getByText("Auditor")).toBeInTheDocument();
    await waitFor(() =>
      expect(mockedUpdateRoleInfo).toHaveBeenCalledWith(1, { roleName: "Senior Manager", roleDesc: "Can manage tickets" }),
    );
    expect(mockedUpdateRoleRules).toHaveBeenCalledWith(1, [1]);
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ orgId: 6001, action: "updated", entityId: 1 }),
    );
    expect(await screen.findByText('Role "Senior Manager" updated')).toBeInTheDocument();
  });

  it("rejects a duplicate name against another role before calling the API", async () => {
    renderSection({ roles: [role({ id: 1, roleName: "Manager" }), role({ id: 2, roleName: "Auditor" })] });
    await userEvent.click(screen.getByRole("button", { name: "Edit Manager role" }));
    const nameInput = screen.getByDisplayValue("Manager");
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "Auditor");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(
      (await screen.findAllByText('A role named "Auditor" already exists')).length,
    ).toBeGreaterThan(0);
    expect(mockedUpdateRoleInfo).not.toHaveBeenCalled();
  });

  it("reverts the optimistic update and toasts on failure, leaving other roles untouched", async () => {
    mockedUpdateRoleInfo.mockRejectedValue(new Error("boom"));
    mockedUpdateRoleRules.mockResolvedValue(undefined);
    renderSection({ roles: [role(), role({ id: 2, roleName: "Auditor" })] });
    await userEvent.click(screen.getByRole("button", { name: "Edit Manager role" }));
    const nameInput = screen.getByDisplayValue("Manager");
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "Senior Manager");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith('Failed to update role "Senior Manager"', "error"),
    );
    expect(await screen.findByText("Manager")).toBeInTheDocument();
    expect(screen.getByText("Auditor")).toBeInTheDocument();
  });
});

describe("delete", () => {
  it("opens a confirm dialog, deletes optimistically, confirms via the API, logs activity, and shows an alert", async () => {
    mockedDeleteRole.mockResolvedValue(undefined);
    renderSection();
    await userEvent.click(screen.getByRole("button", { name: "Delete Manager role" }));
    expect(screen.getByText('Delete "Manager" role?')).toBeInTheDocument();

    const confirmButtons = screen.getAllByRole("button", { name: "Delete role" });
    await userEvent.click(confirmButtons[confirmButtons.length - 1]);

    expect(screen.queryByText("Manager")).toBeNull();
    await waitFor(() => expect(mockedDeleteRole).toHaveBeenCalledWith(1));
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ orgId: 6001, action: "removed", entityId: 1 }),
    );
    expect(await screen.findByText('Role "Manager" deleted')).toBeInTheDocument();
  });

  it("reverts the optimistic delete and toasts on failure", async () => {
    mockedDeleteRole.mockRejectedValue(new Error("boom"));
    renderSection();
    await userEvent.click(screen.getByRole("button", { name: "Delete Manager role" }));
    const confirmButtons = screen.getAllByRole("button", { name: "Delete role" });
    await userEvent.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith('Failed to delete role "Manager"', "error"),
    );
    expect(await screen.findByText("Manager")).toBeInTheDocument();
  });

  it("closes without deleting on cancel", async () => {
    renderSection();
    await userEvent.click(screen.getByRole("button", { name: "Delete Manager role" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(mockedDeleteRole).not.toHaveBeenCalled();
    expect(screen.getByText("Manager")).toBeInTheDocument();
  });

  it("hides the confirm dialog gate without role.remove", () => {
    withPermissions([PERMISSIONS.ROLE_VIEW]);
    renderSection();
    expect(screen.queryByRole("button", { name: /Delete/ })).toBeNull();
  });
});
