import { renderHook } from "@testing-library/react";
import { useMembershipBySlug } from "./use-membership-by-slug";
import { useAuth } from "@/providers/auth-provider";

jest.mock("@/providers/auth-provider", () => ({ useAuth: jest.fn() }));

const mockedUseAuth = useAuth as jest.Mock;

function membership(slug: string) {
  return { organization: { settings: { slug } } };
}

it("is null when there's no current user", () => {
  mockedUseAuth.mockReturnValue({ currentUser: null });
  expect(renderHook(() => useMembershipBySlug("acme-studio")).result.current).toBeNull();
});

it("is null when slug is undefined", () => {
  mockedUseAuth.mockReturnValue({ currentUser: { memberships: [membership("acme-studio")] } });
  expect(renderHook(() => useMembershipBySlug(undefined)).result.current).toBeNull();
});

it("finds the membership matching the slug", () => {
  const m = membership("acme-studio");
  mockedUseAuth.mockReturnValue({ currentUser: { memberships: [m, membership("clientco")] } });
  expect(renderHook(() => useMembershipBySlug("acme-studio")).result.current).toBe(m);
});

it("is null when no membership matches the slug", () => {
  mockedUseAuth.mockReturnValue({ currentUser: { memberships: [membership("clientco")] } });
  expect(renderHook(() => useMembershipBySlug("acme-studio")).result.current).toBeNull();
});
