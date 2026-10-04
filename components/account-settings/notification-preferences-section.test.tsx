import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useToast } from "@/providers/toast-provider";
import NotificationPreferencesSection from "./notification-preferences-section";

jest.mock("@/providers/toast-provider", () => ({ useToast: jest.fn() }));

const mockedUseToast = useToast as jest.Mock;
const toast = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseToast.mockReturnValue(toast);
  jest.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => (console.log as jest.Mock).mockRestore());

it("defaults ticket/request updates on and product announcements off", () => {
  render(<NotificationPreferencesSection />);
  expect(screen.getByLabelText(/Ticket updates/)).toBeChecked();
  expect(screen.getByLabelText(/Request updates/)).toBeChecked();
  expect(screen.getByLabelText(/Product announcements/)).not.toBeChecked();
});

it("toasts on save", async () => {
  render(<NotificationPreferencesSection />);
  await userEvent.click(screen.getByLabelText(/Product announcements/));
  await userEvent.click(screen.getByRole("button", { name: "Save preferences" }));
  expect(toast).toHaveBeenCalledWith("Notification preferences updated");
});
