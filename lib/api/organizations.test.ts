import {
  fetchOrganizationDetailBySlug,
  fetchOrganizationDetailById,
  createOrganization,
  fetchMyOwnOrganizations,
  updateOrganizationBasicInfo,
  uploadOrganizationLogo,
  updateOrganizationTimezone,
  updateOrganizationInviteExpiration,
  updateOrganizationNotifications,
  updateOrganizationActiveState,
  deleteOrganization,
  requestOwnershipTransfer,
  cancelOwnershipTransfer,
} from "./organizations";
import { api, ApiError } from "./client";
import type { RawOrganization } from "./raw-types";

jest.mock("./client", () => {
  const actual = jest.requireActual("./client");
  return {
    ...actual,
    api: {
      get: jest.fn(),
      post: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
      postForm: jest.fn(),
    },
  };
});

const mockedApi = api as jest.Mocked<typeof api>;

const RAW_OWNER = {
  id: 1,
  firstName: "Jane",
  lastName: "Doe",
  email: "jane@acmestudio.com",
  avatar: null,
  isActive: true,
  isDeleted: false,
  isVerified: true,
  hasOnboarded: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const RAW_SETTINGS = {
  id: 1,
  orgId: 6001,
  slug: "acme-studio",
  logo: null,
  timezone: "Asia/Manila",
  inviteExpiration: "7d",
  sendEmailNotif: true,
  orgId2: undefined,
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const RAW_ORG: RawOrganization = {
  id: 6001,
  organizationName: "Acme Studio",
  organizationDesc: null,
  email: null,
  website: null,
  owner: RAW_OWNER,
  settings: RAW_SETTINGS,
  capacity: { used: 1, limit: 10 },
  roles: [],
  tags: [],
  members: [],
  pendingInvites: [],
  pendingOwnershipTransfer: null,
} as unknown as RawOrganization;

const EMPTY_PAGE = { items: [], total: 0, page: 1, limit: 100 };

beforeEach(() => jest.clearAllMocks());

describe("fetchOrganizationDetailBySlug", () => {
  it("fetches the org by slug and composes tickets/requests/projects", async () => {
    mockedApi.get.mockImplementation((path: string) => {
      if (path === "/organizations/acme-studio") return Promise.resolve(RAW_ORG);
      if (path.startsWith("/tickets?")) return Promise.resolve(EMPTY_PAGE);
      if (path.startsWith("/ticket-requests?")) return Promise.resolve(EMPTY_PAGE);
      if (path.startsWith("/projects?")) return Promise.resolve([]);
      throw new Error(`unexpected path ${path}`);
    });

    const org = await fetchOrganizationDetailBySlug("acme-studio");
    expect(org?.id).toBe(6001);
    expect(org?.tickets).toEqual([]);
    expect(org?.ticketRequests).toEqual([]);
    expect(org?.projects).toEqual([]);
    expect(mockedApi.get).toHaveBeenCalledWith(
      expect.stringContaining("/tickets?orgId=6001"),
    );
    expect(mockedApi.get).toHaveBeenCalledWith(
      expect.stringContaining("/ticket-requests?orgId=6001"),
    );
    expect(mockedApi.get).toHaveBeenCalledWith("/projects?orgId=6001");
  });

  it("returns null when the org fetch 404s", async () => {
    mockedApi.get.mockRejectedValue(new ApiError(404, null));
    expect(await fetchOrganizationDetailBySlug("nonexistent")).toBeNull();
  });

  it("returns null when the org fetch 403s", async () => {
    mockedApi.get.mockRejectedValue(new ApiError(403, null));
    expect(await fetchOrganizationDetailBySlug("forbidden")).toBeNull();
  });

  it("rethrows a non-404/403 error from the org fetch", async () => {
    mockedApi.get.mockRejectedValue(new ApiError(500, null));
    await expect(fetchOrganizationDetailBySlug("acme-studio")).rejects.toThrow();
  });

  it("degrades tickets/requests to empty on a 403 without failing the page", async () => {
    mockedApi.get.mockImplementation((path: string) => {
      if (path === "/organizations/acme-studio") return Promise.resolve(RAW_ORG);
      if (path.startsWith("/tickets?")) return Promise.reject(new ApiError(403, null));
      if (path.startsWith("/ticket-requests?"))
        return Promise.reject(new ApiError(404, null));
      if (path.startsWith("/projects?")) return Promise.reject(new ApiError(403, null));
      throw new Error(`unexpected path ${path}`);
    });

    const org = await fetchOrganizationDetailBySlug("acme-studio");
    expect(org?.tickets).toEqual([]);
    expect(org?.ticketRequests).toEqual([]);
    expect(org?.projects).toEqual([]);
  });

  it("rethrows a non-404/403 error from the tickets sub-fetch", async () => {
    mockedApi.get.mockImplementation((path: string) => {
      if (path === "/organizations/acme-studio") return Promise.resolve(RAW_ORG);
      if (path.startsWith("/tickets?")) return Promise.reject(new ApiError(500, null));
      if (path.startsWith("/ticket-requests?")) return Promise.resolve(EMPTY_PAGE);
      if (path.startsWith("/projects?")) return Promise.resolve([]);
      throw new Error(`unexpected path ${path}`);
    });

    await expect(fetchOrganizationDetailBySlug("acme-studio")).rejects.toThrow();
  });

  it("rethrows a non-404/403 error from the projects sub-fetch", async () => {
    mockedApi.get.mockImplementation((path: string) => {
      if (path === "/organizations/acme-studio") return Promise.resolve(RAW_ORG);
      if (path.startsWith("/tickets?")) return Promise.resolve(EMPTY_PAGE);
      if (path.startsWith("/ticket-requests?")) return Promise.resolve(EMPTY_PAGE);
      if (path.startsWith("/projects?")) return Promise.reject(new ApiError(500, null));
      throw new Error(`unexpected path ${path}`);
    });

    await expect(fetchOrganizationDetailBySlug("acme-studio")).rejects.toThrow();
  });

  it("adapts pendingOwnershipTransfer when present", async () => {
    const orgWithTransfer = {
      ...RAW_ORG,
      pendingOwnershipTransfer: {
        id: 1,
        orgId: 6001,
        roleId: 1,
        email: "new-owner@acmestudio.com",
        token: "abc",
        expiry: null,
        resentCount: 0,
        lastSentAt: null,
        type: "OWNERSHIP",
        status: "PENDING",
        isDeleted: false,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    };
    mockedApi.get.mockImplementation((path: string) => {
      if (path === "/organizations/acme-studio") return Promise.resolve(orgWithTransfer);
      if (path.startsWith("/tickets?")) return Promise.resolve(EMPTY_PAGE);
      if (path.startsWith("/ticket-requests?")) return Promise.resolve(EMPTY_PAGE);
      if (path.startsWith("/projects?")) return Promise.resolve([]);
      throw new Error(`unexpected path ${path}`);
    });

    const org = await fetchOrganizationDetailBySlug("acme-studio");
    expect(org?.pendingOwnershipTransfer?.type).toBe("ownership");
  });

  it("defaults pendingInvites to an empty array when omitted", async () => {
    const orgWithoutInvites = { ...RAW_ORG, pendingInvites: undefined };
    mockedApi.get.mockImplementation((path: string) => {
      if (path === "/organizations/acme-studio")
        return Promise.resolve(orgWithoutInvites);
      if (path.startsWith("/tickets?")) return Promise.resolve(EMPTY_PAGE);
      if (path.startsWith("/ticket-requests?")) return Promise.resolve(EMPTY_PAGE);
      if (path.startsWith("/projects?")) return Promise.resolve([]);
      throw new Error(`unexpected path ${path}`);
    });

    const org = await fetchOrganizationDetailBySlug("acme-studio");
    expect(org?.pendingInvites).toEqual([]);
  });
});

describe("fetchOrganizationDetailById", () => {
  it("fetches by the by-id endpoint", async () => {
    mockedApi.get.mockImplementation((path: string) => {
      if (path === "/organizations/by-id/6001") return Promise.resolve(RAW_ORG);
      if (path.startsWith("/tickets?")) return Promise.resolve(EMPTY_PAGE);
      if (path.startsWith("/ticket-requests?")) return Promise.resolve(EMPTY_PAGE);
      if (path.startsWith("/projects?")) return Promise.resolve([]);
      throw new Error(`unexpected path ${path}`);
    });
    const org = await fetchOrganizationDetailById(6001);
    expect(org?.id).toBe(6001);
  });
});

describe("createOrganization", () => {
  it("posts the payload and returns an org with empty tickets/requests/projects", async () => {
    mockedApi.post.mockResolvedValue(RAW_ORG);
    const org = await createOrganization({
      organizationName: "Acme Studio",
    } as never);
    expect(mockedApi.post).toHaveBeenCalledWith("/organizations", {
      organizationName: "Acme Studio",
    });
    expect(org.tickets).toEqual([]);
    expect(org.ticketRequests).toEqual([]);
    expect(org.projects).toEqual([]);
  });
});

describe("fetchMyOwnOrganizations", () => {
  it("fetches by ownerId", async () => {
    mockedApi.get.mockResolvedValue([]);
    await fetchMyOwnOrganizations(1);
    expect(mockedApi.get).toHaveBeenCalledWith(
      "/organizations/my-own-organizations?ownerId=1",
    );
  });
});

describe("updateOrganizationBasicInfo", () => {
  it("patches basic-info", async () => {
    mockedApi.patch.mockResolvedValue(undefined);
    await updateOrganizationBasicInfo(6001, { organizationName: "New Name" });
    expect(mockedApi.patch).toHaveBeenCalledWith("/organizations/6001/basic-info", {
      organizationName: "New Name",
    });
  });
});

describe("uploadOrganizationLogo", () => {
  it("posts a FormData with the file and returns the url", async () => {
    mockedApi.postForm.mockResolvedValue({ url: "https://cdn/logo.png" });
    const file = new File(["x"], "logo.png");
    const url = await uploadOrganizationLogo(6001, file);
    expect(url).toBe("https://cdn/logo.png");
    const [path, formData] = mockedApi.postForm.mock.calls[0];
    expect(path).toBe("/organizations/6001/logo");
    expect((formData as FormData).get("file")).toBe(file);
  });
});

describe("updateOrganizationTimezone", () => {
  it("patches the timezone settings sub-endpoint", async () => {
    mockedApi.patch.mockResolvedValue(undefined);
    await updateOrganizationTimezone(6001, "Asia/Manila");
    expect(mockedApi.patch).toHaveBeenCalledWith(
      "/organizations/6001/settings/timezone",
      { timezone: "Asia/Manila" },
    );
  });
});

describe("updateOrganizationInviteExpiration", () => {
  it("patches the invite-expiration settings sub-endpoint", async () => {
    mockedApi.patch.mockResolvedValue(undefined);
    await updateOrganizationInviteExpiration(6001, "7d");
    expect(mockedApi.patch).toHaveBeenCalledWith(
      "/organizations/6001/settings/invite-expiration",
      { inviteExpiration: "7d" },
    );
  });
});

describe("updateOrganizationNotifications", () => {
  it("patches the notifications settings sub-endpoint", async () => {
    mockedApi.patch.mockResolvedValue(undefined);
    await updateOrganizationNotifications(6001, false);
    expect(mockedApi.patch).toHaveBeenCalledWith(
      "/organizations/6001/settings/notifications",
      { sendEmailNotif: false },
    );
  });
});

describe("updateOrganizationActiveState", () => {
  it("patches active-state", async () => {
    mockedApi.patch.mockResolvedValue(undefined);
    await updateOrganizationActiveState(6001, false);
    expect(mockedApi.patch).toHaveBeenCalledWith(
      "/organizations/6001/active-state",
      { isActive: false },
    );
  });
});

describe("deleteOrganization", () => {
  it("deletes the given org id", async () => {
    mockedApi.delete.mockResolvedValue(undefined);
    await deleteOrganization(6001);
    expect(mockedApi.delete).toHaveBeenCalledWith("/organizations/6001");
  });
});

describe("requestOwnershipTransfer", () => {
  it("posts the target email", async () => {
    mockedApi.post.mockResolvedValue(undefined);
    await requestOwnershipTransfer(6001, "new-owner@acmestudio.com");
    expect(mockedApi.post).toHaveBeenCalledWith(
      "/organizations/6001/ownership-transfer",
      { email: "new-owner@acmestudio.com" },
    );
  });
});

describe("cancelOwnershipTransfer", () => {
  it("deletes the pending transfer", async () => {
    mockedApi.delete.mockResolvedValue(undefined);
    await cancelOwnershipTransfer(6001);
    expect(mockedApi.delete).toHaveBeenCalledWith(
      "/organizations/6001/ownership-transfer",
    );
  });
});
