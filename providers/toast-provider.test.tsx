import { renderHook, act } from "@testing-library/react";
import { ToastProvider, useToast, useToastList } from "./toast-provider";

function wrapper({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}

it("throws when used outside a ToastProvider", () => {
  expect(() => renderHook(() => useToastList())).toThrow(
    "useToast must be used within ToastProvider",
  );
});

it("adds a toast with a default 'success' variant", () => {
  const { result } = renderHook(
    () => ({ toast: useToast(), list: useToastList() }),
    { wrapper },
  );
  act(() => result.current.toast("Saved"));
  expect(result.current.list.toasts).toHaveLength(1);
  expect(result.current.list.toasts[0]).toMatchObject({
    message: "Saved",
    variant: "success",
  });
});

it("adds a toast with a custom variant", () => {
  const { result } = renderHook(
    () => ({ toast: useToast(), list: useToastList() }),
    { wrapper },
  );
  act(() => result.current.toast("Failed", "error"));
  expect(result.current.list.toasts[0].variant).toBe("error");
});

it("auto-dismisses a toast after 4 seconds", () => {
  jest.useFakeTimers();
  const { result } = renderHook(
    () => ({ toast: useToast(), list: useToastList() }),
    { wrapper },
  );
  act(() => result.current.toast("Saved"));
  expect(result.current.list.toasts).toHaveLength(1);

  act(() => jest.advanceTimersByTime(4000));
  expect(result.current.list.toasts).toHaveLength(0);
  jest.useRealTimers();
});

it("dismissToast removes just that toast", () => {
  const { result } = renderHook(
    () => ({ toast: useToast(), list: useToastList() }),
    { wrapper },
  );
  act(() => result.current.toast("First"));
  act(() => result.current.toast("Second"));
  const idToRemove = result.current.list.toasts[0].id;
  act(() => result.current.list.dismissToast(idToRemove));
  expect(result.current.list.toasts).toHaveLength(1);
  expect(result.current.list.toasts[0].message).toBe("Second");
});
