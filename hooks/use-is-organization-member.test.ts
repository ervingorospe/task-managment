import { renderHook } from "@testing-library/react";
import {
  useOrganizationMembershipStatus,
  useIsOrganizationMember,
} from "./use-is-organization-member";
import { useAuth } from "@/providers/auth-provider";

jest.mock("@/providers/auth-provider", () => ({ useAuth: jest.fn() }));

const mockedUseAuth = useAuth as jest.Mock;

function membership(orgId: number, isActive: boolean) {
  return { organization: { id: orgId }, isActive };
}

describe("useOrganizationMembershipStatus", () => {
  it("is 'not-member' when not authenticated", () => {
    mockedUseAuth.mockReturnValue({ currentUser: null, isAuthenticated: false });
    const { result } = renderHook(() => useOrganizationMembershipStatus(6001));
    expect(result.current).toBe("not-member");
  });

  it("is 'not-member' when organizationId is null/undefined", () => {
    mockedUseAuth.mockReturnValue({
      currentUser: { memberships: [] },
      isAuthenticated: true,
    });
    expect(renderHook(() => useOrganizationMembershipStatus(null)).result.current).toBe(
      "not-member",
    );
    expect(
      renderHook(() => useOrganizationMembershipStatus(undefined)).result.current,
    ).toBe("not-member");
  });

  it("is 'not-member' when there's no membership for that org", () => {
    mockedUseAuth.mockReturnValue({
      currentUser: { memberships: [membership(9999, true)] },
      isAuthenticated: true,
    });
    const { result } = renderHook(() => useOrganizationMembershipStatus(6001));
    expect(result.current).toBe("not-member");
  });

  it("is 'deactivated' for an inactive membership", () => {
    mockedUseAuth.mockReturnValue({
      currentUser: { memberships: [membership(6001, false)] },
      isAuthenticated: true,
    });
    const { result } = renderHook(() => useOrganizationMembershipStatus(6001));
    expect(result.current).toBe("deactivated");
  });

  it("is 'active' for an active membership", () => {
    mockedUseAuth.mockReturnValue({
      currentUser: { memberships: [membership(6001, true)] },
      isAuthenticated: true,
    });
    const { result } = renderHook(() => useOrganizationMembershipStatus(6001));
    expect(result.current).toBe("active");
  });
});

describe("useIsOrganizationMember", () => {
  it("is true for any status other than 'not-member'", () => {
    mockedUseAuth.mockReturnValue({
      currentUser: { memberships: [membership(6001, false)] },
      isAuthenticated: true,
    });
    expect(renderHook(() => useIsOrganizationMember(6001)).result.current).toBe(true);
  });

  it("is false for 'not-member'", () => {
    mockedUseAuth.mockReturnValue({ currentUser: null, isAuthenticated: false });
    expect(renderHook(() => useIsOrganizationMember(6001)).result.current).toBe(false);
  });
});
