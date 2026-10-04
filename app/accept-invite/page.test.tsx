import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AcceptInvitePage from "./page";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { getInvite, acceptInvite, declineInvite } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import type { InviteInfo } from "@/lib/api/auth";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));
jest.mock("@/providers/auth-provider", () => ({ useAuth: jest.fn() }));
jest.mock("@/lib/api/auth", () => ({
  getInvite: jest.fn(),
  acceptInvite: jest.fn(),
  declineInvite: jest.fn(),
}));

const mockedUseRouter = useRouter as jest.Mock;
const mockedUseSearchParams = useSearchParams as jest.Mock;
const mockedUseAuth = useAuth as jest.Mock;
const mockedGetInvite = getInvite as jest.Mock;
const mockedAcceptInvite = acceptInvite as jest.Mock;
const mockedDeclineInvite = declineInvite as jest.Mock;

const push = jest.fn();
const refreshCurrentUser = jest.fn();

function withToken(token: string | null = "tok-123") {
  mockedUseSearchParams.mockReturnValue({
    get: (key: string) => (key === "token" ? token : null),
  });
}

const passwordlessInvite: InviteInfo = {
  email: "jane@acmestudio.com",
  organizationName: "Acme Studio",
  roleName: "Member",
  requiresPassword: false,
};

const passwordInvite: InviteInfo = {
  ...passwordlessInvite,
  requiresPassword: true,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseRouter.mockReturnValue({ push });
  mockedUseAuth.mockReturnValue({ refreshCurrentUser });
  withToken();
});

it("shows an invalid state when the URL has no token at all", async () => {
  withToken(null);
  render(<AcceptInvitePage />);
  expect(await screen.findByText("Invite not valid")).toBeInTheDocument();
  expect(screen.getByText("This invite link is missing its token.")).toBeInTheDocument();
  expect(mockedGetInvite).not.toHaveBeenCalled();
});

it("shows a loading state while the invite is being looked up", () => {
  mockedGetInvite.mockReturnValue(new Promise(() => {}));
  render(<AcceptInvitePage />);
  expect(screen.getByText("Checking your invite…")).toBeInTheDocument();
});

it("shows the ApiError's message when the invite lookup fails", async () => {
  mockedGetInvite.mockRejectedValue(new ApiError(404, { message: "This invite has expired." }));
  render(<AcceptInvitePage />);
  expect(await screen.findByText("This invite has expired.")).toBeInTheDocument();
});

it("falls back to a generic message for a non-ApiError lookup failure", async () => {
  mockedGetInvite.mockRejectedValue(new Error("network down"));
  render(<AcceptInvitePage />);
  expect(await screen.findByText("This invite link isn't valid.")).toBeInTheDocument();
});

it("shows the invite details with an Accept & continue flow when no password is required", async () => {
  mockedGetInvite.mockResolvedValue(passwordlessInvite);
  render(<AcceptInvitePage />);
  expect(await screen.findByText("You're invited")).toBeInTheDocument();
  expect(screen.getByText("Acme Studio")).toBeInTheDocument();
  expect(screen.getByText("Member")).toBeInTheDocument();
  expect(screen.getByText("jane@acmestudio.com")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Accept & continue/ })).toBeInTheDocument();
});

it("accepts a passwordless invite, refreshes the user, and redirects to the dashboard", async () => {
  mockedGetInvite.mockResolvedValue(passwordlessInvite);
  mockedAcceptInvite.mockResolvedValue({ id: 1 });
  render(<AcceptInvitePage />);
  await userEvent.click(await screen.findByRole("button", { name: /Accept & continue/ }));
  await waitFor(() =>
    expect(mockedAcceptInvite).toHaveBeenCalledWith({ token: "tok-123" }),
  );
  expect(refreshCurrentUser).toHaveBeenCalled();
  expect(push).toHaveBeenCalledWith("/dashboard");
});

it("shows the ApiError's message and reverts to ready when accepting fails", async () => {
  mockedGetInvite.mockResolvedValue(passwordlessInvite);
  mockedAcceptInvite.mockRejectedValue(new ApiError(400, { message: "This invite was already used." }));
  render(<AcceptInvitePage />);
  await userEvent.click(await screen.findByRole("button", { name: /Accept & continue/ }));
  expect(await screen.findByText("This invite was already used.")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Accept & continue/ })).toBeEnabled();
});

it("falls back to a generic message for a non-ApiError accept failure", async () => {
  mockedGetInvite.mockResolvedValue(passwordlessInvite);
  mockedAcceptInvite.mockRejectedValue(new Error("network down"));
  render(<AcceptInvitePage />);
  await userEvent.click(await screen.findByRole("button", { name: /Accept & continue/ }));
  expect(await screen.findByText("Failed to accept invite.")).toBeInTheDocument();
});

it("shows the set-your-name/password form when the invite requires one", async () => {
  mockedGetInvite.mockResolvedValue(passwordInvite);
  render(<AcceptInvitePage />);
  expect(await screen.findByLabelText(/First name/)).toBeInTheDocument();
  expect(screen.getByLabelText(/Last name/)).toBeInTheDocument();
  expect(screen.getByLabelText(/^Password/)).toBeInTheDocument();
  expect(screen.getByLabelText(/Confirm password/)).toBeInTheDocument();
});

it("accepts the invite with the submitted name and password", async () => {
  mockedGetInvite.mockResolvedValue(passwordInvite);
  mockedAcceptInvite.mockResolvedValue({ id: 1 });
  render(<AcceptInvitePage />);
  await userEvent.type(await screen.findByLabelText(/First name/), "Jane");
  await userEvent.type(screen.getByLabelText(/Last name/), "Doe");
  await userEvent.type(screen.getByLabelText(/^Password/), "password123");
  await userEvent.type(screen.getByLabelText(/Confirm password/), "password123");
  await userEvent.click(screen.getByRole("button", { name: "Accept invite" }));
  await waitFor(() =>
    expect(mockedAcceptInvite).toHaveBeenCalledWith({
      token: "tok-123",
      firstName: "Jane",
      lastName: "Doe",
      password: "password123",
      confirmPassword: "password123",
    }),
  );
  expect(push).toHaveBeenCalledWith("/dashboard");
});

it("declines the invite after confirming, showing the declined state", async () => {
  mockedGetInvite.mockResolvedValue(passwordlessInvite);
  mockedDeclineInvite.mockResolvedValue(undefined);
  render(<AcceptInvitePage />);
  await userEvent.click(await screen.findByRole("button", { name: /Decline invite/ }));
  expect(screen.getByText("Decline this invite?")).toBeInTheDocument();

  const confirmButtons = screen.getAllByRole("button", { name: "Decline invite" });
  await userEvent.click(confirmButtons[confirmButtons.length - 1]);

  expect(await screen.findByText("Invite declined")).toBeInTheDocument();
  expect(mockedDeclineInvite).toHaveBeenCalledWith("tok-123");
});

it("shows the ApiError's message and reverts to ready when declining fails", async () => {
  mockedGetInvite.mockResolvedValue(passwordlessInvite);
  mockedDeclineInvite.mockRejectedValue(new ApiError(400, { message: "Too late to decline." }));
  render(<AcceptInvitePage />);
  await userEvent.click(await screen.findByRole("button", { name: /Decline invite/ }));
  const confirmButtons = screen.getAllByRole("button", { name: "Decline invite" });
  await userEvent.click(confirmButtons[confirmButtons.length - 1]);
  expect(await screen.findByText("Too late to decline.")).toBeInTheDocument();
});

it("falls back to a generic message for a non-ApiError decline failure", async () => {
  mockedGetInvite.mockResolvedValue(passwordlessInvite);
  mockedDeclineInvite.mockRejectedValue(new Error("network down"));
  render(<AcceptInvitePage />);
  await userEvent.click(await screen.findByRole("button", { name: /Decline invite/ }));
  const confirmButtons = screen.getAllByRole("button", { name: "Decline invite" });
  await userEvent.click(confirmButtons[confirmButtons.length - 1]);
  expect(await screen.findByText("Failed to decline invite.")).toBeInTheDocument();
});

it("declines the invite from the password-required form too", async () => {
  mockedGetInvite.mockResolvedValue(passwordInvite);
  mockedDeclineInvite.mockResolvedValue(undefined);
  render(<AcceptInvitePage />);
  await userEvent.click(await screen.findByRole("button", { name: /Decline invite/ }));
  expect(screen.getByText("Decline this invite?")).toBeInTheDocument();

  const confirmButtons = screen.getAllByRole("button", { name: "Decline invite" });
  await userEvent.click(confirmButtons[confirmButtons.length - 1]);

  expect(await screen.findByText("Invite declined")).toBeInTheDocument();
});

it("cancels the in-flight invite lookup's effect on unmount without updating state", async () => {
  mockedGetInvite.mockResolvedValue(passwordlessInvite);
  const { unmount } = render(<AcceptInvitePage />);
  unmount();
  await Promise.resolve();
  await Promise.resolve();
});

it("cancels the in-flight invite lookup's effect on unmount even when it fails", async () => {
  mockedGetInvite.mockRejectedValue(new Error("network down"));
  const { unmount } = render(<AcceptInvitePage />);
  unmount();
  await Promise.resolve();
  await Promise.resolve();
});

it("closes the decline dialog without declining on cancel", async () => {
  mockedGetInvite.mockResolvedValue(passwordlessInvite);
  render(<AcceptInvitePage />);
  await userEvent.click(await screen.findByRole("button", { name: /Decline invite/ }));
  await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(mockedDeclineInvite).not.toHaveBeenCalled();
});
