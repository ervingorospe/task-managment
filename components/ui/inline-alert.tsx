"use client";

import { CheckCircle2, XCircle, Info, X } from "lucide-react";

export type InlineAlertVariant = "success" | "error" | "info";

const variantConfig: Record<
  InlineAlertVariant,
  { icon: typeof CheckCircle2; className: string; iconClassName: string }
> = {
  success: {
    icon: CheckCircle2,
    className: "border-accent/30 bg-accent-subtle text-ink",
    iconClassName: "text-accent-text",
  },
  error: {
    icon: XCircle,
    className: "border-danger/30 bg-danger-subtle text-ink",
    iconClassName: "text-danger",
  },
  info: {
    icon: Info,
    className: "border-line bg-surface text-ink",
    iconClassName: "text-ink-muted",
  },
};

interface InlineAlertProps {
  message: string;
  variant?: InlineAlertVariant;
  onDismiss: () => void;
  className?: string;
}

/** A dismissible banner meant to sit inline in the page (e.g. above a
 * page's title), not float over content the way a toast does. Stays
 * until the user dismisses it — no auto-timeout. */
export function InlineAlert({
  message,
  variant = "success",
  onDismiss,
  className = "",
}: InlineAlertProps) {
  const { icon: Icon, className: variantClassName, iconClassName } =
    variantConfig[variant];

  return (
    <div
      role="status"
      className={`mb-4 flex items-start gap-2 rounded border px-3.5 py-2.5 text-sm ${variantClassName} ${className}`}
    >
      <Icon size={16} className={`mt-0.5 shrink-0 ${iconClassName}`} />
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 text-ink-faint transition-colors hover:text-ink"
      >
        <X size={14} />
      </button>
    </div>
  );
}
