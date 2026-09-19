"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { effectiveSearch } from "@/lib/helper/search-query";

interface MemberListQueryState {
  page: number;
  /** Raw text bound to the search input — updates on every keystroke. */
  searchInput: string;
  /** Gated to the filtering criteria: "" unless searchInput has 3+ characters. */
  search: string;
  setPage: (page: number) => void;
  setSearchInput: (value: string) => void;
}

/**
 * Keeps the members list's page number (?membersPage=) and search
 * (?membersSearch=) mirrored in the URL, written through a single
 * router.replace per update so the two never race each other. Changing
 * the search also resets the page back to 1. Search only takes effect
 * (and only reaches the URL) once it's 3+ characters — below that it's
 * treated as no search at all.
 */
export function useMemberListQueryState(): MemberListQueryState {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const fromUrlPage = Number(searchParams.get("membersPage"));
  const [page, setPageState] = useState(
    Number.isFinite(fromUrlPage) && fromUrlPage > 0 ? fromUrlPage : 1,
  );
  const [searchInput, setSearchInputState] = useState(
    () => searchParams.get("membersSearch") ?? "",
  );

  const writeUrl = useCallback(
    (nextPage: number, nextSearch: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (nextPage <= 1) params.delete("membersPage");
      else params.set("membersPage", String(nextPage));

      if (nextSearch) params.set("membersSearch", nextSearch);
      else params.delete("membersSearch");

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
      writeUrl(next, effectiveSearch(searchInput));
    },
    [writeUrl, searchInput],
  );

  const setSearchInput = useCallback(
    (next: string) => {
      setSearchInputState(next);
      setPageState(1);
      writeUrl(1, effectiveSearch(next));
    },
    [writeUrl],
  );

  return {
    page,
    searchInput,
    search: effectiveSearch(searchInput),
    setPage,
    setSearchInput,
  };
}
