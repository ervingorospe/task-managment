import { renderHook, waitFor } from "@testing-library/react";
import { useTicketById } from "./use-ticket-by-id";
import { getTicketById } from "@/lib/data/organization-detail";

jest.mock("@/lib/data/organization-detail", () => ({ getTicketById: jest.fn() }));

const mockedGetTicket = getTicketById as jest.Mock;

beforeEach(() => jest.clearAllMocks());

it("starts loading, then resolves with the ticket and organization", async () => {
  const ticket = { id: 1, title: "Fix the login page" };
  const organization = { id: 6001 };
  mockedGetTicket.mockResolvedValue({ ticket, organization });

  const { result } = renderHook(() => useTicketById(1));
  expect(result.current.loading).toBe(true);

  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.ticket).toBe(ticket);
  expect(result.current.organization).toBe(organization);
  expect(result.current.notFound).toBe(false);
  expect(mockedGetTicket).toHaveBeenCalledWith(1);
});

it("sets notFound when the ticket doesn't exist", async () => {
  mockedGetTicket.mockResolvedValue(null);
  const { result } = renderHook(() => useTicketById(999));
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.notFound).toBe(true);
  expect(result.current.ticket).toBeNull();
});

it("resets notFound and re-fetches when the ticketId changes", async () => {
  mockedGetTicket.mockResolvedValueOnce(null);
  const { result, rerender } = renderHook(({ id }) => useTicketById(id), {
    initialProps: { id: 999 },
  });
  await waitFor(() => expect(result.current.notFound).toBe(true));

  mockedGetTicket.mockResolvedValueOnce({ ticket: { id: 1 }, organization: null });
  rerender({ id: 1 });
  expect(result.current.loading).toBe(true);
  await waitFor(() => expect(result.current.ticket).toEqual({ id: 1 }));
  expect(result.current.notFound).toBe(false);
});

it("discards a stale response after unmounting", async () => {
  let resolveFetch: (result: unknown) => void;
  mockedGetTicket.mockImplementation(
    () => new Promise((resolve) => (resolveFetch = resolve)),
  );
  const { unmount } = renderHook(() => useTicketById(1));
  unmount();
  resolveFetch!({ ticket: { id: 1 }, organization: null });
  await new Promise((r) => setTimeout(r, 0));
});
