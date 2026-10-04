import {
  inviteMember,
  resendInvite,
  removeInvite,
  updateMemberRole,
  updateMemberActiveState,
  removeMember,
} from "./members";
import { api } from "./client";
import type { RawMemberInvite } from "./raw-types";

jest.mock("./client", () => {
  const actual = jest.requireActual("./client");
  return {
    ...actual,
    api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
  };
});

const mockedApi = api as jest.Mocked<typeof api>;

const RAW_INVITE: RawMemberInvite = {
  id: 1,
  orgId: 6001,
  roleId: 2,
  email: "alex@clientco.com",
  token: "abc",
  expiry: null,
  resentCount: 0,
  lastSentAt: null,
  type: "MEMBERSHIP",
  status: "PENDING",
  isDeleted: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

beforeEach(() => jest.clearAllMocks());

describe("inviteMember", () => {
  it("posts to /members/invite with the orgId query param", async () => {
    mockedApi.post.mockResolvedValue(RAW_INVITE);
    const payload = { email: "alex@clientco.com", roleId: 2 };
    const invite = await inviteMember(6001, payload);
    expect(mockedApi.post).toHaveBeenCalledWith("/members/invite?orgId=6001", payload);
    expect(invite.email).toBe("alex@clientco.com");
  });
});

describe("resendInvite", () => {
  it("posts to the resend sub-endpoint", async () => {
    mockedApi.post.mockResolvedValue(RAW_INVITE);
    await resendInvite(1);
    expect(mockedApi.post).toHaveBeenCalledWith("/members/invites/1/resend");
  });
});

describe("removeInvite", () => {
  it("deletes the given invite id", async () => {
    mockedApi.delete.mockResolvedValue(undefined);
    await removeInvite(1);
    expect(mockedApi.delete).toHaveBeenCalledWith("/members/invites/1");
  });
});

describe("updateMemberRole", () => {
  it("patches the member's role", async () => {
    mockedApi.patch.mockResolvedValue(undefined);
    await updateMemberRole(5, 2);
    expect(mockedApi.patch).toHaveBeenCalledWith("/members/5/role", { roleId: 2 });
  });
});

describe("updateMemberActiveState", () => {
  it("patches the member's active state", async () => {
    mockedApi.patch.mockResolvedValue(undefined);
    await updateMemberActiveState(5, false);
    expect(mockedApi.patch).toHaveBeenCalledWith("/members/5/active-state", {
      isActive: false,
    });
  });
});

describe("removeMember", () => {
  it("deletes the given member id", async () => {
    mockedApi.delete.mockResolvedValue(undefined);
    await removeMember(5);
    expect(mockedApi.delete).toHaveBeenCalledWith("/members/5");
  });
});
