import { ApiError } from "@/lib/api/client";

/**
 * 409 Conflict means the request itself was fine but collided with
 * existing data (a duplicate name, a pending invite that's already
 * there, a race with another tab) — the same category as a validation
 * error from the user's point of view, not a system/server fault. Every
 * other failure toasts: 400/401/403/404/5xx from the backend, or no
 * response at all (a network failure / the backend being unreachable).
 */
export function shouldToastApiError(error: unknown): boolean {
  return !(error instanceof ApiError && error.status === 409);
}

export function apiErrorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

/** `notifyApiError(toast, error, "Failed to update assignees")` — the
 * drop-in replacement for `toast(errorMessage(error, fallback), "error")`
 * in every catch block, gated so 409s stay silent. */
export function notifyApiError(
  toast: (message: string, variant?: "success" | "error" | "info") => void,
  error: unknown,
  fallback: string,
): void {
  if (!shouldToastApiError(error)) return;
  toast(apiErrorMessage(error, fallback), "error");
}
