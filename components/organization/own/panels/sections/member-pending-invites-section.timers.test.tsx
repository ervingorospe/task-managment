// Isolated in its own file: mixing fake timers with the rest of the
// suite's real-timer tests in one file corrupted coverage instrumentation
// for unrelated statements in that file (observed empirically — moving
// the fake-timer test out fixed it).
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MemberPendingInvites from "./member-pending-invites-section";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { useLogActivity } from "@/hooks/use-log-activity";
import { resendInvite } from "@/lib/api/members";
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
const mockedUseLogActivity = useLogActivity as jest.Mock;
const mockedResendInvite = resendInvite as jest.Mock;

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

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseAuth.mockReturnValue({
    activeMembership: {
      role: { rules: [{ id: 1, action: PERMISSIONS.MEMBER_INVITE, name: "", desc: "", categoryId: 1 }] },
    },
    isPersonalMode: false,
  });
  (useToast as jest.Mock).mockReturnValue(jest.fn());
  mockedUseLogActivity.mockReturnValue(jest.fn());
});

afterEach(() => {
  jest.useRealTimers();
});

it("ticks the resend cooldown down every second, clearing it at zero", async () => {
  jest.useFakeTimers();
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  mockedResendInvite.mockResolvedValue(invite());
  render(
    <MemberPendingInvites orgId={6001} invites={[invite()]} roles={[MANAGER]} onInvitesChange={jest.fn()} />,
  );

  await user.click(screen.getByRole("button", { name: "Resend invitation" }));
  expect(await screen.findByText("Resend in 300s")).toBeInTheDocument();

  jest.advanceTimersByTime(1000);
  expect(await screen.findByText("Resend in 299s")).toBeInTheDocument();

  jest.advanceTimersByTime(299_000);
  expect(await screen.findByRole("button", { name: "Resend invitation" })).toBeInTheDocument();
});
