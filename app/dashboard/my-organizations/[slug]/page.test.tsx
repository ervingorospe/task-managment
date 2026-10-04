import { render, screen } from "@testing-library/react";
import OrganizationPage from "./page";
import { useParams, notFound } from "next/navigation";
import { useOrganizationBySlug } from "@/hooks/use-organization-by-slug";
import { useOrgReferenceData } from "@/hooks/use-org-reference-data";

jest.mock("next/navigation", () => ({
  useParams: jest.fn(),
  notFound: jest.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  useRouter: jest.fn(() => ({ back: jest.fn() })),
}));
jest.mock("@/hooks/use-organization-by-slug", () => ({ useOrganizationBySlug: jest.fn() }));
jest.mock("@/hooks/use-org-reference-data", () => ({ useOrgReferenceData: jest.fn() }));
jest.mock("@/components/organization/own/organization-tabs", () => function MockOrganizationTabs(props: any) {
  return <div>{`OrganizationTabs(${props.organization.id})`}</div>;
});
jest.mock("@/components/auth/owner-guard", () => ({
  OwnerGuard: function MockOwnerGuard(props: any) {
    return (
      <div>
        <span>{`OwnerGuard(ownerId=${props.ownerId})`}</span>
        {props.children}
      </div>
    );
  },
}));

const mockedUseParams = useParams as jest.Mock;
const mockedUseOrganizationBySlug = useOrganizationBySlug as jest.Mock;
const mockedUseOrgReferenceData = useOrgReferenceData as jest.Mock;

const organization = {
  id: 6001,
  ownerId: 1,
  roles: [],
  tags: [],
  capacity: { members: 10, tags: 5, roles: 5, tickets: 10, projects: 10 },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseParams.mockReturnValue({ slug: "acme-studio" });
  mockedUseOrgReferenceData.mockReturnValue({
    permissionOptions: [],
    ruleCategories: [],
    loading: false,
  });
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

it("calls notFound when there's no organization for the slug", () => {
  mockedUseOrganizationBySlug.mockReturnValue({ organization: null, loading: false });
  expect(() => render(<OrganizationPage />)).toThrow("NEXT_NOT_FOUND");
  expect(notFound).toHaveBeenCalled();
});

it("renders the back button and organization tabs behind OwnerGuard once loaded", () => {
  mockedUseOrganizationBySlug.mockReturnValue({ organization, loading: false });
  render(<OrganizationPage />);
  expect(screen.getByText("OwnerGuard(ownerId=1)")).toBeInTheDocument();
  expect(screen.getByText("OrganizationTabs(6001)")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();
});
