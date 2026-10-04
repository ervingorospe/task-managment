import { renderHook, act } from "@testing-library/react";
import { useRequestListQueryState, DEFAULT_PAGE_SIZE } from "./use-request-list-query-state";
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
const PATH = "/dashboard/organizations/acme-studio/requests";

function setup(search = "") {
  mockedUseRouter.mockReturnValue({ replace });
  mockedUsePathname.mockReturnValue(PATH);
  mockedUseSearchParams.mockReturnValue(new URLSearchParams(search));
}

beforeEach(() => jest.clearAllMocks());

it("defaults page/pageSize/filter/search with no URL params", () => {
  setup();
  const { result } = renderHook(() => useRequestListQueryState());
  expect(result.current.page).toBe(1);
  expect(result.current.pageSize).toBe(DEFAULT_PAGE_SIZE);
  expect(result.current.filter).toEqual({ statuses: [], dateFrom: null, dateTo: null });
  expect(result.current.searchInput).toBe("");
});

it("reads statuses/dates/pageSize/search from the URL", () => {
  setup("page=2&limit=30&status=pending,approved&dateFrom=2026-01-01&dateTo=2026-01-31&q=login");
  const { result } = renderHook(() => useRequestListQueryState());
  expect(result.current.page).toBe(2);
  expect(result.current.pageSize).toBe(30);
  expect(result.current.filter).toEqual({
    statuses: ["pending", "approved"],
    dateFrom: "2026-01-01",
    dateTo: "2026-01-31",
  });
  expect(result.current.searchInput).toBe("login");
});

it("filters out an invalid status value", () => {
  setup("status=pending,bogus");
  const { result } = renderHook(() => useRequestListQueryState());
  expect(result.current.filter.statuses).toEqual(["pending"]);
});

it("setPage writes ?page= and omits it for page 1", () => {
  setup();
  const { result } = renderHook(() => useRequestListQueryState());
  act(() => result.current.setPage(3));
  expect(replace).toHaveBeenCalledWith(`${PATH}?page=3`, { scroll: false });
});

it("setFilter resets the page to 1 and writes status/date fields", () => {
  setup("page=5");
  const { result } = renderHook(() => useRequestListQueryState());
  act(() =>
    result.current.setFilter({
      statuses: ["rejected"],
      dateFrom: "2026-01-01",
      dateTo: "2026-01-31",
    }),
  );
  expect(result.current.page).toBe(1);
  const url = replace.mock.calls[0][0];
  expect(url).toContain("status=rejected");
  expect(url).toContain("dateFrom=2026-01-01");
  expect(url).toContain("dateTo=2026-01-31");
});

it("setFilter clears the URL params for an empty filter", () => {
  setup("status=pending&dateFrom=2026-01-01&dateTo=2026-01-31");
  const { result } = renderHook(() => useRequestListQueryState());
  act(() => result.current.setFilter({ statuses: [], dateFrom: null, dateTo: null }));
  expect(replace).toHaveBeenCalledWith(PATH, { scroll: false });
});

it("setPageSize resets the page and omits ?limit= for the default size", () => {
  setup("page=5&limit=30");
  const { result } = renderHook(() => useRequestListQueryState());
  act(() => result.current.setPageSize(DEFAULT_PAGE_SIZE));
  expect(result.current.page).toBe(1);
  expect(replace).toHaveBeenCalledWith(PATH, { scroll: false });
});

it("setPageSize writes a non-default size", () => {
  setup();
  const { result } = renderHook(() => useRequestListQueryState());
  act(() => result.current.setPageSize(50));
  expect(replace).toHaveBeenCalledWith(`${PATH}?limit=50`, { scroll: false });
});

it("setSearchInput resets the page and gates the URL to 3+ characters", () => {
  setup("page=5");
  const { result } = renderHook(() => useRequestListQueryState());
  act(() => result.current.setSearchInput("lo"));
  expect(result.current.page).toBe(1);
  expect(replace).toHaveBeenLastCalledWith(PATH, { scroll: false });
  act(() => result.current.setSearchInput("login"));
  expect(replace).toHaveBeenLastCalledWith(`${PATH}?q=login`, { scroll: false });
});
