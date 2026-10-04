import { render, screen, renderHook, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider, useToast } from "@/providers/toast-provider";
import { Toaster } from "./toaster";

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      {children}
      <Toaster />
    </ToastProvider>
  );
}

it("renders nothing when there are no toasts", () => {
  render(<div />, { wrapper });
  expect(screen.queryByRole("status")).toBeNull();
});

it("renders a success toast by default", async () => {
  const { result } = renderHook(() => useToast(), { wrapper });
  act(() => result.current("Ticket created"));
  expect(screen.getByRole("status")).toHaveTextContent("Ticket created");
});

it("renders an error toast", () => {
  const { result } = renderHook(() => useToast(), { wrapper });
  act(() => result.current("Failed to save", "error"));
  expect(screen.getByRole("status").className).toContain("danger");
});

it("renders an info toast", () => {
  const { result } = renderHook(() => useToast(), { wrapper });
  act(() => result.current("FYI", "info"));
  expect(screen.getByRole("status")).toBeInTheDocument();
});

it("dismisses a toast when its dismiss button is clicked", async () => {
  const { result } = renderHook(() => useToast(), { wrapper });
  act(() => result.current("Ticket created"));
  await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));
  expect(screen.queryByRole("status")).toBeNull();
});

it("stacks multiple toasts", () => {
  const { result } = renderHook(() => useToast(), { wrapper });
  act(() => {
    result.current("First");
    result.current("Second");
  });
  expect(screen.getAllByRole("status")).toHaveLength(2);
});
