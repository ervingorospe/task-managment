import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmDialog } from "./confirm-dialog";

it("renders nothing when closed", () => {
  render(
    <ConfirmDialog
      open={false}
      onClose={jest.fn()}
      onConfirm={jest.fn()}
      title="Delete ticket"
      description="This can't be undone."
    />,
  );
  expect(screen.queryByText("Delete ticket")).toBeNull();
});

it("renders the danger warning icon and styling by default", () => {
  render(
    <ConfirmDialog
      open
      onClose={jest.fn()}
      onConfirm={jest.fn()}
      title="Delete ticket"
      description="This can't be undone."
    />,
  );
  // Portaled to document.body, not inside RTL's mount container.
  expect(document.querySelector(".text-danger")).not.toBeNull();
  expect(screen.getByRole("button", { name: "Confirm" }).className).toContain("danger");
});

it("omits the warning icon and uses primary styling when danger is false", () => {
  render(
    <ConfirmDialog
      open
      onClose={jest.fn()}
      onConfirm={jest.fn()}
      title="Leave organization"
      description="You can rejoin later."
      danger={false}
    />,
  );
  expect(document.querySelector("svg.text-danger")).toBeNull();
});

it("uses custom confirm/cancel labels", () => {
  render(
    <ConfirmDialog
      open
      onClose={jest.fn()}
      onConfirm={jest.fn()}
      title="Delete ticket"
      description="This can't be undone."
      confirmLabel="Yes, delete"
      cancelLabel="Never mind"
    />,
  );
  expect(screen.getByRole("button", { name: "Yes, delete" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Never mind" })).toBeInTheDocument();
});

it("calls onClose (not onConfirm) when Cancel is clicked", async () => {
  const onClose = jest.fn();
  const onConfirm = jest.fn();
  render(
    <ConfirmDialog
      open
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete ticket"
      description="This can't be undone."
    />,
  );
  await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(onConfirm).not.toHaveBeenCalled();
});

it("calls both onConfirm and onClose when Confirm is clicked", async () => {
  const onClose = jest.fn();
  const onConfirm = jest.fn();
  render(
    <ConfirmDialog
      open
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete ticket"
      description="This can't be undone."
    />,
  );
  await userEvent.click(screen.getByRole("button", { name: "Confirm" }));
  expect(onConfirm).toHaveBeenCalledTimes(1);
  expect(onClose).toHaveBeenCalledTimes(1);
});

it("renders a ReactNode description", () => {
  render(
    <ConfirmDialog
      open
      onClose={jest.fn()}
      onConfirm={jest.fn()}
      title="Delete ticket"
      description={<span>Custom <b>description</b></span>}
    />,
  );
  expect(screen.getByText("description")).toBeInTheDocument();
});
