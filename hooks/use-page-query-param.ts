"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

/**
 * Same shape as `useState(1)`, but keeps the current page mirrored in the
 * URL as `?page=N` (omitted entirely for page 1) so a reload or a shared
 * link lands back on the same page.
 */
export function usePageQueryParam(
  paramName = "page",
): [number, (page: number) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const fromUrl = Number(searchParams.get(paramName));
  const [page, setPageState] = useState(
    Number.isFinite(fromUrl) && fromUrl > 0 ? fromUrl : 1,
  );

  const setPage = useCallback(
    (next: number) => {
      setPageState(next);

      const params = new URLSearchParams(searchParams.toString());
      if (next <= 1) {
        params.delete(paramName);
      } else {
        params.set(paramName, String(next));
      }

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [router, pathname, searchParams, paramName],
  );

  return [page, setPage];
}
