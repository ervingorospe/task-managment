import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAuth } from "@/providers/auth-provider";
import { changeUserPassword } from "@/lib/api/users";
import ChangePasswordSection from "./change-password-section";

jest.mock("@/providers/auth-provider", () => ({ useAuth: jest.fn() }));
jest.mock("@/lib/api/users", () => ({ changeUserPassword: jest.fn() }));

const mockedUseAuth = useAuth as jest.Mock;
const mockedChangePassword = changeUserPassword as jest.Mock;

beforeEach(() => jest.clearAllMocks());

it("shows the Current Password field and 'Update password' label for an account with a password", () => {
  mockedUseAuth.mockReturnValue({ currentUser: { id: 1, hasPassword: true } });
  render(<ChangePasswordSection />);
  expect(screen.getByLabelText(/^Current Password/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Update password" })).toBeInTheDocument();
});

it("hides Current Password and shows 'Set password' for a Google-only account", () => {
  mockedUseAuth.mockReturnValue({ currentUser: { id: 1, hasPassword: false } });
  render(<ChangePasswordSection />);
  expect(screen.queryByLabelText(/^Current Password/)).toBeNull();
  expect(screen.getByRole("button", { name: "Set password" })).toBeInTheDocument();
  expect(screen.getByText(/signed in with Google/)).toBeInTheDocument();
});

it("submits with currentPassword omitted for a Google-only account and shows a success alert", async () => {
  mockedUseAuth.mockReturnValue({ currentUser: { id: 1, hasPassword: false } });
  mockedChangePassword.mockResolvedValue(undefined);
  render(<ChangePasswordSection />);

  await userEvent.type(screen.getByLabelText(/^New Password/), "newpassword123");
  await userEvent.type(screen.getByLabelText(/^Confirm New Password/), "newpassword123");
  await userEvent.click(screen.getByRole("button", { name: "Set password" }));

  expect(await screen.findByText("Password set")).toBeInTheDocument();
  expect(mockedChangePassword).toHaveBeenCalledWith(1, {
    currentPassword: undefined,
    newPassword: "newpassword123",
    confirmPassword: "newpassword123",
  });
});

it("submits with currentPassword included for an account with a password, showing 'Password updated'", async () => {
  mockedUseAuth.mockReturnValue({ currentUser: { id: 1, hasPassword: true } });
  mockedChangePassword.mockResolvedValue(undefined);
  render(<ChangePasswordSection />);

  await userEvent.type(screen.getByLabelText(/^Current Password/), "oldpass123");
  await userEvent.type(screen.getByLabelText(/^New Password/), "newpassword123");
  await userEvent.type(screen.getByLabelText(/^Confirm New Password/), "newpassword123");
  await userEvent.click(screen.getByRole("button", { name: "Update password" }));

  expect(await screen.findByText("Password updated")).toBeInTheDocument();
  expect(mockedChangePassword).toHaveBeenCalledWith(1, {
    currentPassword: "oldpass123",
    newPassword: "newpassword123",
    confirmPassword: "newpassword123",
  });
});

it("shows an error alert when the request fails", async () => {
  mockedUseAuth.mockReturnValue({ currentUser: { id: 1, hasPassword: true } });
  mockedChangePassword.mockRejectedValue(new Error("boom"));
  render(<ChangePasswordSection />);

  await userEvent.type(screen.getByLabelText(/^Current Password/), "oldpass123");
  await userEvent.type(screen.getByLabelText(/^New Password/), "newpassword123");
  await userEvent.type(screen.getByLabelText(/^Confirm New Password/), "newpassword123");
  await userEvent.click(screen.getByRole("button", { name: "Update password" }));

  expect(await screen.findByText("Failed to update password")).toBeInTheDocument();
});

it("does not submit when there's no current user", async () => {
  mockedUseAuth.mockReturnValue({ currentUser: null });
  render(<ChangePasswordSection />);

  // hasPassword defaults to true with no currentUser, so Current Password
  // is shown and must be filled for validation to pass and actually reach
  // the `if (!currentUser) return;` guard being tested here.
  await userEvent.type(screen.getByLabelText(/^Current Password/), "oldpass123");
  await userEvent.type(screen.getByLabelText(/^New Password/), "newpassword123");
  await userEvent.type(screen.getByLabelText(/^Confirm New Password/), "newpassword123");
  await userEvent.click(screen.getByRole("button", { name: "Update password" }));

  expect(mockedChangePassword).not.toHaveBeenCalled();
});

it("dismisses the alert", async () => {
  mockedUseAuth.mockReturnValue({ currentUser: { id: 1, hasPassword: true } });
  mockedChangePassword.mockResolvedValue(undefined);
  render(<ChangePasswordSection />);

  await userEvent.type(screen.getByLabelText(/^Current Password/), "oldpass123");
  await userEvent.type(screen.getByLabelText(/^New Password/), "newpassword123");
  await userEvent.type(screen.getByLabelText(/^Confirm New Password/), "newpassword123");
  await userEvent.click(screen.getByRole("button", { name: "Update password" }));
  await screen.findByText("Password updated");

  await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));
  expect(screen.queryByText("Password updated")).toBeNull();
});
