jest.mock("./ticket-description-cell", () => ({
  __esModule: true,
  default: () => <div data-testid="description-cell" />,
}));

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TicketList } from "./ticket-list";
import { usePermission } from "@/providers/auth-provider";
import { PERMISSIONS } from "@/lib/data/permissions";
import type { TicketDetail } from "@/lib/types/ticket/ticket-detail.type";
import type { TagDetail } from "@/lib/types/organization/tag-detail.type";
import type { MemberDetail } from "@/lib/types/organization/member-detail.type";

jest.mock("@/providers/auth-provider", () => {
  const actual = jest.requireActual("@/providers/auth-provider");
  return { ...actual, usePermission: jest.fn() };
});

const mockedUsePermission = usePermission as jest.Mock;

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
    ...overrides,
  };
  return {
    ...base,
    user: { id: base.id, firstName: base.firstName, lastName: base.lastName, email: base.email } as MemberDetail["user"],
  };
}

const ASSIGNEE = member({ id: 1, firstName: "Jane", lastName: "Doe" });
const ANOTHER_MEMBER = member({ id: 2, firstName: "Marco", lastName: "Reyes" });
// A historical assignee whose org membership was later removed — assignees
// are a point-in-time snapshot, so ticket.assignees can still reference one.
const REMOVED_ASSIGNEE: MemberDetail = { ...member({ id: 3, firstName: "Priya", lastName: "Kapoor" }), user: null };

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
  mockedUsePermission.mockImplementation((action: string) => actions.includes(action));
}

function renderList(overrides: Partial<React.ComponentProps<typeof TicketList>> = {}) {
  const onChangeTag = jest.fn();
  const onAssign = jest.fn();
  const onToggleStar = jest.fn();
  render(
    <TicketList
      tickets={[ticket()]}
      availableTags={[TODO, DONE]}
      assignableMembers={[ASSIGNEE, ANOTHER_MEMBER]}
      onChangeTag={onChangeTag}
      onAssign={onAssign}
      onToggleStar={onToggleStar}
      {...overrides}
    />,
  );
  return { onChangeTag, onAssign, onToggleStar };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("empty state", () => {
  it("shows the default empty state when there are no tickets", () => {
    withPermissions([]);
    renderList({ tickets: [] });
    expect(screen.getByText("No tickets yet")).toBeInTheDocument();
    expect(
      screen.getByText("Create your first ticket to get started."),
    ).toBeInTheDocument();
  });

  it("shows a custom empty title, subtitle, and action", () => {
    withPermissions([]);
    renderList({
      tickets: [],
      emptyTitle: "No matches",
      emptySubtitle: "Try a different filter.",
      emptyAction: <button>Clear filters</button>,
    });
    expect(screen.getByText("No matches")).toBeInTheDocument();
    expect(screen.getByText("Try a different filter.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear filters" })).toBeInTheDocument();
  });
});

describe("row basics", () => {
  it("links the reference id and title to the ticket page", () => {
    withPermissions([]);
    renderList({ tickets: [ticket({ id: 42, referenceId: "TCK-42" })] });
    expect(screen.getByRole("link", { name: "TCK-42" })).toHaveAttribute(
      "href",
      "/dashboard/tickets/42",
    );
    expect(screen.getByRole("link", { name: "Fix the login page" })).toHaveAttribute(
      "href",
      "/dashboard/tickets/42",
    );
  });

  it("toggles the star and reflects starred state", async () => {
    withPermissions([]);
    const { onToggleStar } = renderList({
      tickets: [ticket({ id: 7, starred: false })],
    });
    const starButton = screen.getByRole("button", { name: "Star ticket" });
    expect(starButton).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(starButton);
    expect(onToggleStar).toHaveBeenCalledWith(7);
  });

  it("shows the unstar label and pressed state for a starred ticket", () => {
    withPermissions([]);
    renderList({ tickets: [ticket({ starred: true })] });
    expect(screen.getByRole("button", { name: "Unstar ticket" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("shows the due timeframe and chip when a due date is set", () => {
    withPermissions([]);
    jest.useFakeTimers().setSystemTime(new Date("2026-03-15T12:00:00Z"));
    renderList({ tickets: [ticket({ dueDate: "2026-01-01" })] });
    expect(screen.getByText(/Due on/)).toBeInTheDocument();
    expect(screen.getByText("Overdue")).toBeInTheDocument();
    jest.useRealTimers();
  });

  it("shows no timeframe when there's no due date", () => {
    withPermissions([]);
    renderList({ tickets: [ticket({ dueDate: null })] });
    expect(screen.queryByText(/Due on/)).toBeNull();
  });

  it("shows the client's name when present", () => {
    withPermissions([]);
    renderList({ tickets: [ticket({ client: ASSIGNEE })] });
    expect(screen.getByText(/Client: Jane Doe/)).toBeInTheDocument();
  });

  it("shows no client line when absent", () => {
    withPermissions([]);
    renderList({ tickets: [ticket({ client: null })] });
    expect(screen.queryByText(/Client:/)).toBeNull();
  });
});

describe("status column", () => {
  it("shows the TagPicker and calls onChangeTag when permitted", async () => {
    withPermissions([PERMISSIONS.TICKET_CHANGE_TAG]);
    const { onChangeTag } = renderList({ tickets: [ticket({ id: 1, tag: TODO })] });
    await userEvent.click(screen.getByText("To Do"));
    await userEvent.click(screen.getByRole("menuitem", { name: /Done/ }));
    expect(onChangeTag).toHaveBeenCalledWith(1, DONE);
  });

  it("shows a read-only badge without permission", () => {
    withPermissions([]);
    renderList({ tickets: [ticket({ tag: TODO })] });
    expect(screen.queryByRole("button", { name: "To Do" })).toBeNull();
    expect(screen.getByText("To Do")).toBeInTheDocument();
  });
});

describe("assignees column", () => {
  it("hides the column without assign or assign_view", () => {
    withPermissions([]);
    renderList();
    expect(screen.queryByText("Assignees")).toBeNull();
  });

  it("hides the column when hideAssign is set even with permission", () => {
    withPermissions([PERMISSIONS.TICKET_ASSIGN]);
    renderList({ hideAssign: true });
    expect(screen.queryByText("Assignees")).toBeNull();
  });

  it("shows an Assign trigger and assigns via the dropdown when the user can assign", async () => {
    withPermissions([PERMISSIONS.TICKET_ASSIGN]);
    const { onAssign } = renderList({ tickets: [ticket({ id: 5, assignees: [] })] });
    const trigger = document.querySelector('[aria-haspopup="menu"]') as HTMLElement;
    await userEvent.click(trigger);
    await userEvent.click(screen.getByLabelText("Jane Doe"));
    expect(onAssign).toHaveBeenCalledWith(5, [1]);
  });

  it("lists a member whose user account was removed from the org as an assign option", async () => {
    withPermissions([PERMISSIONS.TICKET_ASSIGN]);
    renderList({
      tickets: [ticket({ id: 5, assignees: [] })],
      assignableMembers: [ASSIGNEE, REMOVED_ASSIGNEE],
    });
    const trigger = document.querySelector('[aria-haspopup="menu"]') as HTMLElement;
    await userEvent.click(trigger);
    expect(screen.getByLabelText("Jane Doe")).toBeInTheDocument();
  });

  it("shows avatars for existing assignees when the user can assign", () => {
    withPermissions([PERMISSIONS.TICKET_ASSIGN]);
    renderList({ tickets: [ticket({ assignees: [ASSIGNEE] })] });
    expect(screen.getByLabelText("Jane Doe")).toBeInTheDocument();
  });

  it("falls back to a '?' avatar for a removed assignee when the user can assign", () => {
    withPermissions([PERMISSIONS.TICKET_ASSIGN]);
    renderList({ tickets: [ticket({ assignees: [REMOVED_ASSIGNEE] })] });
    expect(screen.getByText("?")).toBeInTheDocument();
  });

  it("shows 'Unassigned' for a viewer with only assign_view and no assignees", () => {
    withPermissions([PERMISSIONS.TICKET_ASSIGN_VIEW]);
    renderList({ tickets: [ticket({ assignees: [] })] });
    expect(screen.getByText("Unassigned")).toBeInTheDocument();
  });

  it("shows read-only avatars for a viewer with only assign_view and assignees", () => {
    withPermissions([PERMISSIONS.TICKET_ASSIGN_VIEW]);
    renderList({ tickets: [ticket({ assignees: [ASSIGNEE] })] });
    expect(screen.getByLabelText("Jane Doe")).toBeInTheDocument();
    expect(document.querySelector('[aria-haspopup="menu"]')).toBeNull();
  });

  it("falls back to a '?' read-only avatar for a removed assignee", () => {
    withPermissions([PERMISSIONS.TICKET_ASSIGN_VIEW]);
    renderList({ tickets: [ticket({ assignees: [REMOVED_ASSIGNEE] })] });
    expect(screen.getByText("?")).toBeInTheDocument();
  });
});
