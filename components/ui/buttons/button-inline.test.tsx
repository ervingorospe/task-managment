import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ButtonInline from "./button-inline";

it("renders children and an optional icon", () => {
  render(<ButtonInline icon={<span>+</span>}>Add tag</ButtonInline>);
  expect(screen.getByText("Add tag")).toBeInTheDocument();
  expect(screen.getByText("+")).toBeInTheDocument();
});

it("works without an icon", () => {
  render(<ButtonInline>Add tag</ButtonInline>);
  expect(screen.getByText("Add tag")).toBeInTheDocument();
});

it("calls onClick when clicked", async () => {
  const onClick = jest.fn();
  render(<ButtonInline onClick={onClick}>Add tag</ButtonInline>);
  await userEvent.click(screen.getByRole("button"));
  expect(onClick).toHaveBeenCalledTimes(1);
});

it("applies a custom className", () => {
  render(<ButtonInline className="my-extra">Add tag</ButtonInline>);
  expect(screen.getByRole("button").className).toContain("my-extra");
});
