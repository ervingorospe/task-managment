import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MembersSection from "./members-section";
import { useAuth, usePermission } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { useLogActivity } from "@/hooks/use-log-activity";
import { useMemberListQueryState } from "@/hooks/use-member-list-query-state";
import { updateMemberRole, updateMemberActiveState, removeMember } from "@/lib/api/members";
import { PERMISSIONS } from "@/lib/data/permissions";
import type { MemberDetail } from "@/lib/types/organization/member-detail.type";
import type { RoleDetail } from "@/lib/types/organization/role-detail.type";

jest.mock("@/providers/auth-provider", () => {
  const actual = jest.requireActual("@/providers/auth-provider");
  return { ...actual, useAuth: jest.fn(), usePermission: jest.fn() };
});
jest.mock("@/providers/toast-provider", () => ({ useToast: jest.fn() }));
jest.mock("@/hooks/use-log-activity", () => ({ useLogActivity: jest.fn() }));
jest.mock("@/hooks/use-member-list-query-state", () => ({ useMemberListQueryState: jest.fn() }));
jest.mock("@/lib/api/members", () => ({
  updateMemberRole: jest.fn(),
  updateMemberActiveState: jest.fn(),
  removeMember: jest.fn(),
}));

const mockedUseAuth = useAuth as jest.Mock;
const mockedUsePermission = usePermission as jest.Mock;
const mockedUseToast = useToast as jest.Mock;
const mockedUseLogActivity = useLogActivity as jest.Mock;
const mockedUseMemberListQueryState = useMemberListQueryState as jest.Mock;
const mockedUpdateMemberRole = updateMemberRole as jest.Mock;
const mockedUpdateMemberActiveState = updateMemberActiveState as jest.Mock;
const mockedRemoveMember = removeMember as jest.Mock;

const toast = jest.fn();
const logActivity = jest.fn();
const setPage = jest.fn();
const setSearchInput = jest.fn();

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
const CLIENT_ROLE: RoleDetail = {
  id: 2,
  roleName: "Client",
  roleDesc: "",
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
  mockedUsePermission.mockImplementation((action: string) => actions.includes(action));
}

let queryState: ReturnType<typeof useMemberListQueryState>;

beforeEach(() => {
  jest.clearAllMocks();
  withPermissions([
    PERMISSIONS.MEMBER_VIEW_MEMBERS,
    PERMISSIONS.MEMBER_UPDATE_ROLE,
    PERMISSIONS.MEMBER_SET_ACTIVE,
    PERMISSIONS.MEMBER_REMOVE,
  ]);
  mockedUseToast.mockReturnValue(toast);
  mockedUseLogActivity.mockReturnValue(logActivity);
  queryState = { page: 1, searchInput: "", search: "", setPage, setSearchInput };
  mockedUseMemberListQueryState.mockImplementation(() => queryState);
});

function renderSection(overrides: Partial<React.ComponentProps<typeof MembersSection>> = {}) {
  render(<MembersSection orgId={6001} members={[member()]} roles={[MANAGER, CLIENT_ROLE]} {...overrides} />);
}

it("renders nothing without member.view_members", () => {
  withPermissions([]);
  renderSection();
  expect(screen.queryByText("Current Members")).toBeNull();
});

it("shows the title and member count", () => {
  renderSection();
  expect(screen.getByText("Current Members")).toBeInTheDocument();
  expect(screen.getByText("1 members")).toBeInTheDocument();
  expect(screen.getByText("Jane Doe")).toBeInTheDocument();
});

describe("search", () => {
  it("filters by name, email, and role name", () => {
    const members = [
      member({ id: 1, firstName: "Jane", lastName: "Doe", roleId: 1 }),
      member({ id: 2, firstName: "Marco", lastName: "Reyes", email: "marco@acmestudio.com", roleId: 2 }),
    ];
    queryState.search = "doe";
    renderSection({ members });
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.queryByText("Marco Reyes")).toBeNull();
  });

  it("matches by role name", () => {
    const members = [
      member({ id: 1, firstName: "Jane", lastName: "Doe", roleId: 1 }),
      member({ id: 2, firstName: "Marco", lastName: "Reyes", email: "marco@acmestudio.com", roleId: 2 }),
      // roleId 999 has no matching role, exercising the `roleNameById.get(...) ?? ""` fallback.
      member({ id: 3, firstName: "No", lastName: "Role", email: "norole@acmestudio.com", roleId: 999 }),
    ];
    queryState.search = "client";
    renderSection({ members });
    expect(screen.getByText("Marco Reyes")).toBeInTheDocument();
    expect(screen.queryByText("Jane Doe")).toBeNull();
    expect(screen.queryByText("No Role")).toBeNull();
  });

  it("shows a 'no matching members' empty state with a clear-search action", async () => {
    queryState.search = "zzz";
    renderSection();
    expect(screen.getByText("No matching members")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(setSearchInput).toHaveBeenCalledWith("");
  });

  it("shows the default empty state with no members at all", () => {
    renderSection({ members: [] });
    expect(screen.getByText("No members yet")).toBeInTheDocument();
  });
});

describe("sort", () => {
  it("sorts by name ascending by default", () => {
    const members = [
      member({ id: 1, firstName: "Zed", lastName: "Zephyr" }),
      member({ id: 2, firstName: "Alex", lastName: "Adams" }),
    ];
    renderSection({ members });
    const names = screen.getAllByText(/Adams|Zephyr/).map((el) => el.textContent);
    expect(names[0]).toContain("Adams");
    expect(names[1]).toContain("Zephyr");
  });

  it("sorts by email when 'Sort by email' is selected", async () => {
    const members = [
      member({ id: 1, firstName: "Zed", lastName: "Zephyr", email: "a@acmestudio.com" }),
      member({ id: 2, firstName: "Alex", lastName: "Adams", email: "z@acmestudio.com" }),
    ];
    renderSection({ members });
    const sortSelect = document.querySelector("select") as HTMLSelectElement;
    await userEvent.selectOptions(sortSelect, "email");
    const rows = screen.getAllByText(/Zephyr|Adams/).map((el) => el.textContent);
    expect(rows[0]).toContain("Zephyr");
    expect(rows[1]).toContain("Adams");
  });
});

describe("pagination", () => {
  it("changes the page size and resets to page 1", async () => {
    const members = Array.from({ length: 20 }, (_, i) => member({ id: i + 1, firstName: `Member${i + 1}`, lastName: "Test" }));
    renderSection({ members });
    const pageSizeSelect = Array.from(document.querySelectorAll("select")).find((s) =>
      s.textContent?.includes("/ page"),
    ) as HTMLSelectElement;
    await userEvent.selectOptions(pageSizeSelect, "50");
    expect(setPage).toHaveBeenCalledWith(1);
    expect(screen.getByText("Member20 Test")).toBeInTheDocument();
  });
});

describe("toggle active", () => {
  it("opens a confirm dialog naming deactivation and deactivates on confirm, logging activity and toasting success", async () => {
    mockedUpdateMemberActiveState.mockResolvedValue(undefined);
    renderSection({
      members: [
        member({ isActive: true }),
        member({ id: 2, firstName: "Bystander", lastName: "Member", email: "bystander@acmestudio.com" }),
      ],
    });
    await userEvent.click(screen.getByRole("button", { name: "Deactivate Jane Doe" }));
    expect(screen.getByText("Deactivate Jane Doe?")).toBeInTheDocument();

    const confirmButtons = screen.getAllByRole("button", { name: "Deactivate" });
    await userEvent.click(confirmButtons[confirmButtons.length - 1]);

    expect(screen.getByRole("button", { name: "Activate Jane Doe" })).toBeInTheDocument();
    expect(screen.getByText("Bystander Member")).toBeInTheDocument();
    await waitFor(() => expect(mockedUpdateMemberActiveState).toHaveBeenCalledWith(1, false));
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ orgId: 6001, action: "deactivated", entityId: 1 }),
    );
    expect(toast).toHaveBeenCalledWith("Jane Doe deactivated", "error");
  });

  it("opens a confirm dialog naming activation and activates on confirm, toasting success", async () => {
    mockedUpdateMemberActiveState.mockResolvedValue(undefined);
    renderSection({ members: [member({ isActive: false })] });
    await userEvent.click(screen.getByRole("button", { name: "Activate Jane Doe" }));
    expect(screen.getByText("Activate Jane Doe?")).toBeInTheDocument();

    const confirmButtons = screen.getAllByRole("button", { name: "Activate" });
    await userEvent.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => expect(mockedUpdateMemberActiveState).toHaveBeenCalledWith(1, true));
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ action: "activated" }),
    );
    expect(toast).toHaveBeenCalledWith("Jane Doe activated", "success");
  });

  it("reverts and toasts the deactivate failure message", async () => {
    mockedUpdateMemberActiveState.mockRejectedValue(new Error("boom"));
    renderSection({
      members: [
        member({ isActive: true }),
        member({ id: 2, firstName: "Bystander", lastName: "Member", email: "bystander@acmestudio.com" }),
      ],
    });
    await userEvent.click(screen.getByRole("button", { name: "Deactivate Jane Doe" }));
    const confirmButtons = screen.getAllByRole("button", { name: "Deactivate" });
    await userEvent.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith("Failed to deactivate Jane Doe", "error"),
    );
    expect(screen.getByRole("button", { name: "Deactivate Jane Doe" })).toBeInTheDocument();
  });

  it("reverts and toasts the activate failure message", async () => {
    mockedUpdateMemberActiveState.mockRejectedValue(new Error("boom"));
    renderSection({ members: [member({ isActive: false })] });
    await userEvent.click(screen.getByRole("button", { name: "Activate Jane Doe" }));
    const confirmButtons = screen.getAllByRole("button", { name: "Activate" });
    await userEvent.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith("Failed to activate Jane Doe", "error"),
    );
  });

  it("closes without toggling on cancel", async () => {
    renderSection({ members: [member({ isActive: true })] });
    await userEvent.click(screen.getByRole("button", { name: "Deactivate Jane Doe" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(mockedUpdateMemberActiveState).not.toHaveBeenCalled();
  });
});

describe("remove", () => {
  it("opens a confirm dialog, removes on confirm, logs activity, and shows an alert", async () => {
    mockedRemoveMember.mockResolvedValue(undefined);
    renderSection();
    await userEvent.click(screen.getByRole("button", { name: "Remove Jane Doe" }));
    expect(screen.getByText("Remove Jane Doe?")).toBeInTheDocument();

    const confirmButtons = screen.getAllByRole("button", { name: "Remove member" });
    await userEvent.click(confirmButtons[confirmButtons.length - 1]);

    expect(screen.queryByText("Jane Doe")).toBeNull();
    await waitFor(() => expect(mockedRemoveMember).toHaveBeenCalledWith(1));
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ orgId: 6001, action: "removed", entityId: 1 }),
    );
    expect(toast).not.toHaveBeenCalled();
  });

  it("reverts the optimistic remove and toasts on failure", async () => {
    mockedRemoveMember.mockRejectedValue(new Error("boom"));
    renderSection();
    await userEvent.click(screen.getByRole("button", { name: "Remove Jane Doe" }));
    const confirmButtons = screen.getAllByRole("button", { name: "Remove member" });
    await userEvent.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith("Failed to remove Jane Doe", "error"),
    );
    expect(await screen.findByText("Jane Doe")).toBeInTheDocument();
  });

  it("closes without removing on cancel", async () => {
    renderSection();
    await userEvent.click(screen.getByRole("button", { name: "Remove Jane Doe" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(mockedRemoveMember).not.toHaveBeenCalled();
  });

  it("hides the confirm dialog's gate without member.remove", () => {
    withPermissions([PERMISSIONS.MEMBER_VIEW_MEMBERS]);
    renderSection();
    expect(screen.queryByRole("button", { name: /Remove/ })).toBeNull();
  });
});

describe("change role", () => {
  it("opens the role modal preselecting the member's current role and confirms, logging activity", async () => {
    mockedUpdateMemberRole.mockResolvedValue(undefined);
    renderSection({
      members: [
        member(),
        member({ id: 2, firstName: "Bystander", lastName: "Member", email: "bystander@acmestudio.com", roleId: 2 }),
      ],
    });
    await userEvent.click(screen.getByRole("button", { name: /Manager/ }));
    expect(screen.getByText("Set role")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Manager/ })).toBeChecked();

    await userEvent.click(screen.getByRole("radio", { name: /Client/ }));
    await userEvent.click(screen.getByRole("button", { name: "Confirm" }));

    expect(screen.getAllByText(/Client/).length).toBeGreaterThan(0);
    expect(screen.getByText("Bystander Member")).toBeInTheDocument();
    await waitFor(() => expect(mockedUpdateMemberRole).toHaveBeenCalledWith(1, 2));
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ orgId: 6001, action: "role_changed", entityId: 1 }),
    );
  });

  it("reverts and toasts on failure", async () => {
    mockedUpdateMemberRole.mockRejectedValue(new Error("boom"));
    renderSection({
      members: [
        member(),
        member({ id: 2, firstName: "Bystander", lastName: "Member", email: "bystander@acmestudio.com", roleId: 2 }),
      ],
    });
    await userEvent.click(screen.getByRole("button", { name: /Manager/ }));
    await userEvent.click(screen.getByRole("radio", { name: /Client/ }));
    await userEvent.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith("Failed to update Jane Doe's role", "error"),
    );
    expect(await screen.findByText(/Manager/)).toBeInTheDocument();
  });

  it("closes without changing role on cancel", async () => {
    renderSection();
    await userEvent.click(screen.getByRole("button", { name: /Manager/ }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(mockedUpdateMemberRole).not.toHaveBeenCalled();
  });
});
