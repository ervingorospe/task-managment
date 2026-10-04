import { render, screen } from "@testing-library/react";
import ProjectsPage from "./page";
import { useParams, notFound } from "next/navigation";
import { useOrganizationBySlug } from "@/hooks/use-organization-by-slug";
import { useMembershipBySlug } from "@/hooks/use-membership-by-slug";
import { useAuth } from "@/providers/auth-provider";
import { PERMISSIONS } from "@/lib/data/permissions";

jest.mock("next/navigation", () => ({
  useParams: jest.fn(),
  notFound: jest.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));
jest.mock("@/hooks/use-organization-by-slug", () => ({ useOrganizationBySlug: jest.fn() }));
jest.mock("@/hooks/use-membership-by-slug", () => ({ useMembershipBySlug: jest.fn() }));
jest.mock("@/providers/auth-provider", () => {
  const actual = jest.requireActual("@/providers/auth-provider");
  return { ...actual, useAuth: jest.fn() };
});
jest.mock("@/components/organization/member-removed-state", () => ({
  MemberRemovedState: function MockMemberRemovedState(props: any) {
    return <div>{`MemberRemovedState(${props.organizationName})`}</div>;
  },
}));
jest.mock("@/components/organization/project/projects-page-client", () => function MockProjectsPageClient(props: any) {
  return <div>{`ProjectsPageClient(${props.organization.id})`}</div>;
});

const mockedUseParams = useParams as jest.Mock;
const mockedUseOrganizationBySlug = useOrganizationBySlug as jest.Mock;
const mockedUseMembershipBySlug = useMembershipBySlug as jest.Mock;
const mockedUseAuth = useAuth as jest.Mock;

const organization = {
  id: 6001,
  organizationName: "Acme Studio",
  settings: { isActive: true },
};

function withPermissions(actions: string[]) {
  mockedUseAuth.mockReturnValue({
    activeMembership: {
      role: { rules: actions.map((action, i) => ({ id: i, action, name: action, desc: "", categoryId: 1 })) },
    },
    isPersonalMode: false,
    isAuthenticated: true,
    isInitializing: false,
    currentUser: { id: 1, memberships: [{ organization: { id: 6001 }, isActive: true }] },
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseParams.mockReturnValue({ slug: "acme-studio" });
  mockedUseMembershipBySlug.mockReturnValue(null);
  withPermissions([PERMISSIONS.PROJECT_VIEW]);
});

it("shows the loading skeleton while loading", () => {
  mockedUseOrganizationBySlug.mockReturnValue({ organization: null, loading: true });
  const { container } = render(<ProjectsPage />);
  expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
});

it("shows MemberRemovedState when the caller's own membership is deactivated", () => {
  mockedUseOrganizationBySlug.mockReturnValue({ organization: null, loading: false });
  mockedUseMembershipBySlug.mockReturnValue({
    isActive: false,
    organization: { organizationName: "Acme Studio" },
  });
  render(<ProjectsPage />);
  expect(screen.getByText("MemberRemovedState(Acme Studio)")).toBeInTheDocument();
});

it("calls notFound when there's no organization", () => {
  mockedUseOrganizationBySlug.mockReturnValue({ organization: null, loading: false });
  expect(() => render(<ProjectsPage />)).toThrow("NEXT_NOT_FOUND");
  expect(notFound).toHaveBeenCalled();
});

it("shows a permission fallback without any project permission", () => {
  mockedUseOrganizationBySlug.mockReturnValue({ organization, loading: false });
  withPermissions([]);
  render(<ProjectsPage />);
  expect(screen.getByText("You do not have permission to view projects.")).toBeInTheDocument();
});

it("renders the projects page client", () => {
  mockedUseOrganizationBySlug.mockReturnValue({ organization, loading: false });
  render(<ProjectsPage />);
  expect(screen.getByText("ProjectsPageClient(6001)")).toBeInTheDocument();
});
