import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MonthComparisonChart } from "./month-comparison-chart";
import type { TicketDetail } from "@/lib/types/ticket/ticket-detail.type";
import type { TagDetail } from "@/lib/types/organization/tag-detail.type";

let nextId = 1;

function tag(id: number, tagName: string, color = "#000"): TagDetail {
  return { id, tagName, color, isDefault: false, isDeleted: false };
}

const TODO = tag(1, "To Do");
const DONE = tag(2, "Done");

function ticket(overrides: Partial<TicketDetail> & { createdAt: string }): TicketDetail {
  return {
    id: nextId++,
    referenceId: `TCK-${nextId}`,
    orgId: 6001,
    ownerId: null,
    projectId: null,
    project: null,
    title: "Ticket",
    attachments: [],
    tag: TODO,
    client: null,
    assignees: [],
    dueDate: null,
    starred: false,
    updatedAt: overrides.createdAt,
    ...overrides,
  };
}

const tickets: TicketDetail[] = [
  ticket({ createdAt: "2025-12-15T00:00:00.000Z", tag: TODO }),
  ticket({ createdAt: "2026-01-05T00:00:00.000Z", tag: DONE }),
  ticket({ createdAt: "2026-01-20T00:00:00.000Z", tag: TODO }),
];
const tags = [TODO, DONE];

describe("MonthComparisonChart", () => {
  it("defaults to month mode comparing the latest ticket's month against the prior one", () => {
    render(<MonthComparisonChart tickets={tickets} tags={tags} />);

    expect(screen.getByRole("button", { name: "month" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "year" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByLabelText("Month A")).toHaveValue("2025-12");
    expect(screen.getByLabelText("Month B")).toHaveValue("2026-01");
  });

  it("switches to year mode and shows year inputs derived from the latest ticket", async () => {
    const user = userEvent.setup();
    render(<MonthComparisonChart tickets={tickets} tags={tags} />);

    await user.click(screen.getByRole("button", { name: "year" }));

    expect(screen.getByRole("button", { name: "year" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("Year A")).toHaveValue(2025);
    expect(screen.getByLabelText("Year B")).toHaveValue(2026);
    expect(screen.queryByLabelText("Month A")).not.toBeInTheDocument();
  });

  it("updates month A and month B independently", () => {
    render(<MonthComparisonChart tickets={tickets} tags={tags} />);

    fireEvent.change(screen.getByLabelText("Month A"), { target: { value: "2025-10" } });
    fireEvent.change(screen.getByLabelText("Month B"), { target: { value: "2025-11" } });

    expect(screen.getByLabelText("Month A")).toHaveValue("2025-10");
    expect(screen.getByLabelText("Month B")).toHaveValue("2025-11");
  });

  it("updates year A and year B independently", async () => {
    const user = userEvent.setup();
    render(<MonthComparisonChart tickets={tickets} tags={tags} />);
    await user.click(screen.getByRole("button", { name: "year" }));

    fireEvent.change(screen.getByLabelText("Year A"), { target: { value: "2020" } });
    fireEvent.change(screen.getByLabelText("Year B"), { target: { value: "2021" } });

    expect(screen.getByLabelText("Year A")).toHaveValue(2020);
    expect(screen.getByLabelText("Year B")).toHaveValue(2021);
  });

  it("defaults the print summary to 'all tags' with no overdue filter", () => {
    const { container } = render(<MonthComparisonChart tickets={tickets} tags={tags} />);

    const summary = container.querySelector("p.print\\:block")!;
    expect(summary.textContent).toContain("all tags");
    expect(summary.textContent).not.toContain("overdue only");
  });

  it("reflects selected tags and the overdue filter in the print summary", async () => {
    const user = userEvent.setup();
    const { container } = render(<MonthComparisonChart tickets={tickets} tags={tags} />);

    await user.click(screen.getByLabelText(/To Do/));
    await user.click(screen.getByLabelText("Overdue only"));

    const summary = container.querySelector("p.print\\:block")!;
    expect(summary.textContent).toContain("To Do");
    expect(summary.textContent).toContain("overdue only");
  });

  it("removes a tag from the summary when unchecked again", async () => {
    const user = userEvent.setup();
    const { container } = render(<MonthComparisonChart tickets={tickets} tags={tags} />);

    const checkbox = screen.getByLabelText(/To Do/);
    await user.click(checkbox);
    await user.click(checkbox);

    const summary = container.querySelector("p.print\\:block")!;
    expect(summary.textContent).toContain("all tags");
  });

  it("falls back to the current month when there are no tickets", () => {
    render(<MonthComparisonChart tickets={[]} tags={tags} />);

    const currentMonth = new Date().toISOString().slice(0, 7);
    expect(screen.getByLabelText("Month B")).toHaveValue(currentMonth);
  });
});
