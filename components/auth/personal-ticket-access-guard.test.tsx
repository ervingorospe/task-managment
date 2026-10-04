import { render, screen } from "@testing-library/react";
import { notFound } from "next/navigation";
import PersonalTicketAccessGuard from "./personal-ticket-access-guard";
import { useAuth } from "@/providers/auth-provider";

jest.mock("next/navigation", () => ({ notFound: jest.fn() }));
jest.mock("@/providers/auth-provider", () => ({ useAuth: jest.fn() }));

const mockedNotFound = notFound as unknown as jest.Mock;
const mockedUseAuth = useAuth as jest.Mock;

beforeEach(() => jest.clearAllMocks());

it("renders nothing while initializing", () => {
  mockedUseAuth.mockReturnValue({ currentUser: null, isInitializing: true });
  const { container } = render(
    <PersonalTicketAccessGuard ownerId={1}>
      <span>content</span>
    </PersonalTicketAccessGuard>,
  );
  expect(container).toBeEmptyDOMElement();
  expect(mockedNotFound).not.toHaveBeenCalled();
});

it("calls notFound() when there's no current user", () => {
  mockedUseAuth.mockReturnValue({ currentUser: null, isInitializing: false });
  render(
    <PersonalTicketAccessGuard ownerId={1}>
      <span>content</span>
    </PersonalTicketAccessGuard>,
  );
  expect(mockedNotFound).toHaveBeenCalled();
});

it("calls notFound() when the current user isn't the owner", () => {
  mockedUseAuth.mockReturnValue({ currentUser: { id: 2 }, isInitializing: false });
  render(
    <PersonalTicketAccessGuard ownerId={1}>
      <span>content</span>
    </PersonalTicketAccessGuard>,
  );
  expect(mockedNotFound).toHaveBeenCalled();
});

it("renders children for the owner", () => {
  mockedUseAuth.mockReturnValue({ currentUser: { id: 1 }, isInitializing: false });
  render(
    <PersonalTicketAccessGuard ownerId={1}>
      <span>content</span>
    </PersonalTicketAccessGuard>,
  );
  expect(screen.getByText("content")).toBeInTheDocument();
});
