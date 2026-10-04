import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReportsClient from "./reports-client";
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

// These chart/report sub-components are tested in their own files under
// components/organization/ticket-reports/ — mocked here so this file
// focuses purely on ReportsClient's own orchestration logic (loading
// states, Personal vs org mode, stat tile computation).
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
jest.mock("@/components/organization/ticket-reports/month-comparison-chart", () => ({
  MonthComparisonChart: () => <div data-testid="month-comparison-chart" />,
}));

const mockedUseAuth = useAuth as jest.Mock;
const mockedUseOrgDetail = useActiveOrganizationDetail as jest.Mock;
const mockedUseOrgReportData = useOrgReportData as jest.Mock;
const mockedUsePersonalTicketData = usePersonalTicketData as jest.Mock;
const mockedGetDefaultTags = getDefaultTags as jest.Mock;

const ORG = {
  organizationName: "Acme Studio",
  tags: [{ id: 1, tagName: "To Do", color: "#000", isDefault: true, isDeleted: false }],
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

beforeEach(() => {
  jest.clearAllMocks();
  mockedGetDefaultTags.mockResolvedValue([]);
  mockedUsePersonalTicketData.mockReturnValue({ tickets: [], loading: false });
});

it("shows an empty state when in org mode with no active organization", () => {
  mockedUseAuth.mockReturnValue({ activeOrganization: null, isPersonalMode: false });
  mockedUseOrgDetail.mockReturnValue(null);
  mockedUseOrgReportData.mockReturnValue({ tickets: [], requests: [], loading: false });
  render(<ReportsClient />);
  expect(
    screen.getByText("Join or create an organization to see its reports."),
  ).toBeInTheDocument();
});

it("shows a loading skeleton while org data loads", () => {
  mockedUseAuth.mockReturnValue({ activeOrganization: ORG, isPersonalMode: false });
  mockedUseOrgDetail.mockReturnValue(ORG);
  mockedUseOrgReportData.mockReturnValue({ tickets: [], requests: [], loading: true });
  const { container } = render(<ReportsClient />);
  expect(container.querySelector(".animate-pulse")).not.toBeNull();
});

it("shows a loading skeleton in Personal mode while data loads", () => {
  mockedUseAuth.mockReturnValue({ activeOrganization: null, isPersonalMode: true });
  mockedUseOrgDetail.mockReturnValue(null);
  mockedUseOrgReportData.mockReturnValue({ tickets: [], requests: [], loading: false });
  mockedUsePersonalTicketData.mockReturnValue({ tickets: [], loading: true });
  const { container } = render(<ReportsClient />);
  expect(container.querySelector(".animate-pulse")).not.toBeNull();
});

it("renders the org's name in the subtitle once loaded", () => {
  mockedUseAuth.mockReturnValue({ activeOrganization: ORG, isPersonalMode: false });
  mockedUseOrgDetail.mockReturnValue(ORG);
  mockedUseOrgReportData.mockReturnValue({ tickets: [], requests: [], loading: false });
  render(<ReportsClient />);
  expect(screen.getByText(/Acme Studio/)).toBeInTheDocument();
  expect(screen.getByText("Pending requests")).toBeInTheDocument();
});

it("hides the Pending requests tile and uses personal copy in Personal mode", () => {
  mockedUseAuth.mockReturnValue({ activeOrganization: null, isPersonalMode: true });
  mockedUseOrgDetail.mockReturnValue(null);
  mockedUseOrgReportData.mockReturnValue({ tickets: [], requests: [], loading: false });
  render(<ReportsClient />);
  expect(screen.queryByText("Pending requests")).toBeNull();
  expect(
    screen.getByText("A closer look at activity across your personal tickets."),
  ).toBeInTheDocument();
});

it("computes overdue/due-this-week/pending-request stat tiles correctly", () => {
  mockedUseAuth.mockReturnValue({ activeOrganization: ORG, isPersonalMode: false });
  mockedUseOrgDetail.mockReturnValue(ORG);
  mockedUseOrgReportData.mockReturnValue({
    tickets: [
      ticket({ id: 1, dueDate: "2000-01-01" }), // overdue
      ticket({ id: 2, dueDate: null }),
      ticket({ id: 3, dueDate: new Date().toISOString().slice(0, 10) }), // due this week
    ],
    requests: [{ status: "pending" }, { status: "approved" }],
    loading: false,
  });
  render(<ReportsClient />);
  // "Total tickets" = 3, "Overdue" = 1, "Due this week" = 1, "Pending requests" = 1.
  const tiles = screen.getAllByText(/^\d+$/);
  expect(tiles.map((t) => t.textContent)).toEqual(["3", "1", "1", "1"]);
});

it("shows the overdue tickets list scoped to just overdue tickets", () => {
  mockedUseAuth.mockReturnValue({ activeOrganization: ORG, isPersonalMode: false });
  mockedUseOrgDetail.mockReturnValue(ORG);
  mockedUseOrgReportData.mockReturnValue({
    tickets: [ticket({ id: 1, dueDate: "2000-01-01", title: "Overdue one" })],
    requests: [],
    loading: false,
  });
  render(<ReportsClient />);
  expect(screen.getByText("Overdue one")).toBeInTheDocument();
});

it("fetches default tags in Personal mode", async () => {
  mockedGetDefaultTags.mockResolvedValue([
    { id: 9, tagName: "Personal Tag", color: "#000", isDefault: true, isDeleted: false },
  ]);
  mockedUseAuth.mockReturnValue({ activeOrganization: null, isPersonalMode: true });
  mockedUseOrgDetail.mockReturnValue(null);
  mockedUseOrgReportData.mockReturnValue({ tickets: [], requests: [], loading: false });
  render(<ReportsClient />);
  expect(mockedGetDefaultTags).toHaveBeenCalled();
});

it("silently ignores a failure fetching default tags in Personal mode", async () => {
  mockedGetDefaultTags.mockRejectedValue(new Error("boom"));
  mockedUseAuth.mockReturnValue({ activeOrganization: null, isPersonalMode: true });
  mockedUseOrgDetail.mockReturnValue(null);
  mockedUseOrgReportData.mockReturnValue({ tickets: [], requests: [], loading: false });
  render(<ReportsClient />);
  expect(mockedGetDefaultTags).toHaveBeenCalled();
  // No crash, no error surfaced — just verifying the page still renders.
  expect(await screen.findByText("Reports")).toBeInTheDocument();
});

it("renders every chart section", () => {
  mockedUseAuth.mockReturnValue({ activeOrganization: ORG, isPersonalMode: false });
  mockedUseOrgDetail.mockReturnValue(ORG);
  mockedUseOrgReportData.mockReturnValue({ tickets: [], requests: [], loading: false });
  render(<ReportsClient />);
  expect(screen.getByTestId("status-pie-chart")).toBeInTheDocument();
  expect(screen.getByTestId("status-breakdown-chart")).toBeInTheDocument();
  expect(screen.getByTestId("trend-series-select")).toBeInTheDocument();
  expect(screen.getByTestId("trend-line-chart")).toBeInTheDocument();
  expect(screen.getByTestId("month-comparison-chart")).toBeInTheDocument();
});

it("calls window.print when Download PDF is clicked", async () => {
  const printSpy = jest.spyOn(window, "print").mockImplementation(() => {});
  mockedUseAuth.mockReturnValue({ activeOrganization: ORG, isPersonalMode: false });
  mockedUseOrgDetail.mockReturnValue(ORG);
  mockedUseOrgReportData.mockReturnValue({ tickets: [], requests: [], loading: false });
  render(<ReportsClient />);
  await userEvent.click(screen.getByRole("button", { name: /Download PDF/ }));
  expect(printSpy).toHaveBeenCalled();
  printSpy.mockRestore();
});
