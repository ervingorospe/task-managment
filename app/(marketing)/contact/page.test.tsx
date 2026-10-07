import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ContactPage from "./page";
import { useToast } from "@/providers/toast-provider";

jest.mock("@/providers/toast-provider", () => ({ useToast: jest.fn() }));

const mockedUseToast = useToast as jest.Mock;
const toast = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseToast.mockReturnValue(toast);
});

it("renders the heading and contact info", () => {
  render(<ContactPage />);
  expect(screen.getByRole("heading", { name: "Get in touch" })).toBeInTheDocument();
  expect(screen.getByText("hello@relay.app")).toBeInTheDocument();
});

it("shows validation errors for an empty submission", async () => {
  render(<ContactPage />);
  await userEvent.click(screen.getByRole("button", { name: "Send message" }));

  expect(await screen.findByText("Name is required")).toBeInTheDocument();
  expect(screen.getByText("Email is required")).toBeInTheDocument();
  expect(
    screen.getByText("Message must be at least 10 characters"),
  ).toBeInTheDocument();
  expect(toast).not.toHaveBeenCalled();
});

it("submits, shows a success toast, and resets the form", async () => {
  render(<ContactPage />);
  await userEvent.type(screen.getByLabelText(/^Name/), "Jane Visitor");
  await userEvent.type(
    screen.getByLabelText(/^Email/),
    "jane.visitor@example.com",
  );
  await userEvent.type(
    screen.getByLabelText(/^Message/),
    "Hi, I'd like a walkthrough of Relay for my team.",
  );
  await userEvent.click(screen.getByRole("button", { name: "Send message" }));

  expect(
    await screen.findByRole("button", { name: "Sending..." }),
  ).toBeDisabled();

  await waitFor(() =>
    expect(toast).toHaveBeenCalledWith(
      "Message sent — we'll get back to you soon.",
    ),
  );
  await waitFor(() => expect(screen.getByLabelText(/^Name/)).toHaveValue(""));
});
