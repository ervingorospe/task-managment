"use client";

import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/providers/auth-provider";

/** A personal ticket has no org/role to check against — only its owner
 * can ever view it. */
export default function PersonalTicketAccessGuard({
  ownerId,
  children,
}: {
  ownerId: number | null | undefined;
  children: ReactNode;
}) {
  const { currentUser, isInitializing } = useAuth();

  // currentUser is briefly null while the session is still being restored
  // — that would otherwise read as "not the owner" and permanently 404 a
  // legitimate owner. Wait for the real answer first.
  if (isInitializing) return null;
  if (!currentUser || currentUser.id !== ownerId) notFound();
  return <>{children}</>;
}
