import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RejectRequestModal } from "./reject-request-modal";
import type { TicketRequest } from "@/lib/types/ticket/ticket-request.type";
import type { MemberDetail } from "@/lib/types/organization/member-detail.type";

function request(overrides: Partial<TicketRequest> = {}): TicketRequest {
  return {
    id: 1,
    referenceId: "REQ-1",
    orgId: 6001,
    title: "Fix the login page",
    attachments: [],
    client: {} as MemberDetail,
    ticketId: null,
    status: "pending",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function renderModal(overrides: Partial<React.ComponentProps<typeof RejectRequestModal>> = {}) {
  const onClose = jest.fn();
  const onConfirm = jest.fn();
  render(
    <RejectRequestModal request={request()} onClose={onClose} onConfirm={onConfirm} {...overrides} />,
  );
  return { onClose, onConfirm };
}

it("renders nothing when there's no request", () => {
  renderModal({ request: null });
  expect(screen.queryByText("Reject request")).toBeNull();
});

it("names the request's title", () => {
  renderModal();
  expect(screen.getByText(/Fix the login page/)).toBeInTheDocument();
});

it("shows an error and does not confirm when remarks is blank", async () => {
  const { onConfirm } = renderModal();
  await userEvent.click(screen.getByRole("button", { name: "Reject request" }));
  expect(
    await screen.findByText("Let the client know why this request is being rejected."),
  ).toBeInTheDocument();
  expect(onConfirm).not.toHaveBeenCalled();
});

it("submits the remarks and closes", async () => {
  const { onClose, onConfirm } = renderModal();
  await userEvent.type(
    screen.getByLabelText(/Reason for rejection/),
    "Missing required details",
  );
  await userEvent.click(screen.getByRole("button", { name: "Reject request" }));

  expect(onConfirm).toHaveBeenCalledWith("Missing required details");
  expect(onClose).toHaveBeenCalled();
});

it("closes without confirming on Cancel", async () => {
  const { onClose, onConfirm } = renderModal();
  await userEvent.type(screen.getByLabelText(/Reason for rejection/), "Draft");
  await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(onConfirm).not.toHaveBeenCalled();
  expect(onClose).toHaveBeenCalled();
});

it("resets the remarks field each time a new request is opened", () => {
  const { rerender } = render(
    <RejectRequestModal request={request({ id: 1 })} onClose={jest.fn()} onConfirm={jest.fn()} />,
  );
  rerender(
    <RejectRequestModal request={request({ id: 2, title: "Another request" })} onClose={jest.fn()} onConfirm={jest.fn()} />,
  );
  expect(screen.getByLabelText(/Reason for rejection/)).toHaveValue("");
});
