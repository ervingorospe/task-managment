import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useNotifications } from "@/providers/notifications-provider";
import { NotificationBell } from "./notification-bell";

jest.mock("@/providers/notifications-provider", () => ({
  useNotifications: jest.fn(),
}));

const mockedUseNotifications = useNotifications as jest.Mock;

function entry(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 1,
    orgId: 6001,
    module: "ticket",
    action: "assigned",
    entityId: 42,
    entityLabel: "TCK-42",
    referenceId: "TCK-42",
    actorId: 1,
    actorName: "Jane Doe",
    actorAvatar: null,
    involvedUserIds: [1],
    description: "assigned you to this ticket",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

async function open() {
  await userEvent.click(screen.getByRole("button"));
}

it("shows no badge when there are no unread notifications", () => {
  mockedUseNotifications.mockReturnValue({ items: [], unreadCount: 0, markSeen: jest.fn() });
  render(<NotificationBell />);
  expect(screen.queryByLabelText(/unread notification/)).toBeNull();
});

it("shows the unread count in the badge", () => {
  mockedUseNotifications.mockReturnValue({ items: [], unreadCount: 3, markSeen: jest.fn() });
  render(<NotificationBell />);
  expect(screen.getByLabelText("3 unread notifications")).toHaveTextContent("3");
});

it("uses singular wording for exactly 1 unread", () => {
  mockedUseNotifications.mockReturnValue({ items: [], unreadCount: 1, markSeen: jest.fn() });
  render(<NotificationBell />);
  expect(screen.getByLabelText("1 unread notification")).toBeInTheDocument();
});

it("caps the displayed count at '9+'", () => {
  mockedUseNotifications.mockReturnValue({ items: [], unreadCount: 15, markSeen: jest.fn() });
  render(<NotificationBell />);
  expect(screen.getByLabelText("15 unread notifications")).toHaveTextContent("9+");
});

it("calls markSeen when the dropdown is opened", async () => {
  const markSeen = jest.fn();
  mockedUseNotifications.mockReturnValue({ items: [], unreadCount: 2, markSeen });
  render(<NotificationBell />);
  await open();
  expect(markSeen).toHaveBeenCalledTimes(1);
});

it("shows an empty state with no notifications", async () => {
  mockedUseNotifications.mockReturnValue({ items: [], unreadCount: 0, markSeen: jest.fn() });
  render(<NotificationBell />);
  await open();
  expect(screen.getByText("No notifications yet")).toBeInTheDocument();
});

it("lists each notification with actor, description, and reference id", async () => {
  mockedUseNotifications.mockReturnValue({
    items: [entry()],
    unreadCount: 0,
    markSeen: jest.fn(),
  });
  render(<NotificationBell />);
  await open();
  expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  expect(screen.getByText(/assigned you to this ticket/)).toBeInTheDocument();
  expect(screen.getByText("TCK-42")).toBeInTheDocument();
  expect(screen.getByRole("link")).toHaveAttribute("href", "/dashboard/tickets/42");
});

it("shows the actor's avatar image when one is set", async () => {
  mockedUseNotifications.mockReturnValue({
    items: [entry({ actorAvatar: "https://example.com/jane.png" })],
    unreadCount: 0,
    markSeen: jest.fn(),
  });
  render(<NotificationBell />);
  await open();
  // next/image rewrites `src` to its own optimizer URL — assert the
  // original URL is encoded inside it rather than an exact match.
  expect(document.querySelector("img")?.getAttribute("src")).toContain(
    encodeURIComponent("https://example.com/jane.png"),
  );
});

it("omits the reference id line when the entry has none", async () => {
  mockedUseNotifications.mockReturnValue({
    items: [entry({ referenceId: undefined })],
    unreadCount: 0,
    markSeen: jest.fn(),
  });
  render(<NotificationBell />);
  await open();
  expect(screen.queryByText("TCK-42")).toBeNull();
});

it("closes the dropdown when a notification is clicked", async () => {
  mockedUseNotifications.mockReturnValue({
    items: [entry()],
    unreadCount: 0,
    markSeen: jest.fn(),
  });
  render(<NotificationBell />);
  await open();
  await userEvent.click(screen.getByRole("link"));
  expect(screen.queryByText("Ticket notifications")).toBeNull();
});
