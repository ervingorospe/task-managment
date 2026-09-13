"use client";

import { useAuth } from "@/providers/auth-provider";

/** Convenience accessor — the org the user is currently acting in. */
export function useActiveOrganization() {
  const { activeMembership } = useAuth();
  return activeMembership?.organization ?? null;
}
