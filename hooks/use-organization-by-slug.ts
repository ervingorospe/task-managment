"use client";

import { useEffect, useState } from "react";
import { getOrganizationBySlug } from "@/lib/data/organization-detail";
import type { OrganizationDetail } from "@/lib/types/organization/organization-detail.type";

interface Result {
  organization: OrganizationDetail | null;
  loading: boolean;
}

/** Client-side fetch for a slug-scoped org's full detail. This can't run
 * as a plain Server Component fetch in production — the session cookie
 * belongs to the backend's own domain (Render), so a browser navigation
 * to the frontend's domain (Vercel) never carries it, and the Next.js
 * server has nothing to forward. Only a real browser fetch (this hook,
 * with credentials: "include") actually sends it. */
export function useOrganizationBySlug(slug: string): Result {
  const [organization, setOrganization] = useState<OrganizationDetail | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getOrganizationBySlug(slug).then((org) => {
      if (!cancelled) {
        setOrganization(org);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { organization, loading };
}
