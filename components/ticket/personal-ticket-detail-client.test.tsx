jest.mock("./ticket-overview-card", () => ({
  __esModule: true,
  default: (props: { ticketTitle: string }) => (
    <div data-testid="overview-card">{props.ticketTitle}</div>
  ),
}));
jest.mock("./personal-ticket-details-card", () => ({
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
import PersonalTicketDetailClient from "./personal-ticket-detail-client";
import { useToast } from "@/providers/toast-provider";
import { useLogActivity } from "@/hooks/use-log-activity";
import { updateTicket, updateTicketStar, deleteTicket } from "@/lib/api/tickets";
import { getDefaultTags } from "@/lib/data/organizations";
import { setPendingAlert } from "@/lib/helper/pending-alert";
import type { TagDetail } from "@/lib/types/organization/tag-detail.type";
import type { TicketDetail } from "@/lib/types/ticket/ticket-detail.type";

jest.mock("next/navigation", () => ({ useRouter: jest.fn() }));
jest.mock("@/providers/toast-provider", () => ({ useToast: jest.fn() }));
jest.mock("@/hooks/use-log-activity", () => ({ useLogActivity: jest.fn() }));
jest.mock("@/lib/api/tickets", () => ({
  updateTicket: jest.fn(),
  updateTicketStar: jest.fn(),
  deleteTicket: jest.fn(),
}));
jest.mock("@/lib/data/organizations", () => ({ getDefaultTags: jest.fn() }));
jest.mock("@/lib/helper/pending-alert", () => ({ setPendingAlert: jest.fn() }));

const mockedUseRouter = useRouter as jest.Mock;
const mockedUseToast = useToast as jest.Mock;
const mockedUseLogActivity = useLogActivity as jest.Mock;
const mockedUpdateTicket = updateTicket as jest.Mock;
const mockedUpdateTicketStar = updateTicketStar as jest.Mock;
const mockedDeleteTicket = deleteTicket as jest.Mock;
const mockedGetDefaultTags = getDefaultTags as jest.Mock;
const mockedSetPendingAlert = setPendingAlert as jest.Mock;

const push = jest.fn();
const toast = jest.fn();
const logActivity = jest.fn();

const TODO: TagDetail = { id: 1, tagName: "To Do", color: "#000", isDefault: true, isDeleted: false };

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

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseRouter.mockReturnValue({ push });
  mockedUseToast.mockReturnValue(toast);
  mockedUseLogActivity.mockReturnValue(logActivity);
  mockedGetDefaultTags.mockResolvedValue([TODO]);
});

async function renderClient(props: Partial<React.ComponentProps<typeof PersonalTicketDetailClient>> = {}) {
  const result = render(<PersonalTicketDetailClient ticket={ticket()} {...props} />);
  await waitFor(() => expect(mockedGetDefaultTags).toHaveBeenCalled());
  return result;
}

it("renders the ticket title, reference id, and tag", async () => {
  await renderClient();
  expect(screen.getByRole("heading", { name: "Fix the login page" })).toBeInTheDocument();
  expect(screen.getByText("TCK-1")).toBeInTheDocument();
  expect(screen.getByText("To Do")).toBeInTheDocument();
});

it("shows the overdue chip when the ticket is overdue", async () => {
  jest.useFakeTimers().setSystemTime(new Date("2026-03-15T12:00:00Z"));
  await renderClient({ ticket: ticket({ dueDate: "2026-01-01" }) });
  expect(screen.getByText("Overdue")).toBeInTheDocument();
  jest.useRealTimers();
});

it("loads default tags and passes them to the details card", async () => {
  const DONE: TagDetail = { id: 2, tagName: "Done", color: "#0F0", isDefault: false, isDeleted: false };
  mockedGetDefaultTags.mockResolvedValue([TODO, DONE]);
  await renderClient();
});

it("silently falls back to the ticket's own tag if loading default tags fails", async () => {
  mockedGetDefaultTags.mockRejectedValue(new Error("boom"));
  await renderClient();
  expect(screen.getByTestId("details-card")).toHaveTextContent("To Do");
});

describe("star toggle", () => {
  it("stars optimistically and calls updateTicketStar", async () => {
    mockedUpdateTicketStar.mockResolvedValue(undefined);
    await renderClient({ ticket: ticket({ starred: false }) });
    await userEvent.click(screen.getByRole("button", { name: "Star ticket" }));
    expect(mockedUpdateTicketStar).toHaveBeenCalledWith(1, true);
    expect(screen.getByRole("button", { name: "Unstar ticket" })).toBeInTheDocument();
  });

  it("reverts and toasts on failure", async () => {
    mockedUpdateTicketStar.mockRejectedValue(new Error("boom"));
    await renderClient({ ticket: ticket({ starred: false }) });
    await userEvent.click(screen.getByRole("button", { name: "Star ticket" }));
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith("Failed to star ticket", "error"),
    );
    expect(screen.getByRole("button", { name: "Star ticket" })).toBeInTheDocument();
  });

  it("unstars and shows the 'unstar' failure message on revert", async () => {
    mockedUpdateTicketStar.mockRejectedValue(new Error("boom"));
    await renderClient({ ticket: ticket({ starred: true }) });
    await userEvent.click(screen.getByRole("button", { name: "Unstar ticket" }));
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith("Failed to unstar ticket", "error"),
    );
  });
});

describe("title editing", () => {
  it("enters edit mode, commits a changed title on blur, and logs activity", async () => {
    mockedUpdateTicket.mockResolvedValue(undefined);
    await renderClient();
    await userEvent.click(screen.getByRole("button", { name: "Edit title" }));
    const input = screen.getByDisplayValue("Fix the login page");
    await userEvent.clear(input);
    await userEvent.type(input, "Fix the signup page");
    await userEvent.tab();

    expect(screen.getByRole("heading", { name: "Fix the signup page" })).toBeInTheDocument();
    expect(mockedUpdateTicket).toHaveBeenCalledWith(1, { title: "Fix the signup page" });
    expect(toast).toHaveBeenCalledWith("Ticket title updated");
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ action: "title_updated" }),
    );
  });

  it("commits a changed title on Enter", async () => {
    mockedUpdateTicket.mockResolvedValue(undefined);
    await renderClient();
    await userEvent.click(screen.getByRole("button", { name: "Edit title" }));
    const input = screen.getByDisplayValue("Fix the login page");
    await userEvent.clear(input);
    await userEvent.type(input, "Renamed{Enter}");

    expect(screen.getByRole("heading", { name: "Renamed" })).toBeInTheDocument();
  });

  it("cancels editing on Escape without committing", async () => {
    await renderClient();
    await userEvent.click(screen.getByRole("button", { name: "Edit title" }));
    const input = screen.getByDisplayValue("Fix the login page");
    await userEvent.clear(input);
    await userEvent.type(input, "Should not stick{Escape}");

    expect(screen.getByRole("heading", { name: "Fix the login page" })).toBeInTheDocument();
    expect(mockedUpdateTicket).not.toHaveBeenCalled();
  });

  it("does not commit when the draft is unchanged", async () => {
    await renderClient();
    await userEvent.click(screen.getByRole("button", { name: "Edit title" }));
    await userEvent.tab();
    expect(mockedUpdateTicket).not.toHaveBeenCalled();
  });

  it("does not commit when the draft is cleared to blank", async () => {
    await renderClient();
    await userEvent.click(screen.getByRole("button", { name: "Edit title" }));
    const input = screen.getByDisplayValue("Fix the login page");
    await userEvent.clear(input);
    await userEvent.tab();

    expect(screen.getByRole("heading", { name: "Fix the login page" })).toBeInTheDocument();
    expect(mockedUpdateTicket).not.toHaveBeenCalled();
  });

  it("reverts and toasts on failure", async () => {
    mockedUpdateTicket.mockRejectedValue(new Error("boom"));
    await renderClient();
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
  it("opens the confirm dialog, deletes, logs activity, sets a pending alert, and redirects", async () => {
    mockedDeleteTicket.mockResolvedValue(undefined);
    await renderClient();
    await userEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(screen.getByText("Delete ticket")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(mockedDeleteTicket).toHaveBeenCalledWith(1));
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ action: "removed" }),
    );
    expect(mockedSetPendingAlert).toHaveBeenCalledWith(
      "Ticket Fix the login page was removed",
      "error",
    );
    expect(push).toHaveBeenCalledWith("/dashboard/tickets");
  });

  it("closes without deleting when cancelled", async () => {
    await renderClient();
    await userEvent.click(screen.getByRole("button", { name: "Remove" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(mockedDeleteTicket).not.toHaveBeenCalled();
  });

  it("toasts and does not redirect when deletion fails", async () => {
    mockedDeleteTicket.mockRejectedValue(new Error("boom"));
    await renderClient();
    await userEvent.click(screen.getByRole("button", { name: "Remove" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith("Failed to delete ticket", "error"),
    );
    expect(push).not.toHaveBeenCalled();
    expect(mockedSetPendingAlert).not.toHaveBeenCalled();
  });
});
