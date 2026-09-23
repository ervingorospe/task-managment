"use client";

import { useEffect, useState } from "react";
import { useActiveOrganization } from "./use-active-organization";

interface OrgScopedDataResult<T> {
  data: T | null;
  loading: boolean;
  organizationId: number | null;
}

/**
 * Runs `fetcher(orgId)` whenever the active organization changes — this is
 * the piece that makes page content follow the org switcher. Pass extra
 * `deps` for anything else that should also trigger a re-fetch.
 *
 * `orgIdOverride` scopes this to a specific org instead of the topbar's
 * active one — needed by pages that resolve their own org from the URL
 * (e.g. a slug), which isn't necessarily the org currently active in the
 * topbar (it may not even be an org at all, if Personal mode is active).
 * Without this, such a page would silently show the active org's data (or
 * nothing, in Personal mode) instead of the org the URL is actually for.
 */
export function useOrgScopedData<T>(
  fetcher: (orgId: number) => Promise<T>,
  deps: unknown[] = [],
  orgIdOverride?: number,
): OrgScopedDataResult<T> {
  const activeOrganization = useActiveOrganization();
  const orgId = orgIdOverride ?? activeOrganization?.id ?? null;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) {
      setData(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetcher(orgId).then((result) => {
      if (!cancelled) {
        setData(result);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
    // orgId is the actual trigger; fetcher is intentionally excluded since
    // inline fetcher functions get a new identity every render, which
    // would cause an infinite refetch loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, ...deps]);

  return { data, loading, organizationId: orgId };
}
