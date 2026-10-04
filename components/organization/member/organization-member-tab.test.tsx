jest.mock("@/components/organization/own/panels/organization-members", () => ({
  __esModule: true,
  default: () => <div data-testid="organization-members" />,
}));
jest.mock("@/components/organization/member/organization-tab", () => ({
  __esModule: true,
  default: () => <div data-testid="organization-info-tab" />,
}));
jest.mock("@/components/organization/ticket-reports/ticket-reports", () => ({
  __esModule: true,
  default: () => <div data-testid="ticket-reports" />,
}));

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OrganizationMemberTabs from "./organization-member-tab";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { PERMISSIONS } from "@/lib/data/permissions";
import type { OrganizationDetail } from "@/lib/types/organization/organization-detail.type";

jest.mock("@/providers/auth-provider", () => {
  const actual = jest.requireActual("@/providers/auth-provider");
  return { ...actual, useAuth: jest.fn() };
});
jest.mock("@/providers/toast-provider", () => ({ useToast: jest.fn() }));

const mockedUseAuth = useAuth as jest.Mock;

function org(overrides: Partial<OrganizationDetail> = {}): OrganizationDetail {
  return {
    id: 6001,
    organizationName: "Acme Studio",
    organizationDesc: "A design studio",
    ownerId: 1,
    settings: { isActive: true, logo: "https://cdn/logo.png" } as OrganizationDetail["settings"],
    capacity: {} as OrganizationDetail["capacity"],
    owner: {} as OrganizationDetail["owner"],
    roles: [],
    tags: [],
    projects: [],
    members: [],
    tickets: [],
    ticketRequests: [],
    ...overrides,
  } as OrganizationDetail;
}

function withAuth({
  userId = 2,
  actions = [] as string[],
}: { userId?: number; actions?: string[] } = {}) {
  mockedUseAuth.mockReturnValue({
    currentUser: { id: userId },
    isAuthenticated: true,
    activeMembership: {
      role: {
        rules: actions.map((action, i) => ({ id: i, action, name: action, desc: "", categoryId: 1 })),
      },
    },
    isPersonalMode: false,
  });
}

beforeEach(() => {
  withAuth({
    userId: 2,
    actions: [PERMISSIONS.MEMBER_VIEW_MEMBERS, PERMISSIONS.REPORT_VIEW_ALL],
  });
  (useToast as jest.Mock).mockReturnValue(jest.fn());
});

describe("disabled organization", () => {
  it("shows the disabled state with a Leave button for a non-owner", async () => {
    render(<OrganizationMemberTabs organization={org({ settings: { isActive: false, logo: "" } as OrganizationDetail["settings"] })} />);
    expect(screen.getByText("Organization disabled")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Leave Organization" })).toBeInTheDocument();
  });

  it("hides the Leave button for the owner", () => {
    withAuth({ userId: 1, actions: [] });
    render(<OrganizationMemberTabs organization={org({ settings: { isActive: false, logo: "" } as OrganizationDetail["settings"] })} />);
    expect(screen.getByText("Organization disabled")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Leave Organization" })).toBeNull();
  });
});

describe("active organization", () => {
  it("shows the org name, description, and the Info tab by default", () => {
    render(<OrganizationMemberTabs organization={org()} />);
    expect(screen.getByText("Acme Studio")).toBeInTheDocument();
    expect(screen.getByText("A design studio")).toBeInTheDocument();
    expect(screen.getByTestId("organization-info-tab")).toBeInTheDocument();
  });

  it("shows the leave section on the Info tab for a non-owner", () => {
    render(<OrganizationMemberTabs organization={org()} />);
    expect(screen.getByText("Leave this organization")).toBeInTheDocument();
  });

  it("hides the leave section on the Info tab for the owner", () => {
    withAuth({ userId: 1, actions: [] });
    render(<OrganizationMemberTabs organization={org()} />);
    expect(screen.queryByText("Leave this organization")).toBeNull();
  });

  it("switches to the Members tab and shows the members panel", async () => {
    render(<OrganizationMemberTabs organization={org()} />);
    await userEvent.click(screen.getByRole("button", { name: "Members" }));
    expect(screen.getByTestId("organization-members")).toBeInTheDocument();
    expect(screen.queryByTestId("organization-info-tab")).toBeNull();
  });

  it("switches to the Tickets tab and shows reports", async () => {
    render(<OrganizationMemberTabs organization={org()} />);
    await userEvent.click(screen.getByRole("button", { name: "Tickets" }));
    expect(screen.getByTestId("ticket-reports")).toBeInTheDocument();
  });

  it("hides the Members tab button without member.view_members", () => {
    withAuth({ userId: 2, actions: [PERMISSIONS.REPORT_VIEW_ALL] });
    render(<OrganizationMemberTabs organization={org()} />);
    expect(screen.queryByRole("button", { name: "Members" })).toBeNull();
  });

  it("hides the Tickets tab button without report.view_all", () => {
    withAuth({ userId: 2, actions: [PERMISSIONS.MEMBER_VIEW_MEMBERS] });
    render(<OrganizationMemberTabs organization={org()} />);
    expect(screen.queryByRole("button", { name: "Tickets" })).toBeNull();
  });

  it("always shows the Info tab regardless of permissions", () => {
    withAuth({ userId: 2, actions: [] });
    render(<OrganizationMemberTabs organization={org()} />);
    expect(screen.getByRole("button", { name: "Info" })).toBeInTheDocument();
  });
});
