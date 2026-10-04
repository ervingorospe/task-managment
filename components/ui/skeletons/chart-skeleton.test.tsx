import { render } from "@testing-library/react";
import { ChartSkeleton } from "./chart-skeleton";

it("renders the pie variant with 5 legend rows", () => {
  const { container } = render(<ChartSkeleton variant="pie" />);
  expect(container.querySelectorAll(".rounded-full").length).toBeGreaterThanOrEqual(5);
});

it("renders the bar variant with 5 bars", () => {
  const { container } = render(<ChartSkeleton variant="bar" />);
  expect(container.firstChild?.childNodes).toHaveLength(5);
});

it("renders the line variant as a single block", () => {
  const { container } = render(<ChartSkeleton variant="line" />);
  expect(container.firstChild?.childNodes).toHaveLength(0);
});
