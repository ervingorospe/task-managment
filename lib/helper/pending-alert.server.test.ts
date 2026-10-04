/**
 * @jest-environment node
 */
// Covers the `typeof window === "undefined"` early-return branches, which
// jsdom (always defines window) can't exercise — see pending-alert.test.ts
// for the normal browser-side behavior.
import { setPendingAlert, consumePendingAlert } from "./pending-alert";

it("setPendingAlert is a no-op when there's no window", () => {
  expect(() => setPendingAlert("x")).not.toThrow();
});

it("consumePendingAlert returns null when there's no window", () => {
  expect(consumePendingAlert()).toBeNull();
});
