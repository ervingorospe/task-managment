import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  ActivityFilterDropdown,
  emptyActivityFilter,
  type ActivityFilterState,
} from "./activity-filter-dropdown";

const AUTHORS = [
  { id: 1, name: "Jane Doe" },
  { id: 2, name: "Marco Reyes" },
];

async function open() {
  // The trigger is a real <button> wrapped in Dropdown's own role="button"
  // div, so both match — the actual <button> is the one to click.
  const triggers = screen
    .getAllByRole("button", { name: /Filter/ })
    .filter((el) => el.tagName === "BUTTON");
  await userEvent.click(triggers[0]);
}

function renderDropdown(value: ActivityFilterState = emptyActivityFilter, onChange = jest.fn()) {
  render(<ActivityFilterDropdown value={value} onChange={onChange} authors={AUTHORS} />);
  return onChange;
}

it("shows no badge when nothing is active", () => {
  renderDropdown();
  expect(screen.queryByText(/^\d+$/)).toBeNull();
});

it("shows a badge with the count of active filters", () => {
  renderDropdown({
    modules: ["ticket", "project"],
    authorIds: [1],
    dateFrom: "2026-01-01",
    dateTo: null,
  });
  expect(screen.getByText("4")).toBeInTheDocument();
});

it("lists every module checkbox", async () => {
  renderDropdown();
  await open();
  expect(screen.getByLabelText(/Tickets/)).toBeInTheDocument();
  expect(screen.getByLabelText(/Projects/)).toBeInTheDocument();
});

it("lists every author checkbox", async () => {
  renderDropdown();
  await open();
  expect(screen.getByLabelText("Jane Doe")).toBeInTheDocument();
  expect(screen.getByLabelText("Marco Reyes")).toBeInTheDocument();
});

it("filters authors by search text", async () => {
  renderDropdown();
  await open();
  await userEvent.type(screen.getByPlaceholderText("Search authors"), "marco");
  expect(screen.getByLabelText("Marco Reyes")).toBeInTheDocument();
  expect(screen.queryByLabelText("Jane Doe")).toBeNull();
});

it("shows 'No authors found' when the search matches nothing", async () => {
  renderDropdown();
  await open();
  await userEvent.type(screen.getByPlaceholderText("Search authors"), "zzz");
  expect(screen.getByText("No authors found")).toBeInTheDocument();
});

it("shows a 'more' hint when authors exceed the visible cap", async () => {
  const manyAuthors = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `Author ${i + 1}` }));
  render(
    <ActivityFilterDropdown value={emptyActivityFilter} onChange={jest.fn()} authors={manyAuthors} />,
  );
  await open();
  expect(screen.getByText(/\+2 more/)).toBeInTheDocument();
});

it("applies the draft, calling onChange and closing", async () => {
  const onChange = renderDropdown();
  await open();
  await userEvent.click(screen.getByLabelText(/Tickets/));
  await userEvent.click(screen.getByLabelText("Jane Doe"));
  await userEvent.click(within(screen.getByRole("menu")).getByRole("button", { name: "Filter" }));
  expect(onChange).toHaveBeenCalledWith({
    modules: ["ticket"],
    authorIds: [1],
    dateFrom: null,
    dateTo: null,
  });
  expect(screen.queryByText("Filters")).toBeNull();
});

it("unchecking a previously-checked module removes it from the draft", async () => {
  const onChange = renderDropdown({
    modules: ["ticket"],
    authorIds: [],
    dateFrom: null,
    dateTo: null,
  });
  await open();
  await userEvent.click(screen.getByLabelText(/Tickets/));
  await userEvent.click(within(screen.getByRole("menu")).getByRole("button", { name: "Filter" }));
  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining({ modules: [] }),
  );
});

it("unchecking a previously-checked author removes it from the draft", async () => {
  const onChange = renderDropdown({
    modules: [],
    authorIds: [1],
    dateFrom: null,
    dateTo: null,
  });
  await open();
  await userEvent.click(screen.getByLabelText("Jane Doe"));
  await userEvent.click(within(screen.getByRole("menu")).getByRole("button", { name: "Filter" }));
  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining({ authorIds: [] }),
  );
});

it("sets dateFrom/dateTo and clears them when emptied", async () => {
  const onChange = renderDropdown();
  await open();
  const [fromInput, toInput] = document.querySelectorAll('input[type="date"]');
  await userEvent.type(fromInput as HTMLInputElement, "2026-01-15");
  await userEvent.type(toInput as HTMLInputElement, "2026-01-20");
  await userEvent.click(within(screen.getByRole("menu")).getByRole("button", { name: "Filter" }));
  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining({ dateFrom: "2026-01-15", dateTo: "2026-01-20" }),
  );
});

it("clears dateFrom/dateTo back to null when the date inputs are emptied", async () => {
  const onChange = renderDropdown({
    modules: [],
    authorIds: [],
    dateFrom: "2026-01-15",
    dateTo: "2026-01-20",
  });
  await open();
  const [fromInput, toInput] = document.querySelectorAll('input[type="date"]');
  await userEvent.clear(fromInput as HTMLInputElement);
  await userEvent.clear(toInput as HTMLInputElement);
  await userEvent.click(within(screen.getByRole("menu")).getByRole("button", { name: "Filter" }));
  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining({ dateFrom: null, dateTo: null }),
  );
});

it("closes without applying when the Close (X) button is clicked", async () => {
  const onChange = renderDropdown();
  await open();
  await userEvent.click(screen.getByLabelText(/Tickets/));
  await userEvent.click(screen.getByRole("button", { name: "Close filters" }));
  expect(onChange).not.toHaveBeenCalled();
  expect(screen.queryByText("Filters")).toBeNull();
});

it("clears the draft (and author search) back to empty via the clear button", async () => {
  const onChange = renderDropdown({
    modules: ["ticket"],
    authorIds: [1],
    dateFrom: "2026-01-01",
    dateTo: "2026-01-31",
  });
  await open();
  await userEvent.type(screen.getByPlaceholderText("Search authors"), "jane");
  await userEvent.click(screen.getByRole("button", { name: "Clear filter" }));
  expect(screen.getByPlaceholderText("Search authors")).toHaveValue("");

  await userEvent.click(within(screen.getByRole("menu")).getByRole("button", { name: "Filter" }));
  expect(onChange).toHaveBeenCalledWith(emptyActivityFilter);
});

it("resets the draft to the new value when the value prop changes externally", async () => {
  const { rerender } = render(
    <ActivityFilterDropdown value={emptyActivityFilter} onChange={jest.fn()} authors={AUTHORS} />,
  );
  rerender(
    <ActivityFilterDropdown
      value={{ modules: ["ticket"], authorIds: [], dateFrom: null, dateTo: null }}
      onChange={jest.fn()}
      authors={AUTHORS}
    />,
  );
  await open();
  expect(screen.getByLabelText(/Tickets/)).toBeChecked();
});
