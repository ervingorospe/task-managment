import { render } from "@testing-library/react";
import { DataTableSkeleton } from "./data-table-skeleton";

it("renders a filter placeholder by default", () => {
  const { container } = render(
    <DataTableSkeleton>
      <div>rows</div>
    </DataTableSkeleton>,
  );
  const bar = container.querySelector(".border-b");
  expect(bar?.childNodes).toHaveLength(2);
});

it("omits the filter placeholder when withFilter is false", () => {
  const { container } = render(
    <DataTableSkeleton withFilter={false}>
      <div>rows</div>
    </DataTableSkeleton>,
  );
  const bar = container.querySelector(".border-b");
  expect(bar?.childNodes).toHaveLength(1);
});

it("renders its children between the header and footer bars", () => {
  const { getByText } = render(
    <DataTableSkeleton>
      <div>my rows</div>
    </DataTableSkeleton>,
  );
  expect(getByText("my rows")).toBeInTheDocument();
});
