import type { MemberDetail } from "../organization/member-detail.type";
import type { TagDetail } from "../organization/tag-detail.type";

export interface TicketAttachment {
  id: number;
  name: string;
  url: string;
  size: number;
}

export interface TicketDetail {
  id: number;
  orgId: number;
  title: string;
  description?: string;
  attachments: TicketAttachment[];
  tag: TagDetail;
  client: MemberDetail | null;
  assignees: MemberDetail[];
  startDate: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}
