import { fireEvent, render, screen } from "@testing-library/react";
import { TrendLineChart } from "./trend-line-chart";
import type { TrendSeries } from "@/lib/helper/ticket-reports";

function series(overrides: Partial<TrendSeries> = {}): TrendSeries {
  return {
    id: "created",
    label: "Created",
    color: "#8B5CF6",
    points: [
      { x: 0, y: 2, xLabel: "Jan 1" },
      { x: 1, y: 5, xLabel: "Jan 2" },
      { x: 2, y: 3, xLabel: "Jan 3" },
    ],
    ...overrides,
  };
}

function mockSvgRect(container: HTMLElement) {
  const svg = container.querySelector("svg")!;
  jest.spyOn(svg, "getBoundingClientRect").mockReturnValue({
    left: 0,
    top: 0,
    width: 600,
    height: 160,
    right: 600,
    bottom: 160,
    x: 0,
    y: 0,
    toJSON: () => {},
  } as DOMRect);
  return svg;
}

describe("TrendLineChart", () => {
  it("shows the default empty message when there is no series data", () => {
    render(<TrendLineChart series={[]} />);

    expect(screen.getByText("No data yet.")).toBeInTheDocument();
  });

  it("shows a custom empty message", () => {
    render(<TrendLineChart series={[]} emptyMessage="Nothing to show." />);

    expect(screen.getByText("Nothing to show.")).toBeInTheDocument();
  });

  it("treats a series with no points as absent, falling back to the empty message", () => {
    render(<TrendLineChart series={[series({ points: [] })]} />);

    expect(screen.getByText("No data yet.")).toBeInTheDocument();
  });

  it("renders without a legend or area fill for a single series, and shows an end label", () => {
    const { container } = render(<TrendLineChart series={[series()]} />);

    expect(container.querySelector(".mb-2.flex-wrap")).not.toBeInTheDocument();
    expect(container.querySelectorAll("path")).toHaveLength(2);
    const endLabel = container.querySelector(".pointer-events-none.absolute.-top-1")!;
    expect(endLabel.textContent).toBe("3");
  });

  it("renders a legend and no area fill for multiple series, with end labels for two series", () => {
    const twoSeries = [
      series({ id: "created", label: "Created" }),
      series({
        id: "due",
        label: "Due date",
        color: "#E2A03F",
        points: [
          { x: 0, y: 1, xLabel: "Jan 1" },
          { x: 2, y: 4, xLabel: "Jan 3" },
        ],
      }),
    ];
    const { container } = render(<TrendLineChart series={twoSeries} />);

    const legend = container.querySelector(".mb-2.flex-wrap");
    expect(legend).toBeInTheDocument();
    expect(legend!.textContent).toContain("Created");
    expect(legend!.textContent).toContain("Due date");
    expect(container.querySelectorAll("path")).toHaveLength(2);
  });

  it("hides end labels once there are more than two series", () => {
    const threeSeries = [
      series({ id: "a", label: "A", points: [{ x: 0, y: 1, xLabel: "Jan 1" }] }),
      series({ id: "b", label: "B", points: [{ x: 0, y: 2, xLabel: "Jan 1" }] }),
      series({ id: "c", label: "C", points: [{ x: 0, y: 3, xLabel: "Jan 1" }] }),
    ];
    const { container } = render(<TrendLineChart series={threeSeries} />);

    const endLabels = container.querySelectorAll(".pointer-events-none.absolute.-top-1");
    expect(endLabels).toHaveLength(0);
  });

  it("handles a single-point series without dividing by zero on the x axis", () => {
    const single = [series({ points: [{ x: 5, y: 10, xLabel: "Jan 5" }] })];
    const { container } = render(<TrendLineChart series={single} />);

    const circle = container.querySelector("circle")!;
    expect(circle).toHaveAttribute("cx", "0");
  });

  function getTooltip(container: HTMLElement) {
    return container.querySelector(".absolute.top-0.z-10");
  }

  it("shows only the series with a matching point on hover, as a tooltip anchored left", () => {
    const twoSeries = [
      series({ id: "created", label: "Created" }),
      series({
        id: "due",
        label: "Due date",
        color: "#E2A03F",
        points: [
          { x: 0, y: 1, xLabel: "Jan 1" },
          { x: 2, y: 4, xLabel: "Jan 3" },
        ],
      }),
    ];
    const { container } = render(<TrendLineChart series={twoSeries} />);
    const svg = mockSvgRect(container);

    fireEvent.mouseMove(svg, { clientX: 300, clientY: 80 });

    const tooltip = getTooltip(container)!;
    expect(tooltip.textContent).toContain("Jan 2");
    expect(tooltip.textContent).toContain("Created: 5");
    expect(tooltip.textContent).not.toContain("Due date:");
    expect(tooltip.className).not.toContain("translate-x-[-100%]");
  });

  it("anchors the tooltip to the right when hovering near the end of the chart", () => {
    const { container } = render(<TrendLineChart series={[series()]} />);
    const svg = mockSvgRect(container);

    fireEvent.mouseMove(svg, { clientX: 600, clientY: 80 });

    const tooltip = getTooltip(container)!;
    expect(tooltip.textContent).toContain("Jan 3");
    expect(tooltip.className).toContain("translate-x-[-100%]");
  });

  it("clears the hover state on mouse leave", () => {
    const { container } = render(<TrendLineChart series={[series()]} />);
    const svg = mockSvgRect(container);

    fireEvent.mouseMove(svg, { clientX: 300, clientY: 80 });
    expect(getTooltip(container)).toBeInTheDocument();

    fireEvent.mouseLeave(svg);
    expect(getTooltip(container)).not.toBeInTheDocument();
  });

  it("falls back to the raw x value for axis ticks that fall between data points", () => {
    const sparse = [
      series({
        points: [
          { x: 0, y: 1, xLabel: "Jan 1" },
          { x: 2, y: 2, xLabel: "Jan 3" },
          { x: 4, y: 3, xLabel: "Jan 5" },
        ],
      }),
    ];
    const { container } = render(<TrendLineChart series={sparse} />);

    const axisRow = container.querySelector(".mt-1\\.5.flex.justify-between")!;
    expect(axisRow.textContent).toContain("1");
    expect(axisRow.textContent).toContain("3");
  });

  it("shows an em dash in the details table for a date missing from a series", async () => {
    const twoSeries = [
      series({ id: "created", label: "Created" }),
      series({
        id: "due",
        label: "Due date",
        color: "#E2A03F",
        points: [
          { x: 0, y: 1, xLabel: "Jan 1" },
          { x: 2, y: 4, xLabel: "Jan 3" },
        ],
      }),
    ];
    render(<TrendLineChart series={twoSeries} />);

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });
});
