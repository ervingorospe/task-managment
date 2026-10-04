import { render, screen } from "@testing-library/react";
import TicketPage from "./page";
import { useParams, notFound } from "next/navigation";
import { useTicketById } from "@/hooks/use-ticket-by-id";

jest.mock("next/navigation", () => ({
  useParams: jest.fn(),
  notFound: jest.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));
jest.mock("@/hooks/use-ticket-by-id", () => ({ useTicketById: jest.fn() }));
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
jest.mock("@/components/auth/ticket-access-guard", () => function MockTicketAccessGuard(props: any) {
  return (
    <div>
      <span>TicketAccessGuard</span>
      {props.children}
    </div>
  );
});
jest.mock("@/components/auth/personal-ticket-access-guard", () => function MockPersonalTicketAccessGuard(props: any) {
  return (
    <div>
      <span>{`PersonalTicketAccessGuard(ownerId=${props.ownerId})`}</span>
      {props.children}
    </div>
  );
});
jest.mock("@/components/ticket/ticket-detail-client", () => function MockTicketDetailClient(props: any) {
  return <div>{`TicketDetailClient(${props.ticket.title})`}</div>;
});
jest.mock("@/components/ticket/personal-ticket-detail-client", () => function MockPersonalTicketDetailClient(props: any) {
  return <div>{`PersonalTicketDetailClient(${props.ticket.title})`}</div>;
});

const mockedUseParams = useParams as jest.Mock;
const mockedNotFound = notFound as unknown as jest.Mock;
const mockedUseTicketById = useTicketById as jest.Mock;

const ticket = {
  id: 1,
  referenceId: "TCK-1",
  orgId: 6001,
  title: "Fix the thing",
  attachments: [],
  tag: { id: 1, tagName: "Bug", color: "#fff", isDefault: false },
  client: null,
  assignees: [],
  dueDate: null,
  starred: false,
  createdAt: "2026-01-01",
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
  mockedUseParams.mockReturnValue({ id: "not-a-number" });
  mockedUseTicketById.mockReturnValue({
    ticket: null,
    organization: null,
    loading: false,
    notFound: false,
  });
  expect(() => render(<TicketPage />)).toThrow("NEXT_NOT_FOUND");
  expect(mockedNotFound).toHaveBeenCalled();
});

it("renders the loading skeleton while loading", () => {
  mockedUseTicketById.mockReturnValue({
    ticket: null,
    organization: null,
    loading: true,
    notFound: false,
  });
  render(<TicketPage />);
  expect(screen.getByText("Loading...")).toBeInTheDocument();
});

it("calls notFound when the hook reports not found", () => {
  mockedUseTicketById.mockReturnValue({
    ticket: null,
    organization: null,
    loading: false,
    notFound: true,
  });
  expect(() => render(<TicketPage />)).toThrow("NEXT_NOT_FOUND");
});

it("calls notFound when there's no ticket despite loading having finished", () => {
  mockedUseTicketById.mockReturnValue({
    ticket: null,
    organization: null,
    loading: false,
    notFound: false,
  });
  expect(() => render(<TicketPage />)).toThrow("NEXT_NOT_FOUND");
});

it("renders the personal ticket flow when there's no organization", () => {
  mockedUseTicketById.mockReturnValue({
    ticket: { ...ticket, orgId: null, ownerId: 1 },
    organization: null,
    loading: false,
    notFound: false,
  });
  render(<TicketPage />);
  expect(screen.getByText("PersonalTicketAccessGuard(ownerId=1)")).toBeInTheDocument();
  expect(screen.getByText("PersonalTicketDetailClient(Fix the thing)")).toBeInTheDocument();
});

it("renders the organization ticket flow behind MemberGuard and TicketAccessGuard", () => {
  mockedUseTicketById.mockReturnValue({
    ticket,
    organization,
    loading: false,
    notFound: false,
  });
  render(<TicketPage />);
  expect(
    screen.getByText("MemberGuard(orgId=6001, orgName=Acme Studio, active=true)"),
  ).toBeInTheDocument();
  expect(screen.getByText("TicketAccessGuard")).toBeInTheDocument();
  expect(screen.getByText("TicketDetailClient(Fix the thing)")).toBeInTheDocument();
});
