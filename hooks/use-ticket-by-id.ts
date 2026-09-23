"use client";

import { useEffect, useState } from "react";
import { getTicketById } from "@/lib/data/organization-detail";
import type { TicketDetail } from "@/lib/types/ticket/ticket-detail.type";
import type { OrganizationDetail } from "@/lib/types/organization/organization-detail.type";

interface Result {
  ticket: TicketDetail | null;
  /** Null for a personal (org-less) ticket, same as getTicketById(). */
  organization: OrganizationDetail | null;
  loading: boolean;
  /** True once loading is done and no ticket was found (or the id doesn't
   * resolve to one this user can be told about) — the page calls
   * notFound() itself so the usual not-found.tsx boundary still applies. */
  notFound: boolean;
}

/** See use-organization-by-slug.ts for why this has to be a client-side
 * fetch rather than a Server Component one. */
export function useTicketById(ticketId: number): Result {
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [organization, setOrganization] = useState<OrganizationDetail | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    getTicketById(ticketId).then((result) => {
      if (cancelled) return;
      if (!result) {
        setNotFound(true);
      } else {
        setTicket(result.ticket);
        setOrganization(result.organization);
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [ticketId]);

  return { ticket, organization, loading, notFound };
}
