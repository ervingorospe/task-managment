import { render, screen, waitFor } from "@testing-library/react";
import MyOrganizationsPage from "./page";
import { notFound } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { fetchMyOwnOrganizations } from "@/lib/api/organizations";

jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));
jest.mock("@/providers/auth-provider", () => ({ useAuth: jest.fn() }));
jest.mock("@/lib/api/organizations", () => ({ fetchMyOwnOrganizations: jest.fn() }));

const mockedUseAuth = useAuth as jest.Mock;
const mockedFetchMyOwnOrganizations = fetchMyOwnOrganizations as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

it("renders nothing while auth is still initializing", () => {
  mockedUseAuth.mockReturnValue({ currentUser: null, isInitializing: true });
  const { container } = render(<MyOrganizationsPage />);
  expect(container).toBeEmptyDOMElement();
});

it("calls notFound for an account created via invite", () => {
  mockedUseAuth.mockReturnValue({
    currentUser: { id: 1, createdViaInvite: true },
    isInitializing: false,
  });
  expect(() => render(<MyOrganizationsPage />)).toThrow("NEXT_NOT_FOUND");
  expect(notFound).toHaveBeenCalled();
});

it("shows a skeleton while the organizations list is loading", () => {
  mockedUseAuth.mockReturnValue({ currentUser: { id: 1, createdViaInvite: false }, isInitializing: false });
  mockedFetchMyOwnOrganizations.mockReturnValue(new Promise(() => {}));
  render(<MyOrganizationsPage />);
  expect(screen.getByText("My Organizations")).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: /Create Organization/ })).toBeNull();
});

it("shows an empty state with no owned organizations, with no currentUser skipping the fetch", async () => {
  mockedUseAuth.mockReturnValue({ currentUser: null, isInitializing: false });
  render(<MyOrganizationsPage />);
  expect(await screen.findByText("You don't own any organizations yet.")).toBeInTheDocument();
  expect(mockedFetchMyOwnOrganizations).not.toHaveBeenCalled();
});

it("lists owned organizations with a link to each, and a Create Organization button", async () => {
  mockedUseAuth.mockReturnValue({ currentUser: { id: 1, createdViaInvite: false }, isInitializing: false });
  mockedFetchMyOwnOrganizations.mockResolvedValue([
    { id: 1, organizationName: "Acme Studio", organizationDesc: "A design studio", slug: "acme-studio" },
  ]);
  render(<MyOrganizationsPage />);

  expect(await screen.findByText("Acme Studio")).toBeInTheDocument();
  expect(screen.getByText("A design studio")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /View details/ })).toHaveAttribute(
    "href",
    "/dashboard/my-organizations/acme-studio",
  );
  await waitFor(() =>
    expect(screen.getByRole("link", { name: /Create Organization/ })).toHaveAttribute(
      "href",
      "/dashboard/my-organizations/create",
    ),
  );
});

it("cancels the in-flight fetch's effect on unmount without updating state", async () => {
  mockedUseAuth.mockReturnValue({ currentUser: { id: 1, createdViaInvite: false }, isInitializing: false });
  let resolveFetch: (orgs: unknown[]) => void = () => {};
  mockedFetchMyOwnOrganizations.mockReturnValue(
    new Promise((resolve) => {
      resolveFetch = resolve;
    }),
  );
  const { unmount } = render(<MyOrganizationsPage />);
  unmount();
  resolveFetch([]);
  await Promise.resolve();
});
