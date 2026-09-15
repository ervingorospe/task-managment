"use client";

import { UserX, UserCheck, Trash2, Shuffle } from "lucide-react";
import List from "@/components/ui/list";
import Avatar from "@/components/ui/avatar";
import { MemberDetail } from "@/lib/types/organization/member-detail.type";
import { RoleDetail } from "@/lib/types/organization/role-detail.type";
import { getMemberEmail, getMemberName } from "@/lib/helper/member-name";
import { PERMISSIONS } from "@/lib/data/permissions";
import { Can } from "@/components/auth/can";

interface MemberListProps {
  members: MemberDetail[];
  roles: RoleDetail[];
  onToggleActive: (member: MemberDetail) => void;
  onRemove: (member: MemberDetail) => void;
  onChangeRole: (member: MemberDetail) => void;
}

export default function MemberListSection({
  members,
  roles,
  onToggleActive,
  onRemove,
  onChangeRole,
}: MemberListProps) {
  if (members.length === 0) {
    return (
      <div className="rounded border border-dashed border-line px-6 py-8 text-center">
        <p className="text-sm font-medium text-ink">No members yet</p>
        <p className="mt-1 text-sm text-ink-muted">
          Members who accept an invitation will appear here.
        </p>
      </div>
    );
  }

  return (
    <Can action={PERMISSIONS.MEMBER_VIEW_MEMBERS}>
      <List>
        {members.map((member) => {
          const role = roles.find((item) => item.id === member.roleId);
          const name = getMemberName(member);
          const email = getMemberEmail(member);

          return (
            <List.ListItem
              key={member.id}
              leading={<Avatar firstName={name} size="md" />}
              title={
                <span className="flex items-center gap-2">
                  {name}
                  {!member.isActive && (
                    <span className="rounded-sm bg-canvas px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-ink-faint">
                      Deactivated
                    </span>
                  )}
                </span>
              }
              subtitle={email}
              trailing={
                <div className="flex items-center gap-2">
                  <Can
                    allOf={[
                      PERMISSIONS.MEMBER_VIEW_MEMBERS,
                      PERMISSIONS.MEMBER_UPDATE_ROLE,
                    ]}
                  >
                    <button
                      type="button"
                      onClick={() => onChangeRole(member)}
                      className="flex items-center gap-1 rounded border border-line px-2 py-1 text-xs text-ink-muted hover:bg-canvas hover:text-ink"
                    >
                      <Shuffle size={12} />
                      {role?.roleName ?? "No role"}
                    </button>
                  </Can>

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
                </div>
              }
            />
          );
        })}
      </List>
    </Can>
  );
}
