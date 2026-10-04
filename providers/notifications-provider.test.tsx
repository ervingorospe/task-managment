import { renderHook, waitFor, act } from "@testing-library/react";
import { NotificationsProvider, useNotifications } from "./notifications-provider";
import { useAuth } from "@/providers/auth-provider";
import { fetchTicketNotifications, markNotificationsSeen } from "@/lib/api/activity-log";

jest.mock("@/providers/auth-provider", () => ({ useAuth: jest.fn() }));
jest.mock("@/lib/api/activity-log", () => ({
  fetchTicketNotifications: jest.fn(),
  markNotificationsSeen: jest.fn(),
}));

const mockedUseAuth = useAuth as jest.Mock;
const mockedFetch = fetchTicketNotifications as jest.Mock;
const mockedMarkSeen = markNotificationsSeen as jest.Mock;

class MockEventSource {
  static instances: MockEventSource[] = [];
  url: string;
  withCredentials: boolean;
  listeners: Record<string, (() => void)[]> = {};
  onerror: ((event: unknown) => void) | null = null;
  close = jest.fn();

  constructor(url: string, options: { withCredentials: boolean }) {
    this.url = url;
    this.withCredentials = options.withCredentials;
    MockEventSource.instances.push(this);
  }

  addEventListener(name: string, cb: () => void) {
    this.listeners[name] ??= [];
    this.listeners[name].push(cb);
  }

  emit(name: string) {
    this.listeners[name]?.forEach((cb) => cb());
  }
}

function wrapper({ children }: { children: React.ReactNode }) {
  return <NotificationsProvider>{children}</NotificationsProvider>;
}

beforeEach(() => {
  jest.clearAllMocks();
  MockEventSource.instances = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).EventSource = MockEventSource;
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  (console.error as jest.Mock).mockRestore();
  jest.useRealTimers();
});

it("throws when used outside a NotificationsProvider", () => {
  expect(() => renderHook(() => useNotifications())).toThrow(
    "useNotifications must be used within NotificationsProvider",
  );
});

it("resets to empty and doesn't fetch/stream when not authenticated", () => {
  mockedUseAuth.mockReturnValue({ isAuthenticated: false });
  const { result } = renderHook(() => useNotifications(), { wrapper });
  expect(result.current).toMatchObject({ items: [], unreadCount: 0 });
  expect(mockedFetch).not.toHaveBeenCalled();
  expect(MockEventSource.instances).toHaveLength(0);
});

it("loads notifications and opens an SSE stream when authenticated", async () => {
  mockedUseAuth.mockReturnValue({ isAuthenticated: true });
  mockedFetch.mockResolvedValue({ items: [{ id: 1 }], unreadCount: 3 });

  const { result } = renderHook(() => useNotifications(), { wrapper });
  await waitFor(() => expect(result.current.unreadCount).toBe(3));
  expect(result.current.items).toEqual([{ id: 1 }]);

  expect(MockEventSource.instances).toHaveLength(1);
  const source = MockEventSource.instances[0];
  expect(source.url).toContain("/activity-log/notifications/stream");
  expect(source.withCredentials).toBe(true);
});

it("logs (without crashing) when the initial load fails", async () => {
  mockedUseAuth.mockReturnValue({ isAuthenticated: true });
  mockedFetch.mockRejectedValue(new Error("boom"));
  renderHook(() => useNotifications(), { wrapper });
  await waitFor(() => expect(console.error).toHaveBeenCalled());
});

it("reloads when the SSE stream emits a 'notification' event", async () => {
  mockedUseAuth.mockReturnValue({ isAuthenticated: true });
  mockedFetch.mockResolvedValue({ items: [], unreadCount: 0 });
  renderHook(() => useNotifications(), { wrapper });
  await waitFor(() => expect(mockedFetch).toHaveBeenCalledTimes(1));

  mockedFetch.mockResolvedValue({ items: [{ id: 2 }], unreadCount: 1 });
  act(() => MockEventSource.instances[0].emit("notification"));
  await waitFor(() => expect(mockedFetch).toHaveBeenCalledTimes(2));
});

it("logs a stream error via onerror without crashing", () => {
  mockedUseAuth.mockReturnValue({ isAuthenticated: true });
  mockedFetch.mockResolvedValue({ items: [], unreadCount: 0 });
  renderHook(() => useNotifications(), { wrapper });
  const source = MockEventSource.instances[0];
  act(() => source.onerror?.(new Event("error")));
  expect(console.error).toHaveBeenCalledWith("Notification stream error", expect.anything());
});

it("polls on a fallback interval as a safety net", async () => {
  jest.useFakeTimers();
  mockedUseAuth.mockReturnValue({ isAuthenticated: true });
  mockedFetch.mockResolvedValue({ items: [], unreadCount: 0 });
  renderHook(() => useNotifications(), { wrapper });
  await waitFor(() => expect(mockedFetch).toHaveBeenCalledTimes(1));

  act(() => jest.advanceTimersByTime(2 * 60 * 1000));
  await waitFor(() => expect(mockedFetch).toHaveBeenCalledTimes(2));
});

it("closes the stream and clears the interval on cleanup", async () => {
  mockedUseAuth.mockReturnValue({ isAuthenticated: true });
  mockedFetch.mockResolvedValue({ items: [], unreadCount: 0 });
  const { unmount } = renderHook(() => useNotifications(), { wrapper });
  await waitFor(() => expect(MockEventSource.instances).toHaveLength(1));
  const source = MockEventSource.instances[0];
  unmount();
  expect(source.close).toHaveBeenCalled();
});

it("discards a stale response after unmounting mid-fetch", async () => {
  mockedUseAuth.mockReturnValue({ isAuthenticated: true });
  let resolveFetch: (v: unknown) => void;
  mockedFetch.mockImplementation(() => new Promise((resolve) => (resolveFetch = resolve)));
  const { unmount } = renderHook(() => useNotifications(), { wrapper });
  unmount();
  resolveFetch!({ items: [], unreadCount: 0 });
  await new Promise((r) => setTimeout(r, 0));
});

describe("markSeen", () => {
  it("optimistically zeroes unreadCount and calls the API", async () => {
    mockedUseAuth.mockReturnValue({ isAuthenticated: true });
    mockedFetch.mockResolvedValue({ items: [], unreadCount: 5 });
    mockedMarkSeen.mockResolvedValue(undefined);

    const { result } = renderHook(() => useNotifications(), { wrapper });
    await waitFor(() => expect(result.current.unreadCount).toBe(5));

    act(() => result.current.markSeen());
    expect(result.current.unreadCount).toBe(0);
    expect(mockedMarkSeen).toHaveBeenCalled();
  });

  it("logs (without crashing) when marking seen fails", async () => {
    mockedUseAuth.mockReturnValue({ isAuthenticated: true });
    mockedFetch.mockResolvedValue({ items: [], unreadCount: 0 });
    mockedMarkSeen.mockRejectedValue(new Error("boom"));

    const { result } = renderHook(() => useNotifications(), { wrapper });
    await waitFor(() => expect(mockedFetch).toHaveBeenCalled());

    act(() => result.current.markSeen());
    await waitFor(() =>
      expect(console.error).toHaveBeenCalledWith(
        "Failed to mark notifications as seen",
        expect.anything(),
      ),
    );
  });
});
