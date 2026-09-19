import type { ReactNode } from "react";

import Card from "@/components/ui/card";
import { Button } from "@/components/ui/buttons/button";

interface DangerZoneCardProps {
  children: ReactNode;
  subtitle?: string;
}

export function DangerZoneCard({
  children,
  subtitle = "Irreversible and access-affecting actions for this organization.",
}: DangerZoneCardProps) {
  return (
    <Card title="Danger Zone" subtitle={subtitle}>
      <div className="space-y-3">{children}</div>
    </Card>
  );
}

interface DangerZoneRowProps {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  /** "danger" (default): red row for destructive actions. "default": neutral row for reversible actions. */
  variant?: "danger" | "default";
}

export function DangerZoneRow({
  title,
  description,
  actionLabel,
  onAction,
  variant = "danger",
}: DangerZoneRowProps) {
  return (
    <div
      className={`flex items-center justify-between rounded border px-4 py-3 ${
        variant === "danger"
          ? "border-danger/30 bg-danger-subtle"
          : "border-line bg-canvas"
      }`}
    >
      <div>
        <p className="text-sm font-medium text-ink">{title}</p>
        <p className="mt-0.5 text-xs text-ink-muted">{description}</p>
      </div>
      <Button
        variant={variant === "danger" ? "danger" : "secondary"}
        onClick={onAction}
      >
        {actionLabel}
      </Button>
    </div>
  );
}
