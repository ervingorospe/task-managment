// Real Tiptap isn't worth exercising here — see ticket-description-section.test.tsx.
jest.mock("@/components/ui/form", () => ({
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
}));

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PersonalTicketFormModal from "./personal-ticket-form-modal";
import type { TagDetail } from "@/lib/types/organization/tag-detail.type";

const TODO: TagDetail = { id: 1, tagName: "To Do", color: "#000", isDefault: true, isDeleted: false };
const IN_PROGRESS: TagDetail = { id: 2, tagName: "In Progress", color: "#00F", isDefault: false, isDeleted: false };
const DONE: TagDetail = { id: 3, tagName: "Done", color: "#0F0", isDefault: false, isDeleted: false };

function renderModal(overrides: Partial<React.ComponentProps<typeof PersonalTicketFormModal>> = {}) {
  const onClose = jest.fn();
  const onSubmit = jest.fn();
  render(
    <PersonalTicketFormModal
      open
      onClose={onClose}
      onSubmit={onSubmit}
      tagOptions={[TODO, IN_PROGRESS, DONE]}
      {...overrides}
    />,
  );
  return { onClose, onSubmit };
}

it("renders nothing when closed", () => {
  renderModal({ open: false });
  expect(screen.queryByText("Create ticket")).toBeNull();
});

it("defaults the status to 'To Do' when present in the tag options", () => {
  renderModal();
  const select = screen.getByRole("combobox");
  expect(select).toHaveValue("1");
});

it("falls back to the first tag when there's no 'To Do' option", () => {
  renderModal({ tagOptions: [IN_PROGRESS, DONE] });
  const select = screen.getByRole("combobox");
  expect(select).toHaveValue("2");
});

it("renders no status options when there are none at all", () => {
  renderModal({ tagOptions: [] });
  expect(screen.queryAllByRole("option")).toHaveLength(0);
});

it("lists every tag option", () => {
  renderModal();
  expect(screen.getByRole("option", { name: "To Do" })).toBeInTheDocument();
  expect(screen.getByRole("option", { name: "In Progress" })).toBeInTheDocument();
  expect(screen.getByRole("option", { name: "Done" })).toBeInTheDocument();
});

it("sets the due date input's min to today", () => {
  renderModal();
  const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
  expect(dateInput).toHaveAttribute("min");
});

describe("validation", () => {
  it("shows an error and does not submit when the title is too short", async () => {
    const { onSubmit } = renderModal();
    await userEvent.type(screen.getByLabelText(/Title/), "A");
    await userEvent.click(screen.getByRole("button", { name: "Create ticket" }));
    expect(await screen.findByText("Title must be at least 2 characters")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows an error for a past due date", async () => {
    const { onSubmit } = renderModal();
    await userEvent.type(screen.getByLabelText(/Title/), "Renew passport");
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    await userEvent.type(dateInput, "2020-01-01");
    await userEvent.click(screen.getByRole("button", { name: "Create ticket" }));
    expect(await screen.findByText("Due date can't be in the past")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("requires a status to be selected", async () => {
    const { onSubmit } = renderModal({ tagOptions: [] });
    await userEvent.type(screen.getByLabelText(/Title/), "Renew passport");
    await userEvent.click(screen.getByRole("button", { name: "Create ticket" }));
    expect(await screen.findByText("Select a status")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe("submit and cancel", () => {
  it("submits the full form and resets and closes", async () => {
    const { onSubmit, onClose } = renderModal();
    await userEvent.type(screen.getByLabelText(/Title/), "Renew passport");
    await userEvent.type(screen.getByLabelText("description-editor"), "Expires next month");
    await userEvent.selectOptions(screen.getByRole("combobox"), "2");
    await userEvent.click(screen.getByRole("button", { name: "Create ticket" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        title: "Renew passport",
        description: "Expires next month",
        tagId: "2",
        dueDate: "",
      }),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it("closes without submitting on Cancel and resets the draft", async () => {
    const { onSubmit, onClose } = renderModal();
    await userEvent.type(screen.getByLabelText(/Title/), "Draft text");
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("re-seeds the form defaults each time the modal reopens", () => {
    const { rerender } = render(
      <PersonalTicketFormModal open={false} onClose={jest.fn()} onSubmit={jest.fn()} tagOptions={[TODO, DONE]} />,
    );
    rerender(
      <PersonalTicketFormModal open onClose={jest.fn()} onSubmit={jest.fn()} tagOptions={[TODO, DONE]} />,
    );
    expect(screen.getByLabelText(/Title/)).toHaveValue("");
    expect(screen.getByRole("combobox")).toHaveValue("1");
  });
});
