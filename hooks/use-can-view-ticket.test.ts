import { renderHook } from "@testing-library/react";
import { useCanViewTicket } from "./use-can-view-ticket";
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

const TICKET = { client: null, assignees: [{ user: { id: 5 } }] } as never;

it("is false when there's no active membership", () => {
  mockedUseAuth.mockReturnValue({ currentUser: { id: 5 }, activeMembership: null });
  expect(renderHook(() => useCanViewTicket(TICKET)).result.current).toBe(false);
});

it("is true with ticket.view.all regardless of involvement", () => {
  mockedUseAuth.mockReturnValue({
    currentUser: { id: 1 },
    activeMembership: membership([rule(PERMISSIONS.TICKET_VIEW_ALL)]),
  });
  expect(renderHook(() => useCanViewTicket(TICKET)).result.current).toBe(true);
});

it("is false with neither view permission", () => {
  mockedUseAuth.mockReturnValue({
    currentUser: { id: 5 },
    activeMembership: membership([]),
  });
  expect(renderHook(() => useCanViewTicket(TICKET)).result.current).toBe(false);
});

it("with only ticket.view.included, is true when the caller is included", () => {
  mockedUseAuth.mockReturnValue({
    currentUser: { id: 5 },
    activeMembership: membership([rule(PERMISSIONS.TICKET_VIEW_INCLUDED)]),
  });
  expect(renderHook(() => useCanViewTicket(TICKET)).result.current).toBe(true);
});

it("with only ticket.view.included, is false when the caller isn't included", () => {
  mockedUseAuth.mockReturnValue({
    currentUser: { id: 999 },
    activeMembership: membership([rule(PERMISSIONS.TICKET_VIEW_INCLUDED)]),
  });
  expect(renderHook(() => useCanViewTicket(TICKET)).result.current).toBe(false);
});
