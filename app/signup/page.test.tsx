import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SignupPage from "./page";
import { signup } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

jest.mock("next/navigation", () => ({ useRouter: jest.fn(() => ({ push: jest.fn() })) }));
jest.mock("@/lib/api/auth", () => ({ signup: jest.fn() }));

const mockedSignup = signup as jest.Mock;

async function fillAndSubmit() {
  await userEvent.type(screen.getByLabelText(/First name/), "Jane");
  await userEvent.type(screen.getByLabelText(/Last name/), "Doe");
  await userEvent.type(screen.getByLabelText(/^Email/), "jane@acmestudio.com");
  await userEvent.type(screen.getByLabelText(/^Password/), "password123");
  await userEvent.type(screen.getByLabelText(/Confirm password/), "password123");
  await userEvent.click(screen.getByRole("button", { name: "Sign up" }));
}

beforeEach(() => {
  jest.clearAllMocks();
});

it("renders the signup form", () => {
  render(<SignupPage />);
  expect(screen.getByRole("heading", { name: "Sign up" })).toBeInTheDocument();
});

it("shows a 'check your email' state after a successful signup", async () => {
  mockedSignup.mockResolvedValue(undefined);
  render(<SignupPage />);
  await fillAndSubmit();
  expect(await screen.findByText("Check your email")).toBeInTheDocument();
  expect(screen.getByText("jane@acmestudio.com")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Back to log in" })).toHaveAttribute("href", "/login");
});

it("shows the ApiError's message on a failed signup", async () => {
  mockedSignup.mockRejectedValue(new ApiError(409, { message: "Email already in use" }));
  render(<SignupPage />);
  await fillAndSubmit();
  expect(await screen.findByText("Email already in use")).toBeInTheDocument();
  expect(screen.queryByText("Check your email")).toBeNull();
});

it("falls back to a generic failure message for a non-ApiError failure", async () => {
  mockedSignup.mockRejectedValue(new Error("network down"));
  render(<SignupPage />);
  await fillAndSubmit();
  expect(await screen.findByText("Signup failed.")).toBeInTheDocument();
});

it("sends the browser to the backend's Google OAuth endpoint without crashing", async () => {
  render(<SignupPage />);
  await expect(
    userEvent.click(screen.getByRole("button", { name: "Continue with Google" })),
  ).resolves.not.toThrow();
});

it("links to the login page", () => {
  render(<SignupPage />);
  expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login");
});
