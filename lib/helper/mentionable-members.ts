import { hasPermission } from "@/providers/auth-provider";
import { PERMISSIONS } from "@/lib/data/permissions";
import type { OrganizationDetail } from "@/lib/types/organization/organization-detail.type";
import type { MemberDetail } from "@/lib/types/organization/member-detail.type";
import { isTicketIncluded } from "./ticket-access";

interface TicketAccessInfo {
  client: MemberDetail | null;
  assignees: MemberDetail[];
}

/**
 * Who can be @mentioned on a ticket: the org owner, the ticket's client
 * (if any), and anyone whose role can actually view this ticket — either
 * via ticket.view.all, or ticket.view.included plus being included in it.
 */
export function getMentionableMembers(
  organization: OrganizationDetail,
  ticket: TicketAccessInfo,
): MemberDetail[] {
  const seen = new Set<number>();
  const mentionable: MemberDetail[] = [];

  function add(member: MemberDetail | null | undefined) {
    if (!member || seen.has(member.id)) return;
    seen.add(member.id);
    mentionable.push(member);
  }

  add(
    organization.members.find(
      (member) => member.user?.id === organization.owner.id,
    ),
  );

  add(ticket.client);

  for (const member of organization.members) {
    const role = organization.roles.find((r) => r.id === member.roleId);
    if (!role) continue;

    const canViewAll = hasPermission(role.rules, PERMISSIONS.TICKET_VIEW_ALL);
    const canViewIncluded =
      hasPermission(role.rules, PERMISSIONS.TICKET_VIEW_INCLUDED) &&
      isTicketIncluded(ticket, member.user?.id);

    if (canViewAll || canViewIncluded) add(member);
  }

  return mentionable;
}
