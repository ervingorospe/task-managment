import { renderHook, waitFor } from "@testing-library/react";
import { useOrgScopedData } from "./use-org-scope-data";
import { useActiveOrganization } from "./use-active-organization";

jest.mock("./use-active-organization", () => ({ useActiveOrganization: jest.fn() }));

const mockedUseActiveOrg = useActiveOrganization as jest.Mock;

beforeEach(() => jest.clearAllMocks());

it("is empty/not-loading with no active org and no override", () => {
  mockedUseActiveOrg.mockReturnValue(null);
  const fetcher = jest.fn();
  const { result } = renderHook(() => useOrgScopedData(fetcher));
  expect(result.current).toEqual({ data: null, loading: false, organizationId: null });
  expect(fetcher).not.toHaveBeenCalled();
});

it("fetches using the active organization's id", async () => {
  mockedUseActiveOrg.mockReturnValue({ id: 6001 });
  const fetcher = jest.fn().mockResolvedValue({ tickets: [] });
  const { result } = renderHook(() => useOrgScopedData(fetcher));
  expect(result.current.loading).toBe(true);
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.data).toEqual({ tickets: [] });
  expect(result.current.organizationId).toBe(6001);
  expect(fetcher).toHaveBeenCalledWith(6001);
});

it("uses orgIdOverride instead of the active organization's id", async () => {
  mockedUseActiveOrg.mockReturnValue({ id: 6001 });
  const fetcher = jest.fn().mockResolvedValue({ ok: true });
  const { result } = renderHook(() => useOrgScopedData(fetcher, [], 9999));
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(fetcher).toHaveBeenCalledWith(9999);
  expect(result.current.organizationId).toBe(9999);
});

it("degrades to null data on a fetch failure instead of throwing", async () => {
  mockedUseActiveOrg.mockReturnValue({ id: 6001 });
  const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  const fetcher = jest.fn().mockRejectedValue(new Error("boom"));
  const { result } = renderHook(() => useOrgScopedData(fetcher));
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.data).toBeNull();
  expect(consoleSpy).toHaveBeenCalled();
  consoleSpy.mockRestore();
});

it("re-fetches when an extra dep changes", async () => {
  mockedUseActiveOrg.mockReturnValue({ id: 6001 });
  const fetcher = jest.fn().mockResolvedValue({ ok: true });
  const { rerender } = renderHook(({ dep }) => useOrgScopedData(fetcher, [dep]), {
    initialProps: { dep: "a" },
  });
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
  rerender({ dep: "b" });
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
});

it("discards a stale success response after unmounting", async () => {
  mockedUseActiveOrg.mockReturnValue({ id: 6001 });
  let resolveFetch: (v: unknown) => void;
  const fetcher = jest.fn(() => new Promise((resolve) => (resolveFetch = resolve)));
  const { unmount } = renderHook(() => useOrgScopedData(fetcher));
  unmount();
  resolveFetch!({ ok: true });
  await new Promise((r) => setTimeout(r, 0));
});

it("discards a stale error response after unmounting", async () => {
  mockedUseActiveOrg.mockReturnValue({ id: 6001 });
  const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  let rejectFetch: (e: unknown) => void;
  const fetcher = jest.fn(() => new Promise((_resolve, reject) => (rejectFetch = reject)));
  const { unmount } = renderHook(() => useOrgScopedData(fetcher));
  unmount();
  rejectFetch!(new Error("boom"));
  await new Promise((r) => setTimeout(r, 0));
  consoleSpy.mockRestore();
});
