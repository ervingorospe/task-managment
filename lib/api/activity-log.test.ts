import {
  fetchActivityLog,
  fetchPersonalActivityLog,
  postActivityLog,
  fetchTicketNotifications,
  markNotificationsSeen,
} from "./activity-log";
import { api } from "./client";
import type { RawActivityLogEntry } from "./raw-types";

jest.mock("./client", () => {
  const actual = jest.requireActual("./client");
  return {
    ...actual,
    api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
  };
});

const mockedApi = api as jest.Mocked<typeof api>;

const RAW_ENTRY: RawActivityLogEntry = {
  id: 1,
  orgId: 6001,
  module: "TICKET",
  action: "created",
  entityId: 42,
  entityLabel: "TCK-42",
  referenceId: "TCK-42",
  actorId: 1,
  actorName: "Jane Doe",
  actorAvatar: null,
  involvedUserIds: [1, 2],
  description: "Jane created TCK-42",
  createdAt: "2026-01-01T00:00:00.000Z",
};

beforeEach(() => jest.clearAllMocks());

describe("fetchActivityLog", () => {
  it("fetches by orgId and lowercases the module", async () => {
    mockedApi.get.mockResolvedValue({ items: [RAW_ENTRY], total: 1, page: 1, limit: 100 });
    const result = await fetchActivityLog(6001);
    expect(mockedApi.get).toHaveBeenCalledWith("/activity-log?orgId=6001&limit=100");
    expect(result[0].module).toBe("ticket");
  });

  it("defaults referenceId/involvedUserIds when missing", async () => {
    mockedApi.get.mockResolvedValue({
      items: [{ ...RAW_ENTRY, referenceId: null, involvedUserIds: null as never }],
      total: 1,
      page: 1,
      limit: 100,
    });
    const [entry] = await fetchActivityLog(6001);
    expect(entry.referenceId).toBeUndefined();
    expect(entry.involvedUserIds).toEqual([]);
  });
});

describe("fetchPersonalActivityLog", () => {
  it("fetches by userId", async () => {
    mockedApi.get.mockResolvedValue({ items: [RAW_ENTRY], total: 1, page: 1, limit: 100 });
    await fetchPersonalActivityLog(7);
    expect(mockedApi.get).toHaveBeenCalledWith("/activity-log/personal?userId=7&limit=100");
  });
});

describe("postActivityLog", () => {
  it("uppercases the module before posting", async () => {
    mockedApi.post.mockResolvedValue(RAW_ENTRY);
    const { id: _id, createdAt: _createdAt, ...entry } = {
      ...RAW_ENTRY,
      module: "ticket" as never,
    };
    await postActivityLog(entry as never);
    expect(mockedApi.post).toHaveBeenCalledWith(
      "/activity-log",
      expect.objectContaining({ module: "TICKET" }),
    );
  });
});

describe("fetchTicketNotifications", () => {
  it("returns items and unreadCount", async () => {
    mockedApi.get.mockResolvedValue({ items: [RAW_ENTRY], unreadCount: 3 });
    const result = await fetchTicketNotifications();
    expect(mockedApi.get).toHaveBeenCalledWith("/activity-log/notifications");
    expect(result.unreadCount).toBe(3);
    expect(result.items).toHaveLength(1);
  });
});

describe("markNotificationsSeen", () => {
  it("patches the seen endpoint", async () => {
    mockedApi.patch.mockResolvedValue(undefined);
    await markNotificationsSeen();
    expect(mockedApi.patch).toHaveBeenCalledWith("/activity-log/notifications/seen");
  });
});
