import { renderHook, act } from "@testing-library/react";
import { useActivityLogQueryState, DEFAULT_PAGE_SIZE } from "./use-activity-log-query-state";
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
const PATH = "/dashboard/organizations/acme-studio/activity-log";

function setup(search = "") {
  mockedUseRouter.mockReturnValue({ replace });
  mockedUsePathname.mockReturnValue(PATH);
  mockedUseSearchParams.mockReturnValue(new URLSearchParams(search));
}

beforeEach(() => jest.clearAllMocks());

it("defaults page/pageSize/filter with no URL params", () => {
  setup();
  const { result } = renderHook(() => useActivityLogQueryState());
  expect(result.current.page).toBe(1);
  expect(result.current.pageSize).toBe(DEFAULT_PAGE_SIZE);
  expect(result.current.filter).toEqual({
    modules: [],
    authorIds: [],
    dateFrom: null,
    dateTo: null,
  });
});

it("reads modules/authors/dates/pageSize from the URL", () => {
  setup("page=2&limit=30&module=ticket,project&author=1,4&dateFrom=2026-01-01&dateTo=2026-01-31");
  const { result } = renderHook(() => useActivityLogQueryState());
  expect(result.current.page).toBe(2);
  expect(result.current.pageSize).toBe(30);
  expect(result.current.filter).toEqual({
    modules: ["ticket", "project"],
    authorIds: [1, 4],
    dateFrom: "2026-01-01",
    dateTo: "2026-01-31",
  });
});

it("filters out an invalid module and a non-finite author id", () => {
  setup("module=ticket,bogus&author=1,abc");
  const { result } = renderHook(() => useActivityLogQueryState());
  expect(result.current.filter.modules).toEqual(["ticket"]);
  expect(result.current.filter.authorIds).toEqual([1]);
});

it("setPage writes ?page= and omits it for page 1", () => {
  setup();
  const { result } = renderHook(() => useActivityLogQueryState());
  act(() => result.current.setPage(3));
  expect(replace).toHaveBeenCalledWith(`${PATH}?page=3`, { scroll: false });
});

it("setFilter resets the page to 1 and writes module/author/date fields", () => {
  setup("page=5");
  const { result } = renderHook(() => useActivityLogQueryState());
  act(() =>
    result.current.setFilter({
      modules: ["ticket"],
      authorIds: [1],
      dateFrom: "2026-01-01",
      dateTo: "2026-01-31",
    }),
  );
  expect(result.current.page).toBe(1);
  const url = replace.mock.calls[0][0];
  expect(url).toContain("module=ticket");
  expect(url).toContain("author=1");
  expect(url).toContain("dateFrom=2026-01-01");
  expect(url).toContain("dateTo=2026-01-31");
});

it("setFilter clears the URL params for an empty filter", () => {
  setup("module=ticket&author=1&dateFrom=2026-01-01&dateTo=2026-01-31");
  const { result } = renderHook(() => useActivityLogQueryState());
  act(() =>
    result.current.setFilter({ modules: [], authorIds: [], dateFrom: null, dateTo: null }),
  );
  expect(replace).toHaveBeenCalledWith(PATH, { scroll: false });
});

it("setPageSize resets the page and omits ?limit= for the default size", () => {
  setup("page=5&limit=30");
  const { result } = renderHook(() => useActivityLogQueryState());
  act(() => result.current.setPageSize(DEFAULT_PAGE_SIZE));
  expect(result.current.page).toBe(1);
  expect(replace).toHaveBeenCalledWith(PATH, { scroll: false });
});

it("setPageSize writes a non-default size", () => {
  setup();
  const { result } = renderHook(() => useActivityLogQueryState());
  act(() => result.current.setPageSize(50));
  expect(replace).toHaveBeenCalledWith(`${PATH}?limit=50`, { scroll: false });
});
