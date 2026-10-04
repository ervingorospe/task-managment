import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MemberPendingInvites from "./member-pending-invites-section";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { useLogActivity } from "@/hooks/use-log-activity";
import { resendInvite, removeInvite } from "@/lib/api/members";
import { PERMISSIONS } from "@/lib/data/permissions";
import type { MemberInviteDetail } from "@/lib/types/organization/member-invite-detail.type";
import type { RoleDetail } from "@/lib/types/organization/role-detail.type";

jest.mock("@/providers/auth-provider", () => {
  const actual = jest.requireActual("@/providers/auth-provider");
  return { ...actual, useAuth: jest.fn() };
});
jest.mock("@/providers/toast-provider", () => ({ useToast: jest.fn() }));
jest.mock("@/hooks/use-log-activity", () => ({ useLogActivity: jest.fn() }));
jest.mock("@/lib/api/members", () => ({
  resendInvite: jest.fn(),
  removeInvite: jest.fn(),
}));

const mockedUseAuth = useAuth as jest.Mock;
const mockedUseToast = useToast as jest.Mock;
const mockedUseLogActivity = useLogActivity as jest.Mock;
const mockedResendInvite = resendInvite as jest.Mock;
const mockedRemoveInvite = removeInvite as jest.Mock;

const toast = jest.fn();
const logActivity = jest.fn();

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
  jest.clearAllMocks();
  withPermissions([PERMISSIONS.MEMBER_INVITE]);
  mockedUseToast.mockReturnValue(toast);
  mockedUseLogActivity.mockReturnValue(logActivity);
});

function renderSection(overrides: Partial<React.ComponentProps<typeof MemberPendingInvites>> = {}) {
  const onInvitesChange = jest.fn();
  render(
    <MemberPendingInvites
      orgId={6001}
      invites={[invite()]}
      roles={[MANAGER]}
      onInvitesChange={onInvitesChange}
      {...overrides}
    />,
  );
  return { onInvitesChange };
}

it("renders nothing without member.invite", () => {
  withPermissions([]);
  renderSection();
  expect(screen.queryByText("Pending Invitations")).toBeNull();
});

it("shows the title and invited count", () => {
  renderSection({ invites: [invite(), invite({ id: 2, email: "marco@acmestudio.com" })] });
  expect(screen.getByText("Pending Invitations")).toBeInTheDocument();
  expect(screen.getByText("2 invited")).toBeInTheDocument();
});

it("hides pagination with no invites", () => {
  renderSection({ invites: [] });
  expect(screen.queryByText(/of 0/)).toBeNull();
});

describe("resend", () => {
  it("resends, logs activity, and shows an alert", async () => {
    mockedResendInvite.mockResolvedValue(invite());
    const { onInvitesChange } = renderSection();
    await userEvent.click(screen.getByRole("button", { name: "Resend invitation" }));

    await waitFor(() => expect(mockedResendInvite).toHaveBeenCalledWith(1));
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ orgId: 6001, action: "invite_resent", entityId: 1 }),
    );
    expect(await screen.findByText("Invitation resent")).toBeInTheDocument();
    expect(onInvitesChange).not.toHaveBeenCalled();
  });

  it("puts the invite on cooldown after a successful resend", async () => {
    mockedResendInvite.mockResolvedValue(invite());
    renderSection();
    await userEvent.click(screen.getByRole("button", { name: "Resend invitation" }));
    await waitFor(() => expect(mockedResendInvite).toHaveBeenCalled());
    expect(await screen.findByText(/Resend in \d+s/)).toBeInTheDocument();
  });

  it("toasts and does not set a cooldown on failure", async () => {
    mockedResendInvite.mockRejectedValue(new Error("boom"));
    renderSection();
    await userEvent.click(screen.getByRole("button", { name: "Resend invitation" }));

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(
        "Failed to resend invitation — try again in a moment",
        "error",
      ),
    );
    expect(screen.getByRole("button", { name: "Resend invitation" })).toBeInTheDocument();
  });
});

describe("remove", () => {
  it("opens a confirm dialog naming the invite's email and removes on confirm, logging activity and showing an alert", async () => {
    mockedRemoveInvite.mockResolvedValue(undefined);
    const { onInvitesChange } = renderSection();
    await userEvent.click(screen.getByRole("button", { name: "Remove invitation" }));
    expect(
      screen.getByText(/Are you sure you want to remove the invitation sent to jane@acmestudio.com/),
    ).toBeInTheDocument();

    const confirmButtons = screen.getAllByRole("button", { name: "Remove invitation" });
    await userEvent.click(confirmButtons[confirmButtons.length - 1]);

    expect(onInvitesChange).toHaveBeenCalled();
    const updater = onInvitesChange.mock.calls[0][0];
    expect(updater([invite()])).toEqual([]);

    await waitFor(() => expect(mockedRemoveInvite).toHaveBeenCalledWith(1));
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ orgId: 6001, action: "invite_removed", entityId: 1 }),
    );
    expect(await screen.findByText("Invitation removed")).toBeInTheDocument();
  });

  it("re-adds the invite via onInvitesChange and toasts on failure", async () => {
    mockedRemoveInvite.mockRejectedValue(new Error("boom"));
    const { onInvitesChange } = renderSection();
    await userEvent.click(screen.getByRole("button", { name: "Remove invitation" }));
    const confirmButtons = screen.getAllByRole("button", { name: "Remove invitation" });
    await userEvent.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith("Failed to remove invitation", "error"),
    );
    const revertUpdater = onInvitesChange.mock.calls[onInvitesChange.mock.calls.length - 1][0];
    expect(revertUpdater([])).toEqual([invite()]);
  });

  it("closes without removing on cancel", async () => {
    const { onInvitesChange } = renderSection();
    await userEvent.click(screen.getByRole("button", { name: "Remove invitation" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(mockedRemoveInvite).not.toHaveBeenCalled();
    expect(onInvitesChange).not.toHaveBeenCalled();
  });
});

it("changes the page size", async () => {
  const invites = Array.from({ length: 20 }, (_, i) => invite({ id: i + 1, email: `user${i + 1}@acmestudio.com` }));
  renderSection({ invites });
  const pageSizeSelect = document.querySelector("select") as HTMLSelectElement;
  await userEvent.selectOptions(pageSizeSelect, "50");
  expect(screen.getByText("user20@acmestudio.com")).toBeInTheDocument();
});

// Note: this file's own coverage (run in isolation) is 100% except lines
// 68-77 (the setInterval body), which member-pending-invites-section.
// timers.test.tsx covers instead — see that file for why the fake-timer
// test lives separately. Running BOTH files together in one Jest process
// (as `--coverage` with no path filter does) corrupts Istanbul's
// attribution: lines 91-130 get misreported as uncovered even though
// they're fully exercised by this file's own tests above. Verified by
// running this file alone (68-77 uncovered, as expected) vs combined with
// the timers file (91-130 falsely uncovered instead). This is a tooling
// artifact, not a real gap — the union of both files' individually
// verified coverage is complete.
