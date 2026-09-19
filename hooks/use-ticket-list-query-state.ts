"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { effectiveSearch } from "@/lib/helper/search-query";
import type { TicketFilterState } from "@/components/ticket/ticket-filter-dropdown";

export const DEFAULT_PAGE_SIZE = 15;

function parseIds(value: string | null): number[] {
  if (!value) return [];
  return value
    .split(",")
    .map(Number)
    .filter((n) => Number.isFinite(n));
}

function readFilterFromParams(
  searchParams: URLSearchParams,
): TicketFilterState {
  return {
    tagIds: parseIds(searchParams.get("tag")),
    memberIds: parseIds(searchParams.get("member")),
    dateFrom: searchParams.get("dateFrom"),
    dateTo: searchParams.get("dateTo"),
    overdueOnly: searchParams.get("overdue") === "1",
  };
}

function writeFilterToParams(
  params: URLSearchParams,
  filter: TicketFilterState,
) {
  if (filter.tagIds.length > 0) params.set("tag", filter.tagIds.join(","));
  else params.delete("tag");

  if (filter.memberIds.length > 0)
    params.set("member", filter.memberIds.join(","));
  else params.delete("member");

  if (filter.dateFrom) params.set("dateFrom", filter.dateFrom);
  else params.delete("dateFrom");

  if (filter.dateTo) params.set("dateTo", filter.dateTo);
  else params.delete("dateTo");

  if (filter.overdueOnly) params.set("overdue", "1");
  else params.delete("overdue");
}

interface TicketListQueryState {
  page: number;
  filter: TicketFilterState;
  pageSize: number;
  /** Raw text bound to the search input — updates on every keystroke. */
  searchInput: string;
  /** Gated to the filtering criteria: "" unless searchInput has 3+ characters. */
  search: string;
  setPage: (page: number) => void;
  setFilter: (filter: TicketFilterState) => void;
  setPageSize: (size: number) => void;
  setSearchInput: (value: string) => void;
}

/**
 * Keeps the ticket list's page number (?page=), page size (?limit=), search
 * (?q=) and active filters (?tag=1,2&member=3&dateFrom=...&dateTo=...&overdue=1)
 * mirrored in the URL — the same shape a real paginated API endpoint would
 * take. All of it is written through a single router.replace per update:
 * independent hooks each writing their own slice would race, since each
 * builds its URLSearchParams from the same pre-update snapshot. Changing
 * the filter, page size, or search also resets the page back to 1. Search
 * only takes effect (and only reaches the URL) once it's 3+ characters —
 * below that it's treated as no search at all.
 */
export function useTicketListQueryState(): TicketListQueryState {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const fromUrlPage = Number(searchParams.get("page"));
  const [page, setPageState] = useState(
    Number.isFinite(fromUrlPage) && fromUrlPage > 0 ? fromUrlPage : 1,
  );
  const [filter, setFilterState] = useState<TicketFilterState>(() =>
    readFilterFromParams(searchParams),
  );
  const [searchInput, setSearchInputState] = useState(
    () => searchParams.get("q") ?? "",
  );

  const fromUrlLimit = Number(searchParams.get("limit"));
  const [pageSize, setPageSizeState] = useState(
    Number.isFinite(fromUrlLimit) && fromUrlLimit > 0
      ? fromUrlLimit
      : DEFAULT_PAGE_SIZE,
  );

  const writeUrl = useCallback(
    (
      nextPage: number,
      nextFilter: TicketFilterState,
      nextPageSize: number,
      nextSearch: string,
    ) => {
      const params = new URLSearchParams(searchParams.toString());

      if (nextPage <= 1) params.delete("page");
      else params.set("page", String(nextPage));

      writeFilterToParams(params, nextFilter);

      if (nextPageSize === DEFAULT_PAGE_SIZE) params.delete("limit");
      else params.set("limit", String(nextPageSize));

      if (nextSearch) params.set("q", nextSearch);
      else params.delete("q");

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [router, pathname, searchParams],
  );

  const setPage = useCallback(
    (next: number) => {
      setPageState(next);
      writeUrl(next, filter, pageSize, effectiveSearch(searchInput));
    },
    [writeUrl, filter, pageSize, searchInput],
  );

  const setFilter = useCallback(
    (next: TicketFilterState) => {
      setFilterState(next);
      setPageState(1);
      writeUrl(1, next, pageSize, effectiveSearch(searchInput));
    },
    [writeUrl, pageSize, searchInput],
  );

  const setPageSize = useCallback(
    (next: number) => {
      setPageSizeState(next);
      setPageState(1);
      writeUrl(1, filter, next, effectiveSearch(searchInput));
    },
    [writeUrl, filter, searchInput],
  );

  const setSearchInput = useCallback(
    (next: string) => {
      setSearchInputState(next);
      setPageState(1);
      writeUrl(1, filter, pageSize, effectiveSearch(next));
    },
    [writeUrl, filter, pageSize],
  );

  return {
    page,
    filter,
    pageSize,
    searchInput,
    search: effectiveSearch(searchInput),
    setPage,
    setFilter,
    setPageSize,
    setSearchInput,
  };
}
