"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { fetchAllPersonalTickets } from "@/lib/api/tickets";
import type { TicketDetail } from "@/lib/types/ticket/ticket-detail.type";

interface PersonalTicketData {
  tickets: TicketDetail[];
  loading: boolean;
}

/**
 * Same role as useOrgReportData, for Personal mode — the full (unpaginated)
 * set of the current user's own standalone tickets, fed into the same
 * chart/aggregation helpers in lib/helper/ticket-reports.ts. No `requests`
 * here — Requests is an org-only concept.
 */
export function usePersonalTicketData(): PersonalTicketData {
  const { currentUser, isPersonalMode } = useAuth();
  const [tickets, setTickets] = useState<TicketDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isPersonalMode || !currentUser) {
      setTickets([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetchAllPersonalTickets(currentUser.id).then((result) => {
      if (!cancelled) {
        setTickets(result);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isPersonalMode, currentUser]);

  return { tickets, loading };
}
