"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { Filter, X, RotateCcw } from "lucide-react";
import Dropdown from "@/components/ui/dropdown";
import { Button } from "@/components/ui/buttons/button";
import CheckboxBase from "@/components/ui/form/checkbox-base";
import PropertyRow from "@/components/ui/property-row";
import { SearchInput } from "@/components/ui/search-input";
import { useDropdown } from "@/providers/dropdown-context.provider";
import { usePermission } from "@/providers/auth-provider";
import { PERMISSIONS } from "@/lib/data/permissions";
import type { MemberDetail } from "@/lib/types/organization/member-detail.type";
import type { TagDetail } from "@/lib/types/organization/tag-detail.type";
import IconButton from "../ui/buttons/button-icon";

export interface TicketFilterState {
  memberIds: number[];
  tagIds: number[];
  dateFrom: string | null;
  dateTo: string | null;
  overdueOnly: boolean;
}

export const emptyTicketFilter: TicketFilterState = {
  memberIds: [],
  tagIds: [],
  dateFrom: null,
  dateTo: null,
  overdueOnly: false,
};

const MAX_VISIBLE_MEMBERS = 10;

function countActive(filter: TicketFilterState): number {
  return (
    filter.memberIds.length +
    filter.tagIds.length +
    (filter.dateFrom ? 1 : 0) +
    (filter.dateTo ? 1 : 0) +
    (filter.overdueOnly ? 1 : 0)
  );
}

interface TicketFilterDropdownProps {
  value: TicketFilterState;
  onChange: (value: TicketFilterState) => void;
  members: MemberDetail[];
  tags: TagDetail[];
  /** A personal (org-less) ticket has no members to filter by at all —
   * the usual ticket.assign permission check passes in Personal mode (no
   * team to restrict against), so this explicitly hides the section
   * instead. */
  hideMemberFilter?: boolean;
}

export function TicketFilterDropdown({
  value,
  onChange,
  members,
  tags,
  hideMemberFilter = false,
}: TicketFilterDropdownProps) {
  const [draft, setDraft] = useState<TicketFilterState>(value);
  const [memberSearch, setMemberSearch] = useState("");

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const activeCount = countActive(value);

  return (
    <Dropdown
      align="end"
      trigger={
        <Button variant="secondary" type="button">
          <Filter size={14} className="mr-1.5" />
          Filter
          {activeCount > 0 && (
            <span className="ml-1.5 rounded-full bg-accent-subtle px-1.5 py-0.5 text-[10px] font-medium text-accent-text">
              {activeCount}
            </span>
          )}
        </Button>
      }
    >
      <TicketFilterContent
        draft={draft}
        setDraft={setDraft}
        memberSearch={memberSearch}
        setMemberSearch={setMemberSearch}
        members={members}
        tags={tags}
        onChange={onChange}
        hideMemberFilter={hideMemberFilter}
      />
    </Dropdown>
  );
}

interface TicketFilterContentProps {
  draft: TicketFilterState;
  setDraft: Dispatch<SetStateAction<TicketFilterState>>;
  memberSearch: string;
  setMemberSearch: Dispatch<SetStateAction<string>>;
  members: MemberDetail[];
  tags: TagDetail[];
  onChange: (value: TicketFilterState) => void;
  hideMemberFilter: boolean;
}

function TicketFilterContent({
  draft,
  setDraft,
  memberSearch,
  setMemberSearch,
  members,
  tags,
  onChange,
  hideMemberFilter,
}: TicketFilterContentProps) {
  const { close } = useDropdown();
  const canFilterByMember =
    usePermission(PERMISSIONS.TICKET_ASSIGN) && !hideMemberFilter;

  const filteredMembers = members.filter((member) => {
    const name = `${member.user?.firstName ?? member.firstName} ${
      member.user?.lastName ?? member.lastName
    }`.toLowerCase();

    return name.includes(memberSearch.trim().toLowerCase());
  });

  const visibleMembers = filteredMembers.slice(0, MAX_VISIBLE_MEMBERS);
  const hiddenMemberCount = filteredMembers.length - visibleMembers.length;

  function toggleMember(id: number) {
    setDraft((prev) => ({
      ...prev,
      memberIds: prev.memberIds.includes(id)
        ? prev.memberIds.filter((memberId) => memberId !== id)
        : [...prev.memberIds, id],
    }));
  }

  function toggleTag(id: number) {
    setDraft((prev) => ({
      ...prev,
      tagIds: prev.tagIds.includes(id)
        ? prev.tagIds.filter((tagId) => tagId !== id)
        : [...prev.tagIds, id],
    }));
  }

  /**
   * Clears the filter fields only.
   *
   * This does NOT apply the change to the ticket list and does NOT
   * close the dropdown. The user can still click "Filter" afterwards.
   */
  function handleClearFields() {
    setDraft(emptyTicketFilter);
    setMemberSearch("");
  }

  /**
   * The X in the header only closes the dropdown.
   */
  function handleClose() {
    close();
  }

  /**
   * Applies the draft filters and closes the dropdown.
   */
  function handleApply() {
    onChange(draft);
    close();
  }

  return (
    <div className="w-96 p-3">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-ink">Filters</span>

        {/* Close dropdown */}
        <button
          type="button"
          onClick={handleClose}
          title="Close"
          aria-label="Close filters"
          className="rounded p-1 text-ink-muted transition-colors hover:bg-canvas hover:text-ink"
        >
          <X size={14} />
        </button>
      </div>

      {/* Members + Tags */}
      <div className={canFilterByMember ? "grid grid-cols-2 gap-4" : ""}>
        {/* Members — hidden for clients, who can't see assignees at all */}
        {canFilterByMember && (
          <PropertyRow label="Members">
            <SearchInput
              containerClassName="mb-1.5"
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              placeholder="Search members"
            />

            <div className="max-h-40 space-y-1 overflow-y-auto">
              {visibleMembers.length === 0 ? (
                <p className="px-1 py-1 text-xs text-ink-faint">
                  No members found
                </p>
              ) : (
                visibleMembers.map((member) => (
                  <CheckboxBase
                    key={member.id}
                    checked={draft.memberIds.includes(member.id)}
                    onChange={() => toggleMember(member.id)}
                    label={`${member.user?.firstName ?? member.firstName} ${
                      member.user?.lastName ?? member.lastName
                    }`.trim()}
                    className="px-1 py-0.5"
                  />
                ))
              )}
            </div>

            {hiddenMemberCount > 0 && (
              <p className="mt-1 px-1 text-xs text-ink-faint">
                +{hiddenMemberCount} more — refine your search
              </p>
            )}
          </PropertyRow>
        )}

        {/* Tags */}
        <PropertyRow label="Tags">
          <div className="max-h-40 space-y-1 overflow-y-auto">
            {tags.length === 0 ? (
              <p className="px-1 py-1 text-xs text-ink-faint">No tags found</p>
            ) : (
              tags.map((tag) => (
                <CheckboxBase
                  key={tag.id}
                  checked={draft.tagIds.includes(tag.id)}
                  onChange={() => toggleTag(tag.id)}
                  label={
                    <span className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{
                          backgroundColor: tag.color,
                        }}
                      />

                      {tag.tagName}
                    </span>
                  }
                  className="px-1 py-0.5"
                />
              ))
            )}
          </div>
        </PropertyRow>
      </div>

      {/* Overdue only */}
      <PropertyRow label="Status" className="mt-4">
        <CheckboxBase
          checked={draft.overdueOnly}
          onChange={() =>
            setDraft((prev) => ({
              ...prev,
              overdueOnly: !prev.overdueOnly,
            }))
          }
          label="Overdue only"
          className="px-1 py-0.5"
        />
      </PropertyRow>

      {/* Due Date Range */}
      <PropertyRow label="Due date range" className="mt-4">
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            value={draft.dateFrom ?? ""}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                dateFrom: e.target.value || null,
              }))
            }
            className="w-full rounded border border-line bg-surface px-2 py-1.5 text-xs text-ink focus:border-accent-text focus:outline-none"
          />

          <input
            type="date"
            value={draft.dateTo ?? ""}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                dateTo: e.target.value || null,
              }))
            }
            className="w-full rounded border border-line bg-surface px-2 py-1.5 text-xs text-ink focus:border-accent-text focus:outline-none"
          />
        </div>
      </PropertyRow>

      {/* Actions */}
      <div className="mt-4 flex items-center justify-end gap-2 border-t border-line pt-3">
        {/* Clear filter fields */}
        <IconButton
          icon={<RotateCcw size={15} />}
          label="clear filter"
          onClick={handleClearFields}
        />

        {/* Apply filters */}
        <Button type="button" onClick={handleApply}>
          Filter
        </Button>
      </div>
    </div>
  );
}
