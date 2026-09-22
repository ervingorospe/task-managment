import { api, ApiError } from "./client";
import { adaptTicketRequest, adaptTicket } from "./adapters";
import type { TicketRequest } from "@/lib/types/ticket/ticket-request.type";
import type { TicketDetail } from "@/lib/types/ticket/ticket-detail.type";
import type { RawApproveResult, RawTicketRequest } from "./raw-types";

export async function fetchTicketRequestById(
  id: number,
): Promise<TicketRequest | null> {
  try {
    const request = await api.get<RawTicketRequest>(`/ticket-requests/${id}`);
    return adaptTicketRequest(request);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function createTicketRequest(
  orgId: number,
  payload: { clientId: number; title: string; description?: string },
): Promise<TicketRequest> {
  const request = await api.post<RawTicketRequest>(
    `/ticket-requests?orgId=${orgId}`,
    payload,
  );
  return adaptTicketRequest(request);
}

export async function rejectTicketRequest(
  requestId: number,
  remarks: string,
): Promise<TicketRequest> {
  const request = await api.patch<RawTicketRequest>(
    `/ticket-requests/${requestId}/reject`,
    { remarks },
  );
  return adaptTicketRequest(request);
}

export async function cancelTicketRequest(
  requestId: number,
): Promise<TicketRequest> {
  const request = await api.patch<RawTicketRequest>(
    `/ticket-requests/${requestId}/cancel`,
  );
  return adaptTicketRequest(request);
}

export async function approveTicketRequest(
  requestId: number,
  payload: { tagId: number; assigneeIds?: number[]; dueDate?: string },
): Promise<{ request: TicketRequest; ticket: TicketDetail }> {
  const result = await api.post<RawApproveResult>(
    `/ticket-requests/${requestId}/approve`,
    payload,
  );
  return {
    request: adaptTicketRequest(result.request),
    ticket: adaptTicket(result.ticket),
  };
}

/** Every non-deleted request for the org, unpaginated — the ticket-request
 * counterpart to fetchAllTickets(), used by Dashboard/Reports. */
export async function fetchAllTicketRequests(
  orgId: number,
  involvesUserId?: number,
): Promise<TicketRequest[]> {
  const params = new URLSearchParams();
  params.set("orgId", String(orgId));
  if (involvesUserId) params.set("involvesUserId", String(involvesUserId));

  const raw = await api.get<RawTicketRequest[]>(
    `/ticket-requests/all?${params.toString()}`,
  );
  return raw.map(adaptTicketRequest);
}
