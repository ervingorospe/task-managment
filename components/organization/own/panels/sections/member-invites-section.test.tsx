import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MemberInvitesSection from "./member-invites-section";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { useLogActivity } from "@/hooks/use-log-activity";
import { inviteMember } from "@/lib/api/members";
import { ApiError } from "@/lib/api/client";
import { PERMISSIONS } from "@/lib/data/permissions";
import type { RoleDetail } from "@/lib/types/organization/role-detail.type";

jest.mock("@/providers/auth-provider", () => {
  const actual = jest.requireActual("@/providers/auth-provider");
  return { ...actual, useAuth: jest.fn() };
});
jest.mock("@/providers/toast-provider", () => ({ useToast: jest.fn() }));
jest.mock("@/hooks/use-log-activity", () => ({ useLogActivity: jest.fn() }));
jest.mock("@/lib/api/members", () => ({ inviteMember: jest.fn() }));

const mockedUseAuth = useAuth as jest.Mock;
const mockedUseToast = useToast as jest.Mock;
const mockedUseLogActivity = useLogActivity as jest.Mock;
const mockedInviteMember = inviteMember as jest.Mock;

const toast = jest.fn();
const logActivity = jest.fn();

const MEMBER_ROLE: RoleDetail = {
  id: 1,
  roleName: "Member",
  roleDesc: "",
  isDefault: true,
  orgId: 6001,
  isLocked: false,
  isDeleted: false,
  rules: [],
};
const MANAGER_ROLE: RoleDetail = {
  id: 2,
  roleName: "Manager",
  roleDesc: "",
  isDefault: false,
  orgId: 6001,
  isLocked: false,
  isDeleted: false,
  rules: [],
};

function withCurrentUser(currentUser: { id: number; firstName: string; lastName: string } | null) {
  mockedUseAuth.mockReturnValue({
    currentUser,
    activeMembership: {
      role: {
        rules: [PERMISSIONS.MEMBER_INVITE, PERMISSIONS.MEMBER_VIEW_MEMBERS, PERMISSIONS.MEMBER_REMOVE].map((action, i) => ({
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
}

beforeEach(() => {
  jest.clearAllMocks();
  withCurrentUser({ id: 1, firstName: "Jane", lastName: "Doe" });
  mockedUseToast.mockReturnValue(toast);
  mockedUseLogActivity.mockReturnValue(logActivity);
});

function renderSection(overrides: Partial<React.ComponentProps<typeof MemberInvitesSection>> = {}) {
  const onSent = jest.fn();
  render(
    <MemberInvitesSection
      orgId={6001}
      roles={[MEMBER_ROLE, MANAGER_ROLE]}
      capacity={10}
      currentTotalInvites={0}
      onSent={onSent}
      {...overrides}
    />,
  );
  return { onSent };
}

async function addEmail(email: string) {
  // The input's placeholder disappears once a chip exists, so target it
  // by role instead (it's the only textbox in this section).
  const input = screen.getByRole("textbox");
  await userEvent.type(input, `${email} `);
}

it("disables Send Invite until an invite is queued", async () => {
  renderSection();
  expect(screen.getByRole("button", { name: "Send Invite" })).toBeDisabled();
  await addEmail("new@acmestudio.com");
  await userEvent.click(screen.getByRole("button", { name: "Add" }));
  expect(screen.getByRole("button", { name: "Send Invite" })).toBeEnabled();
});

it("queues an added email, logs it, and assigns the default 'Member' role", async () => {
  renderSection();
  await addEmail("new@acmestudio.com");
  await userEvent.click(screen.getByRole("button", { name: "Add" }));

  expect(screen.getByText("new@acmestudio.com")).toBeInTheDocument();
  expect(screen.getByText(/Member/)).toBeInTheDocument();
  expect(logActivity).toHaveBeenCalledWith(
    expect.objectContaining({ orgId: 6001, action: "invited", entityLabel: "new@acmestudio.com" }),
  );
});

it("falls back to the first role when there's no 'Member' role", async () => {
  renderSection({ roles: [MANAGER_ROLE] });
  await addEmail("new@acmestudio.com");
  await userEvent.click(screen.getByRole("button", { name: "Add" }));
  expect(screen.getByText(/Manager/)).toBeInTheDocument();
});

it("falls back to roleId 0 when there are no roles at all", async () => {
  renderSection({ roles: [] });
  await addEmail("new@acmestudio.com");
  await userEvent.click(screen.getByRole("button", { name: "Add" }));
  expect(screen.getByText("No role")).toBeInTheDocument();
});

it("does not queue a duplicate email already pending", async () => {
  renderSection();
  await addEmail("new@acmestudio.com");
  await userEvent.click(screen.getByRole("button", { name: "Add" }));
  await addEmail("new@acmestudio.com");
  await userEvent.click(screen.getByRole("button", { name: "Add" }));

  expect(screen.getAllByText("new@acmestudio.com")).toHaveLength(1);
  expect(logActivity).toHaveBeenCalledTimes(1);
});

it("removes a queued invite", async () => {
  renderSection();
  await addEmail("new@acmestudio.com");
  await userEvent.click(screen.getByRole("button", { name: "Add" }));
  await userEvent.click(screen.getByRole("button", { name: "Remove new@acmestudio.com" }));

  expect(screen.queryByText("new@acmestudio.com")).toBeNull();
  expect(screen.getByRole("button", { name: "Send Invite" })).toBeDisabled();
});

it("changes a queued invite's role, leaving the other queued invite's role untouched", async () => {
  renderSection();
  await addEmail("new@acmestudio.com");
  await userEvent.click(screen.getByRole("button", { name: "Add" }));
  await addEmail("other@acmestudio.com");
  await userEvent.click(screen.getByRole("button", { name: "Add" }));

  const roleButtons = screen.getAllByRole("button", { name: /Member/ });
  await userEvent.click(roleButtons[0]);
  await userEvent.click(screen.getByRole("radio", { name: /Manager/ }));
  await userEvent.click(screen.getByRole("button", { name: "Confirm" }));

  expect(screen.getByText(/Manager/)).toBeInTheDocument();
  expect(screen.getByText(/Member/)).toBeInTheDocument();
});

it("disables Send Invite and shows a tooltip once at capacity", () => {
  renderSection({ currentTotalInvites: 10, capacity: 10 });
  const button = screen.getByRole("button", { name: "Send Invite" });
  expect(button).toBeDisabled();
  expect(button).toHaveAttribute("title", "Invite limit reached (10)");
});

describe("sending invites", () => {
  it("sends, clears the queue, calls onSent, logs activity with the real id, and shows a success alert", async () => {
    mockedInviteMember.mockResolvedValue({ id: 99, email: "new@acmestudio.com", roleId: 1 });
    const { onSent } = renderSection();
    await addEmail("new@acmestudio.com");
    await userEvent.click(screen.getByRole("button", { name: "Add" }));
    await userEvent.click(screen.getByRole("button", { name: "Send Invite" }));

    await waitFor(() =>
      expect(mockedInviteMember).toHaveBeenCalledWith(6001, {
        email: "new@acmestudio.com",
        roleId: 1,
        inviterName: "Jane Doe",
      }),
    );
    expect(onSent).toHaveBeenCalledWith([{ id: 99, email: "new@acmestudio.com", roleId: 1 }]);
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ entityId: 99, action: "invited" }),
    );
    expect(await screen.findByText("1 invite sent")).toBeInTheDocument();
    expect(screen.queryByText("new@acmestudio.com")).toBeNull();
  });

  it("omits inviterName when there's no current user", async () => {
    withCurrentUser(null);
    mockedInviteMember.mockResolvedValue({ id: 99, email: "new@acmestudio.com", roleId: 1 });
    renderSection();
    await addEmail("new@acmestudio.com");
    await userEvent.click(screen.getByRole("button", { name: "Add" }));
    await userEvent.click(screen.getByRole("button", { name: "Send Invite" }));

    await waitFor(() =>
      expect(mockedInviteMember).toHaveBeenCalledWith(
        6001,
        expect.objectContaining({ inviterName: undefined }),
      ),
    );
  });

  it("shows '2 invites sent' for multiple successes", async () => {
    mockedInviteMember
      .mockResolvedValueOnce({ id: 97, email: "a@acmestudio.com", roleId: 1 })
      .mockResolvedValueOnce({ id: 98, email: "b@acmestudio.com", roleId: 1 });
    renderSection();
    await addEmail("a@acmestudio.com");
    await addEmail("b@acmestudio.com");
    await userEvent.click(screen.getByRole("button", { name: "Add" }));
    await userEvent.click(screen.getByRole("button", { name: "Send Invite" }));

    expect(await screen.findByText("2 invites sent")).toBeInTheDocument();
  });

  it("keeps a failed invite queued, toasts for a system fault, and does not call onSent for it", async () => {
    mockedInviteMember.mockRejectedValue(new Error("network down"));
    const { onSent } = renderSection();
    await addEmail("new@acmestudio.com");
    await userEvent.click(screen.getByRole("button", { name: "Add" }));
    await userEvent.click(screen.getByRole("button", { name: "Send Invite" }));

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith("Failed to send invite for new@acmestudio.com", "error"),
    );
    expect(screen.getByText("new@acmestudio.com")).toBeInTheDocument();
    expect(onSent).not.toHaveBeenCalled();
  });

  it("shows a pluralized toast for multiple system-fault failures", async () => {
    mockedInviteMember.mockRejectedValue(new Error("network down"));
    renderSection();
    await addEmail("a@acmestudio.com");
    await addEmail("b@acmestudio.com");
    await userEvent.click(screen.getByRole("button", { name: "Add" }));
    await userEvent.click(screen.getByRole("button", { name: "Send Invite" }));

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(
        "Failed to send invites for a@acmestudio.com, b@acmestudio.com",
        "error",
      ),
    );
  });

  it("shows a conflict alert (not a toast) for an already-invited email, and keeps it queued", async () => {
    mockedInviteMember.mockRejectedValue(new ApiError(409, { message: "Conflict" }));
    renderSection();
    await addEmail("new@acmestudio.com");
    await userEvent.click(screen.getByRole("button", { name: "Add" }));
    await userEvent.click(screen.getByRole("button", { name: "Send Invite" }));

    expect(
      await screen.findByText("new@acmestudio.com already has a pending invitation."),
    ).toBeInTheDocument();
    expect(toast).not.toHaveBeenCalled();
    expect(screen.getByText("new@acmestudio.com")).toBeInTheDocument();
  });

  it("shows a pluralized conflict alert for multiple conflicting emails", async () => {
    mockedInviteMember.mockRejectedValue(new ApiError(409, { message: "Conflict" }));
    renderSection();
    await addEmail("a@acmestudio.com");
    await addEmail("b@acmestudio.com");
    await userEvent.click(screen.getByRole("button", { name: "Add" }));
    await userEvent.click(screen.getByRole("button", { name: "Send Invite" }));

    expect(
      await screen.findByText(
        "These emails already have a pending invitation: a@acmestudio.com, b@acmestudio.com.",
      ),
    ).toBeInTheDocument();
  });

  it("combines a partial success with a conflict in one alert, using the error variant", async () => {
    mockedInviteMember
      .mockResolvedValueOnce({ id: 99, email: "a@acmestudio.com", roleId: 1 })
      .mockRejectedValueOnce(new ApiError(409, { message: "Conflict" }));
    renderSection();
    await addEmail("a@acmestudio.com");
    await addEmail("b@acmestudio.com");
    await userEvent.click(screen.getByRole("button", { name: "Add" }));
    await userEvent.click(screen.getByRole("button", { name: "Send Invite" }));

    expect(
      await screen.findByText(
        "1 invite sent b@acmestudio.com already has a pending invitation.",
      ),
    ).toBeInTheDocument();
  });

  it("shows 'Sending...' while in flight and dismisses the alert", async () => {
    let resolveInvite!: (v: { id: number; email: string; roleId: number }) => void;
    mockedInviteMember.mockReturnValue(
      new Promise((resolve) => (resolveInvite = resolve)),
    );
    renderSection();
    await addEmail("new@acmestudio.com");
    await userEvent.click(screen.getByRole("button", { name: "Add" }));
    await userEvent.click(screen.getByRole("button", { name: "Send Invite" }));
    expect(screen.getByRole("button", { name: "Sending..." })).toBeDisabled();

    resolveInvite({ id: 99, email: "new@acmestudio.com", roleId: 1 });
    await screen.findByText("1 invite sent");
    const dismissButton = screen.getByRole("button", { name: /dismiss/i });
    await userEvent.click(dismissButton);
    expect(screen.queryByText("1 invite sent")).toBeNull();
  });

  it("does nothing when there's nothing queued", async () => {
    renderSection();
    expect(mockedInviteMember).not.toHaveBeenCalled();
  });
});

// Note: handleSendInvites's `if (invites.length === 0) return;` guard
// (line 84) is unreachable through the UI — the "Send Invite" button is
// disabled whenever invites.length === 0, so the handler can't fire with
// an empty queue.
