import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { deleteUserAccount } from "@/lib/api/users";
import AccountDangerZoneSection from "./account-danger-zone-section";

jest.mock("next/navigation", () => ({ useRouter: jest.fn() }));
jest.mock("@/providers/auth-provider", () => ({ useAuth: jest.fn() }));
jest.mock("@/providers/toast-provider", () => ({ useToast: jest.fn() }));
jest.mock("@/lib/api/users", () => ({ deleteUserAccount: jest.fn() }));

const mockedUseRouter = useRouter as jest.Mock;
const mockedUseAuth = useAuth as jest.Mock;
const mockedUseToast = useToast as jest.Mock;
const mockedDeleteAccount = deleteUserAccount as jest.Mock;

const replace = jest.fn();
const logout = jest.fn();
const toast = jest.fn();

function setup(createdViaInvite = false) {
  mockedUseRouter.mockReturnValue({ replace });
  mockedUseAuth.mockReturnValue({
    currentUser: { id: 1, createdViaInvite },
    logout,
  });
  mockedUseToast.mockReturnValue(toast);
  return render(<AccountDangerZoneSection />);
}

beforeEach(() => jest.clearAllMocks());

it("always shows the sign-out-others row", () => {
  setup();
  expect(screen.getByRole("button", { name: "Sign out others" })).toBeInTheDocument();
});

it("shows the delete-account row for a normal account", () => {
  setup(false);
  expect(screen.getByRole("button", { name: "Delete account" })).toBeInTheDocument();
});

it("hides the delete-account row for an account created via invite", () => {
  setup(true);
  expect(screen.queryByRole("button", { name: "Delete account" })).toBeNull();
});

it("confirms signing out of other sessions and toasts", async () => {
  setup();
  await userEvent.click(screen.getByRole("button", { name: "Sign out others" }));
  expect(await screen.findByText("Sign out of all other sessions?")).toBeInTheDocument();

  await userEvent.click(screen.getAllByRole("button", { name: "Sign out others" })[1]);
  expect(toast).toHaveBeenCalledWith("Signed out of all other sessions");
  expect(mockedDeleteAccount).not.toHaveBeenCalled();
});

it("cancels the sign-out-others dialog without toasting", async () => {
  setup();
  await userEvent.click(screen.getByRole("button", { name: "Sign out others" }));
  await screen.findByText("Sign out of all other sessions?");
  await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(toast).not.toHaveBeenCalled();
});

it("deletes the account, logs out, and redirects on confirm", async () => {
  mockedDeleteAccount.mockResolvedValue(undefined);
  setup(false);
  await userEvent.click(screen.getByRole("button", { name: "Delete account" }));
  expect(await screen.findByText("Delete your account?")).toBeInTheDocument();

  await userEvent.click(screen.getAllByRole("button", { name: "Delete account" })[1]);
  expect(mockedDeleteAccount).toHaveBeenCalledWith(1);
  expect(logout).toHaveBeenCalled();
  expect(replace).toHaveBeenCalledWith("/login");
});

it("does nothing on delete-confirm when there's no current user", async () => {
  mockedUseRouter.mockReturnValue({ replace });
  mockedUseAuth.mockReturnValue({ currentUser: null, logout });
  mockedUseToast.mockReturnValue(toast);
  render(<AccountDangerZoneSection />);

  await userEvent.click(screen.getByRole("button", { name: "Delete account" }));
  await screen.findByText("Delete your account?");
  await userEvent.click(screen.getAllByRole("button", { name: "Delete account" })[1]);

  expect(mockedDeleteAccount).not.toHaveBeenCalled();
  expect(logout).not.toHaveBeenCalled();
});

it("shows an error toast without redirecting when deletion fails", async () => {
  mockedDeleteAccount.mockRejectedValue(new Error("boom"));
  setup(false);
  await userEvent.click(screen.getByRole("button", { name: "Delete account" }));
  await screen.findByText("Delete your account?");
  await userEvent.click(screen.getAllByRole("button", { name: "Delete account" })[1]);

  expect(toast).toHaveBeenCalledWith("Failed to delete account", "error");
  expect(replace).not.toHaveBeenCalled();
});
