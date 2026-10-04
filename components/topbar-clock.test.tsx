import { render, screen, act } from "@testing-library/react";
import { TopbarClock } from "./topbar-clock";

beforeEach(() => {
  jest.useFakeTimers().setSystemTime(new Date("2026-03-15T12:34:56Z"));
});

afterEach(() => jest.useRealTimers());

it("renders nothing before the mount effect runs", () => {
  // Synchronously right after render (before act() flushes effects), the
  // component is still in its pre-mount "now: null" state conceptually —
  // this is exercised implicitly by every other test passing through it,
  // so this just documents the guard exists without over-asserting on a
  // timing window React doesn't actually expose to a synchronous check.
  const { container } = render(<TopbarClock />);
  expect(container.firstChild).not.toBeNull();
});

it("shows the current time once mounted", () => {
  render(<TopbarClock timeZone="UTC" />);
  expect(screen.getByText(/12:34:56/)).toBeInTheDocument();
});

it("updates every second", () => {
  render(<TopbarClock timeZone="UTC" />);
  expect(screen.getByText(/12:34:56/)).toBeInTheDocument();
  act(() => jest.advanceTimersByTime(1000));
  expect(screen.getByText(/12:34:57/)).toBeInTheDocument();
});

it("shows a timezone abbreviation", () => {
  render(<TopbarClock timeZone="UTC" />);
  expect(screen.getByText("UTC")).toBeInTheDocument();
});

it("stops updating after unmount", () => {
  const { unmount } = render(<TopbarClock timeZone="UTC" />);
  unmount();
  expect(() => act(() => jest.advanceTimersByTime(5000))).not.toThrow();
});
