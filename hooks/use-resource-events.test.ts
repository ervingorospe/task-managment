import { renderHook } from "@testing-library/react";
import { useResourceEvents } from "./use-resource-events";
import { API_BASE_URL } from "@/lib/api/client";
import { MockEventSource, installMockEventSource } from "@/test/mock-event-source";

beforeEach(() => {
  installMockEventSource();
  jest.spyOn(console, "error").mockImplementation(() => {});
});

it("opens an org-scoped stream when given an orgId", () => {
  renderHook(() => useResourceEvents(5, "TICKET", jest.fn()));

  expect(MockEventSource.instances).toHaveLength(1);
  expect(MockEventSource.instances[0].url).toBe(
    `${API_BASE_URL}/activity-log/organizations/5/stream`,
  );
  expect(MockEventSource.instances[0].withCredentials).toBe(true);
});

it("opens the personal stream when orgId is null", () => {
  renderHook(() => useResourceEvents(null, "TICKET", jest.fn()));

  expect(MockEventSource.instances[0].url).toBe(
    `${API_BASE_URL}/activity-log/personal/stream`,
  );
});

it("calls onChange when the matching resource event fires", () => {
  const onChange = jest.fn();
  renderHook(() => useResourceEvents(5, "REQUEST", onChange));

  MockEventSource.instances[0].emit("REQUEST");

  expect(onChange).toHaveBeenCalledTimes(1);
});

it("does not react to an event for a different resource", () => {
  const onChange = jest.fn();
  renderHook(() => useResourceEvents(5, "REQUEST", onChange));

  MockEventSource.instances[0].emit("PROJECT");

  expect(onChange).not.toHaveBeenCalled();
});

it("closes the stream on unmount", () => {
  const { unmount } = renderHook(() => useResourceEvents(5, "TICKET", jest.fn()));
  const source = MockEventSource.instances[0];

  unmount();

  expect(source.close).toHaveBeenCalledTimes(1);
});

it("closes the old stream and opens a new one when orgId changes", () => {
  const { rerender } = renderHook(
    ({ orgId }) => useResourceEvents(orgId, "TICKET", jest.fn()),
    { initialProps: { orgId: 5 } },
  );
  const first = MockEventSource.instances[0];

  rerender({ orgId: 6 });

  expect(first.close).toHaveBeenCalledTimes(1);
  expect(MockEventSource.instances).toHaveLength(2);
  expect(MockEventSource.instances[1].url).toBe(
    `${API_BASE_URL}/activity-log/organizations/6/stream`,
  );
});

it("logs without throwing when the stream errors", () => {
  renderHook(() => useResourceEvents(5, "TICKET", jest.fn()));

  expect(() =>
    MockEventSource.instances[0].onerror?.(new Event("error")),
  ).not.toThrow();
  expect(console.error).toHaveBeenCalled();
});
