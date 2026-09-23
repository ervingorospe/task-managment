"use client";

import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/providers/auth-provider";
import { useCanViewRequest } from "@/hooks/use-can-view-request";
import type { MemberDetail } from "@/lib/types/organization/member-detail.type";

interface RequestAccessGuardProps {
  request: {
    client: MemberDetail;
  };
  children: ReactNode;
}

export default function RequestAccessGuard({
  request,
  children,
}: RequestAccessGuardProps) {
  const { isInitializing } = useAuth();
  const canView = useCanViewRequest(request);

  // activeMembership is briefly null while the session is still being
  // restored — useCanViewRequest would read that as "can't view" and
  // permanently 404 someone who actually can. Wait for the real answer.
  if (isInitializing) return null;
  if (!canView) notFound();
  return <>{children}</>;
}
