import { renderHook } from "@testing-library/react";
import { useActiveOrganization } from "./use-active-organization";
import { useAuth } from "@/providers/auth-provider";

jest.mock("@/providers/auth-provider", () => ({ useAuth: jest.fn() }));

const mockedUseAuth = useAuth as jest.Mock;

it("returns the active membership's organization", () => {
  const org = { id: 6001, organizationName: "Acme Studio" };
  mockedUseAuth.mockReturnValue({ activeMembership: { organization: org } });
  expect(renderHook(() => useActiveOrganization()).result.current).toBe(org);
});

it("returns null when there's no active membership (e.g. Personal mode)", () => {
  mockedUseAuth.mockReturnValue({ activeMembership: null });
  expect(renderHook(() => useActiveOrganization()).result.current).toBeNull();
});
