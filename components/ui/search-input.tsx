import { Search } from "lucide-react";
import type { ComponentProps } from "react";

interface SearchInputProps extends Omit<ComponentProps<"input">, "type"> {
  containerClassName?: string;
}

/** A text input with a leading search icon, styled to match the standard form Input. */
export function SearchInput({
  className,
  containerClassName,
  ...props
}: SearchInputProps) {
  return (
    <div className={["relative", containerClassName].filter(Boolean).join(" ")}>
      <Search
        size={14}
        className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint"
      />
      <input
        type="text"
        {...props}
        className={[
          "w-full rounded border border-line bg-surface py-2 pl-8 pr-3 text-sm text-ink",
          "placeholder:text-ink-faint",
          "focus:border-accent-text focus:outline-none",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      />
    </div>
  );
}
