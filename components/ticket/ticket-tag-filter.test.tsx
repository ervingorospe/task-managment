import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TicketTagFilter from "./ticket-tag-filter";
import type { TagDetail } from "@/lib/types/organization/tag-detail.type";

const TODO: TagDetail = { id: 1, tagName: "To Do", color: "#000", isDefault: true, isDeleted: false };
const DONE: TagDetail = { id: 2, tagName: "Done", color: "#0F0", isDefault: false, isDeleted: false };

it("shows 'View all' when value is null", () => {
  render(<TicketTagFilter tags={[TODO, DONE]} value={null} onChange={jest.fn()} />);
  expect(screen.getByText("View all")).toBeInTheDocument();
});

it("shows the active tag's name when value matches a tag", () => {
  render(<TicketTagFilter tags={[TODO, DONE]} value={1} onChange={jest.fn()} />);
  expect(screen.getByText("To Do")).toBeInTheDocument();
});

it("falls back to 'View all' when value matches no tag", () => {
  render(<TicketTagFilter tags={[TODO, DONE]} value={999} onChange={jest.fn()} />);
  expect(screen.getByText("View all")).toBeInTheDocument();
});

it("marks 'View all' as checked when value is null", async () => {
  render(<TicketTagFilter tags={[TODO, DONE]} value={null} onChange={jest.fn()} />);
  await userEvent.click(screen.getByText("View all"));
  const viewAllItem = screen.getByRole("menuitem", { name: /View all/ });
  expect(viewAllItem.querySelector("svg.lucide-check")).not.toBeNull();
});

it("calls onChange(null) when 'View all' is clicked", async () => {
  const onChange = jest.fn();
  render(<TicketTagFilter tags={[TODO, DONE]} value={1} onChange={onChange} />);
  await userEvent.click(screen.getByText("To Do"));
  await userEvent.click(screen.getByRole("menuitem", { name: /View all/ }));
  expect(onChange).toHaveBeenCalledWith(null);
});

it("calls onChange(tag.id) when a tag is selected", async () => {
  const onChange = jest.fn();
  render(<TicketTagFilter tags={[TODO, DONE]} value={null} onChange={onChange} />);
  await userEvent.click(screen.getByText("View all"));
  await userEvent.click(screen.getByRole("menuitem", { name: /Done/ }));
  expect(onChange).toHaveBeenCalledWith(2);
});

it("marks the active tag as checked", async () => {
  render(<TicketTagFilter tags={[TODO, DONE]} value={2} onChange={jest.fn()} />);
  await userEvent.click(screen.getByText("Done"));
  const doneItem = screen.getByRole("menuitem", { name: /Done/ });
  expect(doneItem.querySelector("svg.lucide-check")).not.toBeNull();
});
