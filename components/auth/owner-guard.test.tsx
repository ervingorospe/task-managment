import { render, screen } from "@testing-library/react";
import { notFound } from "next/navigation";
import { OwnerGuard } from "./owner-guard";
import { useAuth } from "@/providers/auth-provider";
import { useIsOrganizationOwner } from "@/hooks/use-is-organization-owner";

jest.mock("next/navigation", () => ({ notFound: jest.fn() }));
jest.mock("@/providers/auth-provider", () => ({ useAuth: jest.fn() }));
jest.mock("@/hooks/use-is-organization-owner", () => ({
  useIsOrganizationOwner: jest.fn(),
}));

const mockedNotFound = notFound as unknown as jest.Mock;
const mockedUseAuth = useAuth as jest.Mock;
const mockedUseIsOwner = useIsOrganizationOwner as jest.Mock;

beforeEach(() => jest.clearAllMocks());

it("renders nothing while the session is still initializing", () => {
  mockedUseAuth.mockReturnValue({ isInitializing: true });
  mockedUseIsOwner.mockReturnValue(false);
  const { container } = render(
    <OwnerGuard ownerId={1}>
      <span>content</span>
    </OwnerGuard>,
  );
  expect(container).toBeEmptyDOMElement();
  expect(mockedNotFound).not.toHaveBeenCalled();
});

it("calls notFound() when the current user isn't the owner", () => {
  mockedUseAuth.mockReturnValue({ isInitializing: false });
  mockedUseIsOwner.mockReturnValue(false);
  render(
    <OwnerGuard ownerId={1}>
      <span>content</span>
    </OwnerGuard>,
  );
  expect(mockedNotFound).toHaveBeenCalled();
});

it("renders children for the owner", () => {
  mockedUseAuth.mockReturnValue({ isInitializing: false });
  mockedUseIsOwner.mockReturnValue(true);
  render(
    <OwnerGuard ownerId={1}>
      <span>content</span>
    </OwnerGuard>,
  );
  expect(screen.getByText("content")).toBeInTheDocument();
});
