import { api, ApiError } from "./client";
import { adaptTicket, adaptComment, adaptAttachment } from "./adapters";
import type { TicketDetail, TicketAttachment } from "@/lib/types/ticket/ticket-detail.type";
import type { TicketComment } from "@/lib/types/ticket/ticket-comment.type";
import type { RawTicket, RawTicketComment, RawTicketAttachment, RawPage } from "./raw-types";

export interface TicketsPageQuery {
  page: number;
  limit: number;
  search?: string;
  /** Tag ids plus the literals "overdue" and "starred". */
  filterBy?: (number | "overdue" | "starred")[];
  memberIds?: number[];
  dueDateFrom?: string;
  dueDateTo?: string;
  /** Restricts to tickets where this user is the client or an assignee. */
  involvesUserId?: number;
}

function buildTicketsQuery(orgId: number, query: TicketsPageQuery): string {
  const params = new URLSearchParams();
  params.set("orgId", String(orgId));
  params.set("page", String(query.page));
  params.set("limit", String(query.limit));
  if (query.search) params.set("search", query.search);
  if (query.dueDateFrom) params.set("dueDateFrom", query.dueDateFrom);
  if (query.dueDateTo) params.set("dueDateTo", query.dueDateTo);
  if (query.involvesUserId) params.set("involvesUserId", String(query.involvesUserId));
  for (const value of query.filterBy ?? []) params.append("filterBy", String(value));
  for (const id of query.memberIds ?? []) params.append("memberIds", String(id));
  return params.toString();
}

export interface TicketsPage {
  items: TicketDetail[];
  total: number;
  page: number;
  limit: number;
}

export async function fetchTicketsPage(
  orgId: number,
  query: TicketsPageQuery,
): Promise<TicketsPage> {
  const raw = await api.get<RawPage<RawTicket>>(
    `/tickets?${buildTicketsQuery(orgId, query)}`,
  );
  return { ...raw, items: raw.items.map(adaptTicket) };
}

export interface TicketCountNumbers {
  totalTickets: number;
  overdues: number;
  onTime: number;
  countPerTag: { tagId: number; tagName: string; color: string; count: number }[];
}

/**
 * Every non-deleted ticket for the org, unpaginated — for Dashboard/Reports,
 * which compute flexible client-side aggregations (trend charts, month/year
 * comparison, assignee breakdown) that need row-level data, not just counts.
 */
export async function fetchAllTickets(
  orgId: number,
  involvesUserId?: number,
): Promise<TicketDetail[]> {
  const params = new URLSearchParams();
  params.set("orgId", String(orgId));
  if (involvesUserId) params.set("involvesUserId", String(involvesUserId));

  const raw = await api.get<RawTicket[]>(`/tickets/all?${params.toString()}`);
  return raw.map(adaptTicket);
}

export async function fetchTicketCountNumbers(
  orgId: number,
  options?: {
    filterBy?: (number | "overdue" | "starred")[];
    involvesUserId?: number;
  },
): Promise<TicketCountNumbers> {
  const params = new URLSearchParams();
  params.set("orgId", String(orgId));
  if (options?.involvesUserId) {
    params.set("involvesUserId", String(options.involvesUserId));
  }
  for (const value of options?.filterBy ?? []) params.append("filterBy", String(value));
  return api.get<TicketCountNumbers>(`/tickets/count-numbers?${params.toString()}`);
}

export interface PersonalTicketsPageQuery {
  page: number;
  limit: number;
  search?: string;
  filterBy?: (number | "overdue" | "starred")[];
  dueDateFrom?: string;
  dueDateTo?: string;
}

function buildPersonalTicketsQuery(
  userId: number,
  query: PersonalTicketsPageQuery,
): string {
  const params = new URLSearchParams();
  params.set("userId", String(userId));
  params.set("page", String(query.page));
  params.set("limit", String(query.limit));
  if (query.search) params.set("search", query.search);
  if (query.dueDateFrom) params.set("dueDateFrom", query.dueDateFrom);
  if (query.dueDateTo) params.set("dueDateTo", query.dueDateTo);
  for (const value of query.filterBy ?? []) params.append("filterBy", String(value));
  return params.toString();
}

export async function fetchPersonalTicketsPage(
  userId: number,
  query: PersonalTicketsPageQuery,
): Promise<TicketsPage> {
  const raw = await api.get<RawPage<RawTicket>>(
    `/tickets/personal?${buildPersonalTicketsQuery(userId, query)}`,
  );
  return { ...raw, items: raw.items.map(adaptTicket) };
}

/** Same shape as fetchAllTickets, for a personal (org-less) space —
 * used by Dashboard/Reports when Personal mode is active. */
export async function fetchAllPersonalTickets(
  userId: number,
): Promise<TicketDetail[]> {
  const raw = await api.get<RawTicket[]>(
    `/tickets/personal/all?userId=${userId}`,
  );
  return raw.map(adaptTicket);
}

export async function fetchPersonalTicketCountNumbers(
  userId: number,
  options?: { filterBy?: (number | "overdue" | "starred")[] },
): Promise<TicketCountNumbers> {
  const params = new URLSearchParams();
  params.set("userId", String(userId));
  for (const value of options?.filterBy ?? []) params.append("filterBy", String(value));
  return api.get<TicketCountNumbers>(
    `/tickets/personal/count-numbers?${params.toString()}`,
  );
}

export interface CreatePersonalTicketPayload {
  title: string;
  description?: string;
  tagId: number;
  dueDate?: string;
}

export async function createPersonalTicket(
  userId: number,
  payload: CreatePersonalTicketPayload,
): Promise<TicketDetail> {
  const ticket = await api.post<RawTicket>(
    `/tickets/personal?userId=${userId}`,
    payload,
  );
  return adaptTicket(ticket);
}

export async function fetchTicketById(id: number): Promise<TicketDetail | null> {
  try {
    const ticket = await api.get<RawTicket>(`/tickets/${id}`);
    return adaptTicket(ticket);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export interface CreateTicketPayload {
  title: string;
  description?: string;
  tagId: number;
  clientId?: number;
  assigneeIds?: number[];
  dueDate?: string;
}

export async function createTicket(
  orgId: number,
  payload: CreateTicketPayload,
): Promise<TicketDetail> {
  const ticket = await api.post<RawTicket>(`/tickets?orgId=${orgId}`, payload);
  return adaptTicket(ticket);
}

export interface UpdateTicketPayload {
  title?: string;
  description?: string;
  tagId?: number;
  assigneeIds?: number[];
  dueDate?: string | null;
  starred?: boolean;
}

export async function updateTicket(
  id: number,
  payload: UpdateTicketPayload,
): Promise<TicketDetail> {
  const ticket = await api.patch<RawTicket>(`/tickets/${id}`, payload);
  return adaptTicket(ticket);
}

export async function deleteTicket(id: number): Promise<void> {
  await api.delete(`/tickets/${id}`);
}

export async function uploadTicketAttachment(
  ticketId: number,
  file: File,
): Promise<TicketAttachment> {
  const formData = new FormData();
  formData.append("file", file);
  const attachment = await api.postForm<RawTicketAttachment>(
    `/tickets/${ticketId}/attachments`,
    formData,
  );
  return adaptAttachment(attachment);
}

export async function removeTicketAttachment(
  ticketId: number,
  attachmentId: number,
): Promise<void> {
  await api.delete(`/tickets/${ticketId}/attachments/${attachmentId}`);
}

export async function addTicketComment(
  ticketId: number,
  payload: { userId: number; comment: string },
): Promise<TicketComment> {
  const comment = await api.post<RawTicketComment>(
    `/tickets/${ticketId}/comments`,
    payload,
  );
  return adaptComment(comment);
}

export async function updateTicketComment(
  commentId: number,
  comment: string,
): Promise<TicketComment> {
  const updated = await api.patch<RawTicketComment>(
    `/tickets/comments/${commentId}`,
    { comment },
  );
  return adaptComment(updated);
}

export async function removeTicketComment(commentId: number): Promise<void> {
  await api.delete(`/tickets/comments/${commentId}`);
}
