import type { MemberDetail } from "../organization/member-detail.type";
import type { TagDetail } from "../organization/tag-detail.type";
import type { TicketComment } from "./ticket-comment.type";

export interface TicketAttachment {
  id: number;
  name: string;
  url: string;
  size: number;
}

export interface TicketDetail {
  id: number;
  referenceId: string;
  orgId: number;
  title: string;
  description?: string;
  attachments: TicketAttachment[];
  tag: TagDetail;
  client: MemberDetail | null;
  assignees: MemberDetail[];
  dueDate: string | null;
  starred: boolean;
  comments?: TicketComment[];
  createdAt: string;
  updatedAt: string;
}
