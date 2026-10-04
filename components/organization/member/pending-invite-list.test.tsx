import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PendingInviteList from "./pending-invite-list";
import type { MemberInviteDetail } from "@/lib/types/organization/member-invite-detail.type";
import type { RoleDetail } from "@/lib/types/organization/role-detail.type";

const NOW = new Date("2026-03-15T12:00:00.000Z");

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

function invite(overrides: Partial<MemberInviteDetail> = {}): MemberInviteDetail {
  return { id: 1, email: "jane@acmestudio.com", roleId: 1, ...overrides };
}

function renderList(overrides: Partial<React.ComponentProps<typeof PendingInviteList>> = {}) {
  const onRemove = jest.fn();
  const onResend = jest.fn();
  render(
    <PendingInviteList
      invites={[invite()]}
      roles={[MANAGER]}
      resendCooldowns={{}}
      onRemove={onRemove}
      onResend={onResend}
      {...overrides}
    />,
  );
  return { onRemove, onResend };
}


it("shows an empty state with no invites", () => {
  renderList({ invites: [] });
  expect(screen.getByText("No pending invitations")).toBeInTheDocument();
  expect(
    screen.getByText("Invitations that have not been accepted will appear here."),
  ).toBeInTheDocument();
});

it("shows the invite's email and resolved role name", () => {
  renderList();
  expect(screen.getByText("jane@acmestudio.com")).toBeInTheDocument();
  expect(screen.getByText("Manager")).toBeInTheDocument();
});

it("falls back to 'No role assigned' when the role can't be resolved", () => {
  renderList({ roles: [] });
  expect(screen.getByText("No role assigned")).toBeInTheDocument();
});

describe("expiry", () => {
  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ["queueMicrotask"] }).setSystemTime(NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("shows no expiry text when the invite has none", () => {
    renderList({ invites: [invite({ expiry: undefined })] });
    expect(screen.queryByText(/·/)).toBeNull();
  });

  it("shows a plain expiry countdown well before the threshold", () => {
    renderList({ invites: [invite({ expiry: new Date(NOW.getTime() + 2 * 60 * 60 * 1000).toISOString() })] });
    expect(screen.getByText("Expires in 2h")).toBeInTheDocument();
  });

  it("shows the 'Expiring soon' chip within the threshold", () => {
    renderList({ invites: [invite({ expiry: new Date(NOW.getTime() + 30 * 60 * 1000).toISOString() })] });
    expect(screen.getByText("Expiring soon")).toBeInTheDocument();
  });

  it("shows the 'Expired' chip and a 're-invite' hint once past expiry", () => {
    renderList({ invites: [invite({ expiry: new Date(NOW.getTime() - 1000).toISOString() })] });
    expect(screen.getByText("Expired")).toBeInTheDocument();
    expect(screen.getByText("Remove and re-invite instead")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Resend invitation" })).toBeNull();
  });
});

describe("resend", () => {
  it("shows the resend button when not on cooldown", async () => {
    const { onResend } = renderList();
    await userEvent.click(screen.getByRole("button", { name: "Resend invitation" }));
    expect(onResend).toHaveBeenCalledWith(1);
  });

  it("shows a cooldown countdown instead of the resend button", () => {
    renderList({ resendCooldowns: { 1: 42 } });
    expect(screen.getByText("Resend in 42s")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Resend invitation" })).toBeNull();
  });
});

it("calls onRemove with the full invite object", async () => {
  const target = invite({ id: 7, email: "marco@acmestudio.com" });
  const { onRemove } = renderList({ invites: [target] });
  await userEvent.click(screen.getByRole("button", { name: "Remove invitation" }));
  expect(onRemove).toHaveBeenCalledWith(target);
});
