"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { effectiveSearch } from "@/lib/helper/search-query";
import type { RequestFilterState } from "@/components/organization/requests/request-filter-dropdown";
import type { TicketRequestStatus } from "@/lib/types/ticket/ticket-request.type";

export const DEFAULT_PAGE_SIZE = 15;

const VALID_STATUSES: TicketRequestStatus[] = [
  "pending",
  "approved",
  "rejected",
];

function parseStatuses(value: string | null): TicketRequestStatus[] {
  if (!value) return [];
  return value
    .split(",")
    .filter((s): s is TicketRequestStatus =>
      VALID_STATUSES.includes(s as TicketRequestStatus),
    );
}

function readFilterFromParams(
  searchParams: URLSearchParams,
): RequestFilterState {
  return {
    statuses: parseStatuses(searchParams.get("status")),
    dateFrom: searchParams.get("dateFrom"),
    dateTo: searchParams.get("dateTo"),
  };
}

function writeFilterToParams(
  params: URLSearchParams,
  filter: RequestFilterState,
) {
  if (filter.statuses.length > 0)
    params.set("status", filter.statuses.join(","));
  else params.delete("status");

  if (filter.dateFrom) params.set("dateFrom", filter.dateFrom);
  else params.delete("dateFrom");

  if (filter.dateTo) params.set("dateTo", filter.dateTo);
  else params.delete("dateTo");
}

interface RequestListQueryState {
  page: number;
  filter: RequestFilterState;
  pageSize: number;
  /** Raw text bound to the search input — updates on every keystroke. */
  searchInput: string;
  /** Gated to the filtering criteria: "" unless searchInput has 3+ characters. */
  search: string;
  setPage: (page: number) => void;
  setFilter: (filter: RequestFilterState) => void;
  setPageSize: (size: number) => void;
  setSearchInput: (value: string) => void;
}

/**
 * Keeps the requests list's page number (?page=), page size (?limit=),
 * search (?q=) and active filters (?status=pending,approved&dateFrom=...&dateTo=...)
 * mirrored in the URL. All of it is written through a single router.replace
 * per update — independent hooks each writing their own slice would race,
 * since each builds its URLSearchParams from the same pre-update snapshot.
 * Changing the filter, page size, or search also resets the page back to 1.
 * Search only takes effect (and only reaches the URL) once it's 3+
 * characters — below that it's treated as no search at all.
 */
export function useRequestListQueryState(): RequestListQueryState {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const fromUrlPage = Number(searchParams.get("page"));
  const [page, setPageState] = useState(
    Number.isFinite(fromUrlPage) && fromUrlPage > 0 ? fromUrlPage : 1,
  );
  const [filter, setFilterState] = useState<RequestFilterState>(() =>
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
      nextFilter: RequestFilterState,
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
    (next: RequestFilterState) => {
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
