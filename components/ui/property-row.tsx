import type { ReactNode } from "react";

interface PropertyRowProps {
  label: string;
  children: ReactNode;
  className?: string;
  /**
   * "caption" (default): uppercase tracked label, arbitrary content below —
   * used for property/filter sections. "plain": small muted label with an
   * icon + value row below — used for read-only info displays.
   */
  variant?: "caption" | "plain";
}

export default function PropertyRow({
  label,
  children,
  className,
  variant = "caption",
}: PropertyRowProps) {
  return (
    <div className={className}>
      <p
        className={
          variant === "plain"
            ? "text-xs font-medium text-ink-muted"
            : "mb-1.5 text-xs font-medium uppercase tracking-wide text-ink-faint"
        }
      >
        {label}
      </p>

      {variant === "plain" ? (
        <div className="mt-1 flex items-center gap-1.5">{children}</div>
      ) : (
        children
      )}
    </div>
  );
}
