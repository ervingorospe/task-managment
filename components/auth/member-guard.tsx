"use client";

import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { useIsOrganizationMember } from "@/hooks/use-is-organization-member";

export default function MemberGuard({
  organizationId,
  children,
}: {
  organizationId: number;
  children: ReactNode;
}) {
  const isMember = useIsOrganizationMember(organizationId);
  if (!isMember) notFound();
  return <>{children}</>;
}
