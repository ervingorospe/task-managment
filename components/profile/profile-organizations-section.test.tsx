import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import ProfileOrganizationsSection from "./profile-organizations-section";

jest.mock("next/navigation", () => ({ useRouter: jest.fn() }));
jest.mock("@/providers/auth-provider", () => ({ useAuth: jest.fn() }));

const mockedUseRouter = useRouter as jest.Mock;
const mockedUseAuth = useAuth as jest.Mock;

const push = jest.fn();
const switchOrganization = jest.fn();

function membership(id: number, name: string, roleName = "Member") {
  return {
    organization: { id, organizationName: name, settings: { logo: null } },
    role: { roleName },
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseRouter.mockReturnValue({ push });
});

it("renders nothing when there's no current user", () => {
  mockedUseAuth.mockReturnValue({ currentUser: null });
  const { container } = render(<ProfileOrganizationsSection />);
  expect(container).toBeEmptyDOMElement();
});

it("shows an empty state with no memberships", () => {
  mockedUseAuth.mockReturnValue({
    currentUser: { memberships: [] },
    activeOrganization: null,
    switchOrganization,
  });
  render(<ProfileOrganizationsSection />);
  expect(screen.getByText("You're not part of any organization yet.")).toBeInTheDocument();
});

it("lists each membership with its role", () => {
  mockedUseAuth.mockReturnValue({
    currentUser: { memberships: [membership(1, "Acme Studio", "Owner")] },
    activeOrganization: null,
    switchOrganization,
  });
  render(<ProfileOrganizationsSection />);
  expect(screen.getByText("Acme Studio")).toBeInTheDocument();
  expect(screen.getByText("Owner")).toBeInTheDocument();
});

it("marks the active organization with a 'Current' badge and no switch button", () => {
  mockedUseAuth.mockReturnValue({
    currentUser: { memberships: [membership(1, "Acme Studio")] },
    activeOrganization: { id: 1 },
    switchOrganization,
  });
  render(<ProfileOrganizationsSection />);
  expect(screen.getByText("Current")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Switch to this" })).toBeNull();
});

it("shows a switch button for a non-active organization and switches on click", async () => {
  mockedUseAuth.mockReturnValue({
    currentUser: {
      memberships: [membership(1, "Acme Studio"), membership(2, "Clientco")],
    },
    activeOrganization: { id: 1 },
    switchOrganization,
  });
  render(<ProfileOrganizationsSection />);
  await userEvent.click(screen.getByRole("button", { name: "Switch to this" }));
  expect(switchOrganization).toHaveBeenCalledWith(2);
  expect(push).toHaveBeenCalledWith("/dashboard");
});
