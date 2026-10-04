import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OrganizationMembers from "./organization-members";
import { useAuth } from "@/providers/auth-provider";
import { PERMISSIONS } from "@/lib/data/permissions";
import type { OrganizationDetail } from "@/lib/types/organization/organization-detail.type";
import type { MemberInviteDetail } from "@/lib/types/organization/member-invite-detail.type";

jest.mock("@/providers/auth-provider", () => {
  const actual = jest.requireActual("@/providers/auth-provider");
  return { ...actual, useAuth: jest.fn() };
});
jest.mock("./sections/members-section", () => function MockMembersSection(props: any) {
  return (
    <div>{`MembersSection(orgId=${props.orgId}, members=${props.members.map((m: any) => m.id).join(",")})`}</div>
  );
});
jest.mock("./sections/member-invites-section", () => function MockMemberInvitesSection(props: any) {
  return (
    <div>
      {`MemberInvitesSection(orgId=${props.orgId}, capacity=${props.capacity}, totalInvites=${props.currentTotalInvites})`}
      <button onClick={() => props.onSent([{ id: 99, email: "new@acmestudio.com", roleId: 3 }])}>
        send-invite
      </button>
    </div>
  );
});
jest.mock("./sections/member-pending-invites-section", () => function MockMemberPendingInvites(props: any) {
  return (
    <div>
      {`MemberPendingInvites(orgId=${props.orgId}, invites=${props.invites.map((i: any) => i.id).join(",")})`}
      <button onClick={() => props.onInvitesChange(props.invites.filter((i: any) => i.id !== 1))}>
        remove-invite-1
      </button>
    </div>
  );
});

const mockedUseAuth = useAuth as jest.Mock;

function withUser(currentUser: { id: number } | null, actions: string[] = []) {
  mockedUseAuth.mockReturnValue({
    currentUser,
    activeMembership: {
      role: { rules: actions.map((action, i) => ({ id: i, action, name: action, desc: "", categoryId: 1 })) },
    },
    isPersonalMode: false,
  });
}

const pendingInvite: MemberInviteDetail = { id: 1, email: "pending@acmestudio.com", roleId: 3 };

const organization = {
  id: 6001,
  ownerId: 1,
  roles: [],
  capacity: { members: 10, tags: 5, roles: 5, tickets: 10, projects: 10 },
  pendingInvites: [pendingInvite],
  members: [
    { id: 10, user: { id: 1 } }, // owner — excluded
    { id: 11, user: { id: 2 } }, // the current viewer — excluded
    { id: 12, user: { id: 3 } }, // a regular member — visible
  ],
} as unknown as OrganizationDetail;

it("excludes the owner's row and the current viewer's own row from the member list", () => {
  withUser({ id: 2 }, [PERMISSIONS.MEMBER_VIEW_MEMBERS]);
  render(<OrganizationMembers organization={organization} />);
  expect(screen.getByText("MembersSection(orgId=6001, members=12)")).toBeInTheDocument();
});

it("hides the invite sections when showInvites is false", () => {
  withUser({ id: 2 }, [PERMISSIONS.MEMBER_INVITE, PERMISSIONS.MEMBER_VIEW_MEMBERS]);
  render(<OrganizationMembers organization={organization} showInvites={false} />);
  expect(screen.queryByText(/MemberInvitesSection/)).toBeNull();
  expect(screen.queryByText(/MemberPendingInvites/)).toBeNull();
  expect(screen.getByText(/MembersSection/)).toBeInTheDocument();
});

it("hides the invite section without member.invite, but still shows pending invites", () => {
  withUser({ id: 2 }, [PERMISSIONS.MEMBER_VIEW_MEMBERS]);
  render(<OrganizationMembers organization={organization} />);
  expect(screen.queryByText(/MemberInvitesSection/)).toBeNull();
  expect(screen.getByText("MemberPendingInvites(orgId=6001, invites=1)")).toBeInTheDocument();
});

it("appends newly sent invites to the pending invites list", async () => {
  withUser({ id: 2 }, [PERMISSIONS.MEMBER_INVITE]);
  render(<OrganizationMembers organization={organization} />);
  await userEvent.click(screen.getByText("send-invite"));
  expect(screen.getByText("MemberPendingInvites(orgId=6001, invites=1,99)")).toBeInTheDocument();
});

it("removes a pending invite via onInvitesChange", async () => {
  withUser({ id: 2 }, [PERMISSIONS.MEMBER_INVITE]);
  render(<OrganizationMembers organization={organization} />);
  await userEvent.click(screen.getByText("remove-invite-1"));
  expect(screen.getByText("MemberPendingInvites(orgId=6001, invites=)")).toBeInTheDocument();
});

it("defaults pendingInvites to an empty list when the organization has none", () => {
  withUser({ id: 2 }, [PERMISSIONS.MEMBER_INVITE]);
  render(
    <OrganizationMembers
      organization={{ ...organization, pendingInvites: undefined }}
    />,
  );
  expect(screen.getByText("MemberPendingInvites(orgId=6001, invites=)")).toBeInTheDocument();
});

it("hides the members section without any member permission", () => {
  withUser({ id: 2 }, []);
  render(<OrganizationMembers organization={organization} />);
  expect(screen.queryByText(/MembersSection/)).toBeNull();
});
