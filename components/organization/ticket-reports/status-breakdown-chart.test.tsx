import { fireEvent, render, screen } from "@testing-library/react";
import { StatusBreakdownChart } from "./status-breakdown-chart";
import type { StatusBreakdownRow } from "@/lib/helper/ticket-reports";

function row(overrides: Partial<StatusBreakdownRow> = {}): StatusBreakdownRow {
  return { tagId: 1, tagName: "Bug", color: "#ff0000", count: 3, ...overrides };
}

describe("StatusBreakdownChart", () => {
  it("shows the empty state when there are no rows", () => {
    render(<StatusBreakdownChart rows={[]} />);

    expect(screen.getByText("No tickets yet.")).toBeInTheDocument();
  });

  it("renders a labeled bar and count per row", () => {
    const rows = [row({ tagId: 1, tagName: "Bug", count: 90 }), row({ tagId: 2, tagName: "Feature", count: 10 })];
    render(<StatusBreakdownChart rows={rows} />);

    expect(screen.getAllByText("Bug").length).toBeGreaterThan(0);
    expect(screen.getAllByText("90").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Feature").length).toBeGreaterThan(0);
    expect(screen.getAllByText("10").length).toBeGreaterThan(0);
  });

  it("shows a left-anchored tooltip for a short bar and hides it on mouse leave", () => {
    const rows = [row({ tagId: 1, tagName: "Bug", count: 90 }), row({ tagId: 2, tagName: "Feature", count: 10 })];
    const { container } = render(<StatusBreakdownChart rows={rows} />);

    const bars = container.querySelectorAll(".relative.h-6");
    fireEvent.mouseEnter(bars[1]);

    expect(screen.getByText("Feature: 10 (10%)")).toBeInTheDocument();

    fireEvent.mouseLeave(bars[1]);
    expect(screen.queryByText("Feature: 10 (10%)")).not.toBeInTheDocument();
  });

  it("shows a right-anchored tooltip for a bar over 70% of the max", () => {
    const rows = [row({ tagId: 1, tagName: "Bug", count: 90 }), row({ tagId: 2, tagName: "Feature", count: 10 })];
    const { container } = render(<StatusBreakdownChart rows={rows} />);

    const bars = container.querySelectorAll(".relative.h-6");
    fireEvent.mouseEnter(bars[0]);

    expect(screen.getByText("Bug: 90 (90%)")).toBeInTheDocument();
  });

  it("shows 0% share when the total count is zero", () => {
    const rows = [row({ tagId: 1, tagName: "Untagged", count: 0 })];
    const { container } = render(<StatusBreakdownChart rows={rows} />);

    const bars = container.querySelectorAll(".relative.h-6");
    fireEvent.mouseEnter(bars[0]);

    expect(screen.getByText("Untagged: 0 (0%)")).toBeInTheDocument();
  });

  it("includes a details table with a row per status and matching shares", async () => {
    const rows = [row({ tagId: 1, tagName: "Bug", count: 3 }), row({ tagId: 2, tagName: "Feature", count: 1 })];
    render(<StatusBreakdownChart rows={rows} />);

    const table = screen.getByRole("table");
    expect(table).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Status" })).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
    expect(screen.getByText("25%")).toBeInTheDocument();
  });
});
