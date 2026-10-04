import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemberListToolbar } from "./member-list-toolbar";

function renderToolbar(overrides: Partial<React.ComponentProps<typeof MemberListToolbar>> = {}) {
  const onSearchChange = jest.fn();
  const onSortFieldChange = jest.fn();
  render(
    <MemberListToolbar
      search=""
      onSearchChange={onSearchChange}
      sortField="name"
      onSortFieldChange={onSortFieldChange}
      {...overrides}
    />,
  );
  return { onSearchChange, onSortFieldChange };
}

it("shows the current search value", () => {
  renderToolbar({ search: "jane" });
  expect(screen.getByPlaceholderText(/Search by name/)).toHaveValue("jane");
});

it("calls onSearchChange as the user types", async () => {
  const { onSearchChange } = renderToolbar();
  await userEvent.type(screen.getByPlaceholderText(/Search by name/), "j");
  expect(onSearchChange).toHaveBeenCalledWith("j");
});

it("shows the current sort field", () => {
  renderToolbar({ sortField: "email" });
  expect(screen.getByRole("combobox")).toHaveValue("email");
});

it("calls onSortFieldChange when the sort select changes", async () => {
  const { onSortFieldChange } = renderToolbar();
  await userEvent.selectOptions(screen.getByRole("combobox"), "email");
  expect(onSortFieldChange).toHaveBeenCalledWith("email");
});
