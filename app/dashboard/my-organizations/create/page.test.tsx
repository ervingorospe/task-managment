import { render, screen } from "@testing-library/react";
import CreateOrganizationPage from "./page";
import { notFound, useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import {
  getDefaultRoles,
  getDefaultTags,
  getOrgCapacity,
  getPermissionOptions,
  getRuleCategories,
} from "@/lib/data/organizations";

jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  useRouter: jest.fn(() => ({ back: jest.fn() })),
}));
jest.mock("@/providers/auth-provider", () => ({ useAuth: jest.fn() }));
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

const mockedUseAuth = useAuth as jest.Mock;
const mockedGetDefaultRoles = getDefaultRoles as jest.Mock;
const mockedGetDefaultTags = getDefaultTags as jest.Mock;
const mockedGetOrgCapacity = getOrgCapacity as jest.Mock;
const mockedGetPermissionOptions = getPermissionOptions as jest.Mock;
const mockedGetRuleCategories = getRuleCategories as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

it("shows the loading skeleton while auth is initializing", () => {
  mockedUseAuth.mockReturnValue({ currentUser: null, isInitializing: true });
  const { container } = render(<CreateOrganizationPage />);
  expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
});

it("calls notFound for an account created via invite", () => {
  mockedUseAuth.mockReturnValue({
    currentUser: { id: 1, createdViaInvite: true },
    isInitializing: false,
  });
  expect(() => render(<CreateOrganizationPage />)).toThrow("NEXT_NOT_FOUND");
  expect(notFound).toHaveBeenCalled();
});

it("shows the loading skeleton while the default catalog data is still loading", () => {
  mockedUseAuth.mockReturnValue({ currentUser: { id: 1, createdViaInvite: false }, isInitializing: false });
  mockedGetDefaultRoles.mockReturnValue(new Promise(() => {}));
  mockedGetDefaultTags.mockReturnValue(new Promise(() => {}));
  mockedGetOrgCapacity.mockReturnValue(new Promise(() => {}));
  mockedGetPermissionOptions.mockReturnValue(new Promise(() => {}));
  mockedGetRuleCategories.mockReturnValue(new Promise(() => {}));
  const { container } = render(<CreateOrganizationPage />);
  expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  expect(screen.queryByText("CreateOrganizationClient")).toBeNull();
});

it("renders the wizard once the catalog data resolves", async () => {
  mockedUseAuth.mockReturnValue({ currentUser: { id: 1, createdViaInvite: false }, isInitializing: false });
  mockedGetDefaultRoles.mockResolvedValue([]);
  mockedGetDefaultTags.mockResolvedValue([]);
  mockedGetOrgCapacity.mockResolvedValue({ members: 10, tags: 5, roles: 5, tickets: 10, projects: 10 });
  mockedGetPermissionOptions.mockResolvedValue([]);
  mockedGetRuleCategories.mockResolvedValue([]);
  render(<CreateOrganizationPage />);
  expect(await screen.findByText("CreateOrganizationClient")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();
});

it("cancels the in-flight fetch's effect on unmount without updating state", async () => {
  mockedUseAuth.mockReturnValue({ currentUser: { id: 1, createdViaInvite: false }, isInitializing: false });
  mockedGetDefaultRoles.mockResolvedValue([]);
  mockedGetDefaultTags.mockResolvedValue([]);
  mockedGetOrgCapacity.mockResolvedValue({ members: 10, tags: 5, roles: 5, tickets: 10, projects: 10 });
  mockedGetPermissionOptions.mockResolvedValue([]);
  mockedGetRuleCategories.mockResolvedValue([]);
  const { unmount } = render(<CreateOrganizationPage />);
  unmount();
  await Promise.resolve();
  await Promise.resolve();
});
