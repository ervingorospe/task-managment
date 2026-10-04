import { render, screen } from "@testing-library/react";
import DashboardClient from "./dashboard-client";
import { useAuth } from "@/providers/auth-provider";
import { useActiveOrganizationDetail } from "@/hooks/use-active-organization-detail";
import { useOrgReportData } from "@/hooks/use-org-report-data";
import { usePersonalTicketData } from "@/hooks/use-personal-ticket-data";
import { getDefaultTags } from "@/lib/data/organizations";

jest.mock("@/providers/auth-provider", () => ({ useAuth: jest.fn() }));
jest.mock("@/hooks/use-active-organization-detail", () => ({
  useActiveOrganizationDetail: jest.fn(),
}));
jest.mock("@/hooks/use-org-report-data", () => ({ useOrgReportData: jest.fn() }));
jest.mock("@/hooks/use-personal-ticket-data", () => ({ usePersonalTicketData: jest.fn() }));
jest.mock("@/lib/data/organizations", () => ({ getDefaultTags: jest.fn() }));

jest.mock("@/components/organization/ticket-reports/status-breakdown-chart", () => ({
  StatusBreakdownChart: () => <div data-testid="status-breakdown-chart" />,
}));
jest.mock("@/components/organization/ticket-reports/status-pie-chart", () => ({
  StatusPieChart: () => <div data-testid="status-pie-chart" />,
}));
jest.mock("@/components/organization/ticket-reports/trend-series-select", () => ({
  TrendSeriesSelect: () => <div data-testid="trend-series-select" />,
}));
jest.mock("@/components/organization/ticket-reports/trend-line-chart", () => ({
  TrendLineChart: () => <div data-testid="trend-line-chart" />,
}));

const mockedUseAuth = useAuth as jest.Mock;
const mockedUseOrgDetail = useActiveOrganizationDetail as jest.Mock;
const mockedUseOrgReportData = useOrgReportData as jest.Mock;
const mockedUsePersonalTicketData = usePersonalTicketData as jest.Mock;
const mockedGetDefaultTags = getDefaultTags as jest.Mock;

const ORG = {
  organizationName: "Acme Studio",
  settings: { slug: "acme-studio" },
  tags: [],
};

function ticket(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 1,
    referenceId: "TCK-1",
    orgId: 6001,
    title: "Fix the login page",
    attachments: [],
    tag: { id: 1, tagName: "To Do", color: "#000", isDefault: true, isDeleted: false },
    client: null,
    assignees: [],
    dueDate: null,
    starred: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function request(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 1,
    referenceId: "REQ-1",
    orgId: 6001,
    title: "New ticket please",
    status: "pending",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockedGetDefaultTags.mockResolvedValue([]);
  mockedUsePersonalTicketData.mockReturnValue({ tickets: [], loading: false });
});

it("shows an empty state when in org mode with no active organization", () => {
  mockedUseAuth.mockReturnValue({ activeOrganization: null, isPersonalMode: false });
  mockedUseOrgDetail.mockReturnValue(null);
  mockedUseOrgReportData.mockReturnValue({ tickets: [], requests: [], loading: false });
  render(<DashboardClient />);
  expect(
    screen.getByText("Join or create an organization to see your dashboard."),
  ).toBeInTheDocument();
});

it("shows a loading skeleton while org data loads", () => {
  mockedUseAuth.mockReturnValue({ activeOrganization: ORG, isPersonalMode: false });
  mockedUseOrgDetail.mockReturnValue(ORG);
  mockedUseOrgReportData.mockReturnValue({ tickets: [], requests: [], loading: true });
  const { container } = render(<DashboardClient />);
  expect(container.querySelector(".animate-pulse")).not.toBeNull();
});

it("shows a loading skeleton in Personal mode while data loads", () => {
  mockedUseAuth.mockReturnValue({ activeOrganization: null, isPersonalMode: true });
  mockedUseOrgDetail.mockReturnValue(null);
  mockedUseOrgReportData.mockReturnValue({ tickets: [], requests: [], loading: false });
  mockedUsePersonalTicketData.mockReturnValue({ tickets: [], loading: true });
  const { container } = render(<DashboardClient />);
  expect(container.querySelector(".animate-pulse")).not.toBeNull();
});

it("renders the org's name and links Tickets/Requests to org-scoped routes", () => {
  mockedUseAuth.mockReturnValue({ activeOrganization: ORG, isPersonalMode: false });
  mockedUseOrgDetail.mockReturnValue(ORG);
  mockedUseOrgReportData.mockReturnValue({
    tickets: [ticket()],
    requests: [request()],
    loading: false,
  });
  render(<DashboardClient />);
  expect(screen.getByText(/Acme Studio/)).toBeInTheDocument();
  const viewAllLinks = screen.getAllByRole("link", { name: "View all" });
  expect(viewAllLinks[0]).toHaveAttribute(
    "href",
    "/dashboard/organizations/acme-studio/tickets",
  );
  expect(viewAllLinks[1]).toHaveAttribute(
    "href",
    "/dashboard/organizations/acme-studio/requests",
  );
});

it("hides the Recent requests card and uses personal routes/copy in Personal mode", () => {
  mockedUseAuth.mockReturnValue({ activeOrganization: null, isPersonalMode: true });
  mockedUseOrgDetail.mockReturnValue(null);
  mockedUseOrgReportData.mockReturnValue({ tickets: [], requests: [], loading: false });
  mockedUsePersonalTicketData.mockReturnValue({ tickets: [ticket()], loading: false });
  render(<DashboardClient />);
  expect(screen.queryByText("Recent requests")).toBeNull();
  expect(
    screen.getByText("Here's what's moving across your personal tickets."),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "View all" })).toHaveAttribute(
    "href",
    "/dashboard/tickets",
  );
});

it("computes non-zero overdue/due-this-week/pending-request stat tiles", () => {
  mockedUseAuth.mockReturnValue({ activeOrganization: ORG, isPersonalMode: false });
  mockedUseOrgDetail.mockReturnValue(ORG);
  mockedUseOrgReportData.mockReturnValue({
    tickets: [
      ticket({ id: 1, dueDate: "2000-01-01" }), // overdue
      ticket({ id: 2, dueDate: new Date().toISOString().slice(0, 10) }), // due this week
    ],
    requests: [request({ status: "pending" })],
    loading: false,
  });
  render(<DashboardClient />);
  const tiles = screen.getAllByText(/^\d+$/);
  expect(tiles.map((t) => t.textContent)).toEqual(["2", "1", "1", "1"]);
});

it("silently ignores a failure fetching default tags in Personal mode", async () => {
  mockedGetDefaultTags.mockRejectedValue(new Error("boom"));
  mockedUseAuth.mockReturnValue({ activeOrganization: null, isPersonalMode: true });
  mockedUseOrgDetail.mockReturnValue(null);
  mockedUseOrgReportData.mockReturnValue({ tickets: [], requests: [], loading: false });
  render(<DashboardClient />);
  expect(mockedGetDefaultTags).toHaveBeenCalled();
  expect(await screen.findByText("Dashboard")).toBeInTheDocument();
});

it("shows an empty state for recent tickets/requests when there are none", () => {
  mockedUseAuth.mockReturnValue({ activeOrganization: ORG, isPersonalMode: false });
  mockedUseOrgDetail.mockReturnValue(ORG);
  mockedUseOrgReportData.mockReturnValue({ tickets: [], requests: [], loading: false });
  render(<DashboardClient />);
  expect(screen.getByText("No tickets yet.")).toBeInTheDocument();
  expect(screen.getByText("No requests yet.")).toBeInTheDocument();
});

it("lists recent tickets, most recently updated first, capped at 5", () => {
  mockedUseAuth.mockReturnValue({ activeOrganization: ORG, isPersonalMode: false });
  mockedUseOrgDetail.mockReturnValue(ORG);
  const tickets = [
    ticket({ id: 1, title: "Oldest", updatedAt: "2026-01-01T00:00:00.000Z" }),
    ticket({ id: 2, title: "Newest", updatedAt: "2026-01-05T00:00:00.000Z" }),
    ticket({ id: 3, title: "Middle", updatedAt: "2026-01-03T00:00:00.000Z" }),
  ];
  mockedUseOrgReportData.mockReturnValue({ tickets, requests: [], loading: false });
  render(<DashboardClient />);
  const links = screen.getAllByRole("link", { name: /Oldest|Newest/ });
  expect(links[0]).toHaveTextContent("Newest");
  expect(links[0]).toHaveAttribute("href", "/dashboard/tickets/2");
});

it("lists recent requests, most recently created first, with a status badge", () => {
  mockedUseAuth.mockReturnValue({ activeOrganization: ORG, isPersonalMode: false });
  mockedUseOrgDetail.mockReturnValue(ORG);
  const requests = [
    request({ id: 1, title: "Oldest req", createdAt: "2026-01-01T00:00:00.000Z" }),
    request({
      id: 2,
      title: "Newest req",
      status: "approved",
      createdAt: "2026-01-05T00:00:00.000Z",
    }),
    request({ id: 3, title: "Middle req", createdAt: "2026-01-03T00:00:00.000Z" }),
  ];
  mockedUseOrgReportData.mockReturnValue({ tickets: [], requests, loading: false });
  render(<DashboardClient />);
  const links = screen.getAllByRole("link", { name: /Oldest req|Newest req/ });
  expect(links[0]).toHaveTextContent("Newest req");
  expect(links[0]).toHaveAttribute("href", "/dashboard/requests/2");
  expect(screen.getByText("Approved")).toBeInTheDocument();
});

it("renders every chart section", () => {
  mockedUseAuth.mockReturnValue({ activeOrganization: ORG, isPersonalMode: false });
  mockedUseOrgDetail.mockReturnValue(ORG);
  mockedUseOrgReportData.mockReturnValue({ tickets: [], requests: [], loading: false });
  render(<DashboardClient />);
  expect(screen.getByTestId("status-pie-chart")).toBeInTheDocument();
  expect(screen.getByTestId("status-breakdown-chart")).toBeInTheDocument();
  expect(screen.getByTestId("trend-series-select")).toBeInTheDocument();
  expect(screen.getByTestId("trend-line-chart")).toBeInTheDocument();
});
