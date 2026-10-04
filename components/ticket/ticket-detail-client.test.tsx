jest.mock("./ticket-overview-card", () => ({
  __esModule: true,
  default: (props: { ticketTitle: string }) => (
    <div data-testid="overview-card">{props.ticketTitle}</div>
  ),
}));
jest.mock("./ticket-details-card", () => ({
  __esModule: true,
  default: (props: { ticketTitle: string; tag: { tagName: string } }) => (
    <div data-testid="details-card">
      {props.ticketTitle} — {props.tag.tagName}
    </div>
  ),
}));
jest.mock("./ticket-activity-card", () => ({
  __esModule: true,
  default: () => <div data-testid="activity-card" />,
}));

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import TicketDetailClient from "./ticket-detail-client";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { useLogActivity } from "@/hooks/use-log-activity";
import { updateTicket, updateTicketStar, deleteTicket } from "@/lib/api/tickets";
import { setPendingAlert } from "@/lib/helper/pending-alert";
import { PERMISSIONS } from "@/lib/data/permissions";
import type { TagDetail } from "@/lib/types/organization/tag-detail.type";
import type { TicketDetail } from "@/lib/types/ticket/ticket-detail.type";
import type { OrganizationDetail } from "@/lib/types/organization/organization-detail.type";
import type { MemberDetail } from "@/lib/types/organization/member-detail.type";

jest.mock("next/navigation", () => ({ useRouter: jest.fn() }));
jest.mock("@/providers/auth-provider", () => {
  const actual = jest.requireActual("@/providers/auth-provider");
  return { ...actual, useAuth: jest.fn() };
});
jest.mock("@/providers/toast-provider", () => ({ useToast: jest.fn() }));
jest.mock("@/hooks/use-log-activity", () => ({ useLogActivity: jest.fn() }));
jest.mock("@/lib/api/tickets", () => ({
  updateTicket: jest.fn(),
  updateTicketStar: jest.fn(),
  deleteTicket: jest.fn(),
}));
jest.mock("@/lib/helper/pending-alert", () => ({ setPendingAlert: jest.fn() }));

const mockedUseRouter = useRouter as jest.Mock;
const mockedUseAuth = useAuth as jest.Mock;
const mockedUseToast = useToast as jest.Mock;
const mockedUseLogActivity = useLogActivity as jest.Mock;
const mockedUpdateTicket = updateTicket as jest.Mock;
const mockedUpdateTicketStar = updateTicketStar as jest.Mock;
const mockedDeleteTicket = deleteTicket as jest.Mock;
const mockedSetPendingAlert = setPendingAlert as jest.Mock;

const push = jest.fn();
const toast = jest.fn();
const logActivity = jest.fn();

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
    ...overrides,
  };
  return {
    ...base,
    user: { id: base.id, firstName: base.firstName, lastName: base.lastName, email: base.email } as MemberDetail["user"],
  };
}

const CLIENT = member({ id: 2, firstName: "Alex", lastName: "Kim" });
const ASSIGNEE = member({ id: 1, firstName: "Jane", lastName: "Doe" });

function org(overrides: Partial<OrganizationDetail> = {}): OrganizationDetail {
  return {
    id: 6001,
    organizationName: "Acme Studio",
    ownerId: 1,
    settings: { slug: "acme-studio" } as OrganizationDetail["settings"],
    capacity: {} as OrganizationDetail["capacity"],
    owner: {} as OrganizationDetail["owner"],
    roles: [],
    tags: [],
    projects: [],
    members: [],
    tickets: [],
    ticketRequests: [],
    ...overrides,
  } as OrganizationDetail;
}

function ticket(overrides: Partial<TicketDetail> = {}): TicketDetail {
  return {
    id: 1,
    referenceId: "TCK-1",
    orgId: 6001,
    title: "Fix the login page",
    attachments: [],
    tag: TODO,
    client: CLIENT,
    assignees: [ASSIGNEE],
    dueDate: null,
    starred: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function withPermissions(actions: string[]) {
  mockedUseAuth.mockReturnValue({
    activeMembership: {
      role: {
        rules: actions.map((action, i) => ({ id: i, action, name: action, desc: "", categoryId: 1 })),
      },
    },
    isPersonalMode: false,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseRouter.mockReturnValue({ push });
  mockedUseToast.mockReturnValue(toast);
  mockedUseLogActivity.mockReturnValue(logActivity);
  withPermissions([PERMISSIONS.TICKET_UPDATE, PERMISSIONS.TICKET_REMOVE]);
});

function renderClient(props: Partial<React.ComponentProps<typeof TicketDetailClient>> = {}) {
  return render(
    <TicketDetailClient ticket={ticket()} organization={org()} {...props} />,
  );
}

it("renders the ticket title, reference id, tag, and org name as a link when a slug exists", () => {
  renderClient();
  expect(screen.getByRole("heading", { name: "Fix the login page" })).toBeInTheDocument();
  expect(screen.getByText("TCK-1")).toBeInTheDocument();
  expect(screen.getByText("To Do")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Acme Studio" })).toHaveAttribute(
    "href",
    "/dashboard/organizations/acme-studio/tickets",
  );
});

it("shows the org name as plain text (no link) when there's no slug", () => {
  renderClient({ organization: org({ settings: {} as OrganizationDetail["settings"] }) });
  expect(screen.queryByRole("link", { name: "Acme Studio" })).toBeNull();
  expect(screen.getByText("Acme Studio")).toBeInTheDocument();
});

it("shows the overdue chip when the ticket is overdue", () => {
  jest.useFakeTimers().setSystemTime(new Date("2026-03-15T12:00:00Z"));
  renderClient({ ticket: ticket({ dueDate: "2026-01-01" }) });
  expect(screen.getByText("Overdue")).toBeInTheDocument();
  jest.useRealTimers();
});

describe("permissions", () => {
  it("hides the edit-title button without ticket.update", () => {
    withPermissions([PERMISSIONS.TICKET_REMOVE]);
    renderClient();
    expect(screen.queryByRole("button", { name: "Edit title" })).toBeNull();
  });

  it("hides the Remove button without ticket.remove", () => {
    withPermissions([PERMISSIONS.TICKET_UPDATE]);
    renderClient();
    expect(screen.queryByRole("button", { name: "Remove" })).toBeNull();
  });

  it("shows both controls in Personal mode regardless of rules", () => {
    mockedUseAuth.mockReturnValue({ activeMembership: null, isPersonalMode: true });
    renderClient();
    expect(screen.getByRole("button", { name: "Edit title" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
  });
});

describe("star toggle", () => {
  it("stars optimistically and calls updateTicketStar", async () => {
    mockedUpdateTicketStar.mockResolvedValue(undefined);
    renderClient({ ticket: ticket({ starred: false }) });
    await userEvent.click(screen.getByRole("button", { name: "Star ticket" }));
    expect(mockedUpdateTicketStar).toHaveBeenCalledWith(1, true);
    expect(screen.getByRole("button", { name: "Unstar ticket" })).toBeInTheDocument();
  });

  it("reverts and toasts the star failure message", async () => {
    mockedUpdateTicketStar.mockRejectedValue(new Error("boom"));
    renderClient({ ticket: ticket({ starred: false }) });
    await userEvent.click(screen.getByRole("button", { name: "Star ticket" }));
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith("Failed to star ticket", "error"),
    );
    expect(screen.getByRole("button", { name: "Star ticket" })).toBeInTheDocument();
  });

  it("reverts and toasts the unstar failure message", async () => {
    mockedUpdateTicketStar.mockRejectedValue(new Error("boom"));
    renderClient({ ticket: ticket({ starred: true }) });
    await userEvent.click(screen.getByRole("button", { name: "Unstar ticket" }));
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith("Failed to unstar ticket", "error"),
    );
  });
});

describe("title editing", () => {
  it("enters edit mode, commits a changed title on blur, and logs activity with involved users", async () => {
    mockedUpdateTicket.mockResolvedValue(undefined);
    renderClient();
    await userEvent.click(screen.getByRole("button", { name: "Edit title" }));
    const input = screen.getByDisplayValue("Fix the login page");
    await userEvent.clear(input);
    await userEvent.type(input, "Fix the signup page");
    await userEvent.tab();

    expect(screen.getByRole("heading", { name: "Fix the signup page" })).toBeInTheDocument();
    expect(mockedUpdateTicket).toHaveBeenCalledWith(1, { title: "Fix the signup page" });
    expect(toast).toHaveBeenCalledWith("Ticket title updated");
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        orgId: 6001,
        action: "title_updated",
        involvedUserIds: [2, 1],
      }),
    );
  });

  it("commits a changed title on Enter", async () => {
    mockedUpdateTicket.mockResolvedValue(undefined);
    renderClient();
    await userEvent.click(screen.getByRole("button", { name: "Edit title" }));
    const input = screen.getByDisplayValue("Fix the login page");
    await userEvent.clear(input);
    await userEvent.type(input, "Renamed{Enter}");
    expect(screen.getByRole("heading", { name: "Renamed" })).toBeInTheDocument();
  });

  it("cancels editing on Escape without committing", async () => {
    renderClient();
    await userEvent.click(screen.getByRole("button", { name: "Edit title" }));
    const input = screen.getByDisplayValue("Fix the login page");
    await userEvent.clear(input);
    await userEvent.type(input, "Should not stick{Escape}");
    expect(screen.getByRole("heading", { name: "Fix the login page" })).toBeInTheDocument();
    expect(mockedUpdateTicket).not.toHaveBeenCalled();
  });

  it("does not commit when the draft is unchanged", async () => {
    renderClient();
    await userEvent.click(screen.getByRole("button", { name: "Edit title" }));
    await userEvent.tab();
    expect(mockedUpdateTicket).not.toHaveBeenCalled();
  });

  it("does not commit when the draft is cleared to blank", async () => {
    renderClient();
    await userEvent.click(screen.getByRole("button", { name: "Edit title" }));
    const input = screen.getByDisplayValue("Fix the login page");
    await userEvent.clear(input);
    await userEvent.tab();
    expect(screen.getByRole("heading", { name: "Fix the login page" })).toBeInTheDocument();
    expect(mockedUpdateTicket).not.toHaveBeenCalled();
  });

  it("reverts and toasts on failure", async () => {
    mockedUpdateTicket.mockRejectedValue(new Error("boom"));
    renderClient();
    await userEvent.click(screen.getByRole("button", { name: "Edit title" }));
    const input = screen.getByDisplayValue("Fix the login page");
    await userEvent.clear(input);
    await userEvent.type(input, "Renamed{Enter}");
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith("Failed to update title", "error"),
    );
    expect(screen.getByRole("heading", { name: "Fix the login page" })).toBeInTheDocument();
  });
});

describe("delete", () => {
  it("deletes, logs activity with involved users, sets a pending alert, and redirects to the org's ticket list", async () => {
    mockedDeleteTicket.mockResolvedValue(undefined);
    renderClient();
    await userEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(screen.getByText("Delete ticket")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(mockedDeleteTicket).toHaveBeenCalledWith(1));
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        orgId: 6001,
        action: "removed",
        involvedUserIds: [2, 1],
      }),
    );
    expect(mockedSetPendingAlert).toHaveBeenCalledWith(
      "Ticket Fix the login page was removed",
      "error",
    );
    expect(push).toHaveBeenCalledWith("/dashboard/organizations/acme-studio/tickets");
  });

  it("redirects to /dashboard when there's no slug", async () => {
    mockedDeleteTicket.mockResolvedValue(undefined);
    renderClient({ organization: org({ settings: {} as OrganizationDetail["settings"] }) });
    await userEvent.click(screen.getByRole("button", { name: "Remove" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/dashboard"));
  });

  it("closes without deleting when cancelled", async () => {
    renderClient();
    await userEvent.click(screen.getByRole("button", { name: "Remove" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(mockedDeleteTicket).not.toHaveBeenCalled();
  });

  it("toasts and does not redirect when deletion fails", async () => {
    mockedDeleteTicket.mockRejectedValue(new Error("boom"));
    renderClient();
    await userEvent.click(screen.getByRole("button", { name: "Remove" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith("Failed to delete ticket", "error"),
    );
    expect(push).not.toHaveBeenCalled();
    expect(mockedSetPendingAlert).not.toHaveBeenCalled();
  });
});
