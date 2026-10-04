import { render, screen } from "@testing-library/react";
import DashboardLayout from "./layout";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(),
}));
jest.mock("@/providers/auth-provider", () => ({ useAuth: jest.fn() }));
jest.mock("@/providers/activity-log-provider", () => ({
  ActivityLogProvider: function MockActivityLogProvider(props: any) {
    return <div>{props.children}</div>;
  },
}));
jest.mock("@/providers/notifications-provider", () => ({
  NotificationsProvider: function MockNotificationsProvider(props: any) {
    return <div>{props.children}</div>;
  },
}));
jest.mock("@/components/sidebar", () => ({ Sidebar: function MockSidebar() {
  return <div>Sidebar</div>;
} }));
jest.mock("@/components/topbar", () => ({ Topbar: function MockTopbar() {
  return <div>Topbar</div>;
} }));
jest.mock("@/components/organization/organization-disabled-state", () => ({
  OrganizationDisabledState: function MockOrganizationDisabledState(props: any) {
    return <div>{`OrganizationDisabledState(${props.organizationName})`}</div>;
  },
}));
jest.mock("@/components/organization/member-removed-state", () => ({
  MemberRemovedState: function MockMemberRemovedState(props: any) {
    return <div>{`MemberRemovedState(${props.organizationName})`}</div>;
  },
}));

const mockedUsePathname = usePathname as jest.Mock;
const mockedUseRouter = useRouter as jest.Mock;
const mockedUseAuth = useAuth as jest.Mock;

const replace = jest.fn();
const refresh = jest.fn();

function withAuth(overrides: Record<string, unknown> = {}) {
  mockedUseAuth.mockReturnValue({
    isAuthenticated: true,
    isInitializing: false,
    activeOrganization: null,
    activeMembership: null,
    currentUser: { id: 1, hasOnboarded: true },
    ...overrides,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseRouter.mockReturnValue({ replace, refresh });
  mockedUsePathname.mockReturnValue("/dashboard");
  withAuth();
});

it("renders nothing while auth is initializing", () => {
  withAuth({ isInitializing: true, isAuthenticated: false });
  const { container } = render(
    <DashboardLayout>
      <div>Page Content</div>
    </DashboardLayout>,
  );
  expect(container).toBeEmptyDOMElement();
  expect(replace).not.toHaveBeenCalled();
});

it("redirects to /login when not authenticated", () => {
  withAuth({ isInitializing: false, isAuthenticated: false, currentUser: null });
  render(
    <DashboardLayout>
      <div>Page Content</div>
    </DashboardLayout>,
  );
  expect(replace).toHaveBeenCalledWith("/login");
});

it("redirects to /onboarding when the user hasn't onboarded yet", () => {
  withAuth({ currentUser: { id: 1, hasOnboarded: false } });
  const { container } = render(
    <DashboardLayout>
      <div>Page Content</div>
    </DashboardLayout>,
  );
  expect(replace).toHaveBeenCalledWith("/onboarding");
  expect(container).toBeEmptyDOMElement();
});

it("renders children, sidebar, and topbar for an authenticated, onboarded user", () => {
  render(
    <DashboardLayout>
      <div>Page Content</div>
    </DashboardLayout>,
  );
  expect(screen.getByText("Sidebar")).toBeInTheDocument();
  expect(screen.getByText("Topbar")).toBeInTheDocument();
  expect(screen.getByText("Page Content")).toBeInTheDocument();
});

it("shows MemberRemovedState when the active membership is deactivated, on a non-exempt path", () => {
  mockedUsePathname.mockReturnValue("/dashboard/tickets");
  withAuth({
    activeMembership: { isActive: false },
    activeOrganization: { organizationName: "Acme Studio", settings: { isActive: true } },
  });
  render(
    <DashboardLayout>
      <div>Page Content</div>
    </DashboardLayout>,
  );
  expect(screen.getByText("MemberRemovedState(Acme Studio)")).toBeInTheDocument();
  expect(screen.queryByText("Page Content")).toBeNull();
});

it("shows OrganizationDisabledState when the org is disabled and the member is active, on a non-exempt path", () => {
  mockedUsePathname.mockReturnValue("/dashboard/tickets");
  withAuth({
    activeMembership: { isActive: true },
    activeOrganization: { organizationName: "Acme Studio", settings: { isActive: false } },
  });
  render(
    <DashboardLayout>
      <div>Page Content</div>
    </DashboardLayout>,
  );
  expect(screen.getByText("OrganizationDisabledState(Acme Studio)")).toBeInTheDocument();
  expect(screen.queryByText("Page Content")).toBeNull();
});

it("renders children on a non-exempt path when both member and org are active", () => {
  mockedUsePathname.mockReturnValue("/dashboard/tickets");
  withAuth({
    activeMembership: { isActive: true },
    activeOrganization: { organizationName: "Acme Studio", settings: { isActive: true } },
  });
  render(
    <DashboardLayout>
      <div>Page Content</div>
    </DashboardLayout>,
  );
  expect(screen.getByText("Page Content")).toBeInTheDocument();
});

it.each([
  "/dashboard/my-organizations",
  "/dashboard/profile",
  "/dashboard/settings",
  "/dashboard/organizations",
])("ignores a deactivated membership/disabled org on the exempt path %s", (path) => {
  mockedUsePathname.mockReturnValue(path);
  withAuth({
    activeMembership: { isActive: false },
    activeOrganization: { organizationName: "Acme Studio", settings: { isActive: false } },
  });
  render(
    <DashboardLayout>
      <div>Page Content</div>
    </DashboardLayout>,
  );
  expect(screen.getByText("Page Content")).toBeInTheDocument();
});

it("does not refresh the router on the very first render", () => {
  render(
    <DashboardLayout>
      <div>Page Content</div>
    </DashboardLayout>,
  );
  expect(refresh).not.toHaveBeenCalled();
});

it("refreshes the router when the pathname changes after the first render", () => {
  const { rerender } = render(
    <DashboardLayout>
      <div>Page Content</div>
    </DashboardLayout>,
  );
  mockedUsePathname.mockReturnValue("/dashboard/tickets");
  rerender(
    <DashboardLayout>
      <div>Page Content</div>
    </DashboardLayout>,
  );
  expect(refresh).toHaveBeenCalledTimes(1);
});
