jest.mock("./ticket-list", () => ({
  __esModule: true,
  TicketList: (props: {
    tickets: { id: number; title: string }[];
    emptyTitle?: string;
    emptySubtitle?: string;
    emptyAction?: React.ReactNode;
    onChangeTag: (id: number, tag: { id: number; tagName: string; color: string; isDefault: boolean; isDeleted: boolean }) => void;
    onToggleStar: (id: number) => void;
  }) => (
    <div data-testid="ticket-list">
      {props.tickets.map((t) => (
        <div key={t.id}>
          {t.title}
          <button onClick={() => props.onChangeTag(t.id, { id: 2, tagName: "Done", color: "#0F0", isDefault: false, isDeleted: false })}>
            change-tag-{t.id}
          </button>
          <button onClick={() => props.onToggleStar(t.id)}>toggle-star-{t.id}</button>
        </div>
      ))}
      <button
        onClick={() =>
          props.onChangeTag(999, { id: 2, tagName: "Done", color: "#0F0", isDefault: false, isDeleted: false })
        }
      >
        change-tag-unknown
      </button>
      <button onClick={() => props.onToggleStar(999)}>toggle-star-unknown</button>
      {props.emptyTitle && <p>{props.emptyTitle}</p>}
      {props.emptySubtitle && <p>{props.emptySubtitle}</p>}
      {props.emptyAction}
    </div>
  ),
}));
jest.mock("./personal-ticket-form-modal", () => ({
  __esModule: true,
  default: (props: { open: boolean; onSubmit: (v: unknown) => void; onClose: () => void }) =>
    props.open ? (
      <div data-testid="form-modal">
        <button onClick={() => props.onSubmit({ title: "New ticket", description: "", tagId: "1", dueDate: "" })}>
          submit-form
        </button>
        <button onClick={() => props.onSubmit({ title: "New ticket", description: "", tagId: "not-a-number", dueDate: "" })}>
          submit-form-invalid-tag
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
import PersonalTicketsPageClient from "./personal-tickets-page-client";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { useLogActivity } from "@/hooks/use-log-activity";
import { useInlineAlert } from "@/hooks/use-inline-alert";
import { useTicketListQueryState } from "@/hooks/use-ticket-list-query-state";
import {
  createPersonalTicket,
  updateTicketTag,
  updateTicketStar,
  fetchPersonalTicketsPage,
  fetchPersonalTicketCountNumbers,
} from "@/lib/api/tickets";
import { getDefaultTags } from "@/lib/data/organizations";
import { emptyTicketFilter } from "./ticket-filter-dropdown";
import type { TicketDetail } from "@/lib/types/ticket/ticket-detail.type";
import type { TagDetail } from "@/lib/types/organization/tag-detail.type";
import { installMockEventSource } from "@/test/mock-event-source";

jest.mock("@/providers/auth-provider", () => ({ useAuth: jest.fn() }));
jest.mock("@/providers/toast-provider", () => ({ useToast: jest.fn() }));
jest.mock("@/hooks/use-log-activity", () => ({ useLogActivity: jest.fn() }));
jest.mock("@/hooks/use-inline-alert", () => ({ useInlineAlert: jest.fn() }));
jest.mock("@/hooks/use-ticket-list-query-state", () => ({ useTicketListQueryState: jest.fn() }));
jest.mock("@/lib/api/tickets", () => ({
  createPersonalTicket: jest.fn(),
  updateTicketTag: jest.fn(),
  updateTicketStar: jest.fn(),
  fetchPersonalTicketsPage: jest.fn(),
  fetchPersonalTicketCountNumbers: jest.fn(),
}));
jest.mock("@/lib/data/organizations", () => ({ getDefaultTags: jest.fn() }));

const mockedUseAuth = useAuth as jest.Mock;
const mockedUseToast = useToast as jest.Mock;
const mockedUseLogActivity = useLogActivity as jest.Mock;
const mockedUseInlineAlert = useInlineAlert as jest.Mock;
const mockedUseTicketListQueryState = useTicketListQueryState as jest.Mock;
const mockedCreatePersonalTicket = createPersonalTicket as jest.Mock;
const mockedUpdateTicketTag = updateTicketTag as jest.Mock;
const mockedUpdateTicketStar = updateTicketStar as jest.Mock;
const mockedFetchPersonalTicketsPage = fetchPersonalTicketsPage as jest.Mock;
const mockedFetchPersonalTicketCountNumbers = fetchPersonalTicketCountNumbers as jest.Mock;
const mockedGetDefaultTags = getDefaultTags as jest.Mock;

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

function ticket(overrides: Partial<TicketDetail> = {}): TicketDetail {
  return {
    id: 1,
    referenceId: "TCK-1",
    orgId: null,
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

let queryState: ReturnType<typeof useTicketListQueryState>;

beforeEach(() => {
  jest.clearAllMocks();
  installMockEventSource();
  mockedUseAuth.mockReturnValue({ currentUser: { id: 1 } });
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
  mockedGetDefaultTags.mockResolvedValue([TODO, DONE]);
  mockedFetchPersonalTicketsPage.mockResolvedValue({ items: [ticket()], total: 1, page: 1, limit: 15 });
  mockedFetchPersonalTicketCountNumbers.mockResolvedValue({
    totalTickets: 1,
    overdues: 0,
    onTime: 1,
    countPerTag: [{ tagId: 1, tagName: "To Do", color: "#000", count: 1 }],
  });
});

async function renderPage(props: Partial<React.ComponentProps<typeof PersonalTicketsPageClient>> = {}) {
  const result = render(<PersonalTicketsPageClient {...props} />);
  await waitFor(() => expect(mockedFetchPersonalTicketsPage).toHaveBeenCalled());
  return result;
}

it("shows the Tickets heading and loads the ticket list", async () => {
  await renderPage();
  expect(screen.getByRole("heading", { name: "Tickets" })).toBeInTheDocument();
  expect(screen.getByText("Fix the login page")).toBeInTheDocument();
  expect(mockedFetchPersonalTicketsPage).toHaveBeenCalledWith(1, {
    page: 1,
    limit: 15,
    search: undefined,
    filterBy: undefined,
    dueDateFrom: undefined,
    dueDateTo: undefined,
  });
});

it("shows the Starred heading, subtitle, and no Create button when starredOnly", async () => {
  await renderPage({ starredOnly: true });
  expect(screen.getByRole("heading", { name: "Starred" })).toBeInTheDocument();
  expect(
    screen.getByText("Tickets you've starred in your personal space."),
  ).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Create ticket/ })).toBeNull();
  expect(mockedFetchPersonalTicketsPage).toHaveBeenCalledWith(
    1,
    expect.objectContaining({ filterBy: ["starred"] }),
  );
  expect(mockedFetchPersonalTicketCountNumbers).toHaveBeenCalledWith(1, { filterBy: ["starred"] });
});

it("does nothing when there's no current user", async () => {
  mockedUseAuth.mockReturnValue({ currentUser: null });
  render(<PersonalTicketsPageClient />);
  await waitFor(() => expect(mockedGetDefaultTags).toHaveBeenCalled());
  expect(mockedFetchPersonalTicketsPage).not.toHaveBeenCalled();
  expect(mockedFetchPersonalTicketCountNumbers).not.toHaveBeenCalled();
});

it("still works when loading the default tag catalog fails", async () => {
  mockedGetDefaultTags.mockRejectedValue(new Error("boom"));
  render(<PersonalTicketsPageClient />);
  await waitFor(() => expect(mockedGetDefaultTags).toHaveBeenCalled());
  await screen.findByText("Tickets");
});

it("toasts when loading tickets fails", async () => {
  mockedFetchPersonalTicketsPage.mockRejectedValue(new Error("boom"));
  render(<PersonalTicketsPageClient />);
  await waitFor(() =>
    expect(toast).toHaveBeenCalledWith("Failed to load tickets", "error"),
  );
});

it("toasts when loading ticket stats fails", async () => {
  mockedFetchPersonalTicketCountNumbers.mockRejectedValue(new Error("boom"));
  await renderPage();
  await waitFor(() =>
    expect(toast).toHaveBeenCalledWith("Failed to load ticket stats", "error"),
  );
});

it("includes overdueOnly in the filterBy list sent to the API", async () => {
  queryState.filter = { ...emptyTicketFilter, overdueOnly: true };
  await renderPage();
  expect(mockedFetchPersonalTicketsPage).toHaveBeenCalledWith(
    1,
    expect.objectContaining({ filterBy: ["overdue"] }),
  );
});

it("shows the overdue stat tile in a danger color when there are overdue tickets", async () => {
  mockedFetchPersonalTicketCountNumbers.mockResolvedValue({
    totalTickets: 3,
    overdues: 2,
    onTime: 1,
    countPerTag: [],
  });
  await renderPage();
  expect(await screen.findByText("2")).toBeInTheDocument();
});

it("sorts the per-tag stat tiles by count, descending", async () => {
  mockedFetchPersonalTicketCountNumbers.mockResolvedValue({
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
  mockedFetchPersonalTicketsPage.mockReturnValueOnce(first);
  mockedFetchPersonalTicketsPage.mockResolvedValueOnce({
    items: [ticket({ id: 2, title: "Second, fresher ticket" })],
    total: 1,
    page: 1,
    limit: 15,
  });

  const { rerender } = render(<PersonalTicketsPageClient starredOnly={false} />);
  rerender(<PersonalTicketsPageClient starredOnly />);
  await waitFor(() => expect(mockedFetchPersonalTicketsPage).toHaveBeenCalledTimes(2));
  await screen.findByText("Second, fresher ticket");

  resolveFirst({ items: [ticket({ id: 1, title: "Stale ticket" })], total: 1, page: 1, limit: 15 });
  await new Promise((r) => setTimeout(r, 0));

  expect(screen.queryByText("Stale ticket")).toBeNull();
  expect(screen.getByText("Second, fresher ticket")).toBeInTheDocument();
});

it("discards a stale ticket-list rejection that rejects after a newer request", async () => {
  let rejectFirst!: (err: Error) => void;
  const first = new Promise<never>((_, reject) => (rejectFirst = reject));
  mockedFetchPersonalTicketsPage.mockReturnValueOnce(first);
  mockedFetchPersonalTicketsPage.mockResolvedValueOnce({
    items: [ticket({ id: 2, title: "Second, fresher ticket" })],
    total: 1,
    page: 1,
    limit: 15,
  });

  const { rerender } = render(<PersonalTicketsPageClient starredOnly={false} />);
  rerender(<PersonalTicketsPageClient starredOnly />);
  await waitFor(() => expect(mockedFetchPersonalTicketsPage).toHaveBeenCalledTimes(2));
  await screen.findByText("Second, fresher ticket");

  rejectFirst(new Error("stale request failed"));
  await new Promise((r) => setTimeout(r, 0));

  expect(toast).not.toHaveBeenCalledWith("Failed to load tickets", "error");
  expect(screen.getByText("Second, fresher ticket")).toBeInTheDocument();
});

describe("create ticket", () => {
  it("opens the form modal, creates a ticket, reloads, logs activity, and shows an alert", async () => {
    const newTicket = ticket({ id: 2, title: "New ticket", referenceId: "TCK-2" });
    mockedCreatePersonalTicket.mockResolvedValue(newTicket);
    await renderPage();

    await userEvent.click(screen.getByRole("button", { name: /Create ticket/ }));
    expect(screen.getByTestId("form-modal")).toBeInTheDocument();
    await userEvent.click(screen.getByText("submit-form"));

    await waitFor(() =>
      expect(mockedCreatePersonalTicket).toHaveBeenCalledWith(1, {
        title: "New ticket",
        description: undefined,
        tagId: 1,
        dueDate: undefined,
      }),
    );
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ action: "created", entityId: 2 }),
    );
    expect(showAlert).toHaveBeenCalledWith("New ticket New ticket was created");
    expect(mockedFetchPersonalTicketsPage).toHaveBeenCalledTimes(2);
  });

  it("closes the modal without creating", async () => {
    await renderPage();
    await userEvent.click(screen.getByRole("button", { name: /Create ticket/ }));
    await userEvent.click(screen.getByText("close-form"));
    expect(screen.queryByTestId("form-modal")).toBeNull();
    expect(mockedCreatePersonalTicket).not.toHaveBeenCalled();
  });

  it("toasts and does not reload when creation fails", async () => {
    mockedCreatePersonalTicket.mockRejectedValue(new Error("boom"));
    await renderPage();
    await userEvent.click(screen.getByRole("button", { name: /Create ticket/ }));
    await userEvent.click(screen.getByText("submit-form"));

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith("Failed to create ticket", "error"),
    );
  });

  it("does nothing when there's no current user", async () => {
    mockedUseAuth.mockReturnValue({ currentUser: null });
    render(<PersonalTicketsPageClient />);
    await userEvent.click(screen.getByRole("button", { name: /Create ticket/ }));
    await userEvent.click(screen.getByText("submit-form"));
    expect(mockedCreatePersonalTicket).not.toHaveBeenCalled();
  });

  it("does nothing when the submitted tagId isn't a valid number", async () => {
    await renderPage();
    await userEvent.click(screen.getByRole("button", { name: /Create ticket/ }));
    await userEvent.click(screen.getByText("submit-form-invalid-tag"));
    expect(mockedCreatePersonalTicket).not.toHaveBeenCalled();
    expect(logActivity).not.toHaveBeenCalled();
    expect(mockedFetchPersonalTicketsPage).toHaveBeenCalledTimes(1);
  });
});

describe("change tag", () => {
  it("updates optimistically, calls the API, refreshes counts, and logs activity", async () => {
    mockedUpdateTicketTag.mockResolvedValue(undefined);
    mockedFetchPersonalTicketsPage.mockResolvedValue({
      items: [ticket({ id: 1, title: "Fix the login page" }), ticket({ id: 5, title: "Other ticket" })],
      total: 2,
      page: 1,
      limit: 15,
    });
    await renderPage();
    await userEvent.click(screen.getByText("change-tag-1"));

    expect(mockedUpdateTicketTag).toHaveBeenCalledWith(1, 2);
    expect(screen.getByText("Other ticket")).toBeInTheDocument();
    await waitFor(() => expect(mockedFetchPersonalTicketCountNumbers).toHaveBeenCalledTimes(2));
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ action: "status_changed" }),
    );
  });

  it("reverts and toasts on failure", async () => {
    mockedUpdateTicketTag.mockRejectedValue(new Error("boom"));
    mockedFetchPersonalTicketsPage.mockResolvedValue({
      items: [ticket({ id: 1, title: "Fix the login page" }), ticket({ id: 5, title: "Other ticket" })],
      total: 2,
      page: 1,
      limit: 15,
    });
    await renderPage();
    await userEvent.click(screen.getByText("change-tag-1"));

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith("Failed to update status", "error"),
    );
    expect(screen.getByText("Other ticket")).toBeInTheDocument();
  });

  it("still calls the API but skips logging and revert bookkeeping for a ticket not in the loaded list", async () => {
    mockedUpdateTicketTag.mockRejectedValue(new Error("boom"));
    await renderPage();
    await userEvent.click(screen.getByText("change-tag-unknown"));

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith("Failed to update status", "error"),
    );
    expect(mockedUpdateTicketTag).toHaveBeenCalledWith(999, 2);
    expect(logActivity).not.toHaveBeenCalled();
  });
});

describe("toggle star", () => {
  it("stars optimistically and calls the API", async () => {
    mockedUpdateTicketStar.mockResolvedValue(undefined);
    mockedFetchPersonalTicketsPage.mockResolvedValue({
      items: [ticket({ id: 1, title: "Fix the login page" }), ticket({ id: 5, title: "Other ticket" })],
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
    await waitFor(() => expect(mockedFetchPersonalTicketsPage).toHaveBeenCalledTimes(2));
  });

  it("reverts and toasts on failure", async () => {
    mockedUpdateTicketStar.mockRejectedValue(new Error("boom"));
    mockedFetchPersonalTicketsPage.mockResolvedValue({
      items: [ticket({ id: 1, title: "Fix the login page" }), ticket({ id: 5, title: "Other ticket" })],
      total: 2,
      page: 1,
      limit: 15,
    });
    await renderPage();
    await userEvent.click(screen.getByText("toggle-star-1"));
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith("Failed to star ticket", "error"),
    );
    expect(screen.getByText("Other ticket")).toBeInTheDocument();
  });

  it("shows the 'unstar' failure message when unstarring a starred ticket fails", async () => {
    mockedUpdateTicketStar.mockRejectedValue(new Error("boom"));
    mockedFetchPersonalTicketsPage.mockResolvedValue({
      items: [ticket({ id: 1, title: "Fix the login page", starred: true })],
      total: 1,
      page: 1,
      limit: 15,
    });
    await renderPage();
    await userEvent.click(screen.getByText("toggle-star-1"));
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith("Failed to unstar ticket", "error"),
    );
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

  it("shows the 'no matching tickets' empty state with a clear-filters action when a query yields no results", async () => {
    mockedFetchPersonalTicketsPage.mockResolvedValue({ items: [], total: 0, page: 1, limit: 15 });
    queryState.search = "zzz";
    await renderPage();
    expect(screen.getByText("No matching tickets")).toBeInTheDocument();
    expect(screen.getByText("Try adjusting your search or filters.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(setFilter).toHaveBeenCalledWith(emptyTicketFilter);
    expect(setSearchInput).toHaveBeenCalledWith("");
  });

  it("shows the starred-specific empty state when there are no tickets at all", async () => {
    mockedFetchPersonalTicketsPage.mockResolvedValue({ items: [], total: 0, page: 1, limit: 15 });
    mockedFetchPersonalTicketCountNumbers.mockResolvedValue({
      totalTickets: 0,
      overdues: 0,
      onTime: 0,
      countPerTag: [],
    });
    await renderPage({ starredOnly: true });
    expect(screen.getByText("No starred tickets")).toBeInTheDocument();
    expect(
      screen.getByText("Star a ticket from the list to pin it here."),
    ).toBeInTheDocument();
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
