import { renderHook, waitFor } from "@testing-library/react";
import { useOrgReportData } from "./use-org-report-data";
import { useAuth, usePermission } from "@/providers/auth-provider";
import { useActiveOrganization } from "./use-active-organization";
import { fetchAllTickets } from "@/lib/api/tickets";
import { fetchAllTicketRequests } from "@/lib/api/ticket-requests";

jest.mock("@/providers/auth-provider", () => ({
  useAuth: jest.fn(),
  usePermission: jest.fn(),
}));
jest.mock("./use-active-organization", () => ({ useActiveOrganization: jest.fn() }));
jest.mock("@/lib/api/tickets", () => ({ fetchAllTickets: jest.fn() }));
jest.mock("@/lib/api/ticket-requests", () => ({ fetchAllTicketRequests: jest.fn() }));

const mockedUseAuth = useAuth as jest.Mock;
const mockedUsePermission = usePermission as jest.Mock;
const mockedUseActiveOrg = useActiveOrganization as jest.Mock;
const mockedFetchTickets = fetchAllTickets as jest.Mock;
const mockedFetchRequests = fetchAllTicketRequests as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseActiveOrg.mockReturnValue({ id: 6001 });
  mockedUseAuth.mockReturnValue({ currentUser: { id: 5 } });
});

it("defaults to empty tickets/requests while loading", () => {
  mockedUsePermission.mockReturnValue(true);
  mockedFetchTickets.mockReturnValue(new Promise(() => {}));
  mockedFetchRequests.mockReturnValue(new Promise(() => {}));
  const { result } = renderHook(() => useOrgReportData());
  expect(result.current).toEqual({ tickets: [], requests: [], loading: true });
});

it("fetches without involvesUserId when the caller can view all", async () => {
  mockedUsePermission.mockReturnValue(true);
  mockedFetchTickets.mockResolvedValue([{ id: 1 }]);
  mockedFetchRequests.mockResolvedValue([{ id: 2 }]);

  const { result } = renderHook(() => useOrgReportData());
  await waitFor(() => expect(result.current.loading).toBe(false));

  expect(mockedFetchTickets).toHaveBeenCalledWith(6001, undefined);
  expect(mockedFetchRequests).toHaveBeenCalledWith(6001, undefined);
  expect(result.current.tickets).toEqual([{ id: 1 }]);
  expect(result.current.requests).toEqual([{ id: 2 }]);
});

it("scopes to the current user's id when the caller can't view all", async () => {
  mockedUsePermission.mockReturnValue(false);
  mockedFetchTickets.mockResolvedValue([]);
  mockedFetchRequests.mockResolvedValue([]);

  const { result } = renderHook(() => useOrgReportData());
  await waitFor(() => expect(result.current.loading).toBe(false));

  expect(mockedFetchTickets).toHaveBeenCalledWith(6001, 5);
  expect(mockedFetchRequests).toHaveBeenCalledWith(6001, 5);
});

it("falls back to an impossible id (-1) when the user isn't known yet", async () => {
  mockedUsePermission.mockReturnValue(false);
  mockedUseAuth.mockReturnValue({ currentUser: null });
  mockedFetchTickets.mockResolvedValue([]);
  mockedFetchRequests.mockResolvedValue([]);

  const { result } = renderHook(() => useOrgReportData());
  await waitFor(() => expect(result.current.loading).toBe(false));

  expect(mockedFetchTickets).toHaveBeenCalledWith(6001, -1);
});

it("passes an explicit orgId override through to the scoped-data fetch", async () => {
  mockedUsePermission.mockReturnValue(true);
  mockedFetchTickets.mockResolvedValue([]);
  mockedFetchRequests.mockResolvedValue([]);

  const { result } = renderHook(() => useOrgReportData(9999));
  await waitFor(() => expect(result.current.loading).toBe(false));

  expect(mockedFetchTickets).toHaveBeenCalledWith(9999, undefined);
});
