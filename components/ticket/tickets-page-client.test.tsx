jest.mock("./ticket-list", () => ({
  __esModule: true,
  TicketList: (props: {
    tickets: { id: number; title: string }[];
    emptyTitle?: string;
    emptySubtitle?: string;
    emptyAction?: React.ReactNode;
    onChangeTag: (id: number, tag: { id: number; tagName: string; color: string; isDefault: boolean; isDeleted: boolean }) => void;
    onAssign: (id: number, memberIds: number[]) => void;
    onToggleStar: (id: number) => void;
  }) => (
    <div data-testid="ticket-list">
      {props.tickets.map((t) => (
        <div key={t.id}>
          {t.title}
          <button onClick={() => props.onChangeTag(t.id, { id: 2, tagName: "Done", color: "#0F0", isDefault: false, isDeleted: false })}>
            change-tag-{t.id}
          </button>
          <button onClick={() => props.onAssign(t.id, [1])}>assign-{t.id}</button>
          <button onClick={() => props.onToggleStar(t.id)}>toggle-star-{t.id}</button>
        </div>
      ))}
      <button onClick={() => props.onChangeTag(999, { id: 2, tagName: "Done", color: "#0F0", isDefault: false, isDeleted: false })}>
        change-tag-unknown
      </button>
      <button onClick={() => props.onAssign(999, [1])}>assign-unknown</button>
      <button onClick={() => props.onToggleStar(999)}>toggle-star-unknown</button>
      {props.emptyTitle && <p>{props.emptyTitle}</p>}
      {props.emptySubtitle && <p>{props.emptySubtitle}</p>}
      {props.emptyAction}
    </div>
  ),
}));
jest.mock("./ticket-form-modal", () => ({
  __esModule: true,
  default: (props: { open: boolean; onSubmit: (v: unknown) => void; onClose: () => void }) =>
    props.open ? (
      <div data-testid="form-modal">
        <button
          onClick={() =>
            props.onSubmit({
              organizationId: "6001",
              title: "New ticket",
              description: "",
              assigneeIds: [1],
              clientId: "2",
              projectId: "1",
              dueDate: "",
              attachments: [],
            })
          }
        >
          submit-form
        </button>
        <button
          onClick={() =>
            props.onSubmit({
              organizationId: "6001",
              title: "New ticket",
              description: "",
              assigneeIds: [],
              clientId: null,
              projectId: null,
              dueDate: "",
              attachments: [],
            })
          }
        >
          submit-form-minimal
        </button>
        <button onClick={props.onClose}>close-form</button>
      </div>
    ) : null,
}));
jest.mock("./ticket-filter-dropdown", () => {
  const actual = jest.requireActual("./ticket-filter-dropdown");
  return {
    ...actual,
    TicketFilterDropdown: (props: { onChange: (v: unknown) => void }) => (
      <button onClick={() => props.onChange({ ...actual.emptyTicketFilter, tagIds: [1] })}>
        apply-filter
      </button>
    ),
  };
});

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TicketsPageClient from "./tickets-page-client";
import { useAuth, usePermission } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { useLogActivity } from "@/hooks/use-log-activity";
import { useInlineAlert } from "@/hooks/use-inline-alert";
import { useTicketListQueryState } from "@/hooks/use-ticket-list-query-state";
import {
  createTicket,
  updateTicketTag,
  updateTicketAssignees,
  updateTicketStar,
  fetchTicketsPage,
  fetchTicketCountNumbers,
} from "@/lib/api/tickets";
import { emptyTicketFilter } from "./ticket-filter-dropdown";
import { PERMISSIONS } from "@/lib/data/permissions";
import type { TicketDetail } from "@/lib/types/ticket/ticket-detail.type";
import type { TagDetail } from "@/lib/types/organization/tag-detail.type";
import type { MemberDetail } from "@/lib/types/organization/member-detail.type";
import type { OrganizationDetail } from "@/lib/types/organization/organization-detail.type";

jest.mock("@/providers/auth-provider", () => {
  const actual = jest.requireActual("@/providers/auth-provider");
  return { ...actual, useAuth: jest.fn(), usePermission: jest.fn() };
});
jest.mock("@/providers/toast-provider", () => ({ useToast: jest.fn() }));
jest.mock("@/hooks/use-log-activity", () => ({ useLogActivity: jest.fn() }));
jest.mock("@/hooks/use-inline-alert", () => ({ useInlineAlert: jest.fn() }));
jest.mock("@/hooks/use-ticket-list-query-state", () => ({ useTicketListQueryState: jest.fn() }));
jest.mock("@/lib/api/tickets", () => ({
  createTicket: jest.fn(),
  updateTicketTag: jest.fn(),
  updateTicketAssignees: jest.fn(),
  updateTicketStar: jest.fn(),
  fetchTicketsPage: jest.fn(),
  fetchTicketCountNumbers: jest.fn(),
}));

const mockedUseAuth = useAuth as jest.Mock;
const mockedUsePermission = usePermission as jest.Mock;
const mockedUseToast = useToast as jest.Mock;
const mockedUseLogActivity = useLogActivity as jest.Mock;
const mockedUseInlineAlert = useInlineAlert as jest.Mock;
const mockedUseTicketListQueryState = useTicketListQueryState as jest.Mock;
const mockedCreateTicket = createTicket as jest.Mock;
const mockedUpdateTicketTag = updateTicketTag as jest.Mock;
const mockedUpdateTicketAssignees = updateTicketAssignees as jest.Mock;
const mockedUpdateTicketStar = updateTicketStar as jest.Mock;
const mockedFetchTicketsPage = fetchTicketsPage as jest.Mock;
const mockedFetchTicketCountNumbers = fetchTicketCountNumbers as jest.Mock;

const toast = jest.fn();
const logActivity = jest.fn();
const showAlert = jest.fn();
const dismissAlert = jest.fn();
const setPage = jest.fn();
const setFilter = jest.fn();
const setPageSize = jest.fn();
const setSearchInput = jest.fn();

const TODO: TagDetail = { id: 1, tagName: "To Do", color: "#000", isDefault: true, isDeleted: false };
const DONE: TagDetail = { id: 2, tagName: "Done", color: "#0F0", isDefault: false, isDeleted: false };

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

const MANAGER = member({ id: 1, firstName: "Jane", lastName: "Doe" });
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
    tags: [TODO, DONE],
    projects: [{ id: 1, name: "Website Revamp" } as OrganizationDetail["projects"][number]],
    members: [MANAGER, CLIENT_MEMBER],
    tickets: [],
    ticketRequests: [],
    ...overrides,
  } as OrganizationDetail;
}

const ORG = org();

function ticket(overrides: Partial<TicketDetail> = {}): TicketDetail {
  return {
    id: 1,
    referenceId: "TCK-1",
    orgId: 6001,
    title: "Fix the login page",
    attachments: [],
    tag: TODO,
    client: null,
    assignees: [],
    dueDate: null,
    starred: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function withPermissions(actions: string[]) {
  mockedUseAuth.mockReturnValue({
    currentUser: { id: 1 },
    activeMembership: {
      role: {
        rules: actions.map((action, i) => ({ id: i, action, name: action, desc: "", categoryId: 1 })),
      },
    },
    isPersonalMode: false,
  });
  mockedUsePermission.mockImplementation((action: string) => actions.includes(action));
}

let queryState: ReturnType<typeof useTicketListQueryState>;

beforeEach(() => {
  jest.clearAllMocks();
  withPermissions([PERMISSIONS.TICKET_CREATE, PERMISSIONS.TICKET_VIEW_ALL]);
  mockedUseToast.mockReturnValue(toast);
  mockedUseLogActivity.mockReturnValue(logActivity);
  mockedUseInlineAlert.mockReturnValue({ alert: null, showAlert, dismissAlert });
  queryState = {
    page: 1,
    filter: emptyTicketFilter,
    pageSize: 15,
    searchInput: "",
    search: "",
    setPage,
    setFilter,
    setPageSize,
    setSearchInput,
  };
  mockedUseTicketListQueryState.mockImplementation(() => queryState);
  mockedFetchTicketsPage.mockResolvedValue({ items: [ticket()], total: 1, page: 1, limit: 15 });
  mockedFetchTicketCountNumbers.mockResolvedValue({
    totalTickets: 1,
    overdues: 0,
    onTime: 1,
    countPerTag: [{ tagId: 1, tagName: "To Do", color: "#000", count: 1 }],
  });
});

async function renderPage(props: Partial<React.ComponentProps<typeof TicketsPageClient>> = {}) {
  const result = render(<TicketsPageClient organization={ORG} {...props} />);
  await waitFor(() => expect(mockedFetchTicketsPage).toHaveBeenCalled());
  return result;
}

it("shows the Tickets heading and loads the list scoped to the org", async () => {
  await renderPage();
  expect(screen.getByRole("heading", { name: "Tickets" })).toBeInTheDocument();
  expect(screen.getByText("Every ticket in Acme Studio.")).toBeInTheDocument();
  expect(screen.getByText("Fix the login page")).toBeInTheDocument();
  expect(mockedFetchTicketsPage).toHaveBeenCalledWith(6001, expect.objectContaining({ involvesUserId: undefined }));
});

it("scopes to the current user's tickets without ticket.view.all", async () => {
  withPermissions([PERMISSIONS.TICKET_CREATE]);
  await renderPage();
  expect(mockedFetchTicketsPage).toHaveBeenCalledWith(6001, expect.objectContaining({ involvesUserId: 1 }));
});

it("falls back to an unmatchable user id when scoped but the current user isn't known yet", async () => {
  mockedUseAuth.mockReturnValue({ currentUser: null, activeMembership: null, isPersonalMode: false });
  mockedUsePermission.mockReturnValue(false);
  await renderPage();
  expect(mockedFetchTicketsPage).toHaveBeenCalledWith(6001, expect.objectContaining({ involvesUserId: -1 }));
});

it("shows the Starred heading, subtitle, and no Create button when starredOnly", async () => {
  await renderPage({ starredOnly: true });
  expect(screen.getByRole("heading", { name: "Starred" })).toBeInTheDocument();
  expect(screen.getByText("Tickets you've starred in Acme Studio.")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Create ticket/ })).toBeNull();
  expect(mockedFetchTicketsPage).toHaveBeenCalledWith(6001, expect.objectContaining({ filterBy: ["starred"] }));
  expect(mockedFetchTicketCountNumbers).toHaveBeenCalledWith(
    6001,
    expect.objectContaining({ filterBy: ["starred"] }),
  );
});

it("hides the Create button without ticket.create", async () => {
  withPermissions([]);
  await renderPage();
  expect(screen.queryByRole("button", { name: /Create ticket/ })).toBeNull();
});

it("scopes to a single project when projectId is given", async () => {
  await renderPage({ projectId: 1 });
  expect(mockedFetchTicketsPage).toHaveBeenCalledWith(6001, expect.objectContaining({ projectIds: [1] }));
  expect(mockedFetchTicketCountNumbers).toHaveBeenCalledWith(6001, expect.objectContaining({ projectIds: [1] }));
});

it("toasts when loading tickets fails", async () => {
  mockedFetchTicketsPage.mockRejectedValue(new Error("boom"));
  render(<TicketsPageClient organization={ORG} />);
  await waitFor(() => expect(toast).toHaveBeenCalledWith("Failed to load tickets", "error"));
});

it("toasts when loading ticket stats fails", async () => {
  mockedFetchTicketCountNumbers.mockRejectedValue(new Error("boom"));
  await renderPage();
  await waitFor(() => expect(toast).toHaveBeenCalledWith("Failed to load ticket stats", "error"));
});

it("includes overdueOnly in the filterBy list", async () => {
  queryState.filter = { ...emptyTicketFilter, overdueOnly: true };
  await renderPage();
  expect(mockedFetchTicketsPage).toHaveBeenCalledWith(6001, expect.objectContaining({ filterBy: ["overdue"] }));
});

it("passes selected memberIds from the filter", async () => {
  queryState.filter = { ...emptyTicketFilter, memberIds: [1] };
  await renderPage();
  expect(mockedFetchTicketsPage).toHaveBeenCalledWith(6001, expect.objectContaining({ memberIds: [1] }));
});

it("shows the overdue stat tile in a danger color when there are overdue tickets", async () => {
  mockedFetchTicketCountNumbers.mockResolvedValue({ totalTickets: 3, overdues: 2, onTime: 1, countPerTag: [] });
  await renderPage();
  expect(await screen.findByText("2")).toBeInTheDocument();
});

it("sorts the per-tag stat tiles by count, descending", async () => {
  mockedFetchTicketCountNumbers.mockResolvedValue({
    totalTickets: 6,
    overdues: 0,
    onTime: 6,
    countPerTag: [
      { tagId: 1, tagName: "To Do", color: "#000", count: 1 },
      { tagId: 2, tagName: "Done", color: "#0F0", count: 3 },
      { tagId: 3, tagName: "In Progress", color: "#00F", count: 2 },
    ],
  });
  await renderPage();
  const labels = (await screen.findAllByText(/To Do|Done|In Progress/)).map((el) => el.textContent);
  expect(labels).toEqual(["Done", "In Progress", "To Do"]);
});

it("changes the page size", async () => {
  await renderPage();
  const pageSizeSelect = document.querySelector("select") as HTMLSelectElement;
  await userEvent.selectOptions(pageSizeSelect, "50");
  expect(setPageSize).toHaveBeenCalledWith(50);
});

it("discards a stale ticket-list response that resolves after a newer request", async () => {
  let resolveFirst!: (v: { items: TicketDetail[]; total: number; page: number; limit: number }) => void;
  const first = new Promise<{ items: TicketDetail[]; total: number; page: number; limit: number }>(
    (resolve) => (resolveFirst = resolve),
  );
  mockedFetchTicketsPage.mockReturnValueOnce(first);
  mockedFetchTicketsPage.mockResolvedValueOnce({
    items: [ticket({ id: 2, title: "Second, fresher ticket" })],
    total: 1,
    page: 1,
    limit: 15,
  });

  const { rerender } = render(<TicketsPageClient organization={ORG} starredOnly={false} />);
  rerender(<TicketsPageClient organization={ORG} starredOnly />);
  await waitFor(() => expect(mockedFetchTicketsPage).toHaveBeenCalledTimes(2));
  await screen.findByText("Second, fresher ticket");

  resolveFirst({ items: [ticket({ id: 1, title: "Stale ticket" })], total: 1, page: 1, limit: 15 });
  await new Promise((r) => setTimeout(r, 0));

  expect(screen.queryByText("Stale ticket")).toBeNull();
  expect(screen.getByText("Second, fresher ticket")).toBeInTheDocument();
});

it("discards a stale ticket-list rejection that rejects after a newer request", async () => {
  let rejectFirst!: (err: Error) => void;
  const first = new Promise<never>((_, reject) => (rejectFirst = reject));
  mockedFetchTicketsPage.mockReturnValueOnce(first);
  mockedFetchTicketsPage.mockResolvedValueOnce({
    items: [ticket({ id: 2, title: "Second, fresher ticket" })],
    total: 1,
    page: 1,
    limit: 15,
  });

  const { rerender } = render(<TicketsPageClient organization={ORG} starredOnly={false} />);
  rerender(<TicketsPageClient organization={ORG} starredOnly />);
  await waitFor(() => expect(mockedFetchTicketsPage).toHaveBeenCalledTimes(2));
  await screen.findByText("Second, fresher ticket");

  rejectFirst(new Error("stale request failed"));
  await new Promise((r) => setTimeout(r, 0));

  expect(toast).not.toHaveBeenCalledWith("Failed to load tickets", "error");
  expect(screen.getByText("Second, fresher ticket")).toBeInTheDocument();
});

describe("create ticket", () => {
  it("creates a ticket with client, project, and assignees resolved from the org, reloads, and logs activity", async () => {
    const newTicket = ticket({
      id: 2,
      title: "New ticket",
      referenceId: "TCK-2",
      client: CLIENT_MEMBER,
      assignees: [MANAGER],
    });
    mockedCreateTicket.mockResolvedValue(newTicket);
    await renderPage();

    await userEvent.click(screen.getByRole("button", { name: /Create ticket/ }));
    await userEvent.click(screen.getByText("submit-form"));

    await waitFor(() =>
      expect(mockedCreateTicket).toHaveBeenCalledWith(6001, {
        title: "New ticket",
        description: undefined,
        tagId: 1,
        clientId: 2,
        projectId: 1,
        assigneeIds: [1],
        dueDate: undefined,
      }),
    );
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ orgId: 6001, action: "created", entityId: 2 }),
    );
    expect(showAlert).toHaveBeenCalledWith("New ticket New ticket was created");
    expect(mockedFetchTicketsPage).toHaveBeenCalledTimes(2);
  });

  it("creates with no client/project/assignees when none were selected", async () => {
    mockedCreateTicket.mockResolvedValue(ticket({ id: 3 }));
    await renderPage();
    await userEvent.click(screen.getByRole("button", { name: /Create ticket/ }));
    await userEvent.click(screen.getByText("submit-form-minimal"));

    await waitFor(() =>
      expect(mockedCreateTicket).toHaveBeenCalledWith(6001, {
        title: "New ticket",
        description: undefined,
        tagId: 1,
        clientId: undefined,
        projectId: undefined,
        assigneeIds: [],
        dueDate: undefined,
      }),
    );
  });

  it("falls back to the org's first tag when there's no 'To Do' tag", async () => {
    mockedCreateTicket.mockResolvedValue(ticket({ id: 4 }));
    await renderPage({ organization: org({ tags: [DONE] }) });
    await userEvent.click(screen.getByRole("button", { name: /Create ticket/ }));
    await userEvent.click(screen.getByText("submit-form-minimal"));

    await waitFor(() =>
      expect(mockedCreateTicket).toHaveBeenCalledWith(6001, expect.objectContaining({ tagId: 2 })),
    );
  });

  it("does nothing when the org has no tags at all", async () => {
    await renderPage({ organization: org({ tags: [] }) });
    await userEvent.click(screen.getByRole("button", { name: /Create ticket/ }));
    await userEvent.click(screen.getByText("submit-form-minimal"));
    expect(mockedCreateTicket).not.toHaveBeenCalled();
  });

  it("closes without creating", async () => {
    await renderPage();
    await userEvent.click(screen.getByRole("button", { name: /Create ticket/ }));
    await userEvent.click(screen.getByText("close-form"));
    expect(screen.queryByTestId("form-modal")).toBeNull();
    expect(mockedCreateTicket).not.toHaveBeenCalled();
  });

  it("toasts and does not reload when creation fails", async () => {
    mockedCreateTicket.mockRejectedValue(new Error("boom"));
    await renderPage();
    await userEvent.click(screen.getByRole("button", { name: /Create ticket/ }));
    await userEvent.click(screen.getByText("submit-form-minimal"));

    await waitFor(() => expect(toast).toHaveBeenCalledWith("Failed to create ticket", "error"));
    expect(logActivity).not.toHaveBeenCalled();
    expect(mockedFetchTicketsPage).toHaveBeenCalledTimes(1);
  });
});

describe("change tag", () => {
  it("updates optimistically, calls the API, refreshes counts, and logs activity", async () => {
    mockedUpdateTicketTag.mockResolvedValue(undefined);
    mockedFetchTicketsPage.mockResolvedValue({
      items: [ticket({ id: 1, client: CLIENT_MEMBER, assignees: [MANAGER] }), ticket({ id: 5, title: "Other ticket" })],
      total: 2,
      page: 1,
      limit: 15,
    });
    await renderPage();
    await userEvent.click(screen.getByText("change-tag-1"));

    expect(mockedUpdateTicketTag).toHaveBeenCalledWith(1, 2);
    expect(screen.getByText("Other ticket")).toBeInTheDocument();
    await waitFor(() => expect(mockedFetchTicketCountNumbers).toHaveBeenCalledTimes(2));
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ orgId: 6001, action: "status_changed" }),
    );
  });

  it("reverts and toasts on failure", async () => {
    mockedUpdateTicketTag.mockRejectedValue(new Error("boom"));
    mockedFetchTicketsPage.mockResolvedValue({
      items: [ticket({ id: 1 }), ticket({ id: 5, title: "Other ticket" })],
      total: 2,
      page: 1,
      limit: 15,
    });
    await renderPage();
    await userEvent.click(screen.getByText("change-tag-1"));
    await waitFor(() => expect(toast).toHaveBeenCalledWith("Failed to update status", "error"));
    expect(screen.getByText("Other ticket")).toBeInTheDocument();
  });

  it("still calls the API but skips logging for a ticket not in the loaded list", async () => {
    mockedUpdateTicketTag.mockResolvedValue(undefined);
    await renderPage();
    await userEvent.click(screen.getByText("change-tag-unknown"));
    expect(mockedUpdateTicketTag).toHaveBeenCalledWith(999, 2);
    expect(logActivity).not.toHaveBeenCalled();
  });

  it("skips the revert (nothing to revert to) when a ticket not in the loaded list fails", async () => {
    mockedUpdateTicketTag.mockRejectedValue(new Error("boom"));
    await renderPage();
    await userEvent.click(screen.getByText("change-tag-unknown"));
    await waitFor(() => expect(toast).toHaveBeenCalledWith("Failed to update status", "error"));
    expect(screen.getByText("Fix the login page")).toBeInTheDocument();
  });
});

describe("assign", () => {
  it("updates optimistically, calls the API, and logs activity with involved users", async () => {
    mockedUpdateTicketAssignees.mockResolvedValue(undefined);
    mockedFetchTicketsPage.mockResolvedValue({
      items: [ticket({ id: 1, client: CLIENT_MEMBER, assignees: [MANAGER] }), ticket({ id: 5, title: "Other ticket" })],
      total: 2,
      page: 1,
      limit: 15,
    });
    await renderPage();
    await userEvent.click(screen.getByText("assign-1"));

    expect(mockedUpdateTicketAssignees).toHaveBeenCalledWith(1, [1]);
    expect(screen.getByText("Other ticket")).toBeInTheDocument();
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ orgId: 6001, action: "assigned" }),
    );
  });

  it("reverts and toasts on failure", async () => {
    mockedUpdateTicketAssignees.mockRejectedValue(new Error("boom"));
    mockedFetchTicketsPage.mockResolvedValue({
      items: [ticket({ id: 1 }), ticket({ id: 5, title: "Other ticket" })],
      total: 2,
      page: 1,
      limit: 15,
    });
    await renderPage();
    await userEvent.click(screen.getByText("assign-1"));
    await waitFor(() => expect(toast).toHaveBeenCalledWith("Failed to update assignees", "error"));
    expect(screen.getByText("Other ticket")).toBeInTheDocument();
  });

  it("still calls the API but skips logging for a ticket not in the loaded list", async () => {
    mockedUpdateTicketAssignees.mockResolvedValue(undefined);
    await renderPage();
    await userEvent.click(screen.getByText("assign-unknown"));
    expect(mockedUpdateTicketAssignees).toHaveBeenCalledWith(999, [1]);
    expect(logActivity).not.toHaveBeenCalled();
  });

  it("skips the revert (nothing to revert to) when a ticket not in the loaded list fails", async () => {
    mockedUpdateTicketAssignees.mockRejectedValue(new Error("boom"));
    await renderPage();
    await userEvent.click(screen.getByText("assign-unknown"));
    await waitFor(() => expect(toast).toHaveBeenCalledWith("Failed to update assignees", "error"));
    expect(screen.getByText("Fix the login page")).toBeInTheDocument();
  });
});

describe("toggle star", () => {
  it("stars optimistically and calls the API", async () => {
    mockedUpdateTicketStar.mockResolvedValue(undefined);
    mockedFetchTicketsPage.mockResolvedValue({
      items: [ticket({ id: 1 }), ticket({ id: 5, title: "Other ticket" })],
      total: 2,
      page: 1,
      limit: 15,
    });
    await renderPage();
    await userEvent.click(screen.getByText("toggle-star-1"));
    expect(mockedUpdateTicketStar).toHaveBeenCalledWith(1, true);
    expect(screen.getByText("Other ticket")).toBeInTheDocument();
  });

  it("reloads the list and counts on success when starredOnly", async () => {
    mockedUpdateTicketStar.mockResolvedValue(undefined);
    await renderPage({ starredOnly: true });
    await userEvent.click(screen.getByText("toggle-star-1"));
    await waitFor(() => expect(mockedFetchTicketsPage).toHaveBeenCalledTimes(2));
  });

  it("reverts and toasts the star failure message", async () => {
    mockedUpdateTicketStar.mockRejectedValue(new Error("boom"));
    mockedFetchTicketsPage.mockResolvedValue({
      items: [ticket({ id: 1 }), ticket({ id: 5, title: "Other ticket" })],
      total: 2,
      page: 1,
      limit: 15,
    });
    await renderPage();
    await userEvent.click(screen.getByText("toggle-star-1"));
    await waitFor(() => expect(toast).toHaveBeenCalledWith("Failed to star ticket", "error"));
    expect(screen.getByText("Other ticket")).toBeInTheDocument();
  });

  it("reverts and toasts the unstar failure message", async () => {
    mockedUpdateTicketStar.mockRejectedValue(new Error("boom"));
    mockedFetchTicketsPage.mockResolvedValue({
      items: [ticket({ id: 1, starred: true })],
      total: 1,
      page: 1,
      limit: 15,
    });
    await renderPage();
    await userEvent.click(screen.getByText("toggle-star-1"));
    await waitFor(() => expect(toast).toHaveBeenCalledWith("Failed to unstar ticket", "error"));
  });

  it("does nothing for a ticket not in the loaded list", async () => {
    await renderPage();
    await userEvent.click(screen.getByText("toggle-star-unknown"));
    expect(mockedUpdateTicketStar).not.toHaveBeenCalled();
  });
});

describe("filters and empty states", () => {
  it("applies a filter change", async () => {
    await renderPage();
    await userEvent.click(screen.getByText("apply-filter"));
    expect(setFilter).toHaveBeenCalledWith(expect.objectContaining({ tagIds: [1] }));
  });

  it("shows the 'no matching tickets' empty state with a clear-filters action", async () => {
    mockedFetchTicketsPage.mockResolvedValue({ items: [], total: 0, page: 1, limit: 15 });
    queryState.search = "zzz";
    await renderPage();
    expect(screen.getByText("No matching tickets")).toBeInTheDocument();
    expect(screen.getByText("Try adjusting your search or filters.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(setFilter).toHaveBeenCalledWith(emptyTicketFilter);
    expect(setSearchInput).toHaveBeenCalledWith("");
  });

  it("shows the starred-specific empty state when there are no tickets at all", async () => {
    mockedFetchTicketsPage.mockResolvedValue({ items: [], total: 0, page: 1, limit: 15 });
    mockedFetchTicketCountNumbers.mockResolvedValue({ totalTickets: 0, overdues: 0, onTime: 0, countPerTag: [] });
    await renderPage({ starredOnly: true });
    expect(screen.getByText("No starred tickets")).toBeInTheDocument();
    expect(screen.getByText("Star a ticket from the list to pin it here.")).toBeInTheDocument();
  });
});

it("shows the pending inline alert and dismisses it", async () => {
  mockedUseInlineAlert.mockReturnValue({
    alert: { message: "Ticket X was removed", variant: "error" },
    showAlert,
    dismissAlert,
  });
  await renderPage();
  expect(screen.getByText("Ticket X was removed")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: /dismiss/i }));
  expect(dismissAlert).toHaveBeenCalled();
});
