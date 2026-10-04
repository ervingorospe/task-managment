import { render, screen } from "@testing-library/react";
import { notFound } from "next/navigation";
import TicketAccessGuard from "./ticket-access-guard";
import { useAuth } from "@/providers/auth-provider";
import { useCanViewTicket } from "@/hooks/use-can-view-ticket";

jest.mock("next/navigation", () => ({ notFound: jest.fn() }));
jest.mock("@/providers/auth-provider", () => ({ useAuth: jest.fn() }));
jest.mock("@/hooks/use-can-view-ticket", () => ({ useCanViewTicket: jest.fn() }));

const mockedNotFound = notFound as unknown as jest.Mock;
const mockedUseAuth = useAuth as jest.Mock;
const mockedCanView = useCanViewTicket as jest.Mock;

const TICKET = { client: null, assignees: [] };

beforeEach(() => jest.clearAllMocks());

it("renders nothing while initializing", () => {
  mockedUseAuth.mockReturnValue({ isInitializing: true });
  mockedCanView.mockReturnValue(false);
  const { container } = render(
    <TicketAccessGuard ticket={TICKET}>
      <span>content</span>
    </TicketAccessGuard>,
  );
  expect(container).toBeEmptyDOMElement();
  expect(mockedNotFound).not.toHaveBeenCalled();
});

it("calls notFound() when the caller can't view the ticket", () => {
  mockedUseAuth.mockReturnValue({ isInitializing: false });
  mockedCanView.mockReturnValue(false);
  render(
    <TicketAccessGuard ticket={TICKET}>
      <span>content</span>
    </TicketAccessGuard>,
  );
  expect(mockedNotFound).toHaveBeenCalled();
});

it("renders children when the caller can view the ticket", () => {
  mockedUseAuth.mockReturnValue({ isInitializing: false });
  mockedCanView.mockReturnValue(true);
  render(
    <TicketAccessGuard ticket={TICKET}>
      <span>content</span>
    </TicketAccessGuard>,
  );
  expect(screen.getByText("content")).toBeInTheDocument();
});
