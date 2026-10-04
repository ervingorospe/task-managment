import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataTable } from "./data-table";

function renderTable(overrides: Partial<React.ComponentProps<typeof DataTable>> = {}) {
  const onSearchChange = jest.fn();
  const onPageChange = jest.fn();
  const onPageSizeChange = jest.fn();
  render(
    <DataTable
      search=""
      onSearchChange={onSearchChange}
      page={1}
      totalPages={2}
      totalItems={20}
      pageSize={15}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      {...overrides}
    >
      <div>table rows</div>
    </DataTable>,
  );
  return { onSearchChange, onPageChange, onPageSizeChange };
}

it("renders children between the search bar and pagination", () => {
  renderTable();
  expect(screen.getByText("table rows")).toBeInTheDocument();
});

it("uses the default search placeholder", () => {
  renderTable();
  expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
});

it("accepts a custom search placeholder", () => {
  renderTable({ searchPlaceholder: "Search members..." });
  expect(screen.getByPlaceholderText("Search members...")).toBeInTheDocument();
});

it("calls onSearchChange as the search input changes", async () => {
  const { onSearchChange } = renderTable();
  await userEvent.type(screen.getByPlaceholderText("Search..."), "a");
  expect(onSearchChange).toHaveBeenCalledWith("a");
});

it("renders filterAction when given", () => {
  renderTable({ filterAction: <button>Filter</button> });
  expect(screen.getByRole("button", { name: "Filter" })).toBeInTheDocument();
});

it("passes pagination props through and reacts to page changes", async () => {
  const { onPageChange } = renderTable({ page: 1, totalPages: 3 });
  await userEvent.click(screen.getByRole("button", { name: "Next page" }));
  expect(onPageChange).toHaveBeenCalledWith(2);
});
