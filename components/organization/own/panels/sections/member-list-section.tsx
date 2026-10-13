"use client";

import { memo, type ReactNode } from "react";
import { UserX, UserCheck, Trash2, Shuffle } from "lucide-react";
import List from "@/components/ui/list";
import Avatar from "@/components/ui/avatar";
import EmptyState from "@/components/ui/empty-state";
import { MetaBadge } from "@/components/ui/meta-badge";
import { MemberDetail } from "@/lib/types/organization/member-detail.type";
import { RoleDetail } from "@/lib/types/organization/role-detail.type";
import { getMemberEmail, getMemberName } from "@/lib/helper/member-name";
import { PERMISSIONS } from "@/lib/data/permissions";
import { Can } from "@/components/auth/can";
import { useAuth, usePermission } from "@/providers/auth-provider";

interface MemberListProps {
  members: MemberDetail[];
  roles: RoleDetail[];
  onToggleActive: (member: MemberDetail) => void;
  onRemove: (member: MemberDetail) => void;
  onChangeRole: (member: MemberDetail) => void;
  emptyTitle?: string;
  emptySubtitle?: string;
  emptyAction?: ReactNode;
}

function MemberListSection({
  members,
  roles,
  onToggleActive,
  onRemove,
  onChangeRole,
  emptyTitle = "No members yet",
  emptySubtitle = "Members who accept an invitation will appear here.",
  emptyAction,
}: MemberListProps) {
  const canUpdateRole = usePermission(PERMISSIONS.MEMBER_UPDATE_ROLE);
  const { currentUser } = useAuth();

  if (members.length === 0) {
    return (
      <EmptyState title={emptyTitle} subtitle={emptySubtitle}>
        {emptyAction}
      </EmptyState>
    );
  }

  return (
    <Can action={PERMISSIONS.MEMBER_VIEW_MEMBERS}>
      <List>
        {members.map((member) => {
          const role = roles.find((item) => item.id === member.roleId);
          const name = getMemberName(member);
          const email = getMemberEmail(member);
          // No one edits their own role, deactivates, or removes
          // themselves from here — those are things only someone else
          // with the right permission should be able to do to you.
          const isSelf =
            currentUser != null && member.user?.id === currentUser.id;

          return (
            <List.ListItem
              key={member.id}
              leading={<Avatar firstName={name} size="md" />}
              title={
                <span className="flex items-center gap-2">
                  {name}
                  {isSelf && <MetaBadge>You</MetaBadge>}
                  {!member.isActive && <MetaBadge>Deactivated</MetaBadge>}
                </span>
              }
              subtitle={email}
              trailing={
                <div className="flex items-center gap-2">
                  {canUpdateRole && !isSelf ? (
                    <button
                      type="button"
                      onClick={() => onChangeRole(member)}
                      className="flex items-center gap-1 rounded border border-line px-2 py-1 text-xs text-ink-muted hover:bg-canvas hover:text-ink"
                    >
                      <Shuffle size={12} />
                      {role?.roleName ?? "No role"}
                    </button>
                  ) : (
                    <span className="rounded border border-line px-2 py-1 text-xs text-ink-muted">
                      {role?.roleName ?? "No role"}
                    </span>
                  )}

                  {!isSelf && (
                    <Can
                      allOf={[
                        PERMISSIONS.MEMBER_VIEW_MEMBERS,
                        PERMISSIONS.MEMBER_SET_ACTIVE,
                      ]}
                    >
                      <button
                        type="button"
                        onClick={() => onToggleActive(member)}
                        className="rounded p-1.5 text-ink-faint hover:bg-canvas hover:text-ink"
                        aria-label={
                          member.isActive
                            ? `Deactivate ${name}`
                            : `Activate ${name}`
                        }
                      >
                        {member.isActive ? (
                          <UserX size={15} />
                        ) : (
                          <UserCheck size={15} />
                        )}
                      </button>
                    </Can>
                  )}

                  {!isSelf && (
                    <Can
                      allOf={[
                        PERMISSIONS.MEMBER_VIEW_MEMBERS,
                        PERMISSIONS.MEMBER_REMOVE,
                      ]}
                    >
                      <button
                        type="button"
                        onClick={() => onRemove(member)}
                        className="rounded p-1.5 text-ink-faint hover:bg-danger-subtle hover:text-danger"
                        aria-label={`Remove ${name}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </Can>
                  )}
                </div>
              }
            />
          );
        })}
      </List>
    </Can>
  );
}

export default memo(MemberListSection);
