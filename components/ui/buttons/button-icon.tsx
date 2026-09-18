// components/ui/icon-button.tsx

import type { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  label: string;
  danger?: boolean;
}

export default function IconButton({
  icon,
  label,
  danger = false,
  className,
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={clsx(
        "rounded p-1.5 text-ink-faint transition-colors",
        danger
          ? "hover:bg-danger-subtle hover:text-danger"
          : "hover:bg-canvas hover:text-ink",
        className,
      )}
      {...props}
    >
      {icon}
    </button>
  );
}
