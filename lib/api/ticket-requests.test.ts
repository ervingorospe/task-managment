import {
  fetchTicketRequestById,
  createTicketRequest,
  rejectTicketRequest,
  cancelTicketRequest,
  approveTicketRequest,
  fetchAllTicketRequests,
} from "./ticket-requests";
import { api, ApiError } from "./client";
import type { RawTicketRequest, RawApproveResult } from "./raw-types";
import type { RawTicket } from "./raw-types";

jest.mock("./client", () => {
  const actual = jest.requireActual("./client");
  return {
    ...actual,
    api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
  };
});

const mockedApi = api as jest.Mocked<typeof api>;

const RAW_MEMBER = {
  id: 1,
  firstName: "Alex",
  lastName: "Reyes",
  email: "alex@clientco.com",
  orgId: 6001,
  roleId: 3,
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const RAW_REQUEST: RawTicketRequest = {
  id: 1,
  referenceId: "REQ-1",
  orgId: 6001,
  title: "Fix the login page",
  description: null,
  attachments: [],
  client: RAW_MEMBER,
  ticketId: null,
  remarks: null,
  status: "PENDING",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
} as unknown as RawTicketRequest;

beforeEach(() => jest.clearAllMocks());

describe("fetchTicketRequestById", () => {
  it("returns the adapted request on success", async () => {
    mockedApi.get.mockResolvedValue(RAW_REQUEST);
    const request = await fetchTicketRequestById(1);
    expect(mockedApi.get).toHaveBeenCalledWith("/ticket-requests/1");
    expect(request?.status).toBe("pending");
  });

  it("returns null on 404/403", async () => {
    mockedApi.get.mockRejectedValue(new ApiError(404, null));
    expect(await fetchTicketRequestById(999)).toBeNull();
  });

  it("rethrows other errors", async () => {
    mockedApi.get.mockRejectedValue(new ApiError(500, null));
    await expect(fetchTicketRequestById(1)).rejects.toThrow();
  });
});

describe("createTicketRequest", () => {
  it("posts with the orgId query param", async () => {
    mockedApi.post.mockResolvedValue(RAW_REQUEST);
    const payload = { clientId: 1, title: "Fix the login page" };
    await createTicketRequest(6001, payload);
    expect(mockedApi.post).toHaveBeenCalledWith(
      "/ticket-requests?orgId=6001",
      payload,
    );
  });
});

describe("rejectTicketRequest", () => {
  it("patches the reject sub-endpoint with remarks", async () => {
    mockedApi.patch.mockResolvedValue(RAW_REQUEST);
    await rejectTicketRequest(1, "Not enough detail");
    expect(mockedApi.patch).toHaveBeenCalledWith("/ticket-requests/1/reject", {
      remarks: "Not enough detail",
    });
  });
});

describe("cancelTicketRequest", () => {
  it("patches the cancel sub-endpoint", async () => {
    mockedApi.patch.mockResolvedValue(RAW_REQUEST);
    await cancelTicketRequest(1);
    expect(mockedApi.patch).toHaveBeenCalledWith("/ticket-requests/1/cancel");
  });
});

describe("approveTicketRequest", () => {
  it("posts the approve payload and adapts both the request and ticket", async () => {
    const rawTicket = {
      id: 1,
      referenceId: "TCK-1",
      orgId: 6001,
      ownerId: null,
      projectId: null,
      project: null,
      title: "Fix the login page",
      description: null,
      attachments: [],
      tag: {
        id: 1,
        orgId: 6001,
        tagName: "To Do",
        color: "#000",
        isDefault: true,
        isDeleted: false,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      client: null,
      assignees: [],
      dueDate: null,
      starred: false,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    } as unknown as RawTicket;

    const result: RawApproveResult = { request: RAW_REQUEST, ticket: rawTicket };
    mockedApi.post.mockResolvedValue(result);

    const payload = { tagId: 1 };
    const adapted = await approveTicketRequest(1, payload);
    expect(mockedApi.post).toHaveBeenCalledWith(
      "/ticket-requests/1/approve",
      payload,
    );
    expect(adapted.request.status).toBe("pending");
    expect(adapted.ticket.id).toBe(1);
  });
});

describe("fetchAllTicketRequests", () => {
  it("fetches with just orgId when involvesUserId is omitted", async () => {
    mockedApi.get.mockResolvedValue([RAW_REQUEST]);
    await fetchAllTicketRequests(6001);
    expect(mockedApi.get).toHaveBeenCalledWith("/ticket-requests/all?orgId=6001");
  });

  it("includes involvesUserId when provided", async () => {
    mockedApi.get.mockResolvedValue([RAW_REQUEST]);
    await fetchAllTicketRequests(6001, 7);
    expect(mockedApi.get).toHaveBeenCalledWith(
      "/ticket-requests/all?orgId=6001&involvesUserId=7",
    );
  });
});
