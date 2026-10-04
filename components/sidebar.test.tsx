import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { PERMISSIONS } from "@/lib/data/permissions";
import { Sidebar } from "./sidebar";

jest.mock("next/navigation", () => ({ usePathname: jest.fn() }));
jest.mock("@/providers/auth-provider", () => {
  const actual = jest.requireActual("@/providers/auth-provider");
  return { ...actual, useAuth: jest.fn() };
});

const mockedUsePathname = usePathname as jest.Mock;
const mockedUseAuth = useAuth as jest.Mock;

function rule(action: string) {
  return { id: 1, action, name: action, desc: "", categoryId: 1 };
}

function org(id: number, slug: string, name: string) {
  return { id, organizationName: name, settings: { slug } };
}

function membership(id: number, slug: string, name: string, ruleActions: string[] = []) {
  return {
    id,
    organization: org(id, slug, name),
    role: { rules: ruleActions.map(rule) },
  };
}

const ALL_PERMISSIONS = Object.values(PERMISSIONS);

function setup({
  pathname = "/dashboard",
  isPersonalMode = false,
  activeOrganization = org(1, "acme-studio", "Acme Studio") as ReturnType<typeof org> | null,
  memberships = [membership(1, "acme-studio", "Acme Studio", ALL_PERMISSIONS)],
  currentUser = { memberships } as { memberships: typeof memberships } | null,
} = {}) {
  mockedUsePathname.mockReturnValue(pathname);
  const activeMembership = memberships.find(
    (m) => m.organization.id === activeOrganization?.id,
  );
  mockedUseAuth.mockReturnValue({
    currentUser,
    activeOrganization: isPersonalMode ? null : activeOrganization,
    activeMembership: isPersonalMode ? null : activeMembership,
    isPersonalMode,
  });
  return render(<Sidebar />);
}

it("renders the primary nav links", () => {
  setup();
  expect(screen.getByRole("link", { name: /Dashboard/ })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Tickets/ })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Starred/ })).toBeInTheDocument();
});

it("points Tickets/Starred at the personal routes in Personal mode", () => {
  setup({ isPersonalMode: true });
  expect(screen.getByRole("link", { name: /Tickets/ })).toHaveAttribute(
    "href",
    "/dashboard/tickets",
  );
  expect(screen.getByRole("link", { name: /Starred/ })).toHaveAttribute(
    "href",
    "/dashboard/starred",
  );
});

it("points Tickets/Starred at the org-scoped routes for an active org", () => {
  setup();
  expect(screen.getByRole("link", { name: /Tickets/ })).toHaveAttribute(
    "href",
    "/dashboard/organizations/acme-studio/tickets",
  );
});

it("falls back to /dashboard for Tickets/Starred when not in personal mode but there's no active org", () => {
  setup({ activeOrganization: null, memberships: [] });
  expect(screen.getByRole("link", { name: /Tickets/ })).toHaveAttribute("href", "/dashboard");
  expect(screen.getByRole("link", { name: /Starred/ })).toHaveAttribute("href", "/dashboard");
});

it("renders without crashing when there's no current user yet", () => {
  setup({ currentUser: null, memberships: [] });
  expect(screen.getByRole("link", { name: /Dashboard/ })).toBeInTheDocument();
});

it("hides Requests/Members/Projects in Personal mode", () => {
  setup({ isPersonalMode: true });
  expect(screen.queryByRole("link", { name: /Requests/ })).toBeNull();
  expect(screen.queryByRole("link", { name: /Members/ })).toBeNull();
  expect(screen.queryByRole("link", { name: /Projects/ })).toBeNull();
});

it("shows Requests/Members/Projects for an org member with the right permissions", () => {
  setup();
  expect(screen.getByRole("link", { name: /Requests/ })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Members/ })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Projects/ })).toBeInTheDocument();
});

it("hides Members for a member without member.view.members", () => {
  setup({
    memberships: [
      membership(1, "acme-studio", "Acme Studio", [
        PERMISSIONS.REQUEST_ALL_CREATE,
        PERMISSIONS.PROJECT_VIEW,
        PERMISSIONS.REPORT_VIEW_ALL,
        PERMISSIONS.ACTIVITY_LOG_VIEW_ALL,
      ]),
    ],
  });
  expect(screen.queryByRole("link", { name: /Members/ })).toBeNull();
});

it("marks the active nav link based on the current pathname", () => {
  setup({ pathname: "/dashboard/organizations/acme-studio/tickets" });
  expect(screen.getByRole("link", { name: /Tickets/ }).className).toContain(
    "bg-accent-subtle",
  );
  expect(screen.getByRole("link", { name: /Starred/ }).className).not.toContain(
    "bg-accent-subtle",
  );
});

it("toggles collapsed state, hiding text labels", async () => {
  setup();
  expect(screen.getByText("Dashboard")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Collapse sidebar" }));
  expect(screen.queryByText("Dashboard")).toBeNull();
  expect(screen.getByRole("button", { name: "Expand sidebar" })).toBeInTheDocument();
});

describe("Organization dropdown", () => {
  it("shows 'Not part of any organization yet' when there are no memberships", async () => {
    setup({ memberships: [] });
    await userEvent.click(screen.getByRole("button", { name: /Organization/ }));
    expect(screen.getByText("Not part of any organization yet")).toBeInTheDocument();
  });

  it("lists every membership's organization once opened", async () => {
    setup({
      memberships: [
        membership(1, "acme-studio", "Acme Studio", ALL_PERMISSIONS),
        membership(2, "clientco", "Clientco", ALL_PERMISSIONS),
      ],
    });
    await userEvent.click(screen.getByRole("button", { name: /Organization/ }));
    expect(screen.getByRole("link", { name: "Acme Studio" })).toHaveAttribute(
      "href",
      "/dashboard/organizations/acme-studio",
    );
    expect(screen.getByRole("link", { name: "Clientco" })).toBeInTheDocument();
  });

  it("starts open when already on an org's own landing page", () => {
    setup({ pathname: "/dashboard/organizations/acme-studio" });
    expect(screen.getByRole("link", { name: "Acme Studio" })).toBeInTheDocument();
  });

  it("closes when navigating away from the org's own page", () => {
    const { rerender } = setup({ pathname: "/dashboard/organizations/acme-studio" });
    expect(screen.getByRole("link", { name: "Acme Studio" })).toBeInTheDocument();

    mockedUsePathname.mockReturnValue("/dashboard/tickets");
    rerender(<Sidebar />);
    expect(screen.queryByRole("link", { name: "Acme Studio" })).toBeNull();
  });

  it("re-expands and opens the org menu when clicked while collapsed", async () => {
    const { container } = setup();
    await userEvent.click(screen.getByRole("button", { name: "Collapse sidebar" }));
    // Collapsed: the Organization button's label is hidden, so it has no
    // accessible name (wrapped in a Tooltip instead) — find it structurally.
    const orgButton = container.querySelector(".lucide-building2")!.closest("button")!;
    await userEvent.click(orgButton);
    // Clicking Organization while collapsed re-expands the whole rail.
    expect(screen.getByRole("button", { name: "Collapse sidebar" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Acme Studio" })).toBeInTheDocument();
  });
});

