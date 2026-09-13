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
 */
export function useOrgScopedData<T>(
  fetcher: (orgId: number) => Promise<T>,
  deps: unknown[] = [],
): OrgScopedDataResult<T> {
  const organization = useActiveOrganization();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organization) {
      setData(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetcher(organization.id).then((result) => {
      if (!cancelled) {
        setData(result);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
    // organization?.id is the actual trigger; fetcher is intentionally
    // excluded since inline fetcher functions get a new identity every
    // render, which would cause an infinite refetch loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization?.id, ...deps]);

  return { data, loading, organizationId: organization?.id ?? null };
}
