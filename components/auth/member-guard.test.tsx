import { render, screen } from "@testing-library/react";
import { notFound } from "next/navigation";
import MemberGuard from "./member-guard";
import { useAuth } from "@/providers/auth-provider";
import { useOrganizationMembershipStatus } from "@/hooks/use-is-organization-member";

jest.mock("next/navigation", () => ({ notFound: jest.fn() }));
jest.mock("@/providers/auth-provider", () => ({ useAuth: jest.fn() }));
jest.mock("@/hooks/use-is-organization-member", () => ({
  useOrganizationMembershipStatus: jest.fn(),
}));

const mockedNotFound = notFound as unknown as jest.Mock;
const mockedUseAuth = useAuth as jest.Mock;
const mockedUseStatus = useOrganizationMembershipStatus as jest.Mock;

beforeEach(() => jest.clearAllMocks());

it("calls notFound() when organizationId is null, before even checking auth", () => {
  mockedUseAuth.mockReturnValue({ isInitializing: false });
  mockedUseStatus.mockReturnValue("active");
  render(
    <MemberGuard organizationId={null}>
      <span>content</span>
    </MemberGuard>,
  );
  expect(mockedNotFound).toHaveBeenCalled();
});

it("renders nothing while the session is still initializing", () => {
  mockedUseAuth.mockReturnValue({ isInitializing: true });
  mockedUseStatus.mockReturnValue("not-member");
  const { container } = render(
    <MemberGuard organizationId={6001}>
      <span>content</span>
    </MemberGuard>,
  );
  expect(container).toBeEmptyDOMElement();
  expect(mockedNotFound).not.toHaveBeenCalled();
});

it("calls notFound() for a non-member once initialized", () => {
  mockedUseAuth.mockReturnValue({ isInitializing: false });
  mockedUseStatus.mockReturnValue("not-member");
  render(
    <MemberGuard organizationId={6001}>
      <span>content</span>
    </MemberGuard>,
  );
  expect(mockedNotFound).toHaveBeenCalled();
});

it("shows the removed state for a deactivated membership", () => {
  mockedUseAuth.mockReturnValue({ isInitializing: false });
  mockedUseStatus.mockReturnValue("deactivated");
  render(
    <MemberGuard organizationId={6001} organizationName="Acme Studio">
      <span>content</span>
    </MemberGuard>,
  );
  expect(screen.getByText(/no longer have access/)).toBeInTheDocument();
  expect(screen.getByText(/Acme Studio/)).toBeInTheDocument();
});

it("uses a generic org name in the removed state when none is given", () => {
  mockedUseAuth.mockReturnValue({ isInitializing: false });
  mockedUseStatus.mockReturnValue("deactivated");
  render(
    <MemberGuard organizationId={6001}>
      <span>content</span>
    </MemberGuard>,
  );
  expect(screen.getByText(/This organization/)).toBeInTheDocument();
});

it("shows the disabled state when the org itself is inactive", () => {
  mockedUseAuth.mockReturnValue({ isInitializing: false });
  mockedUseStatus.mockReturnValue("active");
  render(
    <MemberGuard organizationId={6001} organizationName="Acme Studio" isActive={false}>
      <span>content</span>
    </MemberGuard>,
  );
  expect(screen.getByText("Organization disabled")).toBeInTheDocument();
});

it("uses a generic org name in the disabled state when none is given", () => {
  mockedUseAuth.mockReturnValue({ isInitializing: false });
  mockedUseStatus.mockReturnValue("active");
  render(
    <MemberGuard organizationId={6001} isActive={false}>
      <span>content</span>
    </MemberGuard>,
  );
  expect(screen.getByText(/This organization/)).toBeInTheDocument();
});

it("renders children for an active member of an active org", () => {
  mockedUseAuth.mockReturnValue({ isInitializing: false });
  mockedUseStatus.mockReturnValue("active");
  render(
    <MemberGuard organizationId={6001}>
      <span>content</span>
    </MemberGuard>,
  );
  expect(screen.getByText("content")).toBeInTheDocument();
});
