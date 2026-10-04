import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InlineAlert } from "./inline-alert";

it("renders the message with a success style by default", () => {
  render(<InlineAlert message="Ticket created" onDismiss={jest.fn()} />);
  expect(screen.getByText("Ticket created")).toBeInTheDocument();
  expect(screen.getByRole("status").className).toContain("accent");
});

it("renders an error style", () => {
  render(<InlineAlert message="Failed to save" variant="error" onDismiss={jest.fn()} />);
  expect(screen.getByRole("status").className).toContain("danger");
});

it("renders an info style", () => {
  render(<InlineAlert message="FYI" variant="info" onDismiss={jest.fn()} />);
  expect(screen.getByRole("status")).toBeInTheDocument();
});

it("calls onDismiss when the dismiss button is clicked", async () => {
  const onDismiss = jest.fn();
  render(<InlineAlert message="Ticket created" onDismiss={onDismiss} />);
  await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));
  expect(onDismiss).toHaveBeenCalledTimes(1);
});
