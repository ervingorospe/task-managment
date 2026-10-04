import { renderHook, waitFor, act } from "@testing-library/react";
import { ActivityLogProvider, useActivityLog } from "./activity-log-provider";
import { useAuth } from "@/providers/auth-provider";
import {
  fetchActivityLog,
  fetchPersonalActivityLog,
  postActivityLog,
} from "@/lib/api/activity-log";

jest.mock("@/providers/auth-provider", () => ({ useAuth: jest.fn() }));
jest.mock("@/lib/api/activity-log", () => ({
  fetchActivityLog: jest.fn(),
  fetchPersonalActivityLog: jest.fn(),
  postActivityLog: jest.fn(),
}));

const mockedUseAuth = useAuth as jest.Mock;
const mockedFetchOrg = fetchActivityLog as jest.Mock;
const mockedFetchPersonal = fetchPersonalActivityLog as jest.Mock;
const mockedPost = postActivityLog as jest.Mock;

function entry(overrides: Partial<{ id: number; orgId: number | null }> = {}) {
  return {
    id: overrides.id ?? 1,
    orgId: overrides.orgId ?? null,
    module: "ticket" as const,
    action: "created",
    entityId: 1,
    entityLabel: "TCK-1",
    actorId: 1,
    actorName: "Jane Doe",
    actorAvatar: null,
    involvedUserIds: [],
    description: "x",
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

function wrapper({ children }: { children: React.ReactNode }) {
  return <ActivityLogProvider>{children}</ActivityLogProvider>;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  (console.error as jest.Mock).mockRestore();
});

it("throws when used outside an ActivityLogProvider", () => {
  expect(() => renderHook(() => useActivityLog())).toThrow(
    "useActivityLog must be used within ActivityLogProvider",
  );
});

it("does nothing in Personal mode without a current user", () => {
  mockedUseAuth.mockReturnValue({
    currentUser: null,
    activeOrganization: null,
    isPersonalMode: true,
  });
  renderHook(() => useActivityLog(), { wrapper });
  expect(mockedFetchPersonal).not.toHaveBeenCalled();
});

it("does nothing when not in Personal mode and there's no active organization", () => {
  mockedUseAuth.mockReturnValue({
    currentUser: { id: 1 },
    activeOrganization: null,
    isPersonalMode: false,
  });
  renderHook(() => useActivityLog(), { wrapper });
  expect(mockedFetchOrg).not.toHaveBeenCalled();
});

it("fetches personal activity in Personal mode", async () => {
  mockedUseAuth.mockReturnValue({
    currentUser: { id: 1 },
    activeOrganization: null,
    isPersonalMode: true,
  });
  mockedFetchPersonal.mockResolvedValue([entry({ id: 1 })]);

  const { result } = renderHook(() => useActivityLog(), { wrapper });
  await waitFor(() => expect(result.current.entries).toHaveLength(1));
  expect(mockedFetchPersonal).toHaveBeenCalledWith(1);
});

it("logs a console error (without crashing) when the personal fetch fails", async () => {
  mockedUseAuth.mockReturnValue({
    currentUser: { id: 1 },
    activeOrganization: null,
    isPersonalMode: true,
  });
  mockedFetchPersonal.mockRejectedValue(new Error("boom"));

  renderHook(() => useActivityLog(), { wrapper });
  await waitFor(() => expect(console.error).toHaveBeenCalled());
});

it("fetches org activity for the active organization", async () => {
  mockedUseAuth.mockReturnValue({
    currentUser: { id: 1 },
    activeOrganization: { id: 6001 },
    isPersonalMode: false,
  });
  mockedFetchOrg.mockResolvedValue([entry({ id: 1, orgId: 6001 })]);

  const { result } = renderHook(() => useActivityLog(), { wrapper });
  await waitFor(() => expect(result.current.entries).toHaveLength(1));
  expect(mockedFetchOrg).toHaveBeenCalledWith(6001);
});

it("logs a console error (without crashing) when the org fetch fails", async () => {
  mockedUseAuth.mockReturnValue({
    currentUser: { id: 1 },
    activeOrganization: { id: 6001 },
    isPersonalMode: false,
  });
  mockedFetchOrg.mockRejectedValue(new Error("boom"));

  renderHook(() => useActivityLog(), { wrapper });
  await waitFor(() => expect(console.error).toHaveBeenCalled());
});

it("keeps entries from a previously-active org when switching to a different one", async () => {
  mockedUseAuth.mockReturnValue({
    currentUser: { id: 1 },
    activeOrganization: { id: 6001 },
    isPersonalMode: false,
  });
  mockedFetchOrg.mockResolvedValueOnce([entry({ id: 1, orgId: 6001 })]);

  const { result, rerender } = renderHook(() => useActivityLog(), { wrapper });
  await waitFor(() => expect(result.current.entries).toHaveLength(1));

  mockedFetchOrg.mockResolvedValueOnce([entry({ id: 2, orgId: 6002 })]);
  mockedUseAuth.mockReturnValue({
    currentUser: { id: 1 },
    activeOrganization: { id: 6002 },
    isPersonalMode: false,
  });
  rerender();

  await waitFor(() => expect(result.current.entries).toHaveLength(2));
  expect(result.current.entries.map((e) => e.orgId).sort()).toEqual([6001, 6002]);
});

it("on a personal refetch, keeps a stale entry absent from the new fetch and drops a duplicate", async () => {
  mockedUseAuth.mockReturnValue({
    currentUser: { id: 1 },
    activeOrganization: null,
    isPersonalMode: true,
  });
  mockedFetchPersonal.mockResolvedValueOnce([entry({ id: 1 }), entry({ id: 2 })]);

  const { result, rerender } = renderHook(() => useActivityLog(), { wrapper });
  await waitFor(() => expect(result.current.entries).toHaveLength(2));

  // Second fetch (triggered by a currentUser change) only returns id 1 —
  // id 2 should survive the merge since it's not in the new fetch.
  mockedFetchPersonal.mockResolvedValueOnce([entry({ id: 1 })]);
  mockedUseAuth.mockReturnValue({
    currentUser: { id: 2 },
    activeOrganization: null,
    isPersonalMode: true,
  });
  rerender();

  await waitFor(() => expect(mockedFetchPersonal).toHaveBeenCalledTimes(2));
  await waitFor(() =>
    expect(result.current.entries.map((e) => e.id).sort()).toEqual([1, 2]),
  );
});

it("on an org refetch of the same org, drops a duplicate already present in the new fetch", async () => {
  mockedUseAuth.mockReturnValue({
    currentUser: { id: 1 },
    activeOrganization: { id: 6001 },
    isPersonalMode: false,
  });
  mockedFetchOrg.mockResolvedValueOnce([entry({ id: 1, orgId: 6001 })]);

  const { result, rerender } = renderHook(() => useActivityLog(), { wrapper });
  await waitFor(() => expect(result.current.entries).toHaveLength(1));

  // Re-mount effect for the same org (forced via a distinct object
  // reference so the effect's dependency actually changes) — the
  // already-loaded id 1 must not be duplicated.
  mockedFetchOrg.mockResolvedValueOnce([entry({ id: 1, orgId: 6001 })]);
  mockedUseAuth.mockReturnValue({
    currentUser: { id: 1 },
    activeOrganization: { id: 6001 },
    isPersonalMode: false,
  });
  rerender();

  await waitFor(() => expect(mockedFetchOrg).toHaveBeenCalledTimes(2));
  expect(result.current.entries).toHaveLength(1);
});

it("discards a stale org fetch response after unmounting", async () => {
  let resolveFetch: (v: unknown) => void;
  mockedFetchOrg.mockImplementation(
    () => new Promise((resolve) => (resolveFetch = resolve)),
  );
  mockedUseAuth.mockReturnValue({
    currentUser: { id: 1 },
    activeOrganization: { id: 6001 },
    isPersonalMode: false,
  });
  const { unmount } = renderHook(() => useActivityLog(), { wrapper });
  unmount();
  resolveFetch!([entry()]);
  await new Promise((r) => setTimeout(r, 0));
});

it("discards a stale personal fetch response after unmounting", async () => {
  let resolveFetch: (v: unknown) => void;
  mockedFetchPersonal.mockImplementation(
    () => new Promise((resolve) => (resolveFetch = resolve)),
  );
  mockedUseAuth.mockReturnValue({
    currentUser: { id: 1 },
    activeOrganization: null,
    isPersonalMode: true,
  });
  const { unmount } = renderHook(() => useActivityLog(), { wrapper });
  unmount();
  resolveFetch!([entry()]);
  await new Promise((r) => setTimeout(r, 0));
});

describe("logActivity", () => {
  beforeEach(() => {
    mockedUseAuth.mockReturnValue({
      currentUser: { id: 1 },
      activeOrganization: null,
      isPersonalMode: true,
    });
    mockedFetchPersonal.mockResolvedValue([]);
  });

  it("adds an optimistic entry immediately, then replaces it once persisted (leaving other entries alone)", async () => {
    mockedFetchPersonal.mockResolvedValue([entry({ id: 42 })]);
    const persisted = entry({ id: 999 });
    mockedPost.mockResolvedValue(persisted);

    const { result } = renderHook(() => useActivityLog(), { wrapper });
    await waitFor(() => expect(result.current.entries).toHaveLength(1));

    act(() =>
      result.current.logActivity({
        orgId: null,
        module: "ticket",
        action: "created",
        entityId: 1,
        entityLabel: "TCK-1",
        actorId: 1,
        actorName: "Jane Doe",
        actorAvatar: null,
        involvedUserIds: [1],
        description: "Jane created TCK-1",
      }),
    );
    expect(result.current.entries).toHaveLength(2);
    expect(result.current.entries[0].description).toBe("Jane created TCK-1");

    await waitFor(() => expect(result.current.entries[0].id).toBe(999));
    // The pre-existing entry (id 42) must be untouched by the replace.
    expect(result.current.entries[1].id).toBe(42);
  });

  it("keeps the optimistic entry when persisting fails", async () => {
    mockedPost.mockRejectedValue(new Error("boom"));

    const { result } = renderHook(() => useActivityLog(), { wrapper });
    await waitFor(() => expect(mockedFetchPersonal).toHaveBeenCalled());

    act(() =>
      result.current.logActivity({
        orgId: null,
        module: "ticket",
        action: "created",
        entityId: 1,
        entityLabel: "TCK-1",
        actorId: 1,
        actorName: "Jane Doe",
        actorAvatar: null,
        involvedUserIds: [1],
        description: "x",
      }),
    );
    await waitFor(() => expect(mockedPost).toHaveBeenCalled());
    expect(result.current.entries).toHaveLength(1);
  });
});
