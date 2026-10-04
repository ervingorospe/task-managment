import {
  signup,
  login,
  logout,
  fetchCurrentUser,
  resendVerification,
  completeOnboarding,
  getInvite,
  acceptInvite,
  declineInvite,
  UnverifiedAccountError,
} from "./auth";
import { api, ApiError } from "./client";
import type { RawCurrentUser } from "./raw-types";

jest.mock("./client", () => {
  const actual = jest.requireActual("./client");
  return {
    ...actual,
    api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
  };
});

const mockedApi = api as jest.Mocked<typeof api>;

const RAW_USER = {
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

const RAW_CURRENT_USER: RawCurrentUser = {
  ...RAW_USER,
  hasPassword: true,
  createdViaInvite: false,
  memberships: [],
} as unknown as RawCurrentUser;

beforeEach(() => jest.clearAllMocks());

describe("signup", () => {
  it("posts the signup payload", async () => {
    mockedApi.post.mockResolvedValue(undefined);
    const payload = {
      email: "jane@acmestudio.com",
      firstName: "Jane",
      lastName: "Doe",
      password: "x",
      confirmPassword: "x",
    };
    await signup(payload);
    expect(mockedApi.post).toHaveBeenCalledWith("/auth/signup", payload);
  });
});

describe("login", () => {
  it("returns the adapted current user on success", async () => {
    mockedApi.post.mockResolvedValue(RAW_CURRENT_USER);
    const user = await login("jane@acmestudio.com", "123");
    expect(mockedApi.post).toHaveBeenCalledWith("/auth/login", {
      email: "jane@acmestudio.com",
      password: "123",
    });
    expect(user.id).toBe(1);
  });

  it("throws UnverifiedAccountError for an UNVERIFIED ApiError", async () => {
    mockedApi.post.mockRejectedValue(new ApiError(403, { code: "UNVERIFIED" }));
    await expect(login("jane@acmestudio.com", "123")).rejects.toThrow(
      UnverifiedAccountError,
    );
  });

  it("rethrows a plain ApiError untouched", async () => {
    mockedApi.post.mockRejectedValue(new ApiError(401, { message: "Wrong password" }));
    await expect(login("jane@acmestudio.com", "wrong")).rejects.toThrow(
      "Wrong password",
    );
  });
});

describe("logout", () => {
  it("posts to /auth/logout", async () => {
    mockedApi.post.mockResolvedValue(undefined);
    await logout();
    expect(mockedApi.post).toHaveBeenCalledWith("/auth/logout");
  });
});

describe("fetchCurrentUser", () => {
  it("returns the adapted user when logged in", async () => {
    mockedApi.get.mockResolvedValue(RAW_CURRENT_USER);
    const user = await fetchCurrentUser();
    expect(user?.id).toBe(1);
  });

  it("returns null on a 401", async () => {
    mockedApi.get.mockRejectedValue(new ApiError(401, null));
    expect(await fetchCurrentUser()).toBeNull();
  });

  it("rethrows any other error", async () => {
    mockedApi.get.mockRejectedValue(new ApiError(500, null));
    await expect(fetchCurrentUser()).rejects.toThrow();
  });
});

describe("resendVerification", () => {
  it("posts the email", async () => {
    mockedApi.post.mockResolvedValue(undefined);
    await resendVerification("jane@acmestudio.com");
    expect(mockedApi.post).toHaveBeenCalledWith("/auth/resend-verification", {
      email: "jane@acmestudio.com",
    });
  });
});

describe("completeOnboarding", () => {
  it("patches /auth/onboarding", async () => {
    mockedApi.patch.mockResolvedValue(undefined);
    await completeOnboarding();
    expect(mockedApi.patch).toHaveBeenCalledWith("/auth/onboarding");
  });
});

describe("getInvite", () => {
  it("URL-encodes the token", async () => {
    mockedApi.get.mockResolvedValue({
      email: "alex@clientco.com",
      organizationName: "Acme Studio",
      roleName: "Client",
      requiresPassword: true,
    });
    await getInvite("a b/c");
    expect(mockedApi.get).toHaveBeenCalledWith("/auth/invite/a%20b%2Fc");
  });
});

describe("acceptInvite", () => {
  it("posts the payload and returns the adapted user", async () => {
    mockedApi.post.mockResolvedValue(RAW_CURRENT_USER);
    const payload = { token: "abc" };
    const user = await acceptInvite(payload);
    expect(mockedApi.post).toHaveBeenCalledWith("/auth/accept-invite", payload);
    expect(user.id).toBe(1);
  });
});

describe("declineInvite", () => {
  it("posts the token", async () => {
    mockedApi.post.mockResolvedValue(undefined);
    await declineInvite("abc");
    expect(mockedApi.post).toHaveBeenCalledWith("/auth/decline-invite", {
      token: "abc",
    });
  });
});
