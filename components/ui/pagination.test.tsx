import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Pagination } from "./pagination";

function renderPagination(overrides: Partial<React.ComponentProps<typeof Pagination>> = {}) {
  const onPageChange = jest.fn();
  const onPageSizeChange = jest.fn();
  render(
    <Pagination
      page={1}
      totalPages={3}
      totalItems={45}
      pageSize={15}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      {...overrides}
    />,
  );
  return { onPageChange, onPageSizeChange };
}

it("shows the item range and total", () => {
  renderPagination({ page: 2, totalPages: 3, totalItems: 45, pageSize: 15 });
  expect(screen.getByText("16–30 of 45")).toBeInTheDocument();
});

it("shows '0 of 0' when there are no items", () => {
  renderPagination({ page: 1, totalPages: 1, totalItems: 0, pageSize: 15 });
  expect(screen.getByText("0–0 of 0")).toBeInTheDocument();
});

it("renders every page when totalPages is within the visible window (<=5)", () => {
  renderPagination({ page: 1, totalPages: 3 });
  expect(screen.getByRole("button", { name: "1" })).toHaveAttribute("aria-current", "page");
  expect(screen.getByRole("button", { name: "2" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "3" })).toBeInTheDocument();
});

it("disables First/Previous on the first page and Next/Last on the last page", () => {
  renderPagination({ page: 1, totalPages: 3 });
  expect(screen.getByRole("button", { name: "First page" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Next page" })).not.toBeDisabled();
  expect(screen.getByRole("button", { name: "Last page" })).not.toBeDisabled();
});

it("calls onPageChange when a page number is clicked", async () => {
  const { onPageChange } = renderPagination({ page: 1, totalPages: 3 });
  await userEvent.click(screen.getByRole("button", { name: "2" }));
  expect(onPageChange).toHaveBeenCalledWith(2);
});

it("calls onPageChange with page-1/page+1 for Previous/Next", async () => {
  const { onPageChange } = renderPagination({ page: 2, totalPages: 3 });
  await userEvent.click(screen.getByRole("button", { name: "Previous page" }));
  expect(onPageChange).toHaveBeenCalledWith(1);
  await userEvent.click(screen.getByRole("button", { name: "Next page" }));
  expect(onPageChange).toHaveBeenCalledWith(3);
});

it("calls onPageChange with 1/totalPages for First/Last", async () => {
  const { onPageChange } = renderPagination({ page: 2, totalPages: 3 });
  await userEvent.click(screen.getByRole("button", { name: "First page" }));
  expect(onPageChange).toHaveBeenCalledWith(1);
  await userEvent.click(screen.getByRole("button", { name: "Last page" }));
  expect(onPageChange).toHaveBeenCalledWith(3);
});

it("calls onPageSizeChange when the page size select changes", async () => {
  const { onPageSizeChange } = renderPagination();
  await userEvent.selectOptions(screen.getByRole("combobox"), "30");
  expect(onPageSizeChange).toHaveBeenCalledWith(30);
});

it("uses the default page size options", () => {
  renderPagination();
  expect(screen.getByRole("option", { name: "15 / page" })).toBeInTheDocument();
  expect(screen.getByRole("option", { name: "100 / page" })).toBeInTheDocument();
});

it("accepts custom page size options", () => {
  renderPagination({ pageSizeOptions: [10, 20] });
  expect(screen.getByRole("option", { name: "10 / page" })).toBeInTheDocument();
  expect(screen.queryByRole("option", { name: "15 / page" })).toBeNull();
});

describe("large page counts (window > 5)", () => {
  it("shows the first 5 pages with no 'jump back' control when near the start", () => {
    renderPagination({ page: 1, totalPages: 20 });
    expect(screen.getByRole("button", { name: "1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "5" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "6" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Previous set of pages" })).toBeNull();
    expect(screen.getByRole("button", { name: "Next set of pages" })).toBeInTheDocument();
  });

  it("shows both jump controls when in the middle", () => {
    renderPagination({ page: 10, totalPages: 20 });
    expect(screen.getByRole("button", { name: "Previous set of pages" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next set of pages" })).toBeInTheDocument();
    // page stays in the "second slot" of the window: 9,10,11,12,13
    expect(screen.getByRole("button", { name: "9" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "13" })).toBeInTheDocument();
  });

  it("shows the last 5 pages with no 'jump forward' control when near the end", () => {
    renderPagination({ page: 20, totalPages: 20 });
    expect(screen.getByRole("button", { name: "16" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "20" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Next set of pages" })).toBeNull();
    expect(screen.getByRole("button", { name: "Previous set of pages" })).toBeInTheDocument();
  });

  it("jumps the window back/forward by the expected offset", async () => {
    const { onPageChange } = renderPagination({ page: 10, totalPages: 20 });
    await userEvent.click(screen.getByRole("button", { name: "Previous set of pages" }));
    // firstVisible (9) - 4 = 5
    expect(onPageChange).toHaveBeenCalledWith(5);

    await userEvent.click(screen.getByRole("button", { name: "Next set of pages" }));
    // lastVisible (13) + 2 = 15
    expect(onPageChange).toHaveBeenCalledWith(15);
  });
});

it("treats totalPages=0 as 1 page (safeTotalPages floor)", () => {
  renderPagination({ page: 1, totalPages: 0, totalItems: 0 });
  expect(screen.getByRole("button", { name: "1" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Last page" })).toBeDisabled();
});
