import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SetRoleModal } from "./set-role-modal";
import { useAuth } from "@/providers/auth-provider";
import { PERMISSIONS } from "@/lib/data/permissions";
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
  withPermissions([PERMISSIONS.MEMBER_INVITE]);
});

function renderModal(overrides: Partial<React.ComponentProps<typeof SetRoleModal>> = {}) {
  const onClose = jest.fn();
  const onConfirm = jest.fn();
  render(
    <SetRoleModal
      open
      onClose={onClose}
      roles={[MANAGER, CLIENT]}
      currentRoleId={null}
      onConfirm={onConfirm}
      {...overrides}
    />,
  );
  return { onClose, onConfirm };
}

it("renders nothing without member.invite or member.update_role", () => {
  withPermissions([]);
  renderModal();
  expect(screen.queryByText("Set role")).toBeNull();
});

it("renders when only member.update_role is present", () => {
  withPermissions([PERMISSIONS.MEMBER_UPDATE_ROLE]);
  renderModal();
  expect(screen.getByText("Set role")).toBeInTheDocument();
});

it("lists every role with its description", () => {
  renderModal();
  expect(screen.getByText("Manager")).toBeInTheDocument();
  expect(screen.getByText("Can manage tickets")).toBeInTheDocument();
  expect(screen.getByText("Client")).toBeInTheDocument();
});

it("shows a fallback message when there are no roles", () => {
  renderModal({ roles: [] });
  expect(screen.getByText("No roles yet. Create one first.")).toBeInTheDocument();
});

it("disables Confirm until a role is selected", () => {
  renderModal();
  expect(screen.getByRole("button", { name: "Confirm" })).toBeDisabled();
});

it("preselects the current role", () => {
  renderModal({ currentRoleId: 2 });
  expect(screen.getByRole("radio", { name: /Client/ })).toBeChecked();
  expect(screen.getByRole("button", { name: "Confirm" })).toBeEnabled();
});

it("selects a role and confirms, closing the modal", async () => {
  const { onClose, onConfirm } = renderModal();
  await userEvent.click(screen.getByRole("radio", { name: /Manager/ }));
  await userEvent.click(screen.getByRole("button", { name: "Confirm" }));

  expect(onConfirm).toHaveBeenCalledWith(1);
  expect(onClose).toHaveBeenCalled();
});

it("closes without confirming on Cancel", async () => {
  const { onClose, onConfirm } = renderModal();
  await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(onConfirm).not.toHaveBeenCalled();
  expect(onClose).toHaveBeenCalled();
});

it("resets the selection to the current role each time it reopens", () => {
  const { rerender } = render(
    <SetRoleModal open={false} onClose={jest.fn()} roles={[MANAGER, CLIENT]} currentRoleId={1} onConfirm={jest.fn()} />,
  );
  rerender(
    <SetRoleModal open onClose={jest.fn()} roles={[MANAGER, CLIENT]} currentRoleId={1} onConfirm={jest.fn()} />,
  );
  expect(screen.getByRole("radio", { name: /Manager/ })).toBeChecked();
});
