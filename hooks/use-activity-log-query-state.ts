"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { ACTIVITY_MODULES } from "@/lib/helper/activity-log";
import type { ActivityFilterState } from "@/components/activity/activity-filter-dropdown";
import type { ActivityModule } from "@/lib/types/activity/activity-log-entry.type";

export const DEFAULT_PAGE_SIZE = 15;

function parseModules(value: string | null): ActivityModule[] {
  if (!value) return [];
  return value
    .split(",")
    .filter((m): m is ActivityModule =>
      ACTIVITY_MODULES.includes(m as ActivityModule),
    );
}

function parseAuthorIds(value: string | null): number[] {
  if (!value) return [];
  return value
    .split(",")
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id));
}

function readFilterFromParams(
  searchParams: URLSearchParams,
): ActivityFilterState {
  return {
    modules: parseModules(searchParams.get("module")),
    authorIds: parseAuthorIds(searchParams.get("author")),
    dateFrom: searchParams.get("dateFrom"),
    dateTo: searchParams.get("dateTo"),
  };
}

function writeFilterToParams(
  params: URLSearchParams,
  filter: ActivityFilterState,
) {
  if (filter.modules.length > 0)
    params.set("module", filter.modules.join(","));
  else params.delete("module");

  if (filter.authorIds.length > 0)
    params.set("author", filter.authorIds.join(","));
  else params.delete("author");

  if (filter.dateFrom) params.set("dateFrom", filter.dateFrom);
  else params.delete("dateFrom");

  if (filter.dateTo) params.set("dateTo", filter.dateTo);
  else params.delete("dateTo");
}

interface ActivityLogQueryState {
  page: number;
  filter: ActivityFilterState;
  pageSize: number;
  setPage: (page: number) => void;
  setFilter: (filter: ActivityFilterState) => void;
  setPageSize: (size: number) => void;
}

/**
 * Keeps the activity log's page (?page=), page size (?limit=), and active
 * filters (?module=ticket,request&author=1,4&dateFrom=...&dateTo=...)
 * mirrored in the URL — same combined-hook pattern as the ticket/request
 * list pages, writing everything through a single router.replace per
 * update so independent slices can't race each other.
 */
export function useActivityLogQueryState(): ActivityLogQueryState {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const fromUrlPage = Number(searchParams.get("page"));
  const [page, setPageState] = useState(
    Number.isFinite(fromUrlPage) && fromUrlPage > 0 ? fromUrlPage : 1,
  );
  const [filter, setFilterState] = useState<ActivityFilterState>(() =>
    readFilterFromParams(searchParams),
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
      nextFilter: ActivityFilterState,
      nextPageSize: number,
    ) => {
      const params = new URLSearchParams(searchParams.toString());

      if (nextPage <= 1) params.delete("page");
      else params.set("page", String(nextPage));

      writeFilterToParams(params, nextFilter);

      if (nextPageSize === DEFAULT_PAGE_SIZE) params.delete("limit");
      else params.set("limit", String(nextPageSize));

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
      writeUrl(next, filter, pageSize);
    },
    [writeUrl, filter, pageSize],
  );

  const setFilter = useCallback(
    (next: ActivityFilterState) => {
      setFilterState(next);
      setPageState(1);
      writeUrl(1, next, pageSize);
    },
    [writeUrl, pageSize],
  );

  const setPageSize = useCallback(
    (next: number) => {
      setPageSizeState(next);
      setPageState(1);
      writeUrl(1, filter, next);
    },
    [writeUrl, filter],
  );

  return {
    page,
    filter,
    pageSize,
    setPage,
    setFilter,
    setPageSize,
  };
}
