import { mockOrganizationDetails } from "./organization-detail";
import type { ActivityLogEntry } from "@/lib/types/activity/activity-log-entry.type";

/**
 * Derives a plausible activity history straight from the mock org data
 * (ticket/request creation, comments, role/tag creation) rather than
 * hand-writing entries with guessed ids — every id here is guaranteed to
 * exist because it's pulled from the same objects the rest of the app reads.
 */
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
      const clientId = ticket.client?.user?.id ?? ticket.client?.id ?? org.owner.id;

      push({
        orgId: org.id,
        module: "ticket",
        action: "created",
        entityId: ticket.id,
        entityLabel: ticket.title,
        actorId: clientId,
        actorName: clientName,
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
          actorId: comment.author.id,
          actorName: `${comment.author.firstName} ${comment.author.lastName}`,
          actorAvatar: comment.author.avatar,
          description: `commented on "${ticket.title}"`,
          createdAt: comment.createdAt,
        });
      }

      if (ticket.updatedAt && ticket.updatedAt !== ticket.createdAt) {
        const assignee = ticket.assignees?.[0];
        push({
          orgId: org.id,
          module: "ticket",
          action: "status_changed",
          entityId: ticket.id,
          entityLabel: ticket.title,
          actorId: assignee?.user?.id ?? assignee?.id ?? org.owner.id,
          actorName: assignee
            ? `${assignee.user?.firstName ?? assignee.firstName} ${assignee.user?.lastName ?? assignee.lastName}`
            : ownerName,
          description: `changed status of "${ticket.title}" to ${ticket.tag.tagName}`,
          createdAt: ticket.updatedAt,
        });
      }
    }

    for (const request of org.ticketRequests ?? []) {
      const clientName = `${request.client.firstName} ${request.client.lastName}`;

      push({
        orgId: org.id,
        module: "request",
        action: "created",
        entityId: request.id,
        entityLabel: request.title,
        actorId: request.client.id,
        actorName: clientName,
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
          actorId: org.owner.id,
          actorName: ownerName,
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
          actorId: org.owner.id,
          actorName: ownerName,
          description: request.remarks
            ? `rejected request "${request.title}": ${request.remarks}`
            : `rejected request "${request.title}"`,
          createdAt: request.updatedAt,
        });
      }
    }

    for (const member of org.members ?? []) {
      const name = `${member.user?.firstName ?? member.firstName} ${member.user?.lastName ?? member.lastName}`;
      push({
        orgId: org.id,
        module: "member",
        action: "joined",
        entityId: member.id,
        entityLabel: name,
        actorId: member.id,
        actorName: name,
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
        description: `created tag "${tag.tagName}"`,
        createdAt: org.createdAt,
      });
    }
  }

  return entries.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export const activityLogSeed = buildSeed();
