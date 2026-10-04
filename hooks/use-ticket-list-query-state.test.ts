import { renderHook, act } from "@testing-library/react";
import { useTicketListQueryState, DEFAULT_PAGE_SIZE } from "./use-ticket-list-query-state";
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
const PATH = "/dashboard/organizations/acme-studio/tickets";

function setup(search = "") {
  mockedUseRouter.mockReturnValue({ replace });
  mockedUsePathname.mockReturnValue(PATH);
  mockedUseSearchParams.mockReturnValue(new URLSearchParams(search));
}

beforeEach(() => jest.clearAllMocks());

it("defaults page/pageSize/filter/search with no URL params", () => {
  setup();
  const { result } = renderHook(() => useTicketListQueryState());
  expect(result.current.page).toBe(1);
  expect(result.current.pageSize).toBe(DEFAULT_PAGE_SIZE);
  expect(result.current.filter).toEqual({
    tagIds: [],
    memberIds: [],
    dateFrom: null,
    dateTo: null,
    overdueOnly: false,
  });
  expect(result.current.searchInput).toBe("");
});

it("reads every filter field and pageSize from the URL", () => {
  setup("page=2&limit=30&tag=1,2&member=5&dateFrom=2026-01-01&dateTo=2026-01-31&overdue=1&q=login");
  const { result } = renderHook(() => useTicketListQueryState());
  expect(result.current.page).toBe(2);
  expect(result.current.pageSize).toBe(30);
  expect(result.current.filter).toEqual({
    tagIds: [1, 2],
    memberIds: [5],
    dateFrom: "2026-01-01",
    dateTo: "2026-01-31",
    overdueOnly: true,
  });
  expect(result.current.searchInput).toBe("login");
});

it("ignores non-finite ids in the tag/member lists", () => {
  setup("tag=1,abc,2");
  const { result } = renderHook(() => useTicketListQueryState());
  expect(result.current.filter.tagIds).toEqual([1, 2]);
});

it("setPage writes ?page= and omits it for page 1", () => {
  setup();
  const { result } = renderHook(() => useTicketListQueryState());
  act(() => result.current.setPage(3));
  expect(replace).toHaveBeenCalledWith(`${PATH}?page=3`, { scroll: false });
});

it("setFilter resets the page to 1 and writes every filter field", () => {
  setup("page=5");
  const { result } = renderHook(() => useTicketListQueryState());
  act(() =>
    result.current.setFilter({
      tagIds: [1],
      memberIds: [2],
      dateFrom: "2026-01-01",
      dateTo: "2026-01-31",
      overdueOnly: true,
    }),
  );
  expect(result.current.page).toBe(1);
  const url = replace.mock.calls[0][0];
  expect(url).toContain("tag=1");
  expect(url).toContain("member=2");
  expect(url).toContain("dateFrom=2026-01-01");
  expect(url).toContain("dateTo=2026-01-31");
  expect(url).toContain("overdue=1");
  expect(url).not.toContain("page=");
});

it("setFilter clears the URL params for an empty filter", () => {
  setup("tag=1&member=2&dateFrom=2026-01-01&dateTo=2026-01-31&overdue=1");
  const { result } = renderHook(() => useTicketListQueryState());
  act(() =>
    result.current.setFilter({
      tagIds: [],
      memberIds: [],
      dateFrom: null,
      dateTo: null,
      overdueOnly: false,
    }),
  );
  expect(replace).toHaveBeenCalledWith(PATH, { scroll: false });
});

it("setPageSize resets the page to 1 and omits ?limit= for the default size", () => {
  setup("page=5&limit=30");
  const { result } = renderHook(() => useTicketListQueryState());
  act(() => result.current.setPageSize(DEFAULT_PAGE_SIZE));
  expect(result.current.page).toBe(1);
  expect(replace).toHaveBeenCalledWith(PATH, { scroll: false });
});

it("setPageSize writes a non-default size", () => {
  setup();
  const { result } = renderHook(() => useTicketListQueryState());
  act(() => result.current.setPageSize(50));
  expect(replace).toHaveBeenCalledWith(`${PATH}?limit=50`, { scroll: false });
});

it("setSearchInput resets the page and gates the URL to 3+ characters", () => {
  setup("page=5");
  const { result } = renderHook(() => useTicketListQueryState());

  act(() => result.current.setSearchInput("lo"));
  expect(result.current.page).toBe(1);
  expect(replace).toHaveBeenLastCalledWith(PATH, { scroll: false });

  act(() => result.current.setSearchInput("login"));
  expect(replace).toHaveBeenLastCalledWith(`${PATH}?q=login`, { scroll: false });
});
