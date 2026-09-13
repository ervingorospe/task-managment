"use client";

import { useState } from "react";
import clsx from "clsx";
import { Check } from "lucide-react";
import Dropdown from "@/components/ui/dropdown";
import { useDropdown } from "@/providers/dropdown-context.provider";

const defaultPresets = [
  "#94A39D",
  "#64748B",
  "#3B82C4",
  "#8B5CF6",
  "#EC4899",
  "#E5484D",
  "#F97316",
  "#E2A03F",
  "#28A428",
  "#0EA5A5",
];

const hexPattern = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

interface ColorPickerPanelProps {
  value: string;
  onChange: (hex: string) => void;
  presetColors: string[];
}

// Split out so it can call useDropdown() — this component is guaranteed to
// render inside DropdownContextProvider, since it's only ever used as
// Dropdown's children below.
function ColorPickerPanel({
  value,
  onChange,
  presetColors,
}: ColorPickerPanelProps) {
  const { close } = useDropdown();
  const [hexInput, setHexInput] = useState(value);
  const [error, setError] = useState<string | null>(null);

  function applyHex() {
    const normalized = hexInput.startsWith("#") ? hexInput : `#${hexInput}`;
    if (!hexPattern.test(normalized)) {
      setError("Enter a valid hex code, e.g. #3B82C4");
      return;
    }
    onChange(normalized);
    setError(null);
    close();
  }

  return (
    <div className="w-56 p-3">
      <p className="mb-2 text-xs font-medium text-ink-muted">Preset colors</p>
      <div className="grid grid-cols-6 gap-2">
        {presetColors.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => {
              onChange(color);
              close();
            }}
            className="relative h-6 w-6 rounded-full border border-line"
            style={{ backgroundColor: color }}
            aria-label={color}
          >
            {color.toLowerCase() === value.toLowerCase() && (
              <Check
                size={12}
                className="absolute inset-0 m-auto text-white drop-shadow"
              />
            )}
          </button>
        ))}
      </div>

      <div className="mt-3 border-t border-line pt-3">
        <p className="mb-1.5 text-xs font-medium text-ink-muted">Custom hex</p>
        <div className="flex items-center gap-2">
          <span
            className="h-7 w-7 shrink-0 rounded border border-line"
            style={{
              backgroundColor: hexPattern.test(hexInput)
                ? hexInput
                : "transparent",
            }}
          />
          <input
            type="text"
            value={hexInput}
            onChange={(e) => {
              setHexInput(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyHex();
              }
            }}
            placeholder="#3B82C4"
            className="w-full rounded border border-line bg-surface px-2 py-1 text-sm text-ink placeholder:text-ink-faint focus:border-accent-text"
          />
          <button
            type="button"
            onClick={applyHex}
            className="shrink-0 rounded border border-line px-2 py-1 text-xs text-ink hover:bg-canvas"
          >
            Apply
          </button>
        </div>
        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      </div>
    </div>
  );
}

interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
  presetColors?: string[];
  className?: string;
}

export function ColorPicker({
  value,
  onChange,
  presetColors = defaultPresets,
  className,
}: ColorPickerProps) {
  return (
    <Dropdown
      align="end"
      trigger={
        <span
          className={clsx(
            "block h-6 w-6 rounded-full border border-line",
            className,
          )}
          style={{ backgroundColor: value }}
          aria-label="Choose color"
        />
      }
    >
      <ColorPickerPanel
        value={value}
        onChange={onChange}
        presetColors={presetColors}
      />
    </Dropdown>
  );
}
