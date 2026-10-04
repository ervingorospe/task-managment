import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  RequestFilterDropdown,
  emptyRequestFilter,
  type RequestFilterState,
} from "./request-filter-dropdown";

async function openFilter() {
  const trigger = screen
    .getAllByRole("button", { name: /Filter/ })
    .find((el) => el.tagName === "BUTTON")!;
  await userEvent.click(trigger);
}

function renderDropdown(overrides: Partial<React.ComponentProps<typeof RequestFilterDropdown>> = {}) {
  const onChange = jest.fn();
  render(<RequestFilterDropdown value={emptyRequestFilter} onChange={onChange} {...overrides} />);
  return { onChange };
}

it("shows no active-count badge when the filter is empty", () => {
  renderDropdown();
  expect(screen.queryByText(/^\d+$/)).toBeNull();
});

it("shows the active-count badge summing all active criteria", () => {
  const filter: RequestFilterState = {
    statuses: ["pending", "approved"],
    dateFrom: "2026-01-01",
    dateTo: "2026-01-31",
  };
  renderDropdown({ value: filter });
  expect(screen.getByText("4")).toBeInTheDocument();
});

describe("status", () => {
  it("lists every status option", async () => {
    renderDropdown();
    await openFilter();
    expect(screen.getByLabelText("Pending")).toBeInTheDocument();
    expect(screen.getByLabelText("Approved")).toBeInTheDocument();
    expect(screen.getByLabelText("Rejected")).toBeInTheDocument();
    expect(screen.getByLabelText("Cancelled")).toBeInTheDocument();
  });

  it("checks a status in the draft without applying", async () => {
    const { onChange } = renderDropdown();
    await openFilter();
    await userEvent.click(screen.getByLabelText("Pending"));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Pending")).toBeChecked();
  });

  it("unchecks an already-selected status", async () => {
    renderDropdown({ value: { ...emptyRequestFilter, statuses: ["pending"] } });
    await openFilter();
    const checkbox = screen.getByLabelText("Pending");
    expect(checkbox).toBeChecked();
    await userEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });
});

describe("submitted date range", () => {
  it("sets a date range", async () => {
    renderDropdown();
    await openFilter();
    const [fromInput, toInput] = document.querySelectorAll('input[type="date"]');
    await userEvent.type(fromInput as HTMLInputElement, "2026-01-01");
    await userEvent.type(toInput as HTMLInputElement, "2026-01-31");
    expect(fromInput).toHaveValue("2026-01-01");
    expect(toInput).toHaveValue("2026-01-31");
  });

  it("prefills the date range from an existing filter value", async () => {
    renderDropdown({ value: { ...emptyRequestFilter, dateFrom: "2026-01-01", dateTo: "2026-01-31" } });
    await openFilter();
    const [fromInput, toInput] = document.querySelectorAll('input[type="date"]');
    expect(fromInput).toHaveValue("2026-01-01");
    expect(toInput).toHaveValue("2026-01-31");
  });

  it("clears the 'from' date back to null", async () => {
    renderDropdown({ value: { ...emptyRequestFilter, dateFrom: "2026-01-01" } });
    await openFilter();
    const [fromInput] = document.querySelectorAll('input[type="date"]');
    await userEvent.clear(fromInput as HTMLInputElement);
    expect(fromInput).toHaveValue("");
  });

  it("clears the 'to' date back to null", async () => {
    renderDropdown({ value: { ...emptyRequestFilter, dateTo: "2026-01-31" } });
    await openFilter();
    const [, toInput] = document.querySelectorAll('input[type="date"]');
    await userEvent.clear(toInput as HTMLInputElement);
    expect(toInput).toHaveValue("");
  });
});

describe("actions", () => {
  it("applies the draft and closes the dropdown", async () => {
    const { onChange } = renderDropdown();
    await openFilter();
    await userEvent.click(screen.getByLabelText("Pending"));
    const applyButtons = screen.getAllByRole("button", { name: "Filter" });
    await userEvent.click(applyButtons[applyButtons.length - 1]);

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ statuses: ["pending"] }));
    expect(screen.queryByText("Filters")).toBeNull();
  });

  it("closes without applying via the X button", async () => {
    const { onChange } = renderDropdown();
    await openFilter();
    await userEvent.click(screen.getByLabelText("Pending"));
    await userEvent.click(screen.getByRole("button", { name: "Close filters" }));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByText("Filters")).toBeNull();
  });

  it("clears the draft fields without closing or applying", async () => {
    const { onChange } = renderDropdown();
    await openFilter();
    await userEvent.click(screen.getByLabelText("Pending"));
    await userEvent.click(screen.getByRole("button", { name: "clear filter" }));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText("Filters")).toBeInTheDocument();
    expect(screen.getByLabelText("Pending")).not.toBeChecked();
  });

  it("resyncs the draft when the value prop changes externally", async () => {
    const { rerender } = render(
      <RequestFilterDropdown value={emptyRequestFilter} onChange={jest.fn()} />,
    );
    await openFilter();
    await userEvent.click(screen.getByLabelText("Pending"));
    expect(screen.getByLabelText("Pending")).toBeChecked();

    rerender(
      <RequestFilterDropdown value={{ ...emptyRequestFilter, statuses: ["approved"] }} onChange={jest.fn()} />,
    );
    expect(screen.getByLabelText("Pending")).not.toBeChecked();
    expect(screen.getByLabelText("Approved")).toBeChecked();
  });
});
