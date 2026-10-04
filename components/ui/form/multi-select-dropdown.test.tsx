import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MultiSelectDropdown from "./multi-select-dropdown";

const OPTIONS = [
  { value: 1, label: "Jane Doe" },
  { value: 2, label: "Marco Reyes" },
  { value: 3, label: "Priya Kapoor" },
];

async function open() {
  await userEvent.click(screen.getByRole("button"));
}

it("shows the placeholder when nothing is selected", () => {
  render(<MultiSelectDropdown value={[]} onChange={jest.fn()} options={OPTIONS} />);
  expect(screen.getByText("Select...")).toBeInTheDocument();
});

it("shows a custom placeholder", () => {
  render(
    <MultiSelectDropdown
      value={[]}
      onChange={jest.fn()}
      options={OPTIONS}
      placeholder="Assign members"
    />,
  );
  expect(screen.getByText("Assign members")).toBeInTheDocument();
});

it("shows the single selected option's label", () => {
  render(<MultiSelectDropdown value={[1]} onChange={jest.fn()} options={OPTIONS} />);
  expect(screen.getByText("Jane Doe")).toBeInTheDocument();
});

it("falls back to the placeholder if the single selected id has no matching option", () => {
  render(<MultiSelectDropdown value={[999]} onChange={jest.fn()} options={OPTIONS} />);
  expect(screen.getByText("Select...")).toBeInTheDocument();
});

it("shows a count summary when multiple are selected", () => {
  render(<MultiSelectDropdown value={[1, 2]} onChange={jest.fn()} options={OPTIONS} />);
  expect(screen.getByText("2 selected")).toBeInTheDocument();
});

it("renders a custom trigger instead of the default one", () => {
  render(
    <MultiSelectDropdown
      value={[]}
      onChange={jest.fn()}
      options={OPTIONS}
      trigger={<button>Assignees</button>}
    />,
  );
  expect(screen.getByText("Assignees")).toBeInTheDocument();
  expect(screen.queryByText("Select...")).toBeNull();
});

it("lists every option once opened", async () => {
  render(<MultiSelectDropdown value={[]} onChange={jest.fn()} options={OPTIONS} />);
  await open();
  expect(screen.getByLabelText("Jane Doe")).toBeInTheDocument();
  expect(screen.getByLabelText("Marco Reyes")).toBeInTheDocument();
  expect(screen.getByLabelText("Priya Kapoor")).toBeInTheDocument();
});

it("checks the boxes for already-selected ids", async () => {
  render(<MultiSelectDropdown value={[2]} onChange={jest.fn()} options={OPTIONS} />);
  await open();
  expect(screen.getByLabelText("Marco Reyes")).toBeChecked();
  expect(screen.getByLabelText("Jane Doe")).not.toBeChecked();
});

it("adds an id to the selection when an unchecked option is toggled", async () => {
  const onChange = jest.fn();
  render(<MultiSelectDropdown value={[1]} onChange={onChange} options={OPTIONS} />);
  await open();
  await userEvent.click(screen.getByLabelText("Marco Reyes"));
  expect(onChange).toHaveBeenCalledWith([1, 2]);
});

it("removes an id from the selection when a checked option is toggled", async () => {
  const onChange = jest.fn();
  render(<MultiSelectDropdown value={[1, 2]} onChange={onChange} options={OPTIONS} />);
  await open();
  await userEvent.click(screen.getByLabelText("Jane Doe"));
  expect(onChange).toHaveBeenCalledWith([2]);
});

it("filters options by search text (case-insensitive)", async () => {
  render(<MultiSelectDropdown value={[]} onChange={jest.fn()} options={OPTIONS} />);
  await open();
  await userEvent.type(screen.getByPlaceholderText("Search members"), "marco");
  expect(screen.getByLabelText("Marco Reyes")).toBeInTheDocument();
  expect(screen.queryByLabelText("Jane Doe")).toBeNull();
});

it("shows the empty message when no options match the search", async () => {
  render(
    <MultiSelectDropdown
      value={[]}
      onChange={jest.fn()}
      options={OPTIONS}
      emptyMessage="No members found"
    />,
  );
  await open();
  await userEvent.type(screen.getByPlaceholderText("Search members"), "zzz");
  expect(screen.getByText("No members found")).toBeInTheDocument();
});

it("caps the visible list at maxVisible and shows a 'more' hint", async () => {
  render(
    <MultiSelectDropdown value={[]} onChange={jest.fn()} options={OPTIONS} maxVisible={2} />,
  );
  await open();
  expect(screen.getByLabelText("Jane Doe")).toBeInTheDocument();
  expect(screen.getByLabelText("Marco Reyes")).toBeInTheDocument();
  expect(screen.queryByLabelText("Priya Kapoor")).toBeNull();
  expect(screen.getByText(/\+1 more/)).toBeInTheDocument();
});

it("shows no 'more' hint when everything fits", async () => {
  render(<MultiSelectDropdown value={[]} onChange={jest.fn()} options={OPTIONS} />);
  await open();
  expect(screen.queryByText(/more —/)).toBeNull();
});
