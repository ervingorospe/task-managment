export const MIN_SEARCH_LENGTH = 3;

/** Below the minimum length, this returns "" — treated as "no search yet" by callers. */
export function effectiveSearch(raw: string, minLength = MIN_SEARCH_LENGTH): string {
  const trimmed = raw.trim();
  return trimmed.length >= minLength ? trimmed : "";
}
