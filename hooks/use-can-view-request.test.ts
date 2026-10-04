import { renderHook } from "@testing-library/react";
import { useCanViewRequest } from "./use-can-view-request";
import { useAuth } from "@/providers/auth-provider";
import { PERMISSIONS } from "@/lib/data/permissions";

jest.mock("@/providers/auth-provider", () => {
  const actual = jest.requireActual("@/providers/auth-provider");
  return { ...actual, useAuth: jest.fn() };
});

const mockedUseAuth = useAuth as jest.Mock;

function rule(action: string) {
  return { id: 1, action, name: action, desc: "", categoryId: 1 };
}

function membership(rules: ReturnType<typeof rule>[]) {
  return { role: { rules } };
}

const REQUEST = { client: { user: { id: 5 } } };

it("is false when there's no active membership (e.g. Personal mode)", () => {
  mockedUseAuth.mockReturnValue({ currentUser: { id: 5 }, activeMembership: null });
  expect(renderHook(() => useCanViewRequest(REQUEST as never)).result.current).toBe(false);
});

it("is true with any 'all' tier permission, regardless of who the client is", () => {
  mockedUseAuth.mockReturnValue({
    currentUser: { id: 1 },
    activeMembership: membership([rule(PERMISSIONS.REQUEST_ALL_CREATE)]),
  });
  expect(renderHook(() => useCanViewRequest(REQUEST as never)).result.current).toBe(true);
});

it("is false with neither 'all' nor 'own' tier permissions", () => {
  mockedUseAuth.mockReturnValue({
    currentUser: { id: 5 },
    activeMembership: membership([]),
  });
  expect(renderHook(() => useCanViewRequest(REQUEST as never)).result.current).toBe(false);
});

it("with only 'own' tier, is true when the caller is the request's client", () => {
  mockedUseAuth.mockReturnValue({
    currentUser: { id: 5 },
    activeMembership: membership([rule(PERMISSIONS.REQUEST_OWN_CREATE)]),
  });
  expect(renderHook(() => useCanViewRequest(REQUEST as never)).result.current).toBe(true);
});

it("with only 'own' tier, is false when the caller isn't the request's client", () => {
  mockedUseAuth.mockReturnValue({
    currentUser: { id: 999 },
    activeMembership: membership([rule(PERMISSIONS.REQUEST_OWN_CREATE)]),
  });
  expect(renderHook(() => useCanViewRequest(REQUEST as never)).result.current).toBe(false);
});
