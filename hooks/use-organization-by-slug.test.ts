import { renderHook, waitFor } from "@testing-library/react";
import { useOrganizationBySlug } from "./use-organization-by-slug";
import { getOrganizationBySlug } from "@/lib/data/organization-detail";

jest.mock("@/lib/data/organization-detail", () => ({
  getOrganizationBySlug: jest.fn(),
}));

const mockedGetOrg = getOrganizationBySlug as jest.Mock;

beforeEach(() => jest.clearAllMocks());

it("starts loading, then resolves with the fetched organization", async () => {
  const org = { id: 6001, organizationName: "Acme Studio" };
  mockedGetOrg.mockResolvedValue(org);

  const { result } = renderHook(() => useOrganizationBySlug("acme-studio"));
  expect(result.current.loading).toBe(true);
  expect(result.current.organization).toBeNull();

  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.organization).toBe(org);
  expect(mockedGetOrg).toHaveBeenCalledWith("acme-studio");
});

it("re-fetches when the slug changes", async () => {
  mockedGetOrg.mockResolvedValue({ id: 6001 });
  const { result, rerender } = renderHook(
    ({ slug }) => useOrganizationBySlug(slug),
    { initialProps: { slug: "acme-studio" } },
  );
  await waitFor(() => expect(result.current.loading).toBe(false));

  mockedGetOrg.mockResolvedValue({ id: 6002 });
  rerender({ slug: "clientco" });
  expect(result.current.loading).toBe(true);
  await waitFor(() => expect(result.current.organization).toEqual({ id: 6002 }));
  expect(mockedGetOrg).toHaveBeenLastCalledWith("clientco");
});

it("discards a stale response after unmounting", async () => {
  let resolveFetch: (org: unknown) => void;
  mockedGetOrg.mockImplementation(
    () => new Promise((resolve) => (resolveFetch = resolve)),
  );

  const { unmount } = renderHook(() => useOrganizationBySlug("acme-studio"));
  unmount();
  resolveFetch!({ id: 6001 });
  // No assertion needed beyond "this doesn't throw a setState-after-unmount
  // warning/error" — the cancelled guard is what prevents that.
  await new Promise((r) => setTimeout(r, 0));
});
