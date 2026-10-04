import { render, screen } from "@testing-library/react";
import TicketActivityCard from "./ticket-activity-card";
import { useActivityLog } from "@/providers/activity-log-provider";
import { useAuth } from "@/providers/auth-provider";

jest.mock("@/providers/activity-log-provider", () => ({ useActivityLog: jest.fn() }));
jest.mock("@/providers/auth-provider", () => ({ useAuth: jest.fn() }));

const mockedUseActivityLog = useActivityLog as jest.Mock;
const mockedUseAuth = useAuth as jest.Mock;

function entry(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 1,
    orgId: 6001,
    module: "ticket",
    action: "commented",
    entityId: 1,
    entityLabel: "TCK-1",
    actorId: 1,
    actorName: "Jane Doe",
    actorAvatar: null,
    involvedUserIds: [1],
    description: "commented on this ticket",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

beforeEach(() => {
  mockedUseAuth.mockReturnValue({ activeOrganization: { settings: { timezone: "UTC" } } });
});

it("works with no active organization (a personal ticket)", () => {
  mockedUseAuth.mockReturnValue({ activeOrganization: null });
  mockedUseActivityLog.mockReturnValue({ entries: [] });
  render(<TicketActivityCard ticketId={1} createdAt="2026-01-01T00:00:00.000Z" />);
  expect(screen.getByText("Ticket created")).toBeInTheDocument();
});

it("falls back to a synthetic 'Ticket created' step when no logged creation entry exists", () => {
  mockedUseActivityLog.mockReturnValue({ entries: [] });
  render(<TicketActivityCard ticketId={1} createdAt="2026-01-01T00:00:00.000Z" />);
  expect(screen.getByText("Ticket created")).toBeInTheDocument();
});

it("filters entries to just this ticket", () => {
  mockedUseActivityLog.mockReturnValue({
    entries: [
      entry({ id: 1, entityId: 1 }),
      entry({ id: 2, entityId: 999 }),
      entry({ id: 3, module: "project", entityId: 1 }),
    ],
  });
  render(<TicketActivityCard ticketId={1} createdAt="2026-01-01T00:00:00.000Z" />);
  expect(screen.getAllByText(/Jane Doe/)).toHaveLength(1);
});

it("uses the real logged 'created' entry instead of the fallback when present", () => {
  mockedUseActivityLog.mockReturnValue({
    entries: [
      entry({
        id: 1,
        action: "created",
        actorName: "Marco Reyes",
        description: "created this ticket",
      }),
    ],
  });
  render(<TicketActivityCard ticketId={1} createdAt="2026-01-01T00:00:00.000Z" />);
  expect(screen.queryByText("Ticket created")).toBeNull();
  expect(screen.getByText(/Marco Reyes created this ticket/)).toBeInTheDocument();
});

it("sorts non-creation entries newest first, with creation always last", () => {
  mockedUseActivityLog.mockReturnValue({
    entries: [
      entry({
        id: 1,
        action: "created",
        actorName: "Jane",
        createdAt: "2026-01-01T00:00:00.000Z",
      }),
      entry({
        id: 2,
        action: "commented",
        actorName: "Old comment",
        createdAt: "2026-01-05T00:00:00.000Z",
      }),
      entry({
        id: 3,
        action: "status_changed",
        actorName: "New comment",
        createdAt: "2026-01-10T00:00:00.000Z",
      }),
      entry({
        id: 4,
        action: "assigned",
        actorName: "Middle comment",
        createdAt: "2026-01-07T00:00:00.000Z",
      }),
    ],
  });
  render(<TicketActivityCard ticketId={1} createdAt="2026-01-01T00:00:00.000Z" />);
  const labels = screen.getAllByRole("listitem").map((li) => li.textContent);
  expect(labels[0]).toContain("New comment");
  expect(labels[1]).toContain("Middle comment");
  expect(labels[2]).toContain("Old comment");
  expect(labels[3]).toContain("Jane");
});

it("falls back to a generic icon for an unrecognized action", () => {
  mockedUseActivityLog.mockReturnValue({
    entries: [entry({ id: 1, action: "some_future_action" })],
  });
  const { container } = render(
    <TicketActivityCard ticketId={1} createdAt="2026-01-01T00:00:00.000Z" />,
  );
  expect(container.querySelector(".lucide-refresh-cw")).not.toBeNull();
});
