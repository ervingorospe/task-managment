import { render } from "@testing-library/react";
import { ListSkeleton } from "./list-skeleton";

it("defaults to 4 rows with leading and trailing placeholders", () => {
  const { container } = render(<ListSkeleton />);
  const rows = container.firstChild?.childNodes;
  expect(rows).toHaveLength(4);
  const firstRow = rows![0] as HTMLElement;
  // leading circle + text block + trailing block = 3 direct concerns, but
  // leading/text are nested in one wrapper — check trailing/leading via
  // the rounded-full (circle) and h-7 (trailing) classes specifically.
  expect(firstRow.querySelector(".rounded-full")).not.toBeNull();
  expect(firstRow.querySelector(".h-7")).not.toBeNull();
});

it("omits the leading circle when withLeading is false", () => {
  const { container } = render(<ListSkeleton withLeading={false} rows={1} />);
  const row = container.firstChild?.firstChild as HTMLElement;
  expect(row.querySelector(".rounded-full")).toBeNull();
});

it("omits the trailing block when withTrailing is false", () => {
  const { container } = render(<ListSkeleton withTrailing={false} rows={1} />);
  const row = container.firstChild?.firstChild as HTMLElement;
  expect(row.querySelector(".h-7")).toBeNull();
});

it("renders a custom row count and className", () => {
  const { container } = render(<ListSkeleton rows={2} className="my-extra" />);
  expect(container.firstChild?.childNodes).toHaveLength(2);
  expect((container.firstChild as HTMLElement).className).toContain("my-extra");
});
