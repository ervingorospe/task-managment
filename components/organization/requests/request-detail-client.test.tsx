jest.mock("isomorphic-dompurify", () => ({ sanitize: (html: string) => html }));
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

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import RequestDetailClient from "./request-detail-client";
import { useAuth, usePermission } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { useActivityLog } from "@/providers/activity-log-provider";
import { useLogActivity } from "@/hooks/use-log-activity";
import { useInlineAlert } from "@/hooks/use-inline-alert";
import {
  rejectTicketRequest,
  approveTicketRequest,
  cancelTicketRequest,
} from "@/lib/api/ticket-requests";
import { PERMISSIONS } from "@/lib/data/permissions";
import type { TicketRequest } from "@/lib/types/ticket/ticket-request.type";
import type { MemberDetail } from "@/lib/types/organization/member-detail.type";
import type { OrganizationDetail } from "@/lib/types/organization/organization-detail.type";
import type { TagDetail } from "@/lib/types/organization/tag-detail.type";
import type { TicketDetail } from "@/lib/types/ticket/ticket-detail.type";

jest.mock("next/navigation", () => ({ useRouter: jest.fn() }));
jest.mock("@/providers/auth-provider", () => {
  const actual = jest.requireActual("@/providers/auth-provider");
  return { ...actual, useAuth: jest.fn(), usePermission: jest.fn() };
});
jest.mock("@/providers/toast-provider", () => ({ useToast: jest.fn() }));
jest.mock("@/providers/activity-log-provider", () => ({ useActivityLog: jest.fn() }));
jest.mock("@/hooks/use-log-activity", () => ({ useLogActivity: jest.fn() }));
jest.mock("@/hooks/use-inline-alert", () => ({ useInlineAlert: jest.fn() }));
jest.mock("@/lib/api/ticket-requests", () => ({
  rejectTicketRequest: jest.fn(),
  approveTicketRequest: jest.fn(),
  cancelTicketRequest: jest.fn(),
}));

const mockedUseRouter = useRouter as jest.Mock;
const mockedUseAuth = useAuth as jest.Mock;
const mockedUsePermission = usePermission as jest.Mock;
const mockedUseToast = useToast as jest.Mock;
const mockedUseActivityLog = useActivityLog as jest.Mock;
const mockedUseLogActivity = useLogActivity as jest.Mock;
const mockedUseInlineAlert = useInlineAlert as jest.Mock;
const mockedRejectTicketRequest = rejectTicketRequest as jest.Mock;
const mockedApproveTicketRequest = approveTicketRequest as jest.Mock;
const mockedCancelTicketRequest = cancelTicketRequest as jest.Mock;

const push = jest.fn();
const toast = jest.fn();
const logActivity = jest.fn();
const showAlert = jest.fn();
const dismissAlert = jest.fn();

const TODO: TagDetail = { id: 1, tagName: "To Do", color: "#000", isDefault: true, isDeleted: false };

function member(overrides: Partial<MemberDetail> = {}): MemberDetail {
  const base = {
    id: 1,
    firstName: "Alex",
    lastName: "Kim",
    email: "alex@clientco.com",
    orgId: 6001,
    roleId: 1,
    isActive: true,
    ...overrides,
  };
  return {
    ...base,
    user: { id: base.id, firstName: base.firstName, lastName: base.lastName, email: base.email } as MemberDetail["user"],
  };
}

const CLIENT_MEMBER = member();

function org(overrides: Partial<OrganizationDetail> = {}): OrganizationDetail {
  return {
    id: 6001,
    organizationName: "Acme Studio",
    ownerId: 1,
    settings: { slug: "acme-studio" } as OrganizationDetail["settings"],
    capacity: {} as OrganizationDetail["capacity"],
    owner: {} as OrganizationDetail["owner"],
    roles: [],
    tags: [TODO],
    projects: [],
    members: [CLIENT_MEMBER],
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
  actions = [] as string[],
  roleName = "Manager",
  timezone = "UTC",
}: { actions?: string[]; roleName?: string; timezone?: string } = {}) {
  mockedUseAuth.mockReturnValue({
    activeMembership: {
      role: { roleName, rules: actions.map((action, i) => ({ id: i, action, name: action, desc: "", categoryId: 1 })) },
      organization: { settings: { timezone } },
    },
  });
  mockedUsePermission.mockImplementation((action: string) => actions.includes(action));
}

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseRouter.mockReturnValue({ push });
  mockedUseToast.mockReturnValue(toast);
  mockedUseActivityLog.mockReturnValue({ entries: [] });
  mockedUseLogActivity.mockReturnValue(logActivity);
  mockedUseInlineAlert.mockReturnValue({ alert: null, showAlert, dismissAlert });
  withAuth({ actions: [PERMISSIONS.TICKET_CREATE], roleName: "Manager" });
});

function renderClient(overrides: Partial<React.ComponentProps<typeof RequestDetailClient>> = {}) {
  return render(<RequestDetailClient request={request()} organization={org()} {...overrides} />);
}

it("shows the org breadcrumb link, reference id, status label, and title", () => {
  renderClient();
  expect(screen.getByRole("link", { name: "Acme Studio" })).toHaveAttribute(
    "href",
    "/dashboard/organizations/acme-studio/requests",
  );
  expect(screen.getByText("REQ-1")).toBeInTheDocument();
  expect(screen.getByText("Waiting on a decision")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Need a new laptop" })).toBeInTheDocument();
});

it("falls back to /dashboard when there's no org slug", () => {
  renderClient({ organization: org({ settings: {} as OrganizationDetail["settings"] }) });
  expect(screen.getByRole("link", { name: "Acme Studio" })).toHaveAttribute("href", "/dashboard");
});

describe("status presentation", () => {
  it("shows the approved label", () => {
    renderClient({ request: request({ status: "approved" }) });
    expect(screen.getByText("Approved and turned into a ticket")).toBeInTheDocument();
  });

  it("shows the rejected label and remarks", () => {
    renderClient({ request: request({ status: "rejected", remarks: "Not enough detail" }) });
    expect(screen.getByText("Rejected", { selector: "span" })).toBeInTheDocument();
    expect(screen.getByText("Not enough detail")).toBeInTheDocument();
  });

  it("shows the cancelled label", () => {
    renderClient({ request: request({ status: "cancelled" }) });
    expect(screen.getByText("Cancelled", { selector: "span" })).toBeInTheDocument();
  });

  it("shows no remarks card for a rejected request without remarks", () => {
    renderClient({ request: request({ status: "rejected", remarks: undefined }) });
    expect(screen.queryByText("Rejection reason")).toBeNull();
  });
});

describe("description", () => {
  it("shows a fallback when there's no description", () => {
    renderClient();
    expect(screen.getByText("No description provided.")).toBeInTheDocument();
  });

  it("renders the description HTML", () => {
    renderClient({ request: request({ description: "**Urgent**" }) });
    expect(screen.getByText("Urgent")).toBeInTheDocument();
  });
});

describe("attachments", () => {
  it("shows no attachments card when there are none", () => {
    renderClient();
    expect(screen.queryByText(/Attachments/)).toBeNull();
  });

  it("lists attachments with size and a count", () => {
    renderClient({
      request: request({
        attachments: [
          { id: 1, name: "a.png", url: "https://cdn/a.png", size: 500 * 1024 },
          { id: 2, name: "b.mov", url: "https://cdn/b.mov", size: 2.5 * 1024 * 1024 },
        ],
      }),
    });
    expect(screen.getByText("Attachments · 2")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /a\.png/ });
    expect(link).toHaveAttribute("href", "https://cdn/a.png");
    expect(link).toHaveAttribute("target", "_blank");
    expect(screen.getByText("500 KB")).toBeInTheDocument();
    expect(screen.getByText("2.5 MB")).toBeInTheDocument();
  });
});

describe("linked ticket", () => {
  const TICKET = {
    id: 42,
    referenceId: "TCK-42",
    title: "Fix the login page",
    tag: TODO,
  } as TicketDetail;

  it("shows the linked ticket for an approved request", () => {
    renderClient({
      request: request({ status: "approved", ticketId: 42 }),
      organization: org({ tickets: [TICKET] }),
    });
    expect(screen.getByText("Ticket created from this request")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Fix the login page/ })).toHaveAttribute(
      "href",
      "/dashboard/tickets/42",
    );
  });

  it("shows no linked-ticket card when the ticket can't be found", () => {
    renderClient({ request: request({ status: "approved", ticketId: 99 }), organization: org({ tickets: [] }) });
    expect(screen.queryByText("Ticket created from this request")).toBeNull();
  });
});

describe("activity timeline", () => {
  it("shows an 'Awaiting review' step for a pending request with no history", () => {
    renderClient();
    expect(screen.getByText("Awaiting review")).toBeInTheDocument();
  });

  it("shows logged activity entries scoped to this request, sorted oldest first", () => {
    mockedUseActivityLog.mockReturnValue({
      entries: [
        { id: 1, module: "request", entityId: 1, action: "created", actorName: "Alex", description: "submitted this request", createdAt: "2026-01-02T00:00:00.000Z" },
        { id: 2, module: "request", entityId: 1, action: "approved", actorName: "Jane", description: "approved this request", createdAt: "2026-01-01T00:00:00.000Z" },
        { id: 3, module: "ticket", entityId: 1, action: "created", actorName: "Jane", description: "created a ticket", createdAt: "2026-01-03T00:00:00.000Z" },
        { id: 4, module: "request", entityId: 2, action: "created", actorName: "Marco", description: "submitted another request", createdAt: "2026-01-01T00:00:00.000Z" },
        { id: 5, module: "request", entityId: 1, action: "rejected", actorName: "Marco", description: "rejected this request", createdAt: "2025-12-31T00:00:00.000Z" },
        { id: 6, module: "request", entityId: 1, action: "created", actorName: "Priya", description: "also at the same time", createdAt: "2026-01-01T00:00:00.000Z" },
      ],
    });
    renderClient({ request: request({ status: "approved" }) });
    const steps = screen.getAllByRole("listitem").map((li) => li.textContent);
    expect(steps[0]).toContain("Marco rejected this request");
    expect(steps).toHaveLength(4);
    expect(steps[3]).toContain("Alex submitted this request");
  });

  it("falls back to a generic icon for an unrecognized action", () => {
    mockedUseActivityLog.mockReturnValue({
      entries: [{ id: 1, module: "request", entityId: 1, action: "mystery", actorName: "Alex", description: "did something", createdAt: "2026-01-01T00:00:00.000Z" }],
    });
    const { container } = renderClient({ request: request({ status: "approved" }) });
    expect(container.querySelector(".lucide-refresh-cw")).not.toBeNull();
  });
});

it("shows the requester's name and email", () => {
  renderClient();
  expect(screen.getByText("Alex Kim")).toBeInTheDocument();
  expect(screen.getByText("alex@clientco.com")).toBeInTheDocument();
});

describe("manage actions (staff)", () => {
  it("shows Approve/Reject for a pending request with ticket.create", () => {
    renderClient();
    expect(screen.getByRole("button", { name: /Approve/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Reject/ })).toBeInTheDocument();
  });

  it("hides manage actions without ticket.create", () => {
    withAuth({ actions: [], roleName: "Manager" });
    renderClient();
    expect(screen.queryByRole("button", { name: /Approve/ })).toBeNull();
  });

  it("hides manage actions for a non-pending request", () => {
    renderClient({ request: request({ status: "approved" }) });
    expect(screen.queryByRole("button", { name: /Approve/ })).toBeNull();
  });

  it("opens the approve ticket form and approves, logging both activities and navigating", async () => {
    const updatedRequest = request({ status: "approved", ticketId: 42 });
    const newTicket = {
      id: 42,
      title: "Need a new laptop",
      referenceId: "TCK-42",
      client: CLIENT_MEMBER,
      assignees: [CLIENT_MEMBER],
      tag: TODO,
    } as unknown as TicketDetail;
    mockedApproveTicketRequest.mockResolvedValue({ request: updatedRequest, ticket: newTicket });

    renderClient();
    await userEvent.click(screen.getByRole("button", { name: /Approve/ }));
    expect(screen.getByTestId("ticket-form-modal")).toHaveTextContent("Approve request");
    await userEvent.click(screen.getByText("submit-approve-form"));

    await waitFor(() =>
      expect(mockedApproveTicketRequest).toHaveBeenCalledWith(1, {
        tagId: 1,
        assigneeIds: [1],
        dueDate: undefined,
      }),
    );
    expect(logActivity).toHaveBeenCalledWith(expect.objectContaining({ action: "approved" }));
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ action: "created", entityId: 42 }),
    );
    expect(showAlert).not.toHaveBeenCalledWith(expect.stringContaining("rejected"), expect.anything());
    expect(push).toHaveBeenCalledWith("/dashboard/tickets/42");
  });

  it("falls back to the org's first tag when there's no 'To Do' tag", async () => {
    const DONE: TagDetail = { id: 2, tagName: "Done", color: "#0F0", isDefault: false, isDeleted: false };
    mockedApproveTicketRequest.mockResolvedValue({
      request: request({ status: "approved" }),
      ticket: { id: 1, title: "x", referenceId: "TCK-1", client: null, assignees: [] } as unknown as TicketDetail,
    });
    renderClient({ organization: org({ tags: [DONE] }) });
    await userEvent.click(screen.getByRole("button", { name: /Approve/ }));
    await userEvent.click(screen.getByText("submit-approve-form"));
    await waitFor(() =>
      expect(mockedApproveTicketRequest).toHaveBeenCalledWith(1, expect.objectContaining({ tagId: 2 })),
    );
  });

  it("does nothing when the org has no tags at all", async () => {
    renderClient({ organization: org({ tags: [] }) });
    await userEvent.click(screen.getByRole("button", { name: /Approve/ }));
    await userEvent.click(screen.getByText("submit-approve-form"));
    expect(mockedApproveTicketRequest).not.toHaveBeenCalled();
  });

  it("toasts and does not navigate when approval fails", async () => {
    mockedApproveTicketRequest.mockRejectedValue(new Error("boom"));
    renderClient();
    await userEvent.click(screen.getByRole("button", { name: /Approve/ }));
    await userEvent.click(screen.getByText("submit-approve-form"));
    await waitFor(() => expect(toast).toHaveBeenCalledWith("Failed to approve request", "error"));
    expect(push).not.toHaveBeenCalled();
  });

  it("closes the approve form without approving", async () => {
    renderClient();
    await userEvent.click(screen.getByRole("button", { name: /Approve/ }));
    await userEvent.click(screen.getByText("close-approve-form"));
    expect(screen.queryByTestId("ticket-form-modal")).toBeNull();
    expect(mockedApproveTicketRequest).not.toHaveBeenCalled();
  });

  it("rejects, updates status, logs activity, and shows an alert", async () => {
    mockedRejectTicketRequest.mockResolvedValue(undefined);
    renderClient();
    await userEvent.click(screen.getByRole("button", { name: /Reject/ }));
    expect(screen.getByTestId("reject-request-modal")).toBeInTheDocument();
    await userEvent.click(screen.getByText("submit-reject-form"));

    await waitFor(() => expect(mockedRejectTicketRequest).toHaveBeenCalledWith(1, "Not enough detail"));
    expect(logActivity).toHaveBeenCalledWith(expect.objectContaining({ action: "rejected" }));
    expect(showAlert).toHaveBeenCalledWith('Request "Need a new laptop" rejected', "error");
    expect(await screen.findByText("Not enough detail")).toBeInTheDocument();
  });

  it("toasts and does not update when rejection fails", async () => {
    mockedRejectTicketRequest.mockRejectedValue(new Error("boom"));
    renderClient();
    await userEvent.click(screen.getByRole("button", { name: /Reject/ }));
    await userEvent.click(screen.getByText("submit-reject-form"));
    await waitFor(() => expect(toast).toHaveBeenCalledWith("Failed to reject request", "error"));
  });

  it("closes the reject form without rejecting", async () => {
    renderClient();
    await userEvent.click(screen.getByRole("button", { name: /Reject/ }));
    await userEvent.click(screen.getByText("close-reject-form"));
    expect(screen.queryByTestId("reject-request-modal")).toBeNull();
    expect(mockedRejectTicketRequest).not.toHaveBeenCalled();
  });
});

describe("cancel (client)", () => {
  beforeEach(() => {
    withAuth({ actions: [], roleName: "Client" });
  });

  it("shows Cancel request for a pending request", () => {
    renderClient();
    expect(screen.getByRole("button", { name: /Cancel request/ })).toBeInTheDocument();
  });

  it("hides Cancel for a non-pending request", () => {
    renderClient({ request: request({ status: "cancelled" }) });
    expect(screen.queryByRole("button", { name: /Cancel request/ })).toBeNull();
  });

  it("opens a confirm dialog, cancels on confirm, logs activity, and shows an alert", async () => {
    mockedCancelTicketRequest.mockResolvedValue(undefined);
    renderClient();
    await userEvent.click(screen.getByRole("button", { name: /Cancel request/ }));
    expect(screen.getByRole("heading", { name: "Cancel request" })).toBeInTheDocument();

    const confirmButtons = screen.getAllByRole("button", { name: "Cancel request" });
    await userEvent.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => expect(mockedCancelTicketRequest).toHaveBeenCalledWith(1));
    expect(logActivity).toHaveBeenCalledWith(expect.objectContaining({ action: "cancelled" }));
    expect(showAlert).toHaveBeenCalledWith('Request "Need a new laptop" cancelled', "error");
  });

  it("toasts and does not update when cancellation fails", async () => {
    mockedCancelTicketRequest.mockRejectedValue(new Error("boom"));
    renderClient();
    await userEvent.click(screen.getByRole("button", { name: /Cancel request/ }));
    const confirmButtons = screen.getAllByRole("button", { name: "Cancel request" });
    await userEvent.click(confirmButtons[confirmButtons.length - 1]);
    await waitFor(() => expect(toast).toHaveBeenCalledWith("Failed to cancel request", "error"));
  });

  it("keeps the request when dismissed via Keep request", async () => {
    renderClient();
    await userEvent.click(screen.getByRole("button", { name: /Cancel request/ }));
    await userEvent.click(screen.getByRole("button", { name: "Keep request" }));
    expect(mockedCancelTicketRequest).not.toHaveBeenCalled();
  });
});

it("shows the pending inline alert and dismisses it", async () => {
  mockedUseInlineAlert.mockReturnValue({
    alert: { message: 'Request "X" cancelled', variant: "error" },
    showAlert,
    dismissAlert,
  });
  renderClient();
  expect(screen.getByText('Request "X" cancelled')).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: /dismiss/i }));
  expect(dismissAlert).toHaveBeenCalled();
});
