import { renderHook } from "@testing-library/react";
import { useDismiss } from "./use-dismiss";

function fireMouseDown(target: EventTarget) {
  const event = new MouseEvent("mousedown", { bubbles: true });
  Object.defineProperty(event, "target", { value: target });
  document.dispatchEvent(event);
}

it("calls onDismiss when clicking outside the ref'd element", () => {
  const inside = document.createElement("div");
  const outside = document.createElement("div");
  document.body.append(inside, outside);
  const onDismiss = jest.fn();

  renderHook(() => useDismiss({ ref: { current: inside }, onDismiss }));
  fireMouseDown(outside);

  expect(onDismiss).toHaveBeenCalledTimes(1);
  inside.remove();
  outside.remove();
});

it("does not call onDismiss when clicking inside the ref'd element", () => {
  const inside = document.createElement("div");
  const child = document.createElement("span");
  inside.append(child);
  document.body.append(inside);
  const onDismiss = jest.fn();

  renderHook(() => useDismiss({ ref: { current: inside }, onDismiss }));
  fireMouseDown(child);

  expect(onDismiss).not.toHaveBeenCalled();
  inside.remove();
});

it("does not call onDismiss when clicking inside a portaled floating panel", () => {
  const inside = document.createElement("div");
  const panel = document.createElement("div");
  panel.setAttribute("data-floating-panel", "");
  const panelChild = document.createElement("span");
  panel.append(panelChild);
  document.body.append(inside, panel);
  const onDismiss = jest.fn();

  renderHook(() => useDismiss({ ref: { current: inside }, onDismiss }));
  fireMouseDown(panelChild);

  expect(onDismiss).not.toHaveBeenCalled();
  inside.remove();
  panel.remove();
});

it("calls onDismiss on Escape", () => {
  const inside = document.createElement("div");
  document.body.append(inside);
  const onDismiss = jest.fn();

  renderHook(() => useDismiss({ ref: { current: inside }, onDismiss }));
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

  expect(onDismiss).toHaveBeenCalledTimes(1);
  inside.remove();
});

it("ignores a non-Escape key", () => {
  const inside = document.createElement("div");
  document.body.append(inside);
  const onDismiss = jest.fn();

  renderHook(() => useDismiss({ ref: { current: inside }, onDismiss }));
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));

  expect(onDismiss).not.toHaveBeenCalled();
  inside.remove();
});

it("ignores an event whose target isn't a Node", () => {
  const inside = document.createElement("div");
  document.body.append(inside);
  const onDismiss = jest.fn();

  renderHook(() => useDismiss({ ref: { current: inside }, onDismiss }));
  const event = new MouseEvent("mousedown", { bubbles: true });
  Object.defineProperty(event, "target", { value: null });
  document.dispatchEvent(event);

  expect(onDismiss).not.toHaveBeenCalled();
  inside.remove();
});

it("removes its listeners on unmount", () => {
  const inside = document.createElement("div");
  const outside = document.createElement("div");
  document.body.append(inside, outside);
  const onDismiss = jest.fn();

  const { unmount } = renderHook(() => useDismiss({ ref: { current: inside }, onDismiss }));
  unmount();
  fireMouseDown(outside);

  expect(onDismiss).not.toHaveBeenCalled();
  inside.remove();
  outside.remove();
});
