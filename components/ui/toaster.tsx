"use client";

import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { useToastList, type ToastVariant } from "@/providers/toast-provider";

const variantConfig: Record<
  ToastVariant,
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

export function Toaster() {
  const { toasts, dismissToast } = useToastList();

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2">
      {toasts.map((toast) => {
        const { icon: Icon, className, iconClassName } =
          variantConfig[toast.variant];

        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-2 rounded border px-3.5 py-3 text-sm shadow-md ${className}`}
          >
            <Icon size={16} className={`mt-0.5 shrink-0 ${iconClassName}`} />
            <span className="flex-1">{toast.message}</span>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss"
              className="shrink-0 text-ink-faint transition-colors hover:text-ink"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
