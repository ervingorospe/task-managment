import { mockOrganizationDetails } from "./organization-detail";
import type { ActivityLogEntry } from "@/lib/types/activity/activity-log-entry.type";

/**
 * Derives a plausible activity history straight from the mock org data
 * (ticket/request creation, comments, role/tag creation) rather than
 * hand-writing entries with guessed ids — every id here is guaranteed to
 * exist because it's pulled from the same objects the rest of the app reads.
 *
 * The log itself is standalone (no foreign keys, no joins at read time), so
 * every id/name/reference this generator can resolve from the mock data is
 * baked directly onto the row here, once, at "write" time.
 */
function resolveUserId(member: any): number | undefined {
  return member?.user?.id ?? member?.id;
}

function dedupe(ids: (number | undefined)[]): number[] {
  return Array.from(new Set(ids.filter((id): id is number => id != null)));
}

function buildSeed(): ActivityLogEntry[] {
  const entries: ActivityLogEntry[] = [];
  let nextId = 1;

  function push(entry: Omit<ActivityLogEntry, "id">) {
    entries.push({ ...entry, id: nextId++ });
  }

  for (const org of Object.values(mockOrganizationDetails) as any[]) {
    const ownerName = `${org.owner.firstName} ${org.owner.lastName}`;

    for (const ticket of org.tickets ?? []) {
      const clientName = ticket.client
        ? `${ticket.client.user?.firstName ?? ticket.client.firstName} ${ticket.client.user?.lastName ?? ticket.client.lastName}`
        : ownerName;
      const clientId = resolveUserId(ticket.client) ?? org.owner.id;
      const assigneeIds = (ticket.assignees ?? []).map(resolveUserId);

      push({
        orgId: org.id,
        module: "ticket",
        action: "created",
        entityId: ticket.id,
        entityLabel: ticket.title,
        referenceId: ticket.referenceId,
        actorId: clientId,
        actorName: clientName,
        involvedUserIds: dedupe([clientId, ...assigneeIds]),
        description: `created ticket "${ticket.title}"`,
        createdAt: ticket.createdAt,
      });

      for (const comment of ticket.comments ?? []) {
        push({
          orgId: org.id,
          module: "ticket",
          action: "commented",
          entityId: ticket.id,
          entityLabel: ticket.title,
          referenceId: ticket.referenceId,
          actorId: comment.author.id,
          actorName: `${comment.author.firstName} ${comment.author.lastName}`,
          actorAvatar: comment.author.avatar,
          involvedUserIds: dedupe([
            comment.author.id,
            clientId,
            ...assigneeIds,
          ]),
          description: `commented on "${ticket.title}"`,
          createdAt: comment.createdAt,
        });
      }

      if (ticket.updatedAt && ticket.updatedAt !== ticket.createdAt) {
        const assignee = ticket.assignees?.[0];
        const actorId = resolveUserId(assignee) ?? org.owner.id;
        push({
          orgId: org.id,
          module: "ticket",
          action: "status_changed",
          entityId: ticket.id,
          entityLabel: ticket.title,
          referenceId: ticket.referenceId,
          actorId,
          actorName: assignee
            ? `${assignee.user?.firstName ?? assignee.firstName} ${assignee.user?.lastName ?? assignee.lastName}`
            : ownerName,
          involvedUserIds: dedupe([actorId, clientId, ...assigneeIds]),
          description: `changed status of "${ticket.title}" to ${ticket.tag.tagName}`,
          createdAt: ticket.updatedAt,
        });
      }
    }

    for (const request of org.ticketRequests ?? []) {
      const clientName = `${request.client.firstName} ${request.client.lastName}`;
      const clientId = resolveUserId(request.client) ?? org.owner.id;

      push({
        orgId: org.id,
        module: "request",
        action: "created",
        entityId: request.id,
        entityLabel: request.title,
        referenceId: request.referenceId,
        actorId: clientId,
        actorName: clientName,
        involvedUserIds: dedupe([clientId]),
        description: `submitted request "${request.title}"`,
        createdAt: request.createdAt,
      });

      if (request.status === "approved") {
        push({
          orgId: org.id,
          module: "request",
          action: "approved",
          entityId: request.id,
          entityLabel: request.title,
          referenceId: request.referenceId,
          actorId: org.owner.id,
          actorName: ownerName,
          involvedUserIds: dedupe([org.owner.id, clientId]),
          description: `approved request "${request.title}"`,
          createdAt: request.updatedAt,
        });
      } else if (request.status === "rejected") {
        push({
          orgId: org.id,
          module: "request",
          action: "rejected",
          entityId: request.id,
          entityLabel: request.title,
          referenceId: request.referenceId,
          actorId: org.owner.id,
          actorName: ownerName,
          involvedUserIds: dedupe([org.owner.id, clientId]),
          description: request.remarks
            ? `rejected request "${request.title}": ${request.remarks}`
            : `rejected request "${request.title}"`,
          createdAt: request.updatedAt,
        });
      }
    }

    for (const member of org.members ?? []) {
      const name = `${member.user?.firstName ?? member.firstName} ${member.user?.lastName ?? member.lastName}`;
      const memberUserId = resolveUserId(member);
      push({
        orgId: org.id,
        module: "member",
        action: "joined",
        entityId: member.id,
        entityLabel: name,
        actorId: memberUserId ?? member.id,
        actorName: name,
        involvedUserIds: dedupe([memberUserId]),
        description: `joined the organization`,
        createdAt: member.createdAt ?? org.createdAt,
      });
    }

    for (const role of org.roles ?? []) {
      if (role.isDefault) continue;
      push({
        orgId: org.id,
        module: "role",
        action: "created",
        entityId: role.id,
        entityLabel: role.roleName,
        actorId: org.owner.id,
        actorName: ownerName,
        involvedUserIds: dedupe([org.owner.id]),
        description: `created role "${role.roleName}"`,
        createdAt: role.createdAt ?? org.createdAt,
      });
    }

    for (const tag of org.tags ?? []) {
      if (tag.isDefault) continue;
      push({
        orgId: org.id,
        module: "tag",
        action: "created",
        entityId: tag.id,
        entityLabel: tag.tagName,
        actorId: org.owner.id,
        actorName: ownerName,
        involvedUserIds: dedupe([org.owner.id]),
        description: `created tag "${tag.tagName}"`,
        createdAt: org.createdAt,
      });
    }
  }

  return entries.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export const activityLogSeed = buildSeed();
