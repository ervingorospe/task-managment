"use client";

import { useEffect, useState } from "react";
import { getTicketRequestById } from "@/lib/data/organization-detail";
import type { TicketRequest } from "@/lib/types/ticket/ticket-request.type";
import type { OrganizationDetail } from "@/lib/types/organization/organization-detail.type";

interface Result {
  request: TicketRequest | null;
  organization: OrganizationDetail | null;
  loading: boolean;
  notFound: boolean;
}

/** See use-organization-by-slug.ts for why this has to be a client-side
 * fetch rather than a Server Component one. */
export function useTicketRequestById(requestId: number): Result {
  const [request, setRequest] = useState<TicketRequest | null>(null);
  const [organization, setOrganization] = useState<OrganizationDetail | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    getTicketRequestById(requestId).then((result) => {
      if (cancelled) return;
      if (!result) {
        setNotFound(true);
      } else {
        setRequest(result.request);
        setOrganization(result.organization);
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [requestId]);

  return { request, organization, loading, notFound };
}
