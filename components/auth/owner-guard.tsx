"use client";

import { notFound } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { useIsOrganizationOwner } from "@/hooks/use-is-organization-owner";
import type { ReactNode } from "react";

export function OwnerGuard({
  ownerId,
  children,
}: {
  ownerId: number;
  children: ReactNode;
}) {
  const { isInitializing } = useAuth();
  const isOwner = useIsOrganizationOwner(ownerId);

  // currentUser is briefly null while the session is still being restored
  // from the backend — useIsOrganizationOwner would read that as "not the
  // owner" and 404 a legitimate owner. Wait for the real answer instead of
  // permanently bouncing on a stale/empty first render.
  if (isInitializing) return null;
  if (!isOwner) notFound();
  return <>{children}</>;
}
