import { render } from "@testing-library/react";
import { TicketRowsSkeleton } from "./ticket-rows-skeleton";

it("defaults to 8 rows", () => {
  const { container } = render(<TicketRowsSkeleton />);
  expect(container.querySelectorAll("tbody tr")).toHaveLength(8);
});

it("renders a custom row count", () => {
  const { container } = render(<TicketRowsSkeleton rows={3} />);
  expect(container.querySelectorAll("tbody tr")).toHaveLength(3);
});
