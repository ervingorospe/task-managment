"use client";

import { notFound } from "next/navigation";
import { useIsOrganizationOwner } from "@/hooks/use-is-organization-owner";
import type { ReactNode } from "react";

export function OwnerGuard({
  ownerId,
  children,
}: {
  ownerId: number;
  children: ReactNode;
}) {
  const isOwner = useIsOrganizationOwner(ownerId);
  if (!isOwner) notFound();
  return <>{children}</>;
}
