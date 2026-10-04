import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InviteSettingsSection from "./invite-settings-section";
import { useToast } from "@/providers/toast-provider";
import { updateOrganizationInviteExpiration } from "@/lib/api/organizations";

jest.mock("@/providers/toast-provider", () => ({ useToast: jest.fn() }));
jest.mock("@/lib/api/organizations", () => ({ updateOrganizationInviteExpiration: jest.fn() }));

const mockedUseToast = useToast as jest.Mock;
const mockedUpdateExpiration = updateOrganizationInviteExpiration as jest.Mock;

const toast = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseToast.mockReturnValue(toast);
});

it("defaults the expiration to 1 day", () => {
  render(<InviteSettingsSection orgId={6001} />);
  expect(screen.getByRole("combobox")).toHaveValue("1_day");
});

it("prefills the expiration from initialExpiration", () => {
  render(<InviteSettingsSection orgId={6001} initialExpiration="1_week" />);
  expect(screen.getByRole("combobox")).toHaveValue("1_week");
});

it("submits the selected value and shows a success banner", async () => {
  mockedUpdateExpiration.mockResolvedValue(undefined);
  render(<InviteSettingsSection orgId={6001} />);
  await userEvent.selectOptions(screen.getByRole("combobox"), "1_month");
  await userEvent.click(screen.getByRole("button", { name: "Update" }));

  await waitFor(() => expect(mockedUpdateExpiration).toHaveBeenCalledWith(6001, "1_month"));
  expect(await screen.findByText("Invite settings updated")).toBeInTheDocument();
});

it("toasts and shows no banner on failure", async () => {
  mockedUpdateExpiration.mockRejectedValue(new Error("boom"));
  render(<InviteSettingsSection orgId={6001} />);
  await userEvent.click(screen.getByRole("button", { name: "Update" }));

  await waitFor(() =>
    expect(toast).toHaveBeenCalledWith("Failed to update invite settings", "error"),
  );
  expect(screen.queryByText("Invite settings updated")).toBeNull();
});

it("dismisses the success banner", async () => {
  mockedUpdateExpiration.mockResolvedValue(undefined);
  render(<InviteSettingsSection orgId={6001} />);
  await userEvent.click(screen.getByRole("button", { name: "Update" }));
  await screen.findByText("Invite settings updated");

  await userEvent.click(screen.getByRole("button", { name: /dismiss/i }));
  expect(screen.queryByText("Invite settings updated")).toBeNull();
});
