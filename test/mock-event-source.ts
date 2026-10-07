/** jsdom has no EventSource — every component/hook that opens an SSE
 * stream (NotificationsProvider, useResourceEvents) needs this stubbed
 * onto `global` before it mounts. Shared here instead of redeclared per
 * test file, since the shape (instance tracking + a synchronous emit()
 * for simulating a server push) is identical everywhere it's needed. */
export class MockEventSource {
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

/** Call from beforeEach: resets instance tracking and installs the mock
 * as the global EventSource. */
export function installMockEventSource() {
  MockEventSource.instances = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).EventSource = MockEventSource;
}
