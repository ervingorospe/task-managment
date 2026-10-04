import { renderHook } from "@testing-library/react";
import { useIsOrganizationOwner } from "./use-is-organization-owner";
import { useAuth } from "@/providers/auth-provider";

jest.mock("@/providers/auth-provider", () => ({ useAuth: jest.fn() }));

const mockedUseAuth = useAuth as jest.Mock;

it("is false when not authenticated", () => {
  mockedUseAuth.mockReturnValue({ currentUser: null, isAuthenticated: false });
  expect(renderHook(() => useIsOrganizationOwner(1)).result.current).toBe(false);
});

it("is false when ownerId is null/undefined", () => {
  mockedUseAuth.mockReturnValue({ currentUser: { id: 1 }, isAuthenticated: true });
  expect(renderHook(() => useIsOrganizationOwner(null)).result.current).toBe(false);
  expect(renderHook(() => useIsOrganizationOwner(undefined)).result.current).toBe(false);
});

it("is true when the current user's id matches ownerId", () => {
  mockedUseAuth.mockReturnValue({ currentUser: { id: 1 }, isAuthenticated: true });
  expect(renderHook(() => useIsOrganizationOwner(1)).result.current).toBe(true);
});

it("is false when the current user's id doesn't match ownerId", () => {
  mockedUseAuth.mockReturnValue({ currentUser: { id: 2 }, isAuthenticated: true });
  expect(renderHook(() => useIsOrganizationOwner(1)).result.current).toBe(false);
});
