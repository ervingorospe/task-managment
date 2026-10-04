import { render, screen } from "@testing-library/react";
import RequestPage from "./page";
import { useParams, notFound } from "next/navigation";
import { useTicketRequestById } from "@/hooks/use-ticket-request-by-id";

jest.mock("next/navigation", () => ({
  useParams: jest.fn(),
  notFound: jest.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));
jest.mock("@/hooks/use-ticket-request-by-id", () => ({ useTicketRequestById: jest.fn() }));
jest.mock("./loading", () => function MockLoading() {
  return <div>Loading...</div>;
});
jest.mock("@/components/auth/member-guard", () => function MockMemberGuard(props: any) {
  return (
    <div>
      <span>{`MemberGuard(orgId=${props.organizationId}, orgName=${props.organizationName}, active=${props.isActive})`}</span>
      {props.children}
    </div>
  );
});
jest.mock("@/components/auth/request-access-guard", () => function MockRequestAccessGuard(props: any) {
  return (
    <div>
      <span>RequestAccessGuard</span>
      {props.children}
    </div>
  );
});
jest.mock("@/components/organization/requests/request-detail-client", () => function MockRequestDetailClient(props: any) {
  return <div>{`RequestDetailClient(${props.request.title})`}</div>;
});

const mockedUseParams = useParams as jest.Mock;
const mockedUseTicketRequestById = useTicketRequestById as jest.Mock;

const request = {
  id: 1,
  referenceId: "REQ-1",
  orgId: 6001,
  title: "Need a new laptop",
  attachments: [],
  client: { id: 1 },
  ticketId: null,
  status: "pending",
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
};

const organization = {
  id: 6001,
  organizationName: "Acme Studio",
  settings: { isActive: true },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseParams.mockReturnValue({ id: "1" });
});

it("calls notFound when the id isn't a finite number", () => {
  mockedUseParams.mockReturnValue({ id: "nope" });
  mockedUseTicketRequestById.mockReturnValue({
    request: null,
    organization: null,
    loading: false,
    notFound: false,
  });
  expect(() => render(<RequestPage />)).toThrow("NEXT_NOT_FOUND");
  expect(notFound).toHaveBeenCalled();
});

it("renders the loading skeleton while loading", () => {
  mockedUseTicketRequestById.mockReturnValue({
    request: null,
    organization: null,
    loading: true,
    notFound: false,
  });
  render(<RequestPage />);
  expect(screen.getByText("Loading...")).toBeInTheDocument();
});

it("calls notFound when the hook reports not found", () => {
  mockedUseTicketRequestById.mockReturnValue({
    request: null,
    organization: null,
    loading: false,
    notFound: true,
  });
  expect(() => render(<RequestPage />)).toThrow("NEXT_NOT_FOUND");
});

it("calls notFound when there's no request despite loading having finished", () => {
  mockedUseTicketRequestById.mockReturnValue({
    request: null,
    organization: organization,
    loading: false,
    notFound: false,
  });
  expect(() => render(<RequestPage />)).toThrow("NEXT_NOT_FOUND");
});

it("calls notFound when there's no organization despite loading having finished", () => {
  mockedUseTicketRequestById.mockReturnValue({
    request,
    organization: null,
    loading: false,
    notFound: false,
  });
  expect(() => render(<RequestPage />)).toThrow("NEXT_NOT_FOUND");
});

it("renders the request detail flow behind MemberGuard and RequestAccessGuard", () => {
  mockedUseTicketRequestById.mockReturnValue({
    request,
    organization,
    loading: false,
    notFound: false,
  });
  render(<RequestPage />);
  expect(
    screen.getByText("MemberGuard(orgId=6001, orgName=Acme Studio, active=true)"),
  ).toBeInTheDocument();
  expect(screen.getByText("RequestAccessGuard")).toBeInTheDocument();
  expect(screen.getByText("RequestDetailClient(Need a new laptop)")).toBeInTheDocument();
});
