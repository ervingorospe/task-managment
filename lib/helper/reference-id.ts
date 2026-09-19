/** Org-scoped, human-facing counter (e.g. "tckt-00001") — distinct from the internal `id`. */
export function formatReferenceId(prefix: string, n: number): string {
  return `${prefix}-${String(n).padStart(5, "0")}`;
}
