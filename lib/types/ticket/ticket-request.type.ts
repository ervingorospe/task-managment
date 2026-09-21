import type { MemberDetail } from "../organization/member-detail.type";
import type { TicketAttachment } from "./ticket-detail.type";

export type TicketRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled";

export interface TicketRequest {
  id: number;
  referenceId: string;
  orgId: number;
  title: string;
  description?: string;
  attachments: TicketAttachment[];
  client: MemberDetail;
  ticketId: number | null;
  /** The reason given when rejecting — required by the reject flow. */
  remarks?: string;
  status: TicketRequestStatus;
  createdAt: string;
  updatedAt: string;
}
