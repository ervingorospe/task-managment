import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChangeOwnerModal } from "./change-owner-modal";
import { useToast } from "@/providers/toast-provider";
import { requestOwnershipTransfer } from "@/lib/api/organizations";

jest.mock("@/providers/toast-provider", () => ({ useToast: jest.fn() }));
jest.mock("@/lib/api/organizations", () => ({ requestOwnershipTransfer: jest.fn() }));

const mockedUseToast = useToast as jest.Mock;
const mockedRequestOwnershipTransfer = requestOwnershipTransfer as jest.Mock;

const toast = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseToast.mockReturnValue(toast);
});

function renderModal(overrides: Partial<React.ComponentProps<typeof ChangeOwnerModal>> = {}) {
  const onClose = jest.fn();
  const onSent = jest.fn();
  render(<ChangeOwnerModal open orgId={6001} onClose={onClose} onSent={onSent} {...overrides} />);
  return { onClose, onSent };
}

it("renders nothing when closed", () => {
  renderModal({ open: false });
  expect(screen.queryByText("Change organization owner")).toBeNull();
});

it("shows the warning explanation", () => {
  renderModal();
  expect(screen.getByText(/Are you sure you want to change ownership/)).toBeInTheDocument();
});

it("shows an error for an invalid email", async () => {
  renderModal();
  await userEvent.type(screen.getByPlaceholderText("new-owner@company.com"), "not-an-email");
  await userEvent.click(screen.getByRole("button", { name: "Send invite" }));
  expect(await screen.findByText("Enter a valid email address")).toBeInTheDocument();
});

it("sends the invite, calls onSent, resets, and closes", async () => {
  mockedRequestOwnershipTransfer.mockResolvedValue(undefined);
  const { onClose, onSent } = renderModal();
  await userEvent.type(screen.getByPlaceholderText("new-owner@company.com"), "new-owner@acme.com");
  await userEvent.click(screen.getByRole("button", { name: "Send invite" }));

  expect(mockedRequestOwnershipTransfer).toHaveBeenCalledWith(6001, "new-owner@acme.com");
  expect(onSent).toHaveBeenCalledWith("new-owner@acme.com");
  expect(onClose).toHaveBeenCalled();
});

it("toasts and does not close when sending fails", async () => {
  mockedRequestOwnershipTransfer.mockRejectedValue(new Error("boom"));
  const { onClose, onSent } = renderModal();
  await userEvent.type(screen.getByPlaceholderText("new-owner@company.com"), "new-owner@acme.com");
  await userEvent.click(screen.getByRole("button", { name: "Send invite" }));

  await waitFor(() =>
    expect(toast).toHaveBeenCalledWith("Failed to send ownership transfer invite", "error"),
  );
  expect(onSent).not.toHaveBeenCalled();
  expect(onClose).not.toHaveBeenCalled();
});

it("closes and resets on Cancel", async () => {
  const { onClose, onSent } = renderModal();
  await userEvent.type(screen.getByPlaceholderText("new-owner@company.com"), "draft@acme.com");
  await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(onSent).not.toHaveBeenCalled();
  expect(onClose).toHaveBeenCalled();
});
