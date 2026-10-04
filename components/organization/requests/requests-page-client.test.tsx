jest.mock("./request-form-modal", () => ({
  __esModule: true,
  RequestFormModal: (props: { open: boolean; onSubmit: (v: unknown) => void; onClose: () => void }) =>
    props.open ? (
      <div data-testid="request-form-modal">
        <button onClick={() => props.onSubmit({ title: "New laptop", description: "" })}>
          submit-request-form
        </button>
        <button onClick={props.onClose}>close-request-form</button>
      </div>
    ) : null,
}));
jest.mock("@/components/ticket/ticket-form-modal", () => ({
  __esModule: true,
  default: (props: { open: boolean; onSubmit: (v: unknown) => void; onClose: () => void; title?: string }) =>
    props.open ? (
      <div data-testid="ticket-form-modal">
        {props.title}
        <button onClick={() => props.onSubmit({ assigneeIds: [1], dueDate: "" })}>
          submit-approve-form
        </button>
        <button onClick={props.onClose}>close-approve-form</button>
      </div>
    ) : null,
}));
jest.mock("./reject-request-modal", () => ({
  __esModule: true,
  RejectRequestModal: (props: { request: { title: string } | null; onConfirm: (remarks: string) => void; onClose: () => void }) =>
    props.request ? (
      <div data-testid="reject-request-modal">
        {props.request.title}
        <button onClick={() => props.onConfirm("Not enough detail")}>submit-reject-form</button>
        <button onClick={props.onClose}>close-reject-form</button>
      </div>
    ) : null,
}));
jest.mock("./request-filter-dropdown", () => {
  const actual = jest.requireActual("./request-filter-dropdown");
  return {
    ...actual,
    RequestFilterDropdown: (props: { onChange: (v: unknown) => void }) => (
      <button onClick={() => props.onChange({ ...actual.emptyRequestFilter, statuses: ["approved"] })}>
        apply-filter
      </button>
    ),
  };
});
jest.mock("./request-list", () => ({
  __esModule: true,
  RequestList: (props: {
    requests: { id: number; title: string }[];
    emptyTitle?: string;
    emptySubtitle?: string;
    emptyAction?: React.ReactNode;
    onApprove: (r: { id: number; title: string }) => void;
    onReject: (r: { id: number; title: string }) => void;
    onCancel: (r: { id: number; title: string }) => void;
  }) => (
    <div data-testid="request-list">
      {props.requests.map((r) => (
        <div key={r.id}>
          {r.title}
          <button onClick={() => props.onApprove(r)}>approve-{r.id}</button>
          <button onClick={() => props.onReject(r)}>reject-{r.id}</button>
          <button onClick={() => props.onCancel(r)}>cancel-{r.id}</button>
        </div>
      ))}
      {props.emptyTitle && <p>{props.emptyTitle}</p>}
      {props.emptySubtitle && <p>{props.emptySubtitle}</p>}
      {props.emptyAction}
    </div>
  ),
}));

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import RequestsPageClient from "./requests-page-client";
import { useAuth, usePermission } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { useLogActivity } from "@/hooks/use-log-activity";
import { useInlineAlert } from "@/hooks/use-inline-alert";
import { useRequestListQueryState } from "@/hooks/use-request-list-query-state";
import {
  createTicketRequest,
  rejectTicketRequest,
  approveTicketRequest,
  cancelTicketRequest,
} from "@/lib/api/ticket-requests";
import { emptyRequestFilter } from "./request-filter-dropdown";
import { PERMISSIONS } from "@/lib/data/permissions";
import type { TicketRequest } from "@/lib/types/ticket/ticket-request.type";
import type { MemberDetail } from "@/lib/types/organization/member-detail.type";
import type { OrganizationDetail } from "@/lib/types/organization/organization-detail.type";
import type { TicketDetail } from "@/lib/types/ticket/ticket-detail.type";
import type { TagDetail } from "@/lib/types/organization/tag-detail.type";

jest.mock("next/navigation", () => ({ useRouter: jest.fn() }));
jest.mock("@/providers/auth-provider", () => {
  const actual = jest.requireActual("@/providers/auth-provider");
  return { ...actual, useAuth: jest.fn(), usePermission: jest.fn() };
});
jest.mock("@/providers/toast-provider", () => ({ useToast: jest.fn() }));
jest.mock("@/hooks/use-log-activity", () => ({ useLogActivity: jest.fn() }));
jest.mock("@/hooks/use-inline-alert", () => ({ useInlineAlert: jest.fn() }));
jest.mock("@/hooks/use-request-list-query-state", () => ({ useRequestListQueryState: jest.fn() }));
jest.mock("@/lib/api/ticket-requests", () => ({
  createTicketRequest: jest.fn(),
  rejectTicketRequest: jest.fn(),
  approveTicketRequest: jest.fn(),
  cancelTicketRequest: jest.fn(),
}));

const mockedUseRouter = useRouter as jest.Mock;
const mockedUseAuth = useAuth as jest.Mock;
const mockedUsePermission = usePermission as jest.Mock;
const mockedUseToast = useToast as jest.Mock;
const mockedUseLogActivity = useLogActivity as jest.Mock;
const mockedUseInlineAlert = useInlineAlert as jest.Mock;
const mockedUseRequestListQueryState = useRequestListQueryState as jest.Mock;
const mockedCreateTicketRequest = createTicketRequest as jest.Mock;
const mockedRejectTicketRequest = rejectTicketRequest as jest.Mock;
const mockedApproveTicketRequest = approveTicketRequest as jest.Mock;
const mockedCancelTicketRequest = cancelTicketRequest as jest.Mock;

const push = jest.fn();
const toast = jest.fn();
const logActivity = jest.fn();
const showAlert = jest.fn();
const dismissAlert = jest.fn();
const setPage = jest.fn();
const setFilter = jest.fn();
const setPageSize = jest.fn();
const setSearchInput = jest.fn();

const TODO: TagDetail = { id: 1, tagName: "To Do", color: "#000", isDefault: true, isDeleted: false };

function member(overrides: Partial<MemberDetail> = {}): MemberDetail {
  const base = {
    id: 1,
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@acmestudio.com",
    orgId: 6001,
    roleId: 1,
    isActive: true,
    role: { id: 1, roleName: "Manager" } as MemberDetail["role"],
    ...overrides,
  };
  return {
    ...base,
    user: { id: base.id, firstName: base.firstName, lastName: base.lastName, email: base.email } as MemberDetail["user"],
  };
}

const STAFF_MEMBER = member({ id: 1, firstName: "Jane", lastName: "Doe", role: { id: 1, roleName: "Manager" } as MemberDetail["role"] });
const CLIENT_MEMBER = member({ id: 2, firstName: "Alex", lastName: "Kim", role: { id: 2, roleName: "Client" } as MemberDetail["role"] });

function org(overrides: Partial<OrganizationDetail> = {}): OrganizationDetail {
  return {
    id: 6001,
    organizationName: "Acme Studio",
    ownerId: 1,
    settings: {} as OrganizationDetail["settings"],
    capacity: {} as OrganizationDetail["capacity"],
    owner: {} as OrganizationDetail["owner"],
    roles: [],
    tags: [TODO],
    projects: [],
    members: [STAFF_MEMBER, CLIENT_MEMBER],
    tickets: [],
    ticketRequests: [],
    ...overrides,
  } as OrganizationDetail;
}

function request(overrides: Partial<TicketRequest> = {}): TicketRequest {
  return {
    id: 1,
    referenceId: "REQ-1",
    orgId: 6001,
    title: "Need a new laptop",
    attachments: [],
    client: CLIENT_MEMBER,
    ticketId: null,
    status: "pending",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function withAuth({
  userId = 1,
  actions = [] as string[],
  roleName = "Manager",
}: { userId?: number; actions?: string[]; roleName?: string } = {}) {
  mockedUseAuth.mockReturnValue({
    currentUser: { id: userId },
    activeMembership: {
      role: {
        roleName,
        rules: actions.map((action, i) => ({ id: i, action, name: action, desc: "", categoryId: 1 })),
      },
    },
    isPersonalMode: false,
  });
  mockedUsePermission.mockImplementation((action: string) => actions.includes(action));
}

let queryState: ReturnType<typeof useRequestListQueryState>;

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseRouter.mockReturnValue({ push });
  mockedUseToast.mockReturnValue(toast);
  mockedUseLogActivity.mockReturnValue(logActivity);
  mockedUseInlineAlert.mockReturnValue({ alert: null, showAlert, dismissAlert });
  queryState = {
    page: 1,
    filter: emptyRequestFilter,
    pageSize: 15,
    searchInput: "",
    search: "",
    setPage,
    setFilter,
    setPageSize,
    setSearchInput,
  };
  mockedUseRequestListQueryState.mockImplementation(() => queryState);
  withAuth({ userId: 1, actions: [PERMISSIONS.TICKET_CREATE, PERMISSIONS.TICKET_VIEW_ALL], roleName: "Manager" });
});

function renderPage(overrides: Partial<React.ComponentProps<typeof RequestsPageClient>> = {}) {
  return render(<RequestsPageClient organization={org({ ticketRequests: [request()] })} {...overrides} />);
}

it("shows the staff subtitle and the request for a staff user with ticket.view_all", () => {
  renderPage();
  expect(screen.getByRole("heading", { name: "Requests" })).toBeInTheDocument();
  expect(
    screen.getByText("Ticket requests submitted by clients of Acme Studio."),
  ).toBeInTheDocument();
  expect(screen.getByText("Need a new laptop")).toBeInTheDocument();
});

it("shows the client subtitle and only the client's own requests without ticket.view_all", () => {
  withAuth({ userId: 2, actions: [], roleName: "Client" });
  renderPage({
    organization: org({
      ticketRequests: [
        request({ id: 1, title: "My request", client: CLIENT_MEMBER }),
        request({ id: 2, title: "Someone else's", client: STAFF_MEMBER }),
      ],
    }),
  });
  expect(screen.getByText("Requests you've submitted to Acme Studio.")).toBeInTheDocument();
  expect(screen.getByText("My request")).toBeInTheDocument();
  expect(screen.queryByText("Someone else's")).toBeNull();
});

it("hides the New request button for a non-Client role", () => {
  renderPage();
  expect(screen.queryByRole("button", { name: /New request/ })).toBeNull();
});

it("shows the New request button for a Client role", () => {
  withAuth({ userId: 2, actions: [], roleName: "Client" });
  renderPage({ organization: org({ ticketRequests: [], members: [STAFF_MEMBER, CLIENT_MEMBER] }) });
  expect(screen.getByRole("button", { name: /New request/ })).toBeInTheDocument();
});

it("shows the stat tiles with the right counts", () => {
  renderPage({
    organization: org({
      ticketRequests: [
        request({ id: 1, status: "pending" }),
        request({ id: 2, status: "approved" }),
        request({ id: 3, status: "rejected" }),
      ],
    }),
  });
  function statValue(label: string) {
    return screen.getByText(label).nextElementSibling?.textContent;
  }
  expect(statValue("Total")).toBe("3");
  expect(statValue("Pending")).toBe("1");
  expect(statValue("Approved")).toBe("1");
  expect(statValue("Rejected")).toBe("1");
});

describe("search and filter", () => {
  it("filters by title via search", () => {
    queryState.search = "laptop";
    renderPage({
      organization: org({
        ticketRequests: [
          request({ id: 1, title: "Need a new laptop" }),
          request({ id: 2, title: "Need a new chair" }),
        ],
      }),
    });
    expect(screen.getByText("Need a new laptop")).toBeInTheDocument();
    expect(screen.queryByText("Need a new chair")).toBeNull();
  });

  it("filters by status", () => {
    queryState.filter = { ...emptyRequestFilter, statuses: ["approved"] };
    renderPage({
      organization: org({
        ticketRequests: [
          request({ id: 1, title: "Pending one", status: "pending" }),
          request({ id: 2, title: "Approved one", status: "approved" }),
        ],
      }),
    });
    expect(screen.getByText("Approved one")).toBeInTheDocument();
    expect(screen.queryByText("Pending one")).toBeNull();
  });

  it("filters by submitted date range", () => {
    queryState.filter = { ...emptyRequestFilter, dateFrom: "2026-02-01" };
    renderPage({
      organization: org({
        ticketRequests: [
          request({ id: 1, title: "Early one", createdAt: "2026-01-01T00:00:00.000Z" }),
          request({ id: 2, title: "Later one", createdAt: "2026-03-01T00:00:00.000Z" }),
        ],
      }),
    });
    expect(screen.getByText("Later one")).toBeInTheDocument();
    expect(screen.queryByText("Early one")).toBeNull();
  });

  it("filters out requests submitted after the 'to' date", () => {
    queryState.filter = { ...emptyRequestFilter, dateTo: "2026-02-01" };
    renderPage({
      organization: org({
        ticketRequests: [
          request({ id: 1, title: "Early one", createdAt: "2026-01-01T00:00:00.000Z" }),
          request({ id: 2, title: "Later one", createdAt: "2026-03-01T00:00:00.000Z" }),
        ],
      }),
    });
    expect(screen.getByText("Early one")).toBeInTheDocument();
    expect(screen.queryByText("Later one")).toBeNull();
  });

  it("applies a filter change via the dropdown", async () => {
    renderPage();
    await userEvent.click(screen.getByText("apply-filter"));
    expect(setFilter).toHaveBeenCalledWith(expect.objectContaining({ statuses: ["approved"] }));
  });

  it("changes the page size", async () => {
    renderPage();
    const pageSizeSelect = document.querySelector("select") as HTMLSelectElement;
    await userEvent.selectOptions(pageSizeSelect, "50");
    expect(setPageSize).toHaveBeenCalledWith(50);
  });

  it("shows the 'no matching requests' empty state with a clear-filters action", async () => {
    queryState.search = "zzz";
    renderPage();
    expect(screen.getByText("No matching requests")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(setFilter).toHaveBeenCalledWith(emptyRequestFilter);
    expect(setSearchInput).toHaveBeenCalledWith("");
  });

  it("shows the staff empty state with no requests at all", () => {
    renderPage({ organization: org({ ticketRequests: [] }) });
    expect(screen.getByText("No requests yet")).toBeInTheDocument();
  });

  it("shows the client empty state with no requests at all", () => {
    withAuth({ userId: 2, actions: [], roleName: "Client" });
    renderPage({ organization: org({ ticketRequests: [] }) });
    expect(screen.getByText("No requests submitted")).toBeInTheDocument();
  });
});

describe("create request", () => {
  it("submits a new request as the current member, prepends it, and logs activity", async () => {
    const newRequest = request({ id: 9, title: "New laptop", client: CLIENT_MEMBER });
    mockedCreateTicketRequest.mockResolvedValue(newRequest);
    withAuth({ userId: 2, actions: [], roleName: "Client" });
    renderPage({ organization: org({ ticketRequests: [] }) });

    await userEvent.click(screen.getByRole("button", { name: /New request/ }));
    await userEvent.click(screen.getByText("submit-request-form"));

    await waitFor(() =>
      expect(mockedCreateTicketRequest).toHaveBeenCalledWith(6001, {
        clientId: 2,
        title: "New laptop",
        description: undefined,
      }),
    );
    expect(screen.getByText("New laptop")).toBeInTheDocument();
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ orgId: 6001, action: "created" }),
    );
    expect(showAlert).toHaveBeenCalledWith('Request "New laptop" submitted');
  });

  it("does nothing when the current user isn't a member of this org", async () => {
    withAuth({ userId: 999, actions: [], roleName: "Client" });
    renderPage({ organization: org({ ticketRequests: [] }) });
    await userEvent.click(screen.getByRole("button", { name: /New request/ }));
    await userEvent.click(screen.getByText("submit-request-form"));
    expect(mockedCreateTicketRequest).not.toHaveBeenCalled();
  });

  it("toasts and does not add anything when creation fails", async () => {
    mockedCreateTicketRequest.mockRejectedValue(new Error("boom"));
    withAuth({ userId: 2, actions: [], roleName: "Client" });
    renderPage({ organization: org({ ticketRequests: [] }) });
    await userEvent.click(screen.getByRole("button", { name: /New request/ }));
    await userEvent.click(screen.getByText("submit-request-form"));

    await waitFor(() => expect(toast).toHaveBeenCalledWith("Failed to submit request", "error"));
  });

  it("closes the request form without creating", async () => {
    withAuth({ userId: 2, actions: [], roleName: "Client" });
    renderPage({ organization: org({ ticketRequests: [] }) });
    await userEvent.click(screen.getByRole("button", { name: /New request/ }));
    await userEvent.click(screen.getByText("close-request-form"));
    expect(screen.queryByTestId("request-form-modal")).toBeNull();
    expect(mockedCreateTicketRequest).not.toHaveBeenCalled();
  });
});

describe("reject", () => {
  it("rejects, updates status/remarks, logs activity, and shows an alert", async () => {
    mockedRejectTicketRequest.mockResolvedValue(undefined);
    renderPage({
      organization: org({
        ticketRequests: [request(), request({ id: 5, title: "Other request" })],
      }),
    });
    await userEvent.click(screen.getByText("reject-1"));
    expect(screen.getByTestId("reject-request-modal")).toBeInTheDocument();
    await userEvent.click(screen.getByText("submit-reject-form"));

    await waitFor(() => expect(mockedRejectTicketRequest).toHaveBeenCalledWith(1, "Not enough detail"));
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ orgId: 6001, action: "rejected" }),
    );
    expect(showAlert).toHaveBeenCalledWith('Request "Need a new laptop" rejected', "error");
    expect(screen.getByText("Other request")).toBeInTheDocument();
  });

  it("toasts and does not update on failure", async () => {
    mockedRejectTicketRequest.mockRejectedValue(new Error("boom"));
    renderPage();
    await userEvent.click(screen.getByText("reject-1"));
    await userEvent.click(screen.getByText("submit-reject-form"));

    await waitFor(() => expect(toast).toHaveBeenCalledWith("Failed to reject request", "error"));
  });

  it("closes without rejecting on close-reject-form", async () => {
    renderPage();
    await userEvent.click(screen.getByText("reject-1"));
    await userEvent.click(screen.getByText("close-reject-form"));
    expect(screen.queryByTestId("reject-request-modal")).toBeNull();
    expect(mockedRejectTicketRequest).not.toHaveBeenCalled();
  });
});

describe("cancel", () => {
  it("opens a confirm dialog, cancels on confirm, logs activity, and shows an alert", async () => {
    mockedCancelTicketRequest.mockResolvedValue(undefined);
    renderPage({
      organization: org({
        ticketRequests: [request(), request({ id: 5, title: "Other request" })],
      }),
    });
    await userEvent.click(screen.getByText("cancel-1"));
    expect(screen.getByRole("heading", { name: "Cancel request" })).toBeInTheDocument();

    const confirmButtons = screen.getAllByRole("button", { name: "Cancel request" });
    await userEvent.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => expect(mockedCancelTicketRequest).toHaveBeenCalledWith(1));
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ orgId: 6001, action: "cancelled" }),
    );
    expect(showAlert).toHaveBeenCalledWith('Request "Need a new laptop" cancelled', "error");
    expect(screen.getByText("Other request")).toBeInTheDocument();
  });

  it("toasts and does not update on failure", async () => {
    mockedCancelTicketRequest.mockRejectedValue(new Error("boom"));
    renderPage();
    await userEvent.click(screen.getByText("cancel-1"));
    const confirmButtons = screen.getAllByRole("button", { name: "Cancel request" });
    await userEvent.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => expect(toast).toHaveBeenCalledWith("Failed to cancel request", "error"));
  });

  it("keeps the request when cancelled via Keep request", async () => {
    renderPage();
    await userEvent.click(screen.getByText("cancel-1"));
    await userEvent.click(screen.getByRole("button", { name: "Keep request" }));
    expect(mockedCancelTicketRequest).not.toHaveBeenCalled();
  });
});

describe("approve", () => {
  it("opens the ticket form modal prefilled from the request", async () => {
    renderPage();
    await userEvent.click(screen.getByText("approve-1"));
    expect(screen.getByTestId("ticket-form-modal")).toHaveTextContent("Approve request");
  });

  it("approves, adds the new ticket, updates the request, logs both activities, and navigates", async () => {
    const updatedRequest = request({ status: "approved", ticketId: 42 });
    const newTicket = { id: 42, title: "Need a new laptop", referenceId: "TCK-42", client: CLIENT_MEMBER, assignees: [STAFF_MEMBER] } as unknown as TicketDetail;
    mockedApproveTicketRequest.mockResolvedValue({ request: updatedRequest, ticket: newTicket });

    renderPage({
      organization: org({
        ticketRequests: [request(), request({ id: 5, title: "Other request" })],
      }),
    });
    await userEvent.click(screen.getByText("approve-1"));
    await userEvent.click(screen.getByText("submit-approve-form"));

    await waitFor(() =>
      expect(mockedApproveTicketRequest).toHaveBeenCalledWith(1, {
        tagId: 1,
        assigneeIds: [1],
        dueDate: undefined,
      }),
    );
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ orgId: 6001, action: "approved" }),
    );
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ orgId: 6001, action: "created", entityId: 42 }),
    );
    expect(push).toHaveBeenCalledWith("/dashboard/tickets/42");
    expect(screen.queryByTestId("ticket-form-modal")).toBeNull();
    expect(screen.getByText("Other request")).toBeInTheDocument();
  });

  it("falls back to the org's first tag when there's no 'To Do' tag", async () => {
    mockedApproveTicketRequest.mockResolvedValue({
      request: request({ status: "approved" }),
      ticket: { id: 1, title: "x", referenceId: "TCK-1", client: null, assignees: [] } as unknown as TicketDetail,
    });
    const DONE: TagDetail = { id: 2, tagName: "Done", color: "#0F0", isDefault: false, isDeleted: false };
    renderPage({ organization: org({ tags: [DONE], ticketRequests: [request()] }) });
    await userEvent.click(screen.getByText("approve-1"));
    await userEvent.click(screen.getByText("submit-approve-form"));

    await waitFor(() =>
      expect(mockedApproveTicketRequest).toHaveBeenCalledWith(1, expect.objectContaining({ tagId: 2 })),
    );
  });

  it("does nothing when the org has no tags at all", async () => {
    renderPage({ organization: org({ tags: [], ticketRequests: [request()] }) });
    await userEvent.click(screen.getByText("approve-1"));
    await userEvent.click(screen.getByText("submit-approve-form"));
    expect(mockedApproveTicketRequest).not.toHaveBeenCalled();
  });

  it("toasts and does not navigate on failure", async () => {
    mockedApproveTicketRequest.mockRejectedValue(new Error("boom"));
    renderPage();
    await userEvent.click(screen.getByText("approve-1"));
    await userEvent.click(screen.getByText("submit-approve-form"));

    await waitFor(() => expect(toast).toHaveBeenCalledWith("Failed to approve request", "error"));
    expect(push).not.toHaveBeenCalled();
  });

  it("closes without approving", async () => {
    renderPage();
    await userEvent.click(screen.getByText("approve-1"));
    await userEvent.click(screen.getByText("close-approve-form"));
    expect(screen.queryByTestId("ticket-form-modal")).toBeNull();
    expect(mockedApproveTicketRequest).not.toHaveBeenCalled();
  });
});

it("shows the pending inline alert and dismisses it", async () => {
  mockedUseInlineAlert.mockReturnValue({
    alert: { message: 'Request "X" cancelled', variant: "error" },
    showAlert,
    dismissAlert,
  });
  renderPage();
  expect(screen.getByText('Request "X" cancelled')).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: /dismiss/i }));
  expect(dismissAlert).toHaveBeenCalled();
});
