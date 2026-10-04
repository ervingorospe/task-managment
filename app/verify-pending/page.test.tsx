import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import VerifyPendingPage from "./page";
import { useSearchParams } from "next/navigation";
import { resendVerification } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

jest.mock("next/navigation", () => ({ useSearchParams: jest.fn() }));
jest.mock("@/lib/api/auth", () => ({ resendVerification: jest.fn() }));

const mockedUseSearchParams = useSearchParams as jest.Mock;
const mockedResendVerification = resendVerification as jest.Mock;

function withEmail(email: string | null) {
  mockedUseSearchParams.mockReturnValue({
    get: (key: string) => (key === "email" ? email : null),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

it("shows a generic message and a disabled resend button with no email param", () => {
  withEmail(null);
  render(<VerifyPendingPage />);
  expect(
    screen.getByText("Check your inbox for the verification link we sent you."),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Resend email/ })).toBeDisabled();
});

it("shows the email address when present", () => {
  withEmail("jane@acmestudio.com");
  render(<VerifyPendingPage />);
  expect(screen.getByText("jane@acmestudio.com")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Resend email/ })).toBeEnabled();
});

it("resends the verification email and shows a success message", async () => {
  withEmail("jane@acmestudio.com");
  mockedResendVerification.mockResolvedValue(undefined);
  render(<VerifyPendingPage />);
  await userEvent.click(screen.getByRole("button", { name: /Resend email/ }));
  expect(
    await screen.findByText("Verification email sent — check your inbox."),
  ).toBeInTheDocument();
  expect(mockedResendVerification).toHaveBeenCalledWith("jane@acmestudio.com");
});

it("shows the ApiError's message when resending fails", async () => {
  withEmail("jane@acmestudio.com");
  mockedResendVerification.mockRejectedValue(
    new ApiError(429, { message: "Please wait before resending." }),
  );
  render(<VerifyPendingPage />);
  await userEvent.click(screen.getByRole("button", { name: /Resend email/ }));
  expect(await screen.findByText("Please wait before resending.")).toBeInTheDocument();
});

it("falls back to a generic message for a non-ApiError resend failure", async () => {
  withEmail("jane@acmestudio.com");
  mockedResendVerification.mockRejectedValue(new Error("network down"));
  render(<VerifyPendingPage />);
  await userEvent.click(screen.getByRole("button", { name: /Resend email/ }));
  expect(await screen.findByText("Failed to resend.")).toBeInTheDocument();
});

it("links back to the login page", () => {
  withEmail(null);
  render(<VerifyPendingPage />);
  expect(screen.getByRole("link", { name: /Back to log in/ })).toHaveAttribute("href", "/login");
});
