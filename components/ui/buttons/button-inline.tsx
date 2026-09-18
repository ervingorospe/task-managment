// components/ui/action-button.tsx

import type { ReactNode } from "react";
import clsx from "clsx";

interface ActionButtonProps {
  icon?: ReactNode;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export default function ButtonInline({
  icon,
  children,
  onClick,
  className,
}: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "flex items-center gap-1 rounded border border-dashed border-line px-2 py-1 text-xs text-ink-muted",
        "transition-colors hover:bg-canvas hover:text-ink",
        className,
      )}
    >
      {icon}
      {children}
    </button>
  );
}
