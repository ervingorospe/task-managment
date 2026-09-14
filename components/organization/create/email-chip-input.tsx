"use client";

import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PERMISSIONS } from "@/lib/data/permissions";
import { Can } from "@/components/auth/can";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface EmailChipInputProps {
  onAdd: (emails: string[]) => void;
}

export function EmailChipInput({ onAdd }: EmailChipInputProps) {
  const [chips, setChips] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function commitChip(raw: string) {
    const value = raw.trim();
    if (!value) return;
    if (!emailRegex.test(value)) {
      setError(`"${value}" isn't a valid email`);
      return;
    }
    if (!chips.includes(value)) setChips((prev) => [...prev, value]);
    setInputValue("");
    setError(null);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      commitChip(inputValue);
    } else if (e.key === "Backspace" && inputValue === "" && chips.length > 0) {
      setChips((prev) => prev.slice(0, -1));
    }
  }

  function removeChip(email: string) {
    setChips((prev) => prev.filter((c) => c !== email));
  }

  function handleAdd() {
    const pending = inputValue.trim();
    const all = pending ? [...chips, pending] : chips;
    const valid = all.filter((e) => emailRegex.test(e));

    if (valid.length === 0) {
      setError("Add at least one valid email");
      return;
    }

    onAdd(valid);
    setChips([]);
    setInputValue("");
    setError(null);
  }

  return (
    <Can action={PERMISSIONS.MEMBER_INVITE}>
      <div className="flex flex-wrap items-center gap-1.5 rounded border border-line bg-surface px-2 py-1.5 focus-within:border-accent-text">
        {chips.map((email) => (
          <span
            key={email}
            className="flex items-center gap-1 rounded-sm bg-canvas px-2 py-1 text-xs text-ink"
          >
            {email}
            <button
              type="button"
              onClick={() => removeChip(email)}
              className="text-ink-faint hover:text-danger"
              aria-label={`Remove ${email}`}
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder={
            chips.length === 0 ? "Type an email and press space" : ""
          }
          className="min-w-[160px] flex-1 bg-transparent px-1 py-0.5 text-sm text-ink placeholder:text-ink-faint outline-none"
        />
      </div>

      {error && <p className="mt-1 text-xs text-danger">{error}</p>}

      <Button
        type="button"
        variant="secondary"
        onClick={handleAdd}
        className="mt-2"
      >
        Add
      </Button>
    </Can>
  );
}
