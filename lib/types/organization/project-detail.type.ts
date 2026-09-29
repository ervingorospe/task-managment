import type { MemberDetail } from "./member-detail.type";

export interface ProjectDetail {
  id: number;
  name: string;
  description?: string;
  orgId?: number;
  clientId?: number | null;
  client?: MemberDetail | null;
  assignees: MemberDetail[];
  isDeleted?: boolean;
}
