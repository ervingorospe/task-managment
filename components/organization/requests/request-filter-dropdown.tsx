"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { Filter, X, RotateCcw } from "lucide-react";
import Dropdown from "@/components/ui/dropdown";
import { Button } from "@/components/ui/buttons/button";
import CheckboxBase from "@/components/ui/form/checkbox-base";
import PropertyRow from "@/components/ui/property-row";
import IconButton from "@/components/ui/buttons/button-icon";
import { useDropdown } from "@/providers/dropdown-context.provider";
import type { TicketRequestStatus } from "@/lib/types/ticket/ticket-request.type";

export interface RequestFilterState {
  statuses: TicketRequestStatus[];
  dateFrom: string | null;
  dateTo: string | null;
}

export const emptyRequestFilter: RequestFilterState = {
  statuses: [],
  dateFrom: null,
  dateTo: null,
};

const STATUS_OPTIONS: { value: TicketRequestStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

function countActive(filter: RequestFilterState): number {
  return (
    filter.statuses.length +
    (filter.dateFrom ? 1 : 0) +
    (filter.dateTo ? 1 : 0)
  );
}

interface RequestFilterDropdownProps {
  value: RequestFilterState;
  onChange: (value: RequestFilterState) => void;
}

export function RequestFilterDropdown({
  value,
  onChange,
}: RequestFilterDropdownProps) {
  const [draft, setDraft] = useState<RequestFilterState>(value);

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
      <RequestFilterContent draft={draft} setDraft={setDraft} onChange={onChange} />
    </Dropdown>
  );
}

interface RequestFilterContentProps {
  draft: RequestFilterState;
  setDraft: Dispatch<SetStateAction<RequestFilterState>>;
  onChange: (value: RequestFilterState) => void;
}

function RequestFilterContent({
  draft,
  setDraft,
  onChange,
}: RequestFilterContentProps) {
  const { close } = useDropdown();

  function toggleStatus(status: TicketRequestStatus) {
    setDraft((prev) => ({
      ...prev,
      statuses: prev.statuses.includes(status)
        ? prev.statuses.filter((s) => s !== status)
        : [...prev.statuses, status],
    }));
  }

  function handleClearFields() {
    setDraft(emptyRequestFilter);
  }

  function handleClose() {
    close();
  }

  function handleApply() {
    onChange(draft);
    close();
  }

  return (
    <div className="w-72 p-3">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-ink">Filters</span>

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

      <PropertyRow label="Status">
        <div className="space-y-1">
          {STATUS_OPTIONS.map((option) => (
            <CheckboxBase
              key={option.value}
              checked={draft.statuses.includes(option.value)}
              onChange={() => toggleStatus(option.value)}
              label={option.label}
              className="px-1 py-0.5"
            />
          ))}
        </div>
      </PropertyRow>

      <PropertyRow label="Submitted date range" className="mt-4">
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

      <div className="mt-4 flex items-center justify-end gap-2 border-t border-line pt-3">
        <IconButton
          icon={<RotateCcw size={15} />}
          label="clear filter"
          onClick={handleClearFields}
        />

        <Button type="button" onClick={handleApply}>
          Filter
        </Button>
      </div>
    </div>
  );
}
