import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CheckboxBase from "./checkbox-base";

it("renders a plain checkbox with no label", () => {
  render(<CheckboxBase />);
  expect(screen.getByRole("checkbox")).toBeInTheDocument();
});

it("renders a label and toggles on click", async () => {
  const onChange = jest.fn();
  render(<CheckboxBase label="Send email notifications" onChange={onChange} />);
  await userEvent.click(screen.getByLabelText("Send email notifications"));
  expect(onChange).toHaveBeenCalled();
});

it("shows an '(optional)' marker when optional is set", () => {
  render(<CheckboxBase label="Newsletter" optional />);
  expect(screen.getByText("(optional)")).toBeInTheDocument();
});

it("renders a description", () => {
  render(<CheckboxBase label="Newsletter" description="Weekly product updates" />);
  expect(screen.getByText("Weekly product updates")).toBeInTheDocument();
});

it("shows an error message and danger styling", () => {
  render(<CheckboxBase label="Terms" error="You must accept the terms" />);
  expect(screen.getByText("You must accept the terms")).toBeInTheDocument();
  expect(screen.getByRole("checkbox").className).toContain("border-danger");
});

it("applies a disabled, dimmed style", () => {
  const { container } = render(<CheckboxBase label="Terms" disabled />);
  expect(screen.getByRole("checkbox")).toBeDisabled();
  expect(container.querySelector("label")?.className).toContain("cursor-not-allowed");
});

it("forwards a ref to the input element", () => {
  let ref: HTMLInputElement | null = null;
  render(
    <CheckboxBase
      ref={(el) => {
        ref = el;
      }}
    />,
  );
  expect(ref).toBeInstanceOf(HTMLInputElement);
});
