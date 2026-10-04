import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Modal } from "./modal";

afterEach(() => {
  document.body.style.overflow = "";
});

it("renders nothing when closed", () => {
  render(
    <Modal open={false} onClose={jest.fn()} title="Delete ticket">
      Are you sure?
    </Modal>,
  );
  expect(screen.queryByText("Delete ticket")).toBeNull();
});

it("renders the title and children when open", () => {
  render(
    <Modal open onClose={jest.fn()} title="Delete ticket">
      Are you sure?
    </Modal>,
  );
  expect(screen.getByText("Delete ticket")).toBeInTheDocument();
  expect(screen.getByText("Are you sure?")).toBeInTheDocument();
});

it("renders the footer when given, omits it otherwise", () => {
  const { rerender } = render(
    <Modal open onClose={jest.fn()} title="Delete ticket" footer={<button>Confirm</button>}>
      Are you sure?
    </Modal>,
  );
  expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();

  rerender(
    <Modal open onClose={jest.fn()} title="Delete ticket">
      Are you sure?
    </Modal>,
  );
  expect(screen.queryByRole("button", { name: "Confirm" })).toBeNull();
});

it("calls onClose when the close (X) button is clicked", async () => {
  const onClose = jest.fn();
  render(
    <Modal open onClose={onClose} title="Delete ticket">
      Are you sure?
    </Modal>,
  );
  // The only button rendered here (no footer passed) is the close (X) button.
  await userEvent.click(screen.getByRole("button"));
  expect(onClose).toHaveBeenCalledTimes(1);
});

it("calls onClose when clicking outside the panel (via useDismiss)", async () => {
  const onClose = jest.fn();
  render(
    <div>
      <Modal open onClose={onClose} title="Delete ticket">
        Are you sure?
      </Modal>
      <button>Outside</button>
    </div>,
  );
  await userEvent.click(screen.getByRole("button", { name: "Outside" }));
  expect(onClose).toHaveBeenCalledTimes(1);
});

it("calls onClose on Escape", async () => {
  const onClose = jest.fn();
  render(
    <Modal open onClose={onClose} title="Delete ticket">
      Are you sure?
    </Modal>,
  );
  await userEvent.keyboard("{Escape}");
  expect(onClose).toHaveBeenCalledTimes(1);
});

it("locks body scroll while open and restores it on close", () => {
  const { rerender } = render(
    <Modal open onClose={jest.fn()} title="Delete ticket">
      Are you sure?
    </Modal>,
  );
  expect(document.body.style.overflow).toBe("hidden");

  rerender(
    <Modal open={false} onClose={jest.fn()} title="Delete ticket">
      Are you sure?
    </Modal>,
  );
  expect(document.body.style.overflow).toBe("");
});

it("restores body scroll on unmount while open", () => {
  const { unmount } = render(
    <Modal open onClose={jest.fn()} title="Delete ticket">
      Are you sure?
    </Modal>,
  );
  expect(document.body.style.overflow).toBe("hidden");
  unmount();
  expect(document.body.style.overflow).toBe("");
});

it("fades in (visible=true) shortly after opening", async () => {
  render(
    <Modal open onClose={jest.fn()} title="Delete ticket">
      Are you sure?
    </Modal>,
  );
  await waitFor(() =>
    expect(screen.getByText("Delete ticket").closest(".rounded")?.className).toContain(
      "scale-100",
    ),
  );
});
