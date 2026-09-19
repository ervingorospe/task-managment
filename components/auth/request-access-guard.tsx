"use client";

import { notFound } from "next/navigation";
import type { ReactNode } from "react";
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
  const canView = useCanViewRequest(request);
  if (!canView) notFound();
  return <>{children}</>;
}
