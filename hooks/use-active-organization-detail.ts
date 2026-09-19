"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { getOrganizationBySlug } from "@/lib/data/organization-detail";
import type { OrganizationDetail } from "@/lib/types/organization/organization-detail.type";

/**
 * Loads the full OrganizationDetail (tickets, requests, tags, members) for
 * whichever org is currently active. `activeOrganization` from useAuth() is
 * only a lightweight subset (for the org switcher), so pages that need the
 * real data — Dashboard, Reports — fetch it client-side through this hook
 * rather than duplicating the fetch effect in each page.
 */
export function useActiveOrganizationDetail(): OrganizationDetail | null {
  const { activeOrganization } = useAuth();
  const [organization, setOrganization] = useState<OrganizationDetail | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;

    if (!activeOrganization) {
      setOrganization(null);
      return;
    }

    getOrganizationBySlug(activeOrganization.settings.slug).then((org) => {
      if (!cancelled) setOrganization(org);
    });

    return () => {
      cancelled = true;
    };
  }, [activeOrganization]);

  return organization;
}
