"use client";

import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { useIsOrganizationMember } from "@/hooks/use-is-organization-member";

export default function MemberGuard({
  organizationId,
  children,
}: {
  organizationId: number | null;
  children: ReactNode;
}) {
  if (!organizationId) notFound();

  const isMember = useIsOrganizationMember(organizationId);
  if (!isMember) notFound();
  return <>{children}</>;
}
