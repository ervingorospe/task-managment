// Maps the backend's Prisma-shaped responses (uppercase enums, extra
// id/orgId columns on join tables) onto the frontend's existing mock
// types (lowercase string unions) — so the rest of the app, written
// against the mock shapes, doesn't need to change to consume real data.

import type { User } from "@/lib/types/user/user.type";
import type { CurrentUser } from "@/lib/types/user/current-user.type";
import type { RoleDetail } from "@/lib/types/organization/role-detail.type";
import type { TagDetail } from "@/lib/types/organization/tag-detail.type";
import type { MemberDetail } from "@/lib/types/organization/member-detail.type";
import type { OrgSettingsDetail } from "@/lib/types/organization/organization-settings.type";
import type { MemberInviteDetail } from "@/lib/types/organization/member-invite-detail.type";
import type { TicketDetail } from "@/lib/types/ticket/ticket-detail.type";
import type { TicketComment } from "@/lib/types/ticket/ticket-comment.type";
import type { TicketRequest } from "@/lib/types/ticket/ticket-request.type";
import type {
  RawUser,
  RawRole,
  RawTag,
  RawMember,
  RawOrganizationSettings,
  RawMemberInvite,
  RawTicketComment,
  RawTicket,
  RawCurrentUser,
  RawTicketRequest,
  RawTicketAttachment,
} from "./raw-types";
import type { TicketAttachment } from "@/lib/types/ticket/ticket-detail.type";
import { toAbsoluteApiUrl } from "./client";

export function adaptAttachment(a: RawTicketAttachment): TicketAttachment {
  return { ...a, url: toAbsoluteApiUrl(a.url) };
}

export function adaptUser(u: RawUser): User {
  return {
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    avatar: u.avatar ?? null,
    accountType: u.accountType.toLowerCase() === "owner" ? "owner" : "member",
    isActive: u.isActive,
  };
}

export function adaptRole(r: RawRole): RoleDetail {
  return {
    id: r.id,
    roleName: r.roleName,
    roleDesc: r.roleDesc ?? undefined,
    isDefault: r.isDefault,
    orgId: r.orgId ?? null,
    isLocked: r.isLocked,
    isDeleted: r.isDeleted ?? false,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    rules: (r.rules ?? []).map((rule) => ({
      id: rule.id,
      action: rule.action,
      name: rule.name,
      desc: rule.desc,
      categoryId: rule.categoryId,
    })),
  };
}

export function adaptTag(t: RawTag): TagDetail {
  return {
    id: t.id,
    tagName: t.tagName,
    color: t.color,
    isDefault: t.isDefault,
    orgId: t.orgId ?? undefined,
    isDeleted: t.isDeleted ?? false,
  };
}

export function adaptMember(m: RawMember): MemberDetail {
  return {
    id: m.id,
    firstName: m.firstName,
    lastName: m.lastName,
    email: m.email,
    orgId: m.orgId,
    roleId: m.roleId,
    isActive: m.isActive,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
    user: m.user ? adaptUser(m.user) : null,
    role: m.role ? adaptRole(m.role) : undefined,
  };
}

export function adaptSettings(s: RawOrganizationSettings): OrgSettingsDetail {
  return {
    id: s.id,
    slug: s.slug,
    logo: s.logo ?? undefined,
    timezone: s.timezone,
    inviteExpiration: s.inviteExpiration,
    sendEmailNotif: s.sendEmailNotif,
    orgId: s.orgId,
    isActive: s.isActive,
    // Not modeled on the backend's OrganizationSettings — soft-delete lives
    // on the parent Organization there instead.
    isDeleted: false,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}

export function adaptInvite(i: RawMemberInvite): MemberInviteDetail {
  return {
    id: i.id,
    email: i.email,
    token: i.token ?? undefined,
    expiry: i.expiry ?? undefined,
    resentCount: i.resentCount,
    type: i.type.toLowerCase() === "ownership" ? "ownership" : "membership",
    status: i.status.toLowerCase(),
    roleId: i.roleId,
    orgId: i.orgId,
    createdAt: i.createdAt,
    updatedAt: i.updatedAt,
  };
}

export function adaptComment(c: RawTicketComment): TicketComment {
  return {
    id: c.id,
    ticketId: c.ticketId,
    userId: c.userId,
    comment: c.comment,
    author: {
      id: c.author.id,
      firstName: c.author.firstName,
      lastName: c.author.lastName,
      avatar: c.author.avatar,
    },
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

export function adaptTicket(t: RawTicket): TicketDetail {
  return {
    id: t.id,
    referenceId: t.referenceId,
    orgId: t.orgId,
    ownerId: t.ownerId ?? null,
    title: t.title,
    description: t.description ?? undefined,
    attachments: (t.attachments ?? []).map(adaptAttachment),
    tag: adaptTag(t.tag),
    client: t.client ? adaptMember(t.client) : null,
    assignees: (t.assignees ?? []).map(adaptMember),
    dueDate: t.dueDate ?? null,
    starred: t.starred,
    comments: t.comments ? t.comments.map(adaptComment) : undefined,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

export function adaptCurrentUser(u: RawCurrentUser): CurrentUser {
  return {
    ...adaptUser(u),
    memberships: (u.memberships ?? []).map((m) => ({
      id: m.id,
      role: adaptRole(m.role),
      organization: {
        id: m.organization.id,
        organizationName: m.organization.organizationName,
        organizationDesc: m.organization.organizationDesc ?? undefined,
        email: m.organization.email ?? undefined,
        website: m.organization.website ?? undefined,
        ownerId: m.organization.ownerId,
        settings: adaptSettings(m.organization.settings),
      },
    })),
  };
}

export function adaptTicketRequest(r: RawTicketRequest): TicketRequest {
  return {
    id: r.id,
    referenceId: r.referenceId,
    orgId: r.orgId,
    title: r.title,
    description: r.description ?? undefined,
    attachments: (r.attachments ?? []).map(adaptAttachment),
    client: adaptMember(r.client),
    ticketId: r.ticketId,
    remarks: r.remarks ?? undefined,
    status: r.status.toLowerCase() as TicketRequest["status"],
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}
