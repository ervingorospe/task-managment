// Real Tiptap isn't worth exercising here — this file is about
// TicketDescriptionSection's own edit/save/cancel logic, not the editor's
// internals (already covered in markdown-editor.test.tsx). Stand in with a
// plain textarea wired to the same react-hook-form control.
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
jest.mock("isomorphic-dompurify", () => ({
  sanitize: (html: string) => html,
}));

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TicketDescriptionSection from "./ticket-description-section";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { updateTicket } from "@/lib/api/tickets";
import { PERMISSIONS } from "@/lib/data/permissions";

jest.mock("@/providers/auth-provider", () => {
  const actual = jest.requireActual("@/providers/auth-provider");
  return { ...actual, useAuth: jest.fn() };
});
jest.mock("@/providers/toast-provider", () => ({ useToast: jest.fn() }));
jest.mock("@/lib/api/tickets", () => ({ updateTicket: jest.fn() }));

const mockedUseAuth = useAuth as jest.Mock;
const mockedUseToast = useToast as jest.Mock;
const mockedUpdateTicket = updateTicket as jest.Mock;

const toast = jest.fn();

function withEditPermission() {
  mockedUseAuth.mockReturnValue({
    activeMembership: {
      role: {
        rules: [
          { id: 1, action: PERMISSIONS.TICKET_UPDATE, name: "x", desc: "", categoryId: 1 },
        ],
      },
    },
    isPersonalMode: false,
  });
}

function withoutEditPermission() {
  mockedUseAuth.mockReturnValue({ activeMembership: { role: { rules: [] } }, isPersonalMode: false });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseToast.mockReturnValue(toast);
});

it("shows 'No description provided.' when empty", () => {
  withEditPermission();
  render(<TicketDescriptionSection ticketId={1} />);
  expect(screen.getByText("No description provided.")).toBeInTheDocument();
});

it("renders the description as HTML", () => {
  withEditPermission();
  render(<TicketDescriptionSection ticketId={1} description="Hello world" />);
  expect(screen.getByText("Hello world")).toBeInTheDocument();
});

it("hides the Edit button for a viewer without ticket.update", () => {
  withoutEditPermission();
  render(<TicketDescriptionSection ticketId={1} description="Hello" />);
  expect(screen.queryByRole("button", { name: /Edit/ })).toBeNull();
});

it("enters edit mode with the current description pre-filled", async () => {
  withEditPermission();
  render(<TicketDescriptionSection ticketId={1} description="Hello world" />);
  await userEvent.click(screen.getByRole("button", { name: /Edit/ }));
  expect(screen.getByLabelText("description-editor")).toHaveValue("Hello world");
});

it("cancels editing without saving", async () => {
  withEditPermission();
  render(<TicketDescriptionSection ticketId={1} description="Hello world" />);
  await userEvent.click(screen.getByRole("button", { name: /Edit/ }));
  await userEvent.clear(screen.getByLabelText("description-editor"));
  await userEvent.type(screen.getByLabelText("description-editor"), "Changed");
  await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(screen.getByText("Hello world")).toBeInTheDocument();
  expect(mockedUpdateTicket).not.toHaveBeenCalled();
});

it("saves optimistically and calls updateTicket", async () => {
  mockedUpdateTicket.mockResolvedValue(undefined);
  withEditPermission();
  render(<TicketDescriptionSection ticketId={1} description="Hello" />);
  await userEvent.click(screen.getByRole("button", { name: /Edit/ }));
  await userEvent.clear(screen.getByLabelText("description-editor"));
  await userEvent.type(screen.getByLabelText("description-editor"), "Updated text");
  await userEvent.click(screen.getByRole("button", { name: "Save" }));

  expect(screen.getByText("Updated text")).toBeInTheDocument();
  expect(mockedUpdateTicket).toHaveBeenCalledWith(1, { description: "Updated text" });
});

it("reverts and toasts an error when saving fails", async () => {
  mockedUpdateTicket.mockRejectedValue(new Error("boom"));
  withEditPermission();
  render(<TicketDescriptionSection ticketId={1} description="Hello" />);
  await userEvent.click(screen.getByRole("button", { name: /Edit/ }));
  await userEvent.clear(screen.getByLabelText("description-editor"));
  await userEvent.type(screen.getByLabelText("description-editor"), "Updated text");
  await userEvent.click(screen.getByRole("button", { name: "Save" }));

  expect(await screen.findByText("Hello")).toBeInTheDocument();
  expect(toast).toHaveBeenCalledWith("Failed to update description", "error");
});
