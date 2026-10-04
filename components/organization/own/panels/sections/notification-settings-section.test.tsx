import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NotificationSettingsSection from "./notification-settings-section";
import { useToast } from "@/providers/toast-provider";
import { updateOrganizationNotifications } from "@/lib/api/organizations";

jest.mock("@/providers/toast-provider", () => ({ useToast: jest.fn() }));
jest.mock("@/lib/api/organizations", () => ({ updateOrganizationNotifications: jest.fn() }));

const mockedUseToast = useToast as jest.Mock;
const mockedUpdateNotifications = updateOrganizationNotifications as jest.Mock;

const toast = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseToast.mockReturnValue(toast);
});

it("defaults the checkbox to checked", () => {
  render(<NotificationSettingsSection orgId={6001} />);
  expect(screen.getByLabelText("Receive email notifications")).toBeChecked();
});

it("prefills the checkbox from initialValue", () => {
  render(<NotificationSettingsSection orgId={6001} initialValue={false} />);
  expect(screen.getByLabelText("Receive email notifications")).not.toBeChecked();
});

it("submits the toggled value and shows a success banner", async () => {
  mockedUpdateNotifications.mockResolvedValue(undefined);
  render(<NotificationSettingsSection orgId={6001} initialValue={false} />);
  await userEvent.click(screen.getByLabelText("Receive email notifications"));
  await userEvent.click(screen.getByRole("button", { name: "Update" }));

  await waitFor(() => expect(mockedUpdateNotifications).toHaveBeenCalledWith(6001, true));
  expect(await screen.findByText("Notification settings updated")).toBeInTheDocument();
});

it("toasts and shows no banner on failure", async () => {
  mockedUpdateNotifications.mockRejectedValue(new Error("boom"));
  render(<NotificationSettingsSection orgId={6001} />);
  await userEvent.click(screen.getByRole("button", { name: "Update" }));

  await waitFor(() =>
    expect(toast).toHaveBeenCalledWith("Failed to update notification settings", "error"),
  );
  expect(screen.queryByText("Notification settings updated")).toBeNull();
});

it("dismisses the success banner", async () => {
  mockedUpdateNotifications.mockResolvedValue(undefined);
  render(<NotificationSettingsSection orgId={6001} />);
  await userEvent.click(screen.getByRole("button", { name: "Update" }));
  await screen.findByText("Notification settings updated");

  await userEvent.click(screen.getByRole("button", { name: /dismiss/i }));
  expect(screen.queryByText("Notification settings updated")).toBeNull();
});
