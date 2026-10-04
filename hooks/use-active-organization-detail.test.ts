import { renderHook, waitFor } from "@testing-library/react";
import { useActiveOrganizationDetail } from "./use-active-organization-detail";
import { useAuth } from "@/providers/auth-provider";
import { getOrganizationBySlug } from "@/lib/data/organization-detail";

jest.mock("@/providers/auth-provider", () => ({ useAuth: jest.fn() }));
jest.mock("@/lib/data/organization-detail", () => ({
  getOrganizationBySlug: jest.fn(),
}));

const mockedUseAuth = useAuth as jest.Mock;
const mockedGetOrg = getOrganizationBySlug as jest.Mock;

beforeEach(() => jest.clearAllMocks());

it("is null when there's no active organization (e.g. Personal mode)", () => {
  mockedUseAuth.mockReturnValue({ activeOrganization: null });
  const { result } = renderHook(() => useActiveOrganizationDetail());
  expect(result.current).toBeNull();
  expect(mockedGetOrg).not.toHaveBeenCalled();
});

it("fetches by the active organization's slug and returns the result", async () => {
  mockedUseAuth.mockReturnValue({
    activeOrganization: { settings: { slug: "acme-studio" } },
  });
  const org = { id: 6001, organizationName: "Acme Studio" };
  mockedGetOrg.mockResolvedValue(org);

  const { result } = renderHook(() => useActiveOrganizationDetail());
  await waitFor(() => expect(result.current).toBe(org));
  expect(mockedGetOrg).toHaveBeenCalledWith("acme-studio");
});

it("discards a stale response if the active organization changes before it resolves", async () => {
  let resolveFirst: (org: unknown) => void;
  mockedGetOrg.mockImplementationOnce(
    () => new Promise((resolve) => (resolveFirst = resolve)),
  );
  mockedUseAuth.mockReturnValue({
    activeOrganization: { settings: { slug: "acme-studio" } },
  });

  const { result, rerender } = renderHook(() => useActiveOrganizationDetail());

  mockedGetOrg.mockResolvedValueOnce({ id: 6002, organizationName: "Clientco" });
  mockedUseAuth.mockReturnValue({
    activeOrganization: { settings: { slug: "clientco" } },
  });
  rerender();

  await waitFor(() =>
    expect(result.current).toEqual({ id: 6002, organizationName: "Clientco" }),
  );

  // The first (now-stale) fetch resolving afterward must not overwrite it.
  resolveFirst!({ id: 6001, organizationName: "Acme Studio" });
  await new Promise((r) => setTimeout(r, 0));
  expect(result.current).toEqual({ id: 6002, organizationName: "Clientco" });
});
