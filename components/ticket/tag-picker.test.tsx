import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TagPicker } from "./tag-picker";
import type { TagDetail } from "@/lib/types/organization/tag-detail.type";

const TODO: TagDetail = { id: 1, tagName: "To Do", color: "#000", isDefault: true, isDeleted: false };
const DONE: TagDetail = { id: 2, tagName: "Done", color: "#0F0", isDefault: false, isDeleted: false };

it("shows the current tag on the trigger", () => {
  render(<TagPicker value={TODO} options={[TODO, DONE]} onChange={jest.fn()} />);
  expect(screen.getByText("To Do")).toBeInTheDocument();
});

it("lists every option and marks the current one with a checkmark", async () => {
  render(<TagPicker value={TODO} options={[TODO, DONE]} onChange={jest.fn()} />);
  await userEvent.click(screen.getByText("To Do"));
  const todoItem = screen.getByRole("menuitem", { name: /To Do/ });
  expect(todoItem.querySelector("svg.lucide-check")).not.toBeNull();
  const doneItem = screen.getByRole("menuitem", { name: /Done/ });
  expect(doneItem.querySelector("svg.lucide-check")).toBeNull();
});

it("calls onChange when a different tag is selected", async () => {
  const onChange = jest.fn();
  render(<TagPicker value={TODO} options={[TODO, DONE]} onChange={onChange} />);
  await userEvent.click(screen.getByText("To Do"));
  await userEvent.click(screen.getByRole("menuitem", { name: /Done/ }));
  expect(onChange).toHaveBeenCalledWith(DONE);
});
