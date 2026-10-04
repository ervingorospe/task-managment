import { render } from "@testing-library/react";
import { TabsSkeleton } from "./tabs-skeleton";

it("defaults to 3 placeholder tabs", () => {
  const { container } = render(<TabsSkeleton />);
  expect(container.firstChild?.childNodes).toHaveLength(3);
});

it("renders a custom count of tabs", () => {
  const { container } = render(<TabsSkeleton count={5} />);
  expect(container.firstChild?.childNodes).toHaveLength(5);
});
