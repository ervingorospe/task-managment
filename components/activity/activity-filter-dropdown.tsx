"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { Filter, X, RotateCcw } from "lucide-react";
import Dropdown from "@/components/ui/dropdown";
import { Button } from "@/components/ui/buttons/button";
import IconButton from "@/components/ui/buttons/button-icon";
import CheckboxBase from "@/components/ui/form/checkbox-base";
import PropertyRow from "@/components/ui/property-row";
import { SearchInput } from "@/components/ui/search-input";
import { useDropdown } from "@/providers/dropdown-context.provider";
import { ACTIVITY_MODULE_META, ACTIVITY_MODULES } from "@/lib/helper/activity-log";
import type { ActivityModule } from "@/lib/types/activity/activity-log-entry.type";

interface AuthorOption {
  id: number;
  name: string;
}

export interface ActivityFilterState {
  modules: ActivityModule[];
  authorIds: number[];
  dateFrom: string | null;
  dateTo: string | null;
}

export const emptyActivityFilter: ActivityFilterState = {
  modules: [],
  authorIds: [],
  dateFrom: null,
  dateTo: null,
};

const MAX_VISIBLE_AUTHORS = 10;

function countActive(filter: ActivityFilterState): number {
  return (
    filter.modules.length +
    filter.authorIds.length +
    (filter.dateFrom ? 1 : 0) +
    (filter.dateTo ? 1 : 0)
  );
}

interface ActivityFilterDropdownProps {
  value: ActivityFilterState;
  onChange: (value: ActivityFilterState) => void;
  authors: AuthorOption[];
}

export function ActivityFilterDropdown({
  value,
  onChange,
  authors,
}: ActivityFilterDropdownProps) {
  const [draft, setDraft] = useState<ActivityFilterState>(value);
  const [authorSearch, setAuthorSearch] = useState("");

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
      <ActivityFilterContent
        draft={draft}
        setDraft={setDraft}
        authorSearch={authorSearch}
        setAuthorSearch={setAuthorSearch}
        authors={authors}
        onChange={onChange}
      />
    </Dropdown>
  );
}

interface ActivityFilterContentProps {
  draft: ActivityFilterState;
  setDraft: Dispatch<SetStateAction<ActivityFilterState>>;
  authorSearch: string;
  setAuthorSearch: Dispatch<SetStateAction<string>>;
  authors: AuthorOption[];
  onChange: (value: ActivityFilterState) => void;
}

function ActivityFilterContent({
  draft,
  setDraft,
  authorSearch,
  setAuthorSearch,
  authors,
  onChange,
}: ActivityFilterContentProps) {
  const { close } = useDropdown();

  const filteredAuthors = authors.filter((author) =>
    author.name.toLowerCase().includes(authorSearch.trim().toLowerCase()),
  );
  const visibleAuthors = filteredAuthors.slice(0, MAX_VISIBLE_AUTHORS);
  const hiddenAuthorCount = filteredAuthors.length - visibleAuthors.length;

  function toggleModule(module: ActivityModule) {
    setDraft((prev) => ({
      ...prev,
      modules: prev.modules.includes(module)
        ? prev.modules.filter((m) => m !== module)
        : [...prev.modules, module],
    }));
  }

  function toggleAuthor(id: number) {
    setDraft((prev) => ({
      ...prev,
      authorIds: prev.authorIds.includes(id)
        ? prev.authorIds.filter((authorId) => authorId !== id)
        : [...prev.authorIds, id],
    }));
  }

  function handleClearFields() {
    setDraft(emptyActivityFilter);
    setAuthorSearch("");
  }

  function handleClose() {
    close();
  }

  function handleApply() {
    onChange(draft);
    close();
  }

  return (
    <div className="w-96 p-3">
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

      <div className="grid grid-cols-2 gap-4">
        <PropertyRow label="Module">
          <div className="max-h-40 space-y-1 overflow-y-auto">
            {ACTIVITY_MODULES.map((module) => {
              const meta = ACTIVITY_MODULE_META[module];
              return (
                <CheckboxBase
                  key={module}
                  checked={draft.modules.includes(module)}
                  onChange={() => toggleModule(module)}
                  label={
                    <span className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: meta.color }}
                      />
                      {meta.label}
                    </span>
                  }
                  className="px-1 py-0.5"
                />
              );
            })}
          </div>
        </PropertyRow>

        <PropertyRow label="Author">
          <SearchInput
            containerClassName="mb-1.5"
            value={authorSearch}
            onChange={(e) => setAuthorSearch(e.target.value)}
            placeholder="Search authors"
          />

          <div className="max-h-40 space-y-1 overflow-y-auto">
            {visibleAuthors.length === 0 ? (
              <p className="px-1 py-1 text-xs text-ink-faint">
                No authors found
              </p>
            ) : (
              visibleAuthors.map((author) => (
                <CheckboxBase
                  key={author.id}
                  checked={draft.authorIds.includes(author.id)}
                  onChange={() => toggleAuthor(author.id)}
                  label={author.name}
                  className="px-1 py-0.5"
                />
              ))
            )}
          </div>

          {hiddenAuthorCount > 0 && (
            <p className="mt-1 px-1 text-xs text-ink-faint">
              +{hiddenAuthorCount} more — refine your search
            </p>
          )}
        </PropertyRow>
      </div>

      <PropertyRow label="Date range" className="mt-4">
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
          label="Clear filter"
          onClick={handleClearFields}
        />

        <Button type="button" onClick={handleApply}>
          Filter
        </Button>
      </div>
    </div>
  );
}
