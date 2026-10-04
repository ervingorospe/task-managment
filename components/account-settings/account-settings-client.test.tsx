import { render, screen } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import AccountSettingsClient from "./account-settings-client";

jest.mock("next/navigation", () => ({ useRouter: jest.fn() }));
jest.mock("@/providers/auth-provider", () => ({ useAuth: jest.fn() }));
jest.mock("@/providers/toast-provider", () => ({ useToast: jest.fn() }));

it("renders the page heading and every section", () => {
  (useRouter as jest.Mock).mockReturnValue({ replace: jest.fn() });
  (useAuth as jest.Mock).mockReturnValue({
    currentUser: { id: 1, hasPassword: true, createdViaInvite: false },
    logout: jest.fn(),
  });
  (useToast as jest.Mock).mockReturnValue(jest.fn());

  render(<AccountSettingsClient />);
  expect(screen.getByRole("heading", { name: "Account Settings" })).toBeInTheDocument();
  expect(screen.getByText("Password")).toBeInTheDocument();
  expect(screen.getByText("Notifications")).toBeInTheDocument();
  expect(screen.getByText("Advanced")).toBeInTheDocument();
});
