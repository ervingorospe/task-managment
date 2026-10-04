import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PersonalTicketDetailsCard from "./personal-ticket-details-card";
import { useToast } from "@/providers/toast-provider";
import { useLogActivity } from "@/hooks/use-log-activity";
import { updateTicket, updateTicketTag } from "@/lib/api/tickets";

jest.mock("@/providers/toast-provider", () => ({ useToast: jest.fn() }));
jest.mock("@/hooks/use-log-activity", () => ({ useLogActivity: jest.fn() }));
jest.mock("@/lib/api/tickets", () => ({
  updateTicket: jest.fn(),
  updateTicketTag: jest.fn(),
}));

const mockedUseToast = useToast as jest.Mock;
const mockedUseLogActivity = useLogActivity as jest.Mock;
const mockedUpdateTicket = updateTicket as jest.Mock;
const mockedUpdateTicketTag = updateTicketTag as jest.Mock;

const toast = jest.fn();
const logActivity = jest.fn();

const TODO = { id: 1, tagName: "To Do", color: "#000", isDefault: true, isDeleted: false };
const DONE = { id: 2, tagName: "Done", color: "#0F0", isDefault: false, isDeleted: false };

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseToast.mockReturnValue(toast);
  mockedUseLogActivity.mockReturnValue(logActivity);
});

function renderCard(overrides: Partial<React.ComponentProps<typeof PersonalTicketDetailsCard>> = {}) {
  const onChangeTag = jest.fn();
  const onDueDateChange = jest.fn();
  render(
    <PersonalTicketDetailsCard
      ticketId={1}
      referenceId="TCK-1"
      ticketTitle="Fix the login page"
      tag={TODO}
      onChangeTag={onChangeTag}
      tagOptions={[TODO, DONE]}
      dueDate={null}
      onDueDateChange={onDueDateChange}
      {...overrides}
    />,
  );
  return { onChangeTag, onDueDateChange };
}

it("changes the tag optimistically, calls updateTicketTag, and logs activity", async () => {
  mockedUpdateTicketTag.mockResolvedValue(undefined);
  const { onChangeTag } = renderCard();
  await userEvent.click(screen.getByText("To Do"));
  await userEvent.click(screen.getByRole("menuitem", { name: /Done/ }));

  expect(onChangeTag).toHaveBeenCalledWith(DONE);
  expect(mockedUpdateTicketTag).toHaveBeenCalledWith(1, 2);
  expect(logActivity).toHaveBeenCalledWith(
    expect.objectContaining({ action: "status_changed" }),
  );
});

it("reverts the tag and toasts on failure", async () => {
  mockedUpdateTicketTag.mockRejectedValue(new Error("boom"));
  const { onChangeTag } = renderCard();
  await userEvent.click(screen.getByText("To Do"));
  await userEvent.click(screen.getByRole("menuitem", { name: /Done/ }));

  await new Promise((r) => setTimeout(r, 0));
  expect(onChangeTag).toHaveBeenLastCalledWith(TODO);
  expect(toast).toHaveBeenCalledWith("Failed to update status", "error");
});

it("sets the due date, calls updateTicket, and logs activity with the new date", async () => {
  mockedUpdateTicket.mockResolvedValue(undefined);
  const { onDueDateChange } = renderCard();
  const input = document.querySelector('input[type="date"]') as HTMLInputElement;
  await userEvent.type(input, "2026-03-01");
  expect(onDueDateChange).toHaveBeenCalledWith("2026-03-01");
  expect(mockedUpdateTicket).toHaveBeenCalledWith(1, { dueDate: "2026-03-01" });
  expect(logActivity).toHaveBeenCalledWith(
    expect.objectContaining({
      action: "due_date_changed",
      description: expect.stringContaining("changed due date"),
    }),
  );
});

it("reverts the due date and toasts on failure", async () => {
  mockedUpdateTicket.mockRejectedValue(new Error("boom"));
  const { onDueDateChange } = renderCard({ dueDate: "2026-02-01" });
  const input = document.querySelector('input[type="date"]') as HTMLInputElement;
  await userEvent.clear(input);
  await userEvent.type(input, "2026-03-01");

  await new Promise((r) => setTimeout(r, 0));
  expect(onDueDateChange).toHaveBeenLastCalledWith("2026-02-01");
  expect(toast).toHaveBeenCalledWith("Failed to update due date", "error");
});

it("logs a 'cleared the due date' description when the date is cleared", async () => {
  mockedUpdateTicket.mockResolvedValue(undefined);
  renderCard({ dueDate: "2026-02-01" });
  const input = document.querySelector('input[type="date"]') as HTMLInputElement;
  await userEvent.clear(input);
  expect(logActivity).toHaveBeenCalledWith(
    expect.objectContaining({ description: expect.stringContaining("cleared the due date") }),
  );
});

it("shows the overdue chip and formatted due date when overdue", () => {
  jest.useFakeTimers().setSystemTime(new Date("2026-03-15T12:00:00Z"));
  renderCard({ dueDate: "2026-01-01" });
  expect(screen.getByText("Overdue")).toBeInTheDocument();
  jest.useRealTimers();
});

it("shows no chip when there's no due date", () => {
  renderCard({ dueDate: null });
  expect(screen.queryByText("Overdue")).toBeNull();
  expect(screen.queryByText("Due today")).toBeNull();
});
