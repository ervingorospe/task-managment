// The backend's actual response shapes (Prisma models, as JSON) — before
// adaptation to the frontend's existing mock types in adapters.ts.
// "Raw" = what came over the wire: uppercase enums, nullable fields where
// Prisma has them nullable, no defaulting/casing normalization yet.

export interface RawRule {
  id: number;
  action: string;
  name: string;
  desc: string;
  categoryId: number;
}

export interface RawRuleCategory {
  id: number;
  name: string;
  rules: RawRule[];
}

export interface RawUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string | null;
  isActive: boolean;
  isDeleted: boolean;
  isVerified: boolean;
  hasOnboarded: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RawRole {
  id: number;
  orgId: number | null;
  roleName: string;
  roleDesc: string | null;
  isDefault: boolean;
  isLocked: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  rules?: RawRule[];
}

export interface RawTag {
  id: number;
  orgId: number | null;
  tagName: string;
  color: string;
  isDefault: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RawMember {
  id: number;
  orgId: number;
  userId: number | null;
  roleId: number;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  user?: RawUser | null;
  role?: RawRole;
}

export interface RawOrganizationSettings {
  id: number;
  orgId: number;
  slug: string;
  logo: string | null;
  timezone: string;
  inviteExpiration: string;
  sendEmailNotif: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RawOrganizationCapacity {
  id: number;
  orgId: number;
  members: number;
  tags: number;
  roles: number;
  tickets: number;
  projects: number;
}

export interface RawMemberInvite {
  id: number;
  orgId: number;
  roleId: number;
  email: string;
  token: string | null;
  expiry: string | null;
  resentCount: number;
  lastSentAt: string | null;
  type: "MEMBERSHIP" | "OWNERSHIP";
  status: "PENDING" | "ACCEPTED" | "EXPIRED" | "CANCELLED";
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RawOrganization {
  id: number;
  organizationName: string;
  organizationDesc: string | null;
  email: string | null;
  website: string | null;
  settings: RawOrganizationSettings;
  capacity: RawOrganizationCapacity;
  owner: RawUser;
  roles: RawRole[];
  tags: RawTag[];
  members: RawMember[];
  pendingInvites: RawMemberInvite[];
  pendingOwnershipTransfer: RawMemberInvite | null;
}

export interface RawTicketAttachment {
  id: number;
  name: string;
  url: string;
  size: number;
}

export interface RawTicketComment {
  id: number;
  ticketId: number;
  userId: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  author: RawUser;
}

export interface RawTicket {
  id: number;
  // Null for a personal (org-less) ticket — ownerId is set instead.
  orgId: number | null;
  ownerId?: number | null;
  referenceId: string;
  title: string;
  description: string | null;
  tagId: number;
  clientId: number | null;
  dueDate: string | null;
  starred: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  tag: RawTag;
  client: RawMember | null;
  assignees: RawMember[];
  attachments: RawTicketAttachment[];
  comments?: RawTicketComment[];
}

export interface RawTicketRequest {
  id: number;
  orgId: number;
  referenceId: string;
  title: string;
  description: string | null;
  clientId: number;
  ticketId: number | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  remarks: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  client: RawMember;
  attachments: RawTicketAttachment[];
}

// GET /auth/me (and login/verify-email/Google OAuth) includes each
// membership's organization with only `settings` — not `owner` — so this
// is narrower than RawOrganization.
export interface RawMembershipOrganization {
  id: number;
  organizationName: string;
  organizationDesc: string | null;
  email: string | null;
  website: string | null;
  ownerId: number;
  settings: RawOrganizationSettings;
}

export interface RawMembership {
  id: number;
  role: RawRole;
  organization: RawMembershipOrganization;
  isActive: boolean;
}

export interface RawCurrentUser extends RawUser {
  memberships: RawMembership[];
  hasPassword: boolean;
  createdViaInvite: boolean;
}

export interface RawActivityLogEntry {
  id: number;
  // Null for a personal (org-less) ticket's activity.
  orgId: number | null;
  module: "TICKET" | "REQUEST" | "MEMBER" | "ROLE" | "TAG";
  action: string;
  entityId: number;
  entityLabel: string;
  referenceId: string | null;
  actorId: number;
  actorName: string;
  actorAvatar: string | null;
  involvedUserIds: number[];
  description: string;
  createdAt: string;
}

export interface RawPage<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface RawApproveResult {
  request: RawTicketRequest;
  ticket: RawTicket;
}
