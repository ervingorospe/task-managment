jest.mock("@/hooks/use-org-report-data", () => ({
  useOrgReportData: jest.fn(),
}));
jest.mock("./status-pie-chart", () => ({
  StatusPieChart: (props: any) => (
    <div data-testid="pie">{JSON.stringify(props.rows)}</div>
  ),
}));
jest.mock("./status-breakdown-chart", () => ({
  StatusBreakdownChart: (props: any) => (
    <div data-testid="breakdown">{JSON.stringify(props.rows)}</div>
  ),
}));
jest.mock("./trend-line-chart", () => ({
  TrendLineChart: (props: any) => (
    <div data-testid="trend">
      {props.series.length} / {props.emptyMessage}
    </div>
  ),
}));
jest.mock("./date-range-control", () => ({
  DateRangeControl: (props: any) => (
    <button
      data-testid="date-range"
      onClick={() => props.onChange({ from: "2026-01-01", to: "2026-01-31" })}
    >
      date-range:{props.value.from ?? "none"}-{props.value.to ?? "none"}
    </button>
  ),
}));
jest.mock("./trend-series-select", () => ({
  TrendSeriesSelect: (props: any) => (
    <button
      data-testid="trend-select"
      onClick={() => props.onChange({ ...props.value, dueDate: true })}
    >
      trend-select:{props.tags.length}
    </button>
  ),
}));
jest.mock("./month-comparison-chart", () => ({
  MonthComparisonChart: (props: any) => (
    <div data-testid="month-comparison">{props.tickets.length}</div>
  ),
}));

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TicketReports from "./ticket-reports";
import { useOrgReportData } from "@/hooks/use-org-report-data";
import type { OrganizationDetail } from "@/lib/types/organization/organization-detail.type";
import type { TicketDetail } from "@/lib/types/ticket/ticket-detail.type";
import type { TagDetail } from "@/lib/types/organization/tag-detail.type";

const mockedUseOrgReportData = useOrgReportData as jest.Mock;

let nextId = 1;

function tag(id: number, tagName: string, color = "#000"): TagDetail {
  return { id, tagName, color, isDefault: false, isDeleted: false };
}

const TODO = tag(1, "To Do");
const DONE = tag(2, "Done");

function ticket(overrides: Partial<TicketDetail> & { createdAt: string }): TicketDetail {
  return {
    id: nextId++,
    referenceId: `TCK-${nextId}`,
    orgId: 6001,
    ownerId: null,
    projectId: null,
    project: null,
    title: "Ticket",
    attachments: [],
    tag: TODO,
    client: null,
    assignees: [],
    dueDate: null,
    starred: false,
    updatedAt: overrides.createdAt,
    ...overrides,
  };
}

function org(overrides: Partial<OrganizationDetail> = {}): OrganizationDetail {
  return {
    id: 6001,
    organizationName: "Acme Studio",
    ownerId: 1,
    settings: {} as OrganizationDetail["settings"],
    capacity: {} as OrganizationDetail["capacity"],
    owner: {} as OrganizationDetail["owner"],
    roles: [],
    tags: [TODO, DONE],
    projects: [],
    members: [],
    tickets: [],
    ticketRequests: [],
    ...overrides,
  } as OrganizationDetail;
}

describe("TicketReports", () => {
  it("passes the organization id to useOrgReportData and shows the org name", () => {
    mockedUseOrgReportData.mockReturnValue({ tickets: [], requests: [], loading: false });
    render(<TicketReports organization={org({ id: 42, organizationName: "Client Co" })} />);

    expect(mockedUseOrgReportData).toHaveBeenCalledWith(42);
    expect(screen.getByText(/Client Co/)).toBeInTheDocument();
  });

  it("shows a muted 'no overdue' styling and zeroed tiles with no tickets", () => {
    mockedUseOrgReportData.mockReturnValue({ tickets: [], requests: [], loading: false });
    render(<TicketReports organization={org()} />);

    expect(screen.getByText("Total tickets")).toBeInTheDocument();
    const overdueValue = screen.getByText("Overdue").closest("div")!.parentElement!;
    expect(overdueValue.querySelector(".text-ink-faint")).toBeInTheDocument();
  });

  it("highlights the overdue tile when there is at least one overdue ticket", () => {
    const tickets = [
      ticket({ createdAt: "2026-01-10T00:00:00.000Z", tag: TODO, dueDate: "2020-01-01" }),
      ticket({ createdAt: "2026-01-11T00:00:00.000Z", tag: TODO, dueDate: "2099-01-01" }),
    ];
    mockedUseOrgReportData.mockReturnValue({ tickets, requests: [], loading: false });
    render(<TicketReports organization={org()} />);

    const overdueCard = screen.getByText("Overdue").closest("div")!.parentElement!;
    expect(overdueCard.querySelector(".text-danger")).toBeInTheDocument();
  });

  it("builds status rows and a default 'created' trend series from the tickets", () => {
    const tickets = [
      ticket({ createdAt: "2026-01-10T00:00:00.000Z", tag: TODO }),
      ticket({ createdAt: "2026-01-11T00:00:00.000Z", tag: DONE }),
    ];
    mockedUseOrgReportData.mockReturnValue({ tickets, requests: [], loading: false });
    render(<TicketReports organization={org()} />);

    const pie = screen.getByTestId("pie");
    const rows = JSON.parse(pie.textContent!);
    expect(rows).toHaveLength(2);

    expect(screen.getByTestId("trend").textContent).toMatch(/^1 \//);
  });

  it("re-filters status rows by the selected date range", async () => {
    const user = userEvent.setup();
    const tickets = [
      ticket({ createdAt: "2026-01-10T00:00:00.000Z", tag: TODO }),
      ticket({ createdAt: "2026-02-10T00:00:00.000Z", tag: DONE }),
    ];
    mockedUseOrgReportData.mockReturnValue({ tickets, requests: [], loading: false });
    render(<TicketReports organization={org()} />);

    expect(JSON.parse(screen.getByTestId("pie").textContent!)).toHaveLength(2);

    await user.click(screen.getByTestId("date-range"));

    expect(JSON.parse(screen.getByTestId("pie").textContent!)).toHaveLength(1);
  });

  it("adds a series when the trend selection changes", async () => {
    const user = userEvent.setup();
    const tickets = [ticket({ createdAt: "2026-01-10T00:00:00.000Z", tag: TODO, dueDate: "2026-01-10" })];
    mockedUseOrgReportData.mockReturnValue({ tickets, requests: [], loading: false });
    render(<TicketReports organization={org()} />);

    expect(screen.getByTestId("trend").textContent).toMatch(/^1 \//);

    await user.click(screen.getByTestId("trend-select"));

    expect(screen.getByTestId("trend").textContent).toMatch(/^2 \//);
  });

  it("passes the full, unfiltered ticket set and org tags to the month comparison chart", () => {
    const tickets = [
      ticket({ createdAt: "2026-01-10T00:00:00.000Z", tag: TODO }),
      ticket({ createdAt: "2026-02-10T00:00:00.000Z", tag: DONE }),
    ];
    mockedUseOrgReportData.mockReturnValue({ tickets, requests: [], loading: false });
    render(<TicketReports organization={org()} />);

    expect(screen.getByTestId("month-comparison").textContent).toBe("2");
  });
});
