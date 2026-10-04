import { render, screen } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { ToastProvider } from "@/providers/toast-provider";
import ProfileClient from "./profile-client";

jest.mock("next/navigation", () => ({ useRouter: jest.fn() }));
jest.mock("@/providers/auth-provider", () => ({ useAuth: jest.fn() }));

const mockedUseRouter = useRouter as jest.Mock;
const mockedUseAuth = useAuth as jest.Mock;

it("renders the page heading and both sections", () => {
  mockedUseRouter.mockReturnValue({ push: jest.fn() });
  mockedUseAuth.mockReturnValue({
    currentUser: {
      id: 1,
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@acmestudio.com",
      avatar: null,
      memberships: [],
    },
    activeOrganization: null,
    switchOrganization: jest.fn(),
    updateProfile: jest.fn(),
  });
  render(
    <ToastProvider>
      <ProfileClient />
    </ToastProvider>,
  );
  expect(screen.getByRole("heading", { name: "Profile", level: 1 })).toBeInTheDocument();
  expect(screen.getByText("Manage your personal information.")).toBeInTheDocument();
  expect(screen.getByText("Organizations")).toBeInTheDocument();
});
