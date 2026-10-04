import { renderHook, waitFor, act } from "@testing-library/react";
import {
  AuthProvider,
  useAuth,
  hasPermission,
  usePermission,
} from "./auth-provider";
import {
  login as apiLogin,
  logout as apiLogout,
  fetchCurrentUser,
  UnverifiedAccountError,
} from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

jest.mock("@/lib/api/auth", () => {
  const actual = jest.requireActual("@/lib/api/auth");
  return {
    ...actual,
    login: jest.fn(),
    logout: jest.fn(),
    fetchCurrentUser: jest.fn(),
  };
});

const mockedApiLogin = apiLogin as jest.Mock;
const mockedApiLogout = apiLogout as jest.Mock;
const mockedFetchCurrentUser = fetchCurrentUser as jest.Mock;

const STORAGE_KEY = "ticketing_active_org_id";

function role(rules: string[] = []) {
  return {
    id: 1,
    roleName: "Member",
    isDefault: false,
    orgId: 6001,
    isLocked: false,
    isDeleted: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    rules: rules.map((action, i) => ({ id: i + 1, action, name: action, desc: "", categoryId: 1 })),
  };
}

function membership(orgId: number, ruleActions: string[] = []) {
  return {
    id: orgId * 10,
    role: role(ruleActions),
    isActive: true,
    organization: {
      id: orgId,
      organizationName: `Org ${orgId}`,
      ownerId: 1,
      settings: {
        id: orgId,
        slug: `org-${orgId}`,
        timezone: "UTC",
        inviteExpiration: "7d",
        sendEmailNotif: true,
        orgId,
        isActive: true,
        isDeleted: false,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    },
  };
}

function user(overrides: Partial<{ id: number; memberships: ReturnType<typeof membership>[] }> = {}) {
  return {
    id: overrides.id ?? 1,
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@acmestudio.com",
    avatar: null,
    isActive: true,
    isVerified: true,
    hasOnboarded: true,
    hasPassword: true,
    createdViaInvite: false,
    memberships: overrides.memberships ?? [membership(6001)],
  };
}

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  jest.spyOn(console, "error").mockImplementation(() => {});
  mockedFetchCurrentUser.mockResolvedValue(null);
});

afterEach(() => {
  (console.error as jest.Mock).mockRestore();
});

it("throws when used outside an AuthProvider", () => {
  expect(() => renderHook(() => useAuth())).toThrow(
    "useAuth must be used within AuthProvider",
  );
});

describe("session restore on mount", () => {
  it("starts initializing, then settles with no user when the session lookup returns null", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isInitializing).toBe(true);
    await waitFor(() => expect(result.current.isInitializing).toBe(false));
    expect(result.current.currentUser).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("restores the user and defaults to their first membership with no stored org", async () => {
    mockedFetchCurrentUser.mockResolvedValue(user());
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isInitializing).toBe(false));
    expect(result.current.currentUser?.id).toBe(1);
    expect(result.current.activeOrganization?.id).toBe(6001);
  });

  it("restores a stored org id that still matches a membership", async () => {
    localStorage.setItem(STORAGE_KEY, "6002");
    mockedFetchCurrentUser.mockResolvedValue(
      user({ memberships: [membership(6001), membership(6002)] }),
    );
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isInitializing).toBe(false));
    expect(result.current.activeOrganization?.id).toBe(6002);
  });

  it("restores a stored Personal selection", async () => {
    localStorage.setItem(STORAGE_KEY, "personal");
    mockedFetchCurrentUser.mockResolvedValue(user());
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isInitializing).toBe(false));
    expect(result.current.isPersonalMode).toBe(true);
    expect(result.current.activeOrganization).toBeNull();
  });

  it("falls back to the first membership when the stored org id no longer matches any", async () => {
    localStorage.setItem(STORAGE_KEY, "9999");
    mockedFetchCurrentUser.mockResolvedValue(user());
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isInitializing).toBe(false));
    expect(result.current.activeOrganization?.id).toBe(6001);
  });

  it("falls back to Personal mode when the user has no memberships at all", async () => {
    mockedFetchCurrentUser.mockResolvedValue(user({ memberships: [] }));
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isInitializing).toBe(false));
    expect(result.current.isPersonalMode).toBe(true);
  });

  it("logs an error but still finishes initializing when the session lookup fails", async () => {
    mockedFetchCurrentUser.mockRejectedValue(new Error("network down"));
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isInitializing).toBe(false));
    expect(console.error).toHaveBeenCalledWith("Session restore failed", expect.any(Error));
    expect(result.current.currentUser).toBeNull();
  });

  it("discards a stale session-restore response after unmounting", async () => {
    let resolveFetch: (v: unknown) => void;
    mockedFetchCurrentUser.mockImplementation(
      () => new Promise((resolve) => (resolveFetch = resolve)),
    );
    const { unmount } = renderHook(() => useAuth(), { wrapper });
    unmount();
    resolveFetch!(user());
    await new Promise((r) => setTimeout(r, 0));
  });
});

describe("login", () => {
  it("logs in, sets the current user, and stores the resolved active org", async () => {
    mockedApiLogin.mockResolvedValue(user());
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isInitializing).toBe(false));

    let loginResult: Awaited<ReturnType<typeof result.current.login>>;
    await act(async () => {
      loginResult = await result.current.login("  jane@acmestudio.com  ", "123");
    });

    expect(mockedApiLogin).toHaveBeenCalledWith("jane@acmestudio.com", "123");
    expect(loginResult!.success).toBe(true);
    expect(result.current.currentUser?.id).toBe(1);
    expect(localStorage.getItem(STORAGE_KEY)).toBe("6001");
  });

  it("returns needsVerification for an UnverifiedAccountError", async () => {
    mockedApiLogin.mockRejectedValue(new UnverifiedAccountError("jane@acmestudio.com"));
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isInitializing).toBe(false));

    let loginResult: Awaited<ReturnType<typeof result.current.login>>;
    await act(async () => {
      loginResult = await result.current.login("jane@acmestudio.com", "123");
    });

    expect(loginResult!).toEqual({
      success: false,
      needsVerification: true,
      error: expect.any(String),
    });
    expect(result.current.currentUser).toBeNull();
  });

  it("returns the ApiError's own message for a plain login failure (e.g. wrong password)", async () => {
    mockedApiLogin.mockRejectedValue(new ApiError(401, { message: "Wrong password" }));
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isInitializing).toBe(false));

    let loginResult: Awaited<ReturnType<typeof result.current.login>>;
    await act(async () => {
      loginResult = await result.current.login("jane@acmestudio.com", "wrong");
    });

    expect(loginResult!).toEqual({ success: false, error: "Wrong password" });
  });

  it("returns a generic message for a network failure", async () => {
    mockedApiLogin.mockRejectedValue(new TypeError("Failed to fetch"));
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isInitializing).toBe(false));

    let loginResult: Awaited<ReturnType<typeof result.current.login>>;
    await act(async () => {
      loginResult = await result.current.login("jane@acmestudio.com", "123");
    });

    expect(loginResult!.success).toBe(false);
    expect(loginResult!.error).toBe("Couldn't reach the backend. Is it running?");
    expect(console.error).toHaveBeenCalledWith("Login failed", expect.any(Error));
  });
});

describe("logout", () => {
  it("clears the current user and stored active org", async () => {
    mockedApiLogin.mockResolvedValue(user());
    mockedApiLogout.mockResolvedValue(undefined);
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isInitializing).toBe(false));
    await act(async () => {
      await result.current.login("jane@acmestudio.com", "123");
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(mockedApiLogout).toHaveBeenCalled();
    expect(result.current.currentUser).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("still clears local state even if the logout request fails", async () => {
    mockedApiLogin.mockResolvedValue(user());
    mockedApiLogout.mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isInitializing).toBe(false));
    await act(async () => {
      await result.current.login("jane@acmestudio.com", "123");
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(console.error).toHaveBeenCalledWith("Logout request failed", expect.any(Error));
    expect(result.current.currentUser).toBeNull();
  });
});

describe("updateProfile", () => {
  it("patches the current user's fields", async () => {
    mockedFetchCurrentUser.mockResolvedValue(user());
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.currentUser).not.toBeNull());

    act(() => result.current.updateProfile({ firstName: "Janet" }));
    expect(result.current.currentUser?.firstName).toBe("Janet");
  });

  it("no-ops when there's no current user", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isInitializing).toBe(false));
    act(() => result.current.updateProfile({ firstName: "Janet" }));
    expect(result.current.currentUser).toBeNull();
  });
});

describe("switchOrganization", () => {
  it("no-ops when there's no current user", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isInitializing).toBe(false));
    act(() => result.current.switchOrganization(6001));
    expect(result.current.activeOrganization).toBeNull();
  });

  it("switches to Personal mode", async () => {
    mockedFetchCurrentUser.mockResolvedValue(user());
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.currentUser).not.toBeNull());

    act(() => result.current.switchOrganization("personal"));
    expect(result.current.isPersonalMode).toBe(true);
    expect(localStorage.getItem(STORAGE_KEY)).toBe("personal");
  });

  it("switches to a different org the user belongs to", async () => {
    mockedFetchCurrentUser.mockResolvedValue(
      user({ memberships: [membership(6001), membership(6002)] }),
    );
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.activeOrganization?.id).toBe(6001));

    act(() => result.current.switchOrganization(6002));
    expect(result.current.activeOrganization?.id).toBe(6002);
    expect(localStorage.getItem(STORAGE_KEY)).toBe("6002");
  });

  it("ignores a switch to an org the user doesn't belong to", async () => {
    mockedFetchCurrentUser.mockResolvedValue(user());
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.activeOrganization?.id).toBe(6001));

    act(() => result.current.switchOrganization(9999));
    expect(result.current.activeOrganization?.id).toBe(6001);
  });
});

describe("removeMembership", () => {
  it("drops the membership from the current user's list", async () => {
    mockedFetchCurrentUser.mockResolvedValue(
      user({ memberships: [membership(6001), membership(6002)] }),
    );
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.currentUser).not.toBeNull());

    act(() => result.current.removeMembership(6002));
    expect(result.current.currentUser?.memberships.map((m) => m.organization.id)).toEqual([
      6001,
    ]);
  });

  it("no-ops when there's no current user", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isInitializing).toBe(false));
    act(() => result.current.removeMembership(6001));
    expect(result.current.currentUser).toBeNull();
  });

  it("falls back to the next remaining membership once the active one is removed", async () => {
    mockedFetchCurrentUser.mockResolvedValue(
      user({ memberships: [membership(6001), membership(6002)] }),
    );
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.activeOrganization?.id).toBe(6001));

    act(() => result.current.removeMembership(6001));
    expect(result.current.activeOrganization?.id).toBe(6002);
  });
});

describe("refreshCurrentUser", () => {
  it("replaces the current user when a session is found", async () => {
    mockedFetchCurrentUser.mockResolvedValue(user());
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.currentUser).not.toBeNull());

    mockedFetchCurrentUser.mockResolvedValue(user({ id: 2 }));
    await act(async () => {
      await result.current.refreshCurrentUser();
    });
    expect(result.current.currentUser?.id).toBe(2);
  });

  it("leaves the current user untouched when the session lookup returns null", async () => {
    mockedFetchCurrentUser.mockResolvedValue(user());
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.currentUser).not.toBeNull());

    mockedFetchCurrentUser.mockResolvedValue(null);
    await act(async () => {
      await result.current.refreshCurrentUser();
    });
    expect(result.current.currentUser?.id).toBe(1);
  });
});

describe("hasPermission", () => {
  it("is true when a rule with that action exists", () => {
    expect(hasPermission([{ id: 1, action: "ticket.view.all", name: "x", desc: "", categoryId: 1 }], "ticket.view.all")).toBe(
      true,
    );
  });

  it("is false when no rule matches", () => {
    expect(hasPermission([], "ticket.view.all")).toBe(false);
  });
});

describe("usePermission", () => {
  function usePermissionWrapper() {
    const auth = useAuth();
    const canViewAll = usePermission("ticket.view.all");
    return { ...auth, canViewAll };
  }

  it("is false with no active membership (never logged in, not Personal mode)", async () => {
    const { result } = renderHook(() => usePermissionWrapper(), { wrapper });
    await waitFor(() => expect(result.current.isInitializing).toBe(false));
    expect(result.current.canViewAll).toBe(false);
  });

  it("delegates to hasPermission when the active membership lacks the rule", async () => {
    mockedFetchCurrentUser.mockResolvedValue(user({ memberships: [membership(6001, [])] }));
    const { result } = renderHook(() => usePermissionWrapper(), { wrapper });
    await waitFor(() => expect(result.current.currentUser).not.toBeNull());
    expect(result.current.canViewAll).toBe(false);
  });

  it("delegates to hasPermission when the active membership has the rule", async () => {
    mockedFetchCurrentUser.mockResolvedValue(
      user({ memberships: [membership(6001, ["ticket.view.all"])] }),
    );
    const { result } = renderHook(() => usePermissionWrapper(), { wrapper });
    await waitFor(() => expect(result.current.canViewAll).toBe(true));
  });

  it("is always true in Personal mode, regardless of any org's rules", async () => {
    mockedFetchCurrentUser.mockResolvedValue(user({ memberships: [membership(6001, [])] }));
    const { result } = renderHook(() => usePermissionWrapper(), { wrapper });
    await waitFor(() => expect(result.current.currentUser).not.toBeNull());
    expect(result.current.canViewAll).toBe(false);

    act(() => result.current.switchOrganization("personal"));
    await waitFor(() => expect(result.current.isPersonalMode).toBe(true));
    expect(result.current.canViewAll).toBe(true);
  });
});
