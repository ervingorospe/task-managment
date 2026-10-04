import { renderHook, act } from "@testing-library/react";
import { useMemberListQueryState } from "./use-member-list-query-state";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}));

const mockedUseRouter = useRouter as jest.Mock;
const mockedUsePathname = usePathname as jest.Mock;
const mockedUseSearchParams = useSearchParams as jest.Mock;

const replace = jest.fn();

function setup(search = "") {
  mockedUseRouter.mockReturnValue({ replace });
  mockedUsePathname.mockReturnValue("/dashboard/organizations/acme-studio/members");
  mockedUseSearchParams.mockReturnValue(new URLSearchParams(search));
}

beforeEach(() => jest.clearAllMocks());

it("defaults page to 1 and search to '' with no URL params", () => {
  setup();
  const { result } = renderHook(() => useMemberListQueryState());
  expect(result.current.page).toBe(1);
  expect(result.current.searchInput).toBe("");
  expect(result.current.search).toBe("");
});

it("reads an initial page and search from the URL", () => {
  setup("membersPage=3&membersSearch=jane");
  const { result } = renderHook(() => useMemberListQueryState());
  expect(result.current.page).toBe(3);
  expect(result.current.searchInput).toBe("jane");
});

it("ignores a non-finite or non-positive page param", () => {
  setup("membersPage=abc");
  const { result } = renderHook(() => useMemberListQueryState());
  expect(result.current.page).toBe(1);
});

it("setPage writes ?membersPage= and omits it for page 1", () => {
  setup();
  const { result } = renderHook(() => useMemberListQueryState());

  act(() => result.current.setPage(2));
  expect(replace).toHaveBeenCalledWith(
    "/dashboard/organizations/acme-studio/members?membersPage=2",
    { scroll: false },
  );

  act(() => result.current.setPage(1));
  expect(replace).toHaveBeenLastCalledWith(
    "/dashboard/organizations/acme-studio/members",
    { scroll: false },
  );
});

it("setSearchInput resets the page to 1 and gates the URL to 3+ characters", () => {
  setup("membersPage=3");
  const { result } = renderHook(() => useMemberListQueryState());

  act(() => result.current.setSearchInput("ja"));
  expect(result.current.searchInput).toBe("ja");
  expect(result.current.search).toBe("");
  expect(result.current.page).toBe(1);
  // Below the 3-char threshold — no membersSearch param written.
  expect(replace).toHaveBeenLastCalledWith(
    "/dashboard/organizations/acme-studio/members",
    { scroll: false },
  );

  act(() => result.current.setSearchInput("jane"));
  expect(result.current.search).toBe("jane");
  expect(replace).toHaveBeenLastCalledWith(
    "/dashboard/organizations/acme-studio/members?membersSearch=jane",
    { scroll: false },
  );
});

it("preserves unrelated existing search params when writing the URL", () => {
  setup("foo=bar");
  const { result } = renderHook(() => useMemberListQueryState());
  act(() => result.current.setPage(2));
  expect(replace).toHaveBeenCalledWith(
    expect.stringContaining("foo=bar"),
    { scroll: false },
  );
});
