import { api, ApiError } from "./client";
import { adaptTicket, adaptComment, adaptAttachment } from "./adapters";
import type { TicketDetail, TicketAttachment } from "@/lib/types/ticket/ticket-detail.type";
import type { TicketComment } from "@/lib/types/ticket/ticket-comment.type";
import type { RawTicket, RawTicketComment, RawTicketAttachment } from "./raw-types";

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
