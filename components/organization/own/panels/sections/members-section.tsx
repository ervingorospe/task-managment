"use client";

import { useMemo, useState } from "react";
import MemberListSection from "./member-list-section";
import {
  MemberListToolbar,
  type MemberSortField,
} from "@/components/organization/member/member-list-toolbar";
import { Pagination } from "@/components/ui/pagination";
import Card from "@/components/ui/card";
import { lazyNamed } from "@/lib/helper/lazy-named";
import { MemberDetail } from "@/lib/types/organization/member-detail.type";
import { RoleDetail } from "@/lib/types/organization/role-detail.type";
import { getMemberName, getMemberEmail } from "@/lib/helper/member-name";

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
  const [members, setMembers] = useState<MemberDetail[]>(initialMembers);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );
  const [activeRoleMember, setActiveRoleMember] = useState<MemberDetail | null>(
    null,
  );

  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<MemberSortField>("name");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const roleNameById = useMemo(() => {
    const map = new Map<number, string>();
    roles.forEach((r) => map.set(r.id, r.role_name));
    return map;
  }, [roles]);

  // Search first, then sort, then paginate — each step operates on the
  // previous step's result, not the raw `members` array, so filtering and
  // sorting stay correct together rather than racing each other.
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return members;

    return members.filter((member) => {
      const name = getMemberName(member).toLowerCase();
      const email = getMemberEmail(member).toLowerCase();
      const roleName = (roleNameById.get(member.role_id) ?? "").toLowerCase();
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
  const paginated = sorted.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1); // reset to page 1 — otherwise a narrowed result set could leave you stranded on a now-nonexistent page
  }

  function handlePageSizeChange(size: number) {
    setPageSize(size);
    setPage(1);
  }

  function handleConfirm() {
    if (!pendingAction) return;
    const { type, member } = pendingAction;

    if (type === "toggle") {
      setMembers((prev) =>
        prev.map((m) =>
          m.id === member.id ? { ...m, isActive: !m.isActive } : m,
        ),
      );
      // TODO: PATCH /organizations/:orgId/members/:id { isActive }
    } else {
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      // TODO: DELETE /organizations/:orgId/members/:id
    }

    setPendingAction(null);
  }

  function handleConfirmRoleChange(roleId: number) {
    if (!activeRoleMember) return;
    setMembers((prev) =>
      prev.map((m) =>
        m.id === activeRoleMember.id ? { ...m, role_id: roleId } : m,
      ),
    );
    setActiveRoleMember(null);
    // TODO: PATCH /organizations/:orgId/members/:id { role_id: roleId }
  }

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
    <Card
      title="Current Members"
      subtitle="People who currently belong to this organization."
    >
      <MemberListToolbar
        search={search}
        onSearchChange={handleSearchChange}
        sortField={sortField}
        onSortFieldChange={setSortField}
      />

      <MemberListSection
        members={paginated}
        roles={roles}
        onToggleActive={(member) =>
          setPendingAction({ type: "toggle", member })
        }
        onRemove={(member) => setPendingAction({ type: "remove", member })}
        onChangeRole={setActiveRoleMember}
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
        <ConfirmDialog
          open={pendingAction !== null}
          onClose={() => setPendingAction(null)}
          onConfirm={handleConfirm}
          title={dialogCopy.title}
          confirmLabel={dialogCopy.confirmLabel}
          description={dialogCopy.description}
          danger={dialogCopy.danger}
        />
      )}

      {activeRoleMember && (
        <SetRoleModal
          open={activeRoleMember !== null}
          onClose={() => setActiveRoleMember(null)}
          roles={roles}
          currentRoleId={activeRoleMember.role_id}
          onConfirm={handleConfirmRoleChange}
        />
      )}
    </Card>
  );
}
