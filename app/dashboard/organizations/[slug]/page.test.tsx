import { render, screen } from "@testing-library/react";
import OrganizationPage from "./page";
import { useParams, notFound } from "next/navigation";
import { useOrganizationBySlug } from "@/hooks/use-organization-by-slug";
import { useOrgReferenceData } from "@/hooks/use-org-reference-data";
import { useMembershipBySlug } from "@/hooks/use-membership-by-slug";

jest.mock("next/navigation", () => ({
  useParams: jest.fn(),
  notFound: jest.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  useRouter: jest.fn(() => ({ back: jest.fn() })),
}));
jest.mock("@/hooks/use-organization-by-slug", () => ({ useOrganizationBySlug: jest.fn() }));
jest.mock("@/hooks/use-org-reference-data", () => ({ useOrgReferenceData: jest.fn() }));
jest.mock("@/hooks/use-membership-by-slug", () => ({ useMembershipBySlug: jest.fn() }));
jest.mock("@/components/auth/member-guard", () => function MockMemberGuard(props: any) {
  return (
    <div>
      <span>{`MemberGuard(orgId=${props.organizationId})`}</span>
      {props.children}
    </div>
  );
});
jest.mock("@/components/organization/member-removed-state", () => ({
  MemberRemovedState: function MockMemberRemovedState(props: any) {
    return <div>{`MemberRemovedState(${props.organizationName})`}</div>;
  },
}));
jest.mock("@/components/organization/member/organization-member-tab", () => function MockOrganizationMemberTabs(props: any) {
  return <div>{`OrganizationMemberTabs(${props.organization.id})`}</div>;
});

const mockedUseParams = useParams as jest.Mock;
const mockedUseOrganizationBySlug = useOrganizationBySlug as jest.Mock;
const mockedUseOrgReferenceData = useOrgReferenceData as jest.Mock;
const mockedUseMembershipBySlug = useMembershipBySlug as jest.Mock;

const organization = {
  id: 6001,
  roles: [],
  tags: [],
  capacity: { members: 10, tags: 5, roles: 5, tickets: 10, projects: 10 },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseParams.mockReturnValue({ slug: "acme-studio" });
  mockedUseOrgReferenceData.mockReturnValue({ permissionOptions: [], ruleCategories: [], loading: false });
  mockedUseMembershipBySlug.mockReturnValue(null);
});

it("shows the loading skeleton while the organization is loading", () => {
  mockedUseOrganizationBySlug.mockReturnValue({ organization: null, loading: true });
  const { container } = render(<OrganizationPage />);
  expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
});

it("shows the loading skeleton while reference data is loading", () => {
  mockedUseOrganizationBySlug.mockReturnValue({ organization, loading: false });
  mockedUseOrgReferenceData.mockReturnValue({ permissionOptions: [], ruleCategories: [], loading: true });
  const { container } = render(<OrganizationPage />);
  expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
});

it("shows MemberRemovedState when the caller's own membership is deactivated", () => {
  mockedUseOrganizationBySlug.mockReturnValue({ organization: null, loading: false });
  mockedUseMembershipBySlug.mockReturnValue({
    isActive: false,
    organization: { organizationName: "Acme Studio" },
  });
  render(<OrganizationPage />);
  expect(screen.getByText("MemberRemovedState(Acme Studio)")).toBeInTheDocument();
});

it("calls notFound when there's no organization and no membership at all", () => {
  mockedUseOrganizationBySlug.mockReturnValue({ organization: null, loading: false });
  mockedUseMembershipBySlug.mockReturnValue(null);
  expect(() => render(<OrganizationPage />)).toThrow("NEXT_NOT_FOUND");
  expect(notFound).toHaveBeenCalled();
});

it("calls notFound when there's no organization despite an active membership", () => {
  mockedUseOrganizationBySlug.mockReturnValue({ organization: null, loading: false });
  mockedUseMembershipBySlug.mockReturnValue({
    isActive: true,
    organization: { organizationName: "Acme Studio" },
  });
  expect(() => render(<OrganizationPage />)).toThrow("NEXT_NOT_FOUND");
});

it("renders the back button and member tabs behind MemberGuard once loaded", () => {
  mockedUseOrganizationBySlug.mockReturnValue({ organization, loading: false });
  render(<OrganizationPage />);
  expect(screen.getByText("MemberGuard(orgId=6001)")).toBeInTheDocument();
  expect(screen.getByText("OrganizationMemberTabs(6001)")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();
});
