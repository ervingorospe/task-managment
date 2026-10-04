import { renderHook, act } from "@testing-library/react";
import { useInlineAlert } from "./use-inline-alert";
import { consumePendingAlert } from "@/lib/helper/pending-alert";

jest.mock("@/lib/helper/pending-alert", () => ({ consumePendingAlert: jest.fn() }));

const mockedConsume = consumePendingAlert as jest.Mock;

beforeEach(() => jest.clearAllMocks());

it("starts with no alert when nothing is pending", () => {
  mockedConsume.mockReturnValue(null);
  const { result } = renderHook(() => useInlineAlert());
  expect(result.current.alert).toBeNull();
});

it("picks up a pending alert on mount", async () => {
  mockedConsume.mockReturnValue({ message: "Ticket removed", variant: "success" });
  const { result } = renderHook(() => useInlineAlert());
  await act(async () => {});
  expect(result.current.alert).toEqual({ message: "Ticket removed", variant: "success" });
});

it("showAlert sets the alert with a default 'success' variant", () => {
  mockedConsume.mockReturnValue(null);
  const { result } = renderHook(() => useInlineAlert());
  act(() => result.current.showAlert("Saved"));
  expect(result.current.alert).toEqual({ message: "Saved", variant: "success" });
});

it("showAlert accepts a custom variant", () => {
  mockedConsume.mockReturnValue(null);
  const { result } = renderHook(() => useInlineAlert());
  act(() => result.current.showAlert("Failed", "error"));
  expect(result.current.alert).toEqual({ message: "Failed", variant: "error" });
});

it("dismissAlert clears the alert", () => {
  mockedConsume.mockReturnValue(null);
  const { result } = renderHook(() => useInlineAlert());
  act(() => result.current.showAlert("Saved"));
  act(() => result.current.dismissAlert());
  expect(result.current.alert).toBeNull();
});
