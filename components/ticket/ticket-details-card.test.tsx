import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TicketDetailsCard from "./ticket-details-card";
import { usePermission } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { useLogActivity } from "@/hooks/use-log-activity";
import { updateTicket, updateTicketTag, updateTicketAssignees } from "@/lib/api/tickets";
import { PERMISSIONS } from "@/lib/data/permissions";
import type { TagDetail } from "@/lib/types/organization/tag-detail.type";
import type { MemberDetail } from "@/lib/types/organization/member-detail.type";
import type { OrganizationDetail } from "@/lib/types/organization/organization-detail.type";

jest.mock("@/providers/auth-provider", () => {
  const actual = jest.requireActual("@/providers/auth-provider");
  return { ...actual, usePermission: jest.fn() };
});
jest.mock("@/providers/toast-provider", () => ({ useToast: jest.fn() }));
jest.mock("@/hooks/use-log-activity", () => ({ useLogActivity: jest.fn() }));
jest.mock("@/lib/api/tickets", () => ({
  updateTicket: jest.fn(),
  updateTicketTag: jest.fn(),
  updateTicketAssignees: jest.fn(),
}));

const mockedUsePermission = usePermission as jest.Mock;
const mockedUseToast = useToast as jest.Mock;
const mockedUseLogActivity = useLogActivity as jest.Mock;
const mockedUpdateTicket = updateTicket as jest.Mock;
const mockedUpdateTicketTag = updateTicketTag as jest.Mock;
const mockedUpdateTicketAssignees = updateTicketAssignees as jest.Mock;

const toast = jest.fn();
const logActivity = jest.fn();

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
    user: {
      id: base.id,
      firstName: base.firstName,
      lastName: base.lastName,
      email: base.email,
    } as MemberDetail["user"],
  };
}

const CLIENT = member({ id: 2, firstName: "Alex", lastName: "Kim", role: { id: 2, roleName: "Client" } as MemberDetail["role"] });
const ASSIGNEE = member({ id: 1, firstName: "Jane", lastName: "Doe" });
const ANOTHER_MEMBER = member({ id: 3, firstName: "Marco", lastName: "Reyes" });
const REMOVED_MEMBER: MemberDetail = { ...member({ id: 4, firstName: "Priya", lastName: "Kapoor" }), user: null };

function org(overrides: Partial<OrganizationDetail> = {}): OrganizationDetail {
  return {
    id: 6001,
    organizationName: "Acme Studio",
    ownerId: 1,
    settings: { timezone: "UTC" } as OrganizationDetail["settings"],
    capacity: {} as OrganizationDetail["capacity"],
    owner: {} as OrganizationDetail["owner"],
    roles: [],
    tags: [TODO, DONE],
    projects: [],
    members: [CLIENT, ASSIGNEE, ANOTHER_MEMBER],
    tickets: [],
    ticketRequests: [],
    ...overrides,
  } as OrganizationDetail;
}

async function openAssignDropdown() {
  const trigger = document.querySelector('[aria-haspopup="menu"]') as HTMLElement;
  await userEvent.click(trigger);
}

function withPermissions(actions: string[]) {
  mockedUsePermission.mockImplementation((action: string) => actions.includes(action));
}

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseToast.mockReturnValue(toast);
  mockedUseLogActivity.mockReturnValue(logActivity);
});

function renderCard(overrides: Partial<React.ComponentProps<typeof TicketDetailsCard>> = {}) {
  const onChangeTag = jest.fn();
  const onAssigneesChange = jest.fn();
  const onDueDateChange = jest.fn();
  render(
    <TicketDetailsCard
      ticketId={1}
      referenceId="TCK-1"
      ticketTitle="Fix the login page"
      tag={TODO}
      onChangeTag={onChangeTag}
      client={CLIENT}
      assignees={[]}
      onAssigneesChange={onAssigneesChange}
      dueDate={null}
      onDueDateChange={onDueDateChange}
      organization={org()}
      {...overrides}
    />,
  );
  return { onChangeTag, onAssigneesChange, onDueDateChange };
}

describe("status", () => {
  it("shows the TagPicker and changes tag when the user has ticket.change_tag", async () => {
    withPermissions([PERMISSIONS.TICKET_CHANGE_TAG]);
    mockedUpdateTicketTag.mockResolvedValue(undefined);
    const { onChangeTag } = renderCard({ assignees: [ASSIGNEE] });
    await userEvent.click(screen.getByText("To Do"));
    await userEvent.click(screen.getByRole("menuitem", { name: /Done/ }));

    expect(onChangeTag).toHaveBeenCalledWith(DONE);
    expect(mockedUpdateTicketTag).toHaveBeenCalledWith(1, 2);
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ orgId: 6001, action: "status_changed" }),
    );
  });

  it("reverts the tag and toasts on failure", async () => {
    withPermissions([PERMISSIONS.TICKET_CHANGE_TAG]);
    mockedUpdateTicketTag.mockRejectedValue(new Error("boom"));
    const { onChangeTag } = renderCard();
    await userEvent.click(screen.getByText("To Do"));
    await userEvent.click(screen.getByRole("menuitem", { name: /Done/ }));

    await new Promise((r) => setTimeout(r, 0));
    expect(onChangeTag).toHaveBeenLastCalledWith(TODO);
    expect(toast).toHaveBeenCalledWith("Failed to update status", "error");
  });

  it("shows a read-only badge without ticket.change_tag", () => {
    withPermissions([]);
    renderCard();
    expect(screen.queryByRole("button", { name: "To Do" })).toBeNull();
    expect(screen.getByText("To Do")).toBeInTheDocument();
  });
});

describe("assignees", () => {
  it("hides the assignees row entirely without assign or assign_view permission", () => {
    withPermissions([]);
    renderCard();
    expect(screen.queryByText("Assignees")).toBeNull();
  });

  it("shows an Assign trigger and assigns a member when the user can assign", async () => {
    withPermissions([PERMISSIONS.TICKET_ASSIGN]);
    mockedUpdateTicketAssignees.mockResolvedValue(undefined);
    const { onAssigneesChange } = renderCard({ assignees: [ANOTHER_MEMBER] });

    await openAssignDropdown();
    await userEvent.click(screen.getByLabelText("Jane Doe"));

    expect(onAssigneesChange).toHaveBeenCalledWith([ASSIGNEE, ANOTHER_MEMBER]);
    expect(mockedUpdateTicketAssignees).toHaveBeenCalledWith(1, [3, 1]);
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ orgId: 6001, action: "assigned" }),
    );
  });

  it("excludes Client-role members from the assignable options", async () => {
    withPermissions([PERMISSIONS.TICKET_ASSIGN]);
    renderCard({ assignees: [] });
    await openAssignDropdown();
    const menu = within(screen.getByRole("menu"));
    expect(menu.queryByLabelText("Alex Kim")).toBeNull();
    expect(menu.getByLabelText("Jane Doe")).toBeInTheDocument();
  });

  it("reverts assignees and toasts on failure", async () => {
    withPermissions([PERMISSIONS.TICKET_ASSIGN]);
    mockedUpdateTicketAssignees.mockRejectedValue(new Error("boom"));
    const { onAssigneesChange } = renderCard({ assignees: [] });
    await openAssignDropdown();
    await userEvent.click(screen.getByLabelText("Jane Doe"));

    await new Promise((r) => setTimeout(r, 0));
    expect(onAssigneesChange).toHaveBeenLastCalledWith([]);
    expect(toast).toHaveBeenCalledWith("Failed to update assignees", "error");
  });

  it("shows selected assignees as chips inside the dropdown trigger when the user can assign", () => {
    withPermissions([PERMISSIONS.TICKET_ASSIGN]);
    renderCard({ assignees: [ASSIGNEE] });
    expect(screen.getAllByText("Jane Doe").length).toBeGreaterThan(0);
  });

  it("falls back to the member's own name for a removed user's chip", () => {
    withPermissions([PERMISSIONS.TICKET_ASSIGN]);
    renderCard({ assignees: [REMOVED_MEMBER] });
    expect(screen.getAllByText("Priya Kapoor").length).toBeGreaterThan(0);
  });

  it("shows 'No assignees' for a viewer with only assign_view and no assignees", () => {
    withPermissions([PERMISSIONS.TICKET_ASSIGN_VIEW]);
    renderCard({ assignees: [] });
    expect(screen.getByText("No assignees")).toBeInTheDocument();
  });

  it("shows read-only assignee chips for a viewer with only assign_view", () => {
    withPermissions([PERMISSIONS.TICKET_ASSIGN_VIEW]);
    renderCard({ assignees: [ASSIGNEE] });
    expect(screen.queryByRole("button", { name: /Jane Doe/ })).toBeNull();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  });

  it("falls back to the member's own name for a removed user's read-only chip", () => {
    withPermissions([PERMISSIONS.TICKET_ASSIGN_VIEW]);
    renderCard({ assignees: [REMOVED_MEMBER] });
    expect(screen.getByText("Priya Kapoor")).toBeInTheDocument();
  });
});

describe("client", () => {
  it("shows the client's name", () => {
    withPermissions([]);
    renderCard({ client: CLIENT });
    expect(screen.getByText("Alex Kim")).toBeInTheDocument();
  });

  it("shows 'No client' when there's none", () => {
    withPermissions([]);
    renderCard({ client: null });
    expect(screen.getByText("No client")).toBeInTheDocument();
  });

  it("falls back to the member's own name for a removed client's user", () => {
    withPermissions([]);
    renderCard({ client: REMOVED_MEMBER });
    expect(screen.getByText("Priya Kapoor")).toBeInTheDocument();
  });
});

describe("due date", () => {
  it("sets the due date, calls updateTicket, and logs activity", async () => {
    withPermissions([]);
    mockedUpdateTicket.mockResolvedValue(undefined);
    const { onDueDateChange } = renderCard({ assignees: [ASSIGNEE] });
    const input = document.querySelector('input[type="date"]') as HTMLInputElement;
    await userEvent.type(input, "2026-03-01");

    expect(onDueDateChange).toHaveBeenCalledWith("2026-03-01");
    expect(mockedUpdateTicket).toHaveBeenCalledWith(1, { dueDate: "2026-03-01" });
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        orgId: 6001,
        action: "due_date_changed",
        description: expect.stringContaining("changed due date"),
      }),
    );
  });

  it("reverts the due date and toasts on failure", async () => {
    withPermissions([]);
    mockedUpdateTicket.mockRejectedValue(new Error("boom"));
    const { onDueDateChange } = renderCard({ dueDate: "2026-02-01" });
    const input = document.querySelector('input[type="date"]') as HTMLInputElement;
    await userEvent.clear(input);
    await userEvent.type(input, "2026-03-01");

    await new Promise((r) => setTimeout(r, 0));
    expect(onDueDateChange).toHaveBeenLastCalledWith("2026-02-01");
    expect(toast).toHaveBeenCalledWith("Failed to update due date", "error");
  });

  it("logs a 'cleared the due date' description when cleared", async () => {
    withPermissions([]);
    mockedUpdateTicket.mockResolvedValue(undefined);
    renderCard({ dueDate: "2026-02-01" });
    const input = document.querySelector('input[type="date"]') as HTMLInputElement;
    await userEvent.clear(input);
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ description: expect.stringContaining("cleared the due date") }),
    );
  });

  it("shows the overdue chip and formatted caption when overdue", () => {
    withPermissions([]);
    jest.useFakeTimers().setSystemTime(new Date("2026-03-15T12:00:00Z"));
    renderCard({ dueDate: "2026-01-01" });
    expect(screen.getByText("Overdue")).toBeInTheDocument();
    jest.useRealTimers();
  });

  it("shows no chip and no caption without a due date", () => {
    withPermissions([]);
    renderCard({ dueDate: null });
    expect(screen.queryByText("Overdue")).toBeNull();
    expect(screen.queryByText("Due today")).toBeNull();
  });
});
