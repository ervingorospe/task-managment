import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import IconButton from "./button-icon";

it("renders with an accessible label and title from the label prop", () => {
  render(<IconButton icon={<span>x</span>} label="Delete" />);
  const button = screen.getByRole("button", { name: "Delete" });
  expect(button).toHaveAttribute("title", "Delete");
});

it("defaults to type='button'", () => {
  render(<IconButton icon={<span>x</span>} label="Delete" />);
  expect(screen.getByRole("button")).toHaveAttribute("type", "button");
});

it("respects an explicit type override", () => {
  render(<IconButton icon={<span>x</span>} label="Submit" type="submit" />);
  expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
});

it("applies danger hover styling when danger is true", () => {
  render(<IconButton icon={<span>x</span>} label="Delete" danger />);
  expect(screen.getByRole("button").className).toContain("hover:text-danger");
});

it("calls onClick when clicked", async () => {
  const onClick = jest.fn();
  render(<IconButton icon={<span>x</span>} label="Delete" onClick={onClick} />);
  await userEvent.click(screen.getByRole("button"));
  expect(onClick).toHaveBeenCalledTimes(1);
});
