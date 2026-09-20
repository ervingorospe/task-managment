"use client";

import { useCallback, useMemo, useState } from "react";
import MemberListSection from "./member-list-section";
import {
  MemberListToolbar,
  type MemberSortField,
} from "@/components/organization/member/member-list-toolbar";
import { Pagination } from "@/components/ui/pagination";
import Card from "@/components/ui/card";
import { Button } from "@/components/ui/buttons/button";
import { lazyNamed } from "@/lib/helper/lazy-named";
import { MemberDetail } from "@/lib/types/organization/member-detail.type";
import { RoleDetail } from "@/lib/types/organization/role-detail.type";
import { getMemberName, getMemberEmail } from "@/lib/helper/member-name";
import { PERMISSIONS } from "@/lib/data/permissions";
import { Can } from "@/components/auth/can";
import { useToast } from "@/providers/toast-provider";
import { useMemberListQueryState } from "@/hooks/use-member-list-query-state";
import { useLogActivity } from "@/hooks/use-log-activity";

const ConfirmDialog = lazyNamed(
  () => import("@/components/ui/confirm-dialog"),
  "ConfirmDialog",
);
const SetRoleModal = lazyNamed(
  () => import("@/components/organization/role/set-role-modal"),
  "SetRoleModal",
);

interface InvitePeopleSectionProps {
  orgId: string | number;
  members: MemberDetail[];
  roles: RoleDetail[];
}

type PendingAction = { type: "toggle" | "remove"; member: MemberDetail };

export default function MembersSection({
  orgId,
  members: initialMembers,
  roles,
}: InvitePeopleSectionProps) {
  const toast = useToast();
  const logMemberActivity = useLogActivity("member");
  const [members, setMembers] = useState<MemberDetail[]>(initialMembers);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );
  const [activeRoleMember, setActiveRoleMember] = useState<MemberDetail | null>(
    null,
  );

  const [sortField, setSortField] = useState<MemberSortField>("name");
  const { page, searchInput, search, setPage, setSearchInput } =
    useMemberListQueryState();
  const [pageSize, setPageSize] = useState(15);

  const roleNameById = useMemo(() => {
    const map = new Map<number, string>();
    roles.forEach((r) => map.set(r.id, r.roleName));
    return map;
  }, [roles]);

  // Search first, then sort, then paginate — each step operates on the
  // previous step's result, not the raw `members` array, so filtering and
  // sorting stay correct together rather than racing each other.
  const filtered = useMemo(() => {
    if (!search) return members;
    const query = search.toLowerCase();

    return members.filter((member) => {
      const name = getMemberName(member).toLowerCase();
      const email = getMemberEmail(member).toLowerCase();
      const roleName = (roleNameById.get(member.roleId) ?? "").toLowerCase();
      return (
        name.includes(query) ||
        email.includes(query) ||
        roleName.includes(query)
      );
    });
  }, [members, search, roleNameById]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const valueA =
        sortField === "name" ? getMemberName(a) : getMemberEmail(a);
      const valueB =
        sortField === "name" ? getMemberName(b) : getMemberEmail(b);
      return valueA.localeCompare(valueB);
    });
  }, [filtered, sortField]);

  const totalPages = Math.max(Math.ceil(sorted.length / pageSize), 1);
  const currentPage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [sorted, currentPage, pageSize],
  );

  const handlePageSizeChange = useCallback(
    (size: number) => {
      setPageSize(size);
      setPage(1);
    },
    [setPage],
  );

  const handleConfirm = useCallback(() => {
    if (!pendingAction) return;
    const { type, member } = pendingAction;

    if (type === "toggle") {
      const willActivate = !member.isActive;
      setMembers((prev) =>
        prev.map((m) =>
          m.id === member.id ? { ...m, isActive: !m.isActive } : m,
        ),
      );
      logMemberActivity({
        orgId: Number(orgId),
        action: willActivate ? "activated" : "deactivated",
        entityId: member.id,
        entityLabel: getMemberName(member),
        description: `${willActivate ? "activated" : "deactivated"} ${getMemberName(member)}`,
      });
      toast(
        `${getMemberName(member)} ${member.isActive ? "deactivated" : "activated"}`,
        member.isActive ? "error" : "success",
      );
      // TODO: PATCH /organizations/:orgId/members/:id { isActive }
    } else {
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      logMemberActivity({
        orgId: Number(orgId),
        action: "removed",
        entityId: member.id,
        entityLabel: getMemberName(member),
        description: `removed ${getMemberName(member)} from the organization`,
      });
      toast(`${getMemberName(member)} removed`, "error");
      // TODO: DELETE /organizations/:orgId/members/:id
    }

    setPendingAction(null);
  }, [pendingAction, toast, orgId, logMemberActivity]);

  const handleConfirmRoleChange = useCallback(
    (roleId: number) => {
      if (!activeRoleMember) return;
      const roleName =
        roles.find((r) => r.id === roleId)?.roleName ?? "a new role";
      setMembers((prev) =>
        prev.map((m) =>
          m.id === activeRoleMember.id ? { ...m, roleId: roleId } : m,
        ),
      );
      logMemberActivity({
        orgId: Number(orgId),
        action: "role_changed",
        entityId: activeRoleMember.id,
        entityLabel: getMemberName(activeRoleMember),
        description: `changed ${getMemberName(activeRoleMember)}'s role to ${roleName}`,
      });
      toast(`${getMemberName(activeRoleMember)}'s role updated`);
      setActiveRoleMember(null);
      // TODO: PATCH /organizations/:orgId/members/:id { roleId: roleId }
    },
    [activeRoleMember, toast, orgId, roles, logMemberActivity],
  );

  const handleToggleActive = useCallback((member: MemberDetail) => {
    setPendingAction({ type: "toggle", member });
  }, []);

  const handleRemove = useCallback((member: MemberDetail) => {
    setPendingAction({ type: "remove", member });
  }, []);

  // Distinguishes "no members at all" from "your search matched nothing"
  // so the empty state points at the right fix.
  const noResultsFromQuery =
    members.length > 0 && sorted.length === 0 && Boolean(search);

  const handleClearSearch = useCallback(() => {
    setSearchInput("");
  }, [setSearchInput]);

  const dialogCopy = pendingAction
    ? pendingAction.type === "toggle"
      ? pendingAction.member.isActive
        ? {
            title: `Deactivate ${getMemberName(pendingAction.member)}?`,
            confirmLabel: "Deactivate",
            description:
              "They'll lose access to this organization immediately, but their account and history stay intact. You can reactivate them at any time.",
            danger: false,
          }
        : {
            title: `Activate ${getMemberName(pendingAction.member)}?`,
            confirmLabel: "Activate",
            description:
              "They'll regain access to this organization with their existing role.",
            danger: false,
          }
      : {
          title: `Remove ${getMemberName(pendingAction.member)}?`,
          confirmLabel: "Remove member",
          description:
            "They'll lose access to this organization and will need a new invitation to rejoin.",
          danger: true,
        }
    : null;

  return (
    <Can action={PERMISSIONS.MEMBER_VIEW_MEMBERS}>
      <Card
        title="Current Members"
        subtitle="People who currently belong to this organization."
        desc={`${members.length} members`}
      >
        <MemberListToolbar
          search={searchInput}
          onSearchChange={setSearchInput}
          sortField={sortField}
          onSortFieldChange={setSortField}
        />

        <MemberListSection
          members={paginated}
          roles={roles}
          onToggleActive={handleToggleActive}
          onRemove={handleRemove}
          onChangeRole={setActiveRoleMember}
          emptyTitle={noResultsFromQuery ? "No matching members" : undefined}
          emptySubtitle={
            noResultsFromQuery ? "Try a different search term." : undefined
          }
          emptyAction={
            noResultsFromQuery ? (
              <Button
                variant="secondary"
                className="mt-3"
                onClick={handleClearSearch}
              >
                Clear search
              </Button>
            ) : undefined
          }
        />

        <Pagination
          page={currentPage}
          totalPages={totalPages}
          totalItems={sorted.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={handlePageSizeChange}
        />

        {dialogCopy && (
          <Can action={PERMISSIONS.MEMBER_REMOVE}>
            <ConfirmDialog
              open={pendingAction !== null}
              onClose={() => setPendingAction(null)}
              onConfirm={handleConfirm}
              title={dialogCopy.title}
              confirmLabel={dialogCopy.confirmLabel}
              description={dialogCopy.description}
              danger={dialogCopy.danger}
            />
          </Can>
        )}

        {activeRoleMember && (
          <SetRoleModal
            open={activeRoleMember !== null}
            onClose={() => setActiveRoleMember(null)}
            roles={roles}
            currentRoleId={activeRoleMember.roleId}
            onConfirm={handleConfirmRoleChange}
          />
        )}
      </Card>
    </Can>
  );
}
