import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OnboardingPage from "./page";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { completeOnboarding } from "@/lib/api/auth";
import {
  getDefaultRoles,
  getDefaultTags,
  getOrgCapacity,
  getPermissionOptions,
  getRuleCategories,
} from "@/lib/data/organizations";

jest.mock("next/navigation", () => ({ useRouter: jest.fn() }));
jest.mock("@/providers/auth-provider", () => ({ useAuth: jest.fn() }));
jest.mock("@/lib/api/auth", () => ({ completeOnboarding: jest.fn() }));
jest.mock("@/lib/data/organizations", () => ({
  getDefaultRoles: jest.fn(),
  getDefaultTags: jest.fn(),
  getOrgCapacity: jest.fn(),
  getPermissionOptions: jest.fn(),
  getRuleCategories: jest.fn(),
}));
jest.mock("@/components/organization/create/create-organization-client", () => ({
  CreateOrganizationClient: function MockCreateOrganizationClient() {
    return <div>CreateOrganizationClient</div>;
  },
}));

const mockedUseRouter = useRouter as jest.Mock;
const mockedUseAuth = useAuth as jest.Mock;
const mockedCompleteOnboarding = completeOnboarding as jest.Mock;
const mockedGetDefaultRoles = getDefaultRoles as jest.Mock;
const mockedGetDefaultTags = getDefaultTags as jest.Mock;
const mockedGetOrgCapacity = getOrgCapacity as jest.Mock;
const mockedGetPermissionOptions = getPermissionOptions as jest.Mock;
const mockedGetRuleCategories = getRuleCategories as jest.Mock;

const push = jest.fn();
const replace = jest.fn();
const refreshCurrentUser = jest.fn();

function withAuth(overrides: Record<string, unknown> = {}) {
  mockedUseAuth.mockReturnValue({
    currentUser: { id: 1, hasOnboarded: false },
    isInitializing: false,
    isAuthenticated: true,
    refreshCurrentUser,
    ...overrides,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseRouter.mockReturnValue({ push, replace });
  withAuth();
  mockedGetDefaultRoles.mockResolvedValue([]);
  mockedGetDefaultTags.mockResolvedValue([]);
  mockedGetOrgCapacity.mockResolvedValue({ members: 10, tags: 5, roles: 5, tickets: 10, projects: 10 });
  mockedGetPermissionOptions.mockResolvedValue([]);
  mockedGetRuleCategories.mockResolvedValue([]);
});

it("renders nothing while auth is initializing", () => {
  withAuth({ isInitializing: true, isAuthenticated: false });
  const { container } = render(<OnboardingPage />);
  expect(container).toBeEmptyDOMElement();
});

it("redirects to /login when not authenticated", () => {
  withAuth({ isInitializing: false, isAuthenticated: false, currentUser: null });
  render(<OnboardingPage />);
  expect(replace).toHaveBeenCalledWith("/login");
});

it("redirects to /dashboard when the user already onboarded on arrival", () => {
  withAuth({ currentUser: { id: 1, hasOnboarded: true } });
  const { container } = render(<OnboardingPage />);
  expect(replace).toHaveBeenCalledWith("/dashboard");
  expect(container).toBeEmptyDOMElement();
});

it("shows the choose step by default", () => {
  render(<OnboardingPage />);
  expect(screen.getByText("What brings you here?")).toBeInTheDocument();
  expect(screen.getByText("Just for me")).toBeInTheDocument();
  expect(screen.getByText("My organization")).toBeInTheDocument();
});

it("completes personal onboarding, refreshes the user, and redirects to the dashboard", async () => {
  let resolveOnboarding: () => void = () => {};
  mockedCompleteOnboarding.mockReturnValue(
    new Promise<void>((resolve) => {
      resolveOnboarding = resolve;
    }),
  );
  render(<OnboardingPage />);
  await userEvent.click(screen.getByText("Just for me"));
  expect(await screen.findByText("Setting things up…")).toBeInTheDocument();
  resolveOnboarding();
  await waitFor(() => expect(push).toHaveBeenCalledWith("/dashboard"));
  expect(refreshCurrentUser).toHaveBeenCalled();
});

it("shows a loading state while fetching org defaults, then renders the wizard", async () => {
  let resolveRoles: (roles: unknown[]) => void = () => {};
  mockedGetDefaultRoles.mockReturnValue(
    new Promise((resolve) => {
      resolveRoles = resolve;
    }),
  );
  render(<OnboardingPage />);
  await userEvent.click(screen.getByText("My organization"));
  expect(await screen.findByText("Loading…")).toBeInTheDocument();
  resolveRoles([]);
  expect(await screen.findByText("CreateOrganizationClient")).toBeInTheDocument();
});
