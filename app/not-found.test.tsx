import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NotFound from "./not-found";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";

jest.mock("next/navigation", () => ({ useRouter: jest.fn() }));
jest.mock("@/providers/auth-provider", () => ({ useAuth: jest.fn() }));

const mockedUseRouter = useRouter as jest.Mock;
const mockedUseAuth = useAuth as jest.Mock;
const back = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseRouter.mockReturnValue({ back });
});

it("links to /login when not authenticated", () => {
  mockedUseAuth.mockReturnValue({ isAuthenticated: false });
  render(<NotFound />);
  expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login");
});

it("links to /dashboard when authenticated", () => {
  mockedUseAuth.mockReturnValue({ isAuthenticated: true });
  render(<NotFound />);
  expect(screen.getByRole("link", { name: "Back to Dashboard" })).toHaveAttribute(
    "href",
    "/dashboard",
  );
});

it("goes back in history when 'Go back' is clicked", async () => {
  mockedUseAuth.mockReturnValue({ isAuthenticated: false });
  render(<NotFound />);
  await userEvent.click(screen.getByRole("button", { name: /Go back/ }));
  expect(back).toHaveBeenCalledTimes(1);
});
