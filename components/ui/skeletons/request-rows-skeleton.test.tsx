import { render } from "@testing-library/react";
import { RequestRowsSkeleton } from "./request-rows-skeleton";

it("defaults to 5 rows", () => {
  const { container } = render(<RequestRowsSkeleton />);
  expect(container.firstChild?.childNodes).toHaveLength(5);
});

it("renders a custom row count", () => {
  const { container } = render(<RequestRowsSkeleton rows={2} />);
  expect(container.firstChild?.childNodes).toHaveLength(2);
});
