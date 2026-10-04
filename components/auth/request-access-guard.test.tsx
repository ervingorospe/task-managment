import { render, screen } from "@testing-library/react";
import { notFound } from "next/navigation";
import RequestAccessGuard from "./request-access-guard";
import { useAuth } from "@/providers/auth-provider";
import { useCanViewRequest } from "@/hooks/use-can-view-request";

jest.mock("next/navigation", () => ({ notFound: jest.fn() }));
jest.mock("@/providers/auth-provider", () => ({ useAuth: jest.fn() }));
jest.mock("@/hooks/use-can-view-request", () => ({ useCanViewRequest: jest.fn() }));

const mockedNotFound = notFound as unknown as jest.Mock;
const mockedUseAuth = useAuth as jest.Mock;
const mockedCanView = useCanViewRequest as jest.Mock;

const REQUEST = { client: {} } as never;

beforeEach(() => jest.clearAllMocks());

it("renders nothing while initializing", () => {
  mockedUseAuth.mockReturnValue({ isInitializing: true });
  mockedCanView.mockReturnValue(false);
  const { container } = render(
    <RequestAccessGuard request={REQUEST}>
      <span>content</span>
    </RequestAccessGuard>,
  );
  expect(container).toBeEmptyDOMElement();
  expect(mockedNotFound).not.toHaveBeenCalled();
});

it("calls notFound() when the caller can't view the request", () => {
  mockedUseAuth.mockReturnValue({ isInitializing: false });
  mockedCanView.mockReturnValue(false);
  render(
    <RequestAccessGuard request={REQUEST}>
      <span>content</span>
    </RequestAccessGuard>,
  );
  expect(mockedNotFound).toHaveBeenCalled();
});

it("renders children when the caller can view the request", () => {
  mockedUseAuth.mockReturnValue({ isInitializing: false });
  mockedCanView.mockReturnValue(true);
  render(
    <RequestAccessGuard request={REQUEST}>
      <span>content</span>
    </RequestAccessGuard>,
  );
  expect(screen.getByText("content")).toBeInTheDocument();
});
