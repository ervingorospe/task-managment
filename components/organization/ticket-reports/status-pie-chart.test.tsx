import { fireEvent, render, screen } from "@testing-library/react";
import { StatusPieChart } from "./status-pie-chart";
import type { StatusBreakdownRow } from "@/lib/helper/ticket-reports";

function row(overrides: Partial<StatusBreakdownRow> = {}): StatusBreakdownRow {
  return { tagId: 1, tagName: "Bug", color: "#ff0000", count: 3, ...overrides };
}

describe("StatusPieChart", () => {
  it("shows the empty state when there are no tickets", () => {
    render(<StatusPieChart rows={[]} />);

    expect(screen.getByText("No tickets yet.")).toBeInTheDocument();
  });

  it("renders the total ticket count in the center label", () => {
    const rows = [row({ tagId: 1, count: 3 }), row({ tagId: 2, tagName: "Feature", count: 1 })];
    render(<StatusPieChart rows={rows} />);

    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("tickets")).toBeInTheDocument();
  });

  it("renders a legend row per tag with its name, count, and share", () => {
    const rows = [row({ tagId: 1, tagName: "Bug", count: 3 }), row({ tagId: 2, tagName: "Feature", count: 1 })];
    render(<StatusPieChart rows={rows} />);

    expect(screen.getByText("Bug")).toBeInTheDocument();
    expect(screen.getByText("3 (75%)")).toBeInTheDocument();
    expect(screen.getByText("Feature")).toBeInTheDocument();
    expect(screen.getByText("1 (25%)")).toBeInTheDocument();
  });

  it("highlights the hovered slice and clears it on mouse leave", () => {
    const rows = [row({ tagId: 1, tagName: "Bug", count: 3 })];
    const { container } = render(<StatusPieChart rows={rows} />);

    const circle = container.querySelector("circle")!;
    expect(circle).toHaveAttribute("stroke-width", "26");

    fireEvent.mouseEnter(circle);
    expect(circle).toHaveAttribute("stroke-width", "30");

    fireEvent.mouseLeave(circle);
    expect(circle).toHaveAttribute("stroke-width", "26");
  });

  it("highlights the slice when hovering its legend entry, via the shared hover state", () => {
    const rows = [row({ tagId: 1, tagName: "Bug", count: 3 })];
    const { container } = render(<StatusPieChart rows={rows} />);

    const legendItem = screen.getByText("Bug").closest("li")!;
    fireEvent.mouseEnter(legendItem);

    const circle = container.querySelector("circle")!;
    expect(circle).toHaveAttribute("stroke-width", "30");

    fireEvent.mouseLeave(legendItem);
    expect(circle).toHaveAttribute("stroke-width", "26");
  });
});
