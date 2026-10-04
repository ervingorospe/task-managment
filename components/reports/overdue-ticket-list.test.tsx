import { render, screen } from "@testing-library/react";
import { OverdueTicketList } from "./overdue-ticket-list";
import type { TicketDetail } from "@/lib/types/ticket/ticket-detail.type";

function ticket(overrides: Partial<TicketDetail> & { id: number; dueDate: string }): TicketDetail {
  return {
    referenceId: `TCK-${overrides.id}`,
    orgId: 6001,
    title: "Fix the login page",
    attachments: [],
    tag: { id: 1, tagName: "Overdue", color: "#E5484D", isDefault: false, isDeleted: false },
    client: null,
    assignees: [],
    starred: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

it("shows an empty state with no tickets", () => {
  render(<OverdueTicketList tickets={[]} />);
  expect(screen.getByText("Nothing overdue — everything's on track.")).toBeInTheDocument();
});

it("sorts tickets by oldest due date first", () => {
  render(
    <OverdueTicketList
      tickets={[
        ticket({ id: 1, dueDate: "2026-03-10", title: "Newer overdue" }),
        ticket({ id: 2, dueDate: "2026-01-05", title: "Oldest overdue" }),
      ]}
    />,
  );
  const items = screen.getAllByRole("listitem");
  expect(items[0]).toHaveTextContent("Oldest overdue");
  expect(items[1]).toHaveTextContent("Newer overdue");
});

it("does not crash sorting when tickets have a null due date", () => {
  render(
    <OverdueTicketList
      tickets={[
        ticket({ id: 1, dueDate: "2026-01-05" }),
        { ...ticket({ id: 2, dueDate: "2026-01-01" }), dueDate: null },
        { ...ticket({ id: 3, dueDate: "2026-01-02" }), dueDate: null },
      ]}
    />,
  );
  expect(screen.getAllByRole("listitem")).toHaveLength(3);
});

it("links each ticket to its detail page", () => {
  render(<OverdueTicketList tickets={[ticket({ id: 42, dueDate: "2026-01-01" })]} />);
  expect(screen.getByRole("link")).toHaveAttribute("href", "/dashboard/tickets/42");
});

it("caps the list at the default limit (8) and shows a plural 'more' hint", () => {
  const tickets = Array.from({ length: 10 }, (_, i) =>
    ticket({ id: i + 1, dueDate: `2026-01-${String(i + 1).padStart(2, "0")}` }),
  );
  render(<OverdueTicketList tickets={tickets} />);
  expect(screen.getAllByRole("listitem")).toHaveLength(8);
  expect(screen.getByText("+2 more overdue tickets.")).toBeInTheDocument();
});

it("shows a singular 'more' hint for exactly one hidden ticket", () => {
  const tickets = Array.from({ length: 4 }, (_, i) =>
    ticket({ id: i + 1, dueDate: `2026-01-0${i + 1}` }),
  );
  render(<OverdueTicketList tickets={tickets} limit={3} />);
  expect(screen.getByText("+1 more overdue ticket.")).toBeInTheDocument();
});

it("shows no 'more' hint when everything fits", () => {
  render(<OverdueTicketList tickets={[ticket({ id: 1, dueDate: "2026-01-01" })]} />);
  expect(screen.queryByText(/more overdue/)).toBeNull();
});
