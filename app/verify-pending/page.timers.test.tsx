import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import VerifyPendingPage from "./page";
import { useSearchParams } from "next/navigation";
import { resendVerification } from "@/lib/api/auth";

jest.mock("next/navigation", () => ({ useSearchParams: jest.fn() }));
jest.mock("@/lib/api/auth", () => ({ resendVerification: jest.fn() }));

const mockedUseSearchParams = useSearchParams as jest.Mock;
const mockedResendVerification = resendVerification as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseSearchParams.mockReturnValue({
    get: (key: string) => (key === "email" ? "jane@acmestudio.com" : null),
  });
});

it("disables the resend button and counts down after a successful resend", async () => {
  jest.useFakeTimers();
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  mockedResendVerification.mockResolvedValue(undefined);
  render(<VerifyPendingPage />);

  await user.click(screen.getByRole("button", { name: /Resend email/ }));
  expect(await screen.findByRole("button", { name: "Resend in 5:00" })).toBeDisabled();

  act(() => {
    jest.advanceTimersByTime(60_000);
  });
  expect(screen.getByRole("button", { name: "Resend in 4:00" })).toBeInTheDocument();

  act(() => {
    jest.advanceTimersByTime(4 * 60_000);
  });
  expect(screen.getByRole("button", { name: /Resend email/ })).toBeEnabled();

  jest.useRealTimers();
});
