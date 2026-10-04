import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { Topbar } from "./topbar";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));
jest.mock("@/providers/auth-provider", () => ({ useAuth: jest.fn() }));
jest.mock("@/components/notifications/notification-bell", () => ({
  NotificationBell: () => <div data-testid="notification-bell" />,
}));

const mockedUseRouter = useRouter as jest.Mock;
const mockedUsePathname = usePathname as jest.Mock;
const mockedUseAuth = useAuth as jest.Mock;

const push = jest.fn();
const switchOrganization = jest.fn();
const logout = jest.fn();

function membership(id: number, slug: string, name: string, roleName = "Member") {
  return {
    id,
    organization: {
      id,
      organizationName: name,
      settings: { slug, timezone: "Asia/Manila" },
    },
    role: { roleName },
  };
}

function setup({
  currentUser = {
    firstName: "Jane",
    lastName: "Doe",
    avatar: null,
    createdViaInvite: false,
    memberships: [membership(1, "acme-studio", "Acme Studio")],
  },
  activeMembership = membership(1, "acme-studio", "Acme Studio"),
  isPersonalMode = false,
  pathname = "/dashboard/organizations/acme-studio/tickets",
} = {}) {
  mockedUsePathname.mockReturnValue(pathname);
  mockedUseRouter.mockReturnValue({ push });
  mockedUseAuth.mockReturnValue({
    currentUser,
    activeMembership: isPersonalMode ? null : activeMembership,
    isPersonalMode,
    switchOrganization,
    logout,
  });
  return render(<Topbar />);
}

beforeEach(() => jest.clearAllMocks());

it("renders nothing when there's no current user", () => {
  mockedUsePathname.mockReturnValue("/dashboard");
  mockedUseRouter.mockReturnValue({ push });
  mockedUseAuth.mockReturnValue({ currentUser: null });
  const { container } = render(<Topbar />);
  expect(container).toBeEmptyDOMElement();
});

it("shows the active organization's name in the switcher", () => {
  setup();
  expect(screen.getByText("Acme Studio")).toBeInTheDocument();
});

it("shows 'Personal' in the switcher when in Personal mode", () => {
  setup({ isPersonalMode: true });
  expect(screen.getByText("Personal")).toBeInTheDocument();
});

it("switches to Personal mode and navigates to /dashboard", async () => {
  setup();
  await userEvent.click(screen.getByText("Acme Studio"));
  await userEvent.click(screen.getByRole("menuitem", { name: /Personal/ }));
  expect(switchOrganization).toHaveBeenCalledWith("personal");
  expect(push).toHaveBeenCalledWith("/dashboard");
});

it("switches to another organization, swapping the slug in the current path", async () => {
  setup({
    currentUser: {
      firstName: "Jane",
      lastName: "Doe",
      avatar: null,
      createdViaInvite: false,
      memberships: [
        membership(1, "acme-studio", "Acme Studio"),
        membership(2, "clientco", "Clientco"),
      ],
    },
    pathname: "/dashboard/organizations/acme-studio/tickets",
  });
  await userEvent.click(screen.getByText("Acme Studio"));
  await userEvent.click(screen.getByRole("menuitem", { name: "Clientco" }));
  expect(switchOrganization).toHaveBeenCalledWith(2);
  expect(push).toHaveBeenCalledWith("/dashboard/organizations/clientco/tickets");
});

it("navigates to a safe default when switching orgs from Personal mode", async () => {
  setup({
    isPersonalMode: true,
    currentUser: {
      firstName: "Jane",
      lastName: "Doe",
      avatar: null,
      createdViaInvite: false,
      memberships: [membership(1, "acme-studio", "Acme Studio")],
    },
    pathname: "/dashboard/tickets",
  });
  await userEvent.click(screen.getByText("Personal"));
  await userEvent.click(screen.getByRole("menuitem", { name: "Acme Studio" }));
  expect(push).toHaveBeenCalledWith("/dashboard");
});

it("does not render the org separator when the user has no memberships", () => {
  const { container } = setup({
    currentUser: {
      firstName: "Jane",
      lastName: "Doe",
      avatar: null,
      createdViaInvite: false,
      memberships: [],
    },
    isPersonalMode: true,
  });
  expect(container.querySelectorAll('[role="menuitem"]')).toHaveLength(0);
});

it("shows the avatar dropdown with the current user's name and role", async () => {
  setup();
  await userEvent.click(screen.getByLabelText("Jane Doe"));
  expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  expect(screen.getByText("Member")).toBeInTheDocument();
});

it("shows 'Personal' as the role line in Personal mode", async () => {
  setup({ isPersonalMode: true });
  await userEvent.click(screen.getByLabelText("Jane Doe"));
  expect(screen.getAllByText("Personal").length).toBeGreaterThan(0);
});

it("shows the Organization menu item unless the account was created via invite", async () => {
  setup();
  await userEvent.click(screen.getByLabelText("Jane Doe"));
  expect(screen.getByRole("menuitem", { name: /Organization/ })).toHaveAttribute(
    "href",
    "/dashboard/my-organizations",
  );
});

it("hides the Organization menu item for an invited account", async () => {
  setup({
    currentUser: {
      firstName: "Jane",
      lastName: "Doe",
      avatar: null,
      createdViaInvite: true,
      memberships: [membership(1, "acme-studio", "Acme Studio")],
    },
  });
  await userEvent.click(screen.getByLabelText("Jane Doe"));
  expect(screen.queryByRole("menuitem", { name: /Organization/ })).toBeNull();
});

it("calls logout when Log out is clicked", async () => {
  setup();
  await userEvent.click(screen.getByLabelText("Jane Doe"));
  await userEvent.click(screen.getByRole("menuitem", { name: /Log out/ }));
  expect(logout).toHaveBeenCalledTimes(1);
});

it("renders the notification bell", () => {
  setup();
  expect(screen.getByTestId("notification-bell")).toBeInTheDocument();
});
