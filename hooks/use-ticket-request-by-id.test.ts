import { renderHook, waitFor } from "@testing-library/react";
import { useTicketRequestById } from "./use-ticket-request-by-id";
import { getTicketRequestById } from "@/lib/data/organization-detail";

jest.mock("@/lib/data/organization-detail", () => ({ getTicketRequestById: jest.fn() }));

const mockedGetRequest = getTicketRequestById as jest.Mock;

beforeEach(() => jest.clearAllMocks());

it("starts loading, then resolves with the request and organization", async () => {
  const request = { id: 1, title: "Fix the login page" };
  const organization = { id: 6001 };
  mockedGetRequest.mockResolvedValue({ request, organization });

  const { result } = renderHook(() => useTicketRequestById(1));
  expect(result.current.loading).toBe(true);

  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.request).toBe(request);
  expect(result.current.organization).toBe(organization);
  expect(result.current.notFound).toBe(false);
  expect(mockedGetRequest).toHaveBeenCalledWith(1);
});

it("sets notFound when the request doesn't exist", async () => {
  mockedGetRequest.mockResolvedValue(null);
  const { result } = renderHook(() => useTicketRequestById(999));
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.notFound).toBe(true);
  expect(result.current.request).toBeNull();
});

it("re-fetches when the requestId changes", async () => {
  mockedGetRequest.mockResolvedValueOnce(null);
  const { result, rerender } = renderHook(({ id }) => useTicketRequestById(id), {
    initialProps: { id: 999 },
  });
  await waitFor(() => expect(result.current.notFound).toBe(true));

  mockedGetRequest.mockResolvedValueOnce({ request: { id: 1 }, organization: null });
  rerender({ id: 1 });
  await waitFor(() => expect(result.current.request).toEqual({ id: 1 }));
  expect(result.current.notFound).toBe(false);
});

it("discards a stale response after unmounting", async () => {
  let resolveFetch: (result: unknown) => void;
  mockedGetRequest.mockImplementation(
    () => new Promise((resolve) => (resolveFetch = resolve)),
  );
  const { unmount } = renderHook(() => useTicketRequestById(1));
  unmount();
  resolveFetch!({ request: { id: 1 }, organization: null });
  await new Promise((r) => setTimeout(r, 0));
});
