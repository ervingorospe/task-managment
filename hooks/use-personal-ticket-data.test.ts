import { renderHook, waitFor } from "@testing-library/react";
import { usePersonalTicketData } from "./use-personal-ticket-data";
import { useAuth } from "@/providers/auth-provider";
import { fetchAllPersonalTickets } from "@/lib/api/tickets";

jest.mock("@/providers/auth-provider", () => ({ useAuth: jest.fn() }));
jest.mock("@/lib/api/tickets", () => ({ fetchAllPersonalTickets: jest.fn() }));

const mockedUseAuth = useAuth as jest.Mock;
const mockedFetch = fetchAllPersonalTickets as jest.Mock;

beforeEach(() => jest.clearAllMocks());

it("is empty/not-loading when not in Personal mode", () => {
  mockedUseAuth.mockReturnValue({ currentUser: { id: 1 }, isPersonalMode: false });
  const { result } = renderHook(() => usePersonalTicketData());
  expect(result.current).toEqual({ tickets: [], loading: false });
  expect(mockedFetch).not.toHaveBeenCalled();
});

it("is empty/not-loading when there's no current user", () => {
  mockedUseAuth.mockReturnValue({ currentUser: null, isPersonalMode: true });
  const { result } = renderHook(() => usePersonalTicketData());
  expect(result.current).toEqual({ tickets: [], loading: false });
});

it("fetches the current user's personal tickets in Personal mode", async () => {
  mockedUseAuth.mockReturnValue({ currentUser: { id: 1 }, isPersonalMode: true });
  const tickets = [{ id: 1 }];
  mockedFetch.mockResolvedValue(tickets);

  const { result } = renderHook(() => usePersonalTicketData());
  expect(result.current.loading).toBe(true);
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.tickets).toBe(tickets);
  expect(mockedFetch).toHaveBeenCalledWith(1);
});

it("discards a stale response after unmounting", async () => {
  mockedUseAuth.mockReturnValue({ currentUser: { id: 1 }, isPersonalMode: true });
  let resolveFetch: (v: unknown) => void;
  mockedFetch.mockImplementation(() => new Promise((resolve) => (resolveFetch = resolve)));
  const { unmount } = renderHook(() => usePersonalTicketData());
  unmount();
  resolveFetch!([]);
  await new Promise((r) => setTimeout(r, 0));
});
