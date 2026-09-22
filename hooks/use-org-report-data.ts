"use client";

import { useCallback } from "react";
import { useOrgScopedData } from "./use-org-scope-data";
import { useAuth, usePermission } from "@/providers/auth-provider";
import { PERMISSIONS } from "@/lib/data/permissions";
import { fetchAllTickets } from "@/lib/api/tickets";
import { fetchAllTicketRequests } from "@/lib/api/ticket-requests";
import type { TicketDetail } from "@/lib/types/ticket/ticket-detail.type";
import type { TicketRequest } from "@/lib/types/ticket/ticket-request.type";

interface OrgReportData {
  tickets: TicketDetail[];
  requests: TicketRequest[];
  loading: boolean;
}

/**
 * The full (unpaginated) ticket + request set for the active org, scoped to
 * what the current user is allowed to see — the data source for
 * Dashboard/Reports/TicketReports, which each compute their own flexible
 * client-side aggregations (trend charts, assignee breakdown, month/year
 * comparison) that need row-level data rather than pre-aggregated counts.
 */
export function useOrgReportData(): OrgReportData {
  const { currentUser } = useAuth();
  const canViewAll = usePermission(PERMISSIONS.TICKET_VIEW_ALL);
  // Not knowing the user yet must mean "show nothing" (an id no member can
  // have), never "show everything" — see the equivalent guard on the
  // Tickets list page.
  const involvesUserId = canViewAll ? undefined : (currentUser?.id ?? -1);

  const fetcher = useCallback(
    (orgId: number) =>
      Promise.all([
        fetchAllTickets(orgId, involvesUserId),
        fetchAllTicketRequests(orgId, involvesUserId),
      ]).then(([tickets, requests]) => ({ tickets, requests })),
    [involvesUserId],
  );

  const { data, loading } = useOrgScopedData(fetcher, [involvesUserId]);

  return {
    tickets: data?.tickets ?? [],
    requests: data?.requests ?? [],
    loading,
  };
}
