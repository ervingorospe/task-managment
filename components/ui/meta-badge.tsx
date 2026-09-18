import type { ReactNode } from "react";

export function MetaBadge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-sm bg-canvas px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-ink-faint">
      {children}
    </span>
  );
}
