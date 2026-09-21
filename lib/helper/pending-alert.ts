import type { InlineAlertVariant } from "@/components/ui/inline-alert";

const STORAGE_KEY = "pending-inline-alert";

/**
 * For an inline alert that needs to survive a redirect — e.g. deleting a
 * ticket from its own detail page, then landing on the list page it
 * redirects to, which is where the "Ticket X was removed" banner actually
 * belongs. There's no shared client state that spans a full navigation
 * here, so this rides in sessionStorage: set right before the
 * `router.push`, consumed once by the page that lands (see
 * useInlineAlert, which calls consumePendingAlert() on mount).
 */
export function setPendingAlert(
  message: string,
  variant: InlineAlertVariant = "success",
) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ message, variant }));
}

export function consumePendingAlert(): {
  message: string;
  variant: InlineAlertVariant;
} | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(STORAGE_KEY);
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
