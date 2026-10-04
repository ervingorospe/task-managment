import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "./page";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));
jest.mock("@/providers/auth-provider", () => ({ useAuth: jest.fn() }));

const mockedUseRouter = useRouter as jest.Mock;
const mockedUseSearchParams = useSearchParams as jest.Mock;
const mockedUseAuth = useAuth as jest.Mock;

const push = jest.fn();
const replace = jest.fn();
const login = jest.fn();

function withSearchParams(params: Record<string, string> = {}) {
  mockedUseSearchParams.mockReturnValue({
    get: (key: string) => params[key] ?? null,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseRouter.mockReturnValue({ push, replace });
  withSearchParams();
  mockedUseAuth.mockReturnValue({ login });
});

async function fillAndSubmit(email = "jane@acmestudio.com", password = "hunter2") {
  await userEvent.type(screen.getByLabelText(/Email/), email);
  await userEvent.type(screen.getByLabelText(/Password/), password);
  await userEvent.click(screen.getByRole("button", { name: "Log in" }));
}

it("renders the login form", () => {
  render(<LoginPage />);
  expect(screen.getByRole("heading", { name: "Log in" })).toBeInTheDocument();
  expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
  expect(screen.getByLabelText(/Password/)).toBeInTheDocument();
});

it("shows a form error from the ?error= query param and clears it from the URL", () => {
  withSearchParams({ error: "That link has expired." });
  render(<LoginPage />);
  expect(screen.getByText("That link has expired.")).toBeInTheDocument();
  expect(replace).toHaveBeenCalledWith("/login");
});

it("logs in successfully and redirects to the dashboard", async () => {
  login.mockResolvedValue({ success: true });
  render(<LoginPage />);
  await fillAndSubmit();
  await waitFor(() => expect(login).toHaveBeenCalledWith("jane@acmestudio.com", "hunter2"));
  expect(push).toHaveBeenCalledWith("/dashboard");
});

it("redirects to verify-pending when the account needs verification", async () => {
  login.mockResolvedValue({ success: false, needsVerification: true });
  render(<LoginPage />);
  await fillAndSubmit("jane@acmestudio.com", "hunter2");
  await waitFor(() =>
    expect(push).toHaveBeenCalledWith("/verify-pending?email=jane%40acmestudio.com"),
  );
});

it("shows the server's error message on a failed login", async () => {
  login.mockResolvedValue({ success: false, error: "Incorrect password." });
  render(<LoginPage />);
  await fillAndSubmit();
  expect(await screen.findByText("Incorrect password.")).toBeInTheDocument();
  expect(push).not.toHaveBeenCalled();
});

it("falls back to a generic failure message when the server gives no error text", async () => {
  login.mockResolvedValue({ success: false });
  render(<LoginPage />);
  await fillAndSubmit();
  expect(await screen.findByText("Login failed.")).toBeInTheDocument();
});

it("sends the browser to the backend's Google OAuth endpoint without crashing", async () => {
  // jsdom doesn't implement real cross-origin navigation (window.location
  // can't be spied/redefined in this environment either), so this only
  // confirms the click handler runs the assignment without throwing.
  render(<LoginPage />);
  await expect(
    userEvent.click(screen.getByRole("button", { name: "Continue with Google" })),
  ).resolves.not.toThrow();
});

it("links to the signup page", () => {
  render(<LoginPage />);
  expect(screen.getByRole("link", { name: "Sign up" })).toHaveAttribute("href", "/signup");
});
