jest.mock("@/components/ui/form", () => {
  const actual = jest.requireActual("@/components/ui/form");
  return {
    ...actual,
    MarkdownEditor: ({ name, control }: { name: string; control: unknown }) => {
      const { useController } = jest.requireActual("react-hook-form");
      const { field } = useController({ name, control });
      return (
        <textarea
          aria-label="description-editor"
          value={field.value}
          onChange={(e) => field.onChange(e.target.value)}
        />
      );
    },
  };
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RequestFormModal } from "./request-form-modal";

function renderModal(overrides: Partial<React.ComponentProps<typeof RequestFormModal>> = {}) {
  const onClose = jest.fn();
  const onSubmit = jest.fn();
  render(<RequestFormModal open onClose={onClose} onSubmit={onSubmit} {...overrides} />);
  return { onClose, onSubmit };
}

it("renders nothing when closed", () => {
  renderModal({ open: false });
  expect(screen.queryByText("New request")).toBeNull();
});

it("shows the title and submit label", () => {
  renderModal();
  expect(screen.getAllByText("New request").length).toBeGreaterThan(0);
  expect(screen.getByRole("button", { name: "Submit request" })).toBeInTheDocument();
});

it("shows an error and does not submit when the title is too short", async () => {
  const { onSubmit } = renderModal();
  await userEvent.type(screen.getByLabelText(/Title/), "A");
  await userEvent.click(screen.getByRole("button", { name: "Submit request" }));
  expect(await screen.findByText("Title must be at least 2 characters")).toBeInTheDocument();
  expect(onSubmit).not.toHaveBeenCalled();
});

it("submits the full form, resets, and closes", async () => {
  const { onSubmit, onClose } = renderModal();
  await userEvent.type(screen.getByLabelText(/Title/), "Need a new laptop");
  await userEvent.type(screen.getByLabelText("description-editor"), "Mine broke");
  await userEvent.click(screen.getByRole("button", { name: "Submit request" }));

  expect(onSubmit).toHaveBeenCalledWith({
    title: "Need a new laptop",
    description: "Mine broke",
    attachments: [],
  });
  expect(onClose).toHaveBeenCalled();
});

it("closes without submitting on Cancel", async () => {
  const { onClose, onSubmit } = renderModal();
  await userEvent.type(screen.getByLabelText(/Title/), "Draft text");
  await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(onSubmit).not.toHaveBeenCalled();
  expect(onClose).toHaveBeenCalled();
});
