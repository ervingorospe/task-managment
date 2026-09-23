// Thin pass-through to the real backend. No mock data here — every
// function below hits the API in lib/api/ and adapts the response.

import {
  fetchOrganizationDetailBySlug,
  fetchOrganizationDetailById,
} from "@/lib/api/organizations";
import { fetchTicketById } from "@/lib/api/tickets";
import { fetchTicketRequestById } from "@/lib/api/ticket-requests";
import type { TicketDetail } from "../types/ticket/ticket-detail.type";
import type { TicketRequest } from "../types/ticket/ticket-request.type";
import type { OrganizationDetail } from "../types/organization/organization-detail.type";

export async function getOrganizationBySlug(
  slug: string,
): Promise<OrganizationDetail | null> {
  return fetchOrganizationDetailBySlug(slug);
}

export async function getTicketById(id: number): Promise<{
  ticket: TicketDetail;
  organization: OrganizationDetail | null;
} | null> {
  const ticket = await fetchTicketById(id);
  if (!ticket) return null;

  // A personal (org-less) ticket has no organization to fetch — the
  // caller renders a simpler, org-free detail view for these.
  if (ticket.orgId == null) return { ticket, organization: null };

  const organization = await fetchOrganizationDetailById(ticket.orgId);
  if (!organization) return null;

  return { ticket, organization };
}

export async function getTicketRequestById(
  id: number,
): Promise<{ request: TicketRequest; organization: OrganizationDetail } | null> {
  const request = await fetchTicketRequestById(id);
  if (!request) return null;

  const organization = await fetchOrganizationDetailById(request.orgId);
  if (!organization) return null;

  return { request, organization };
}
