"use client";

import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { useCanViewTicket } from "@/hooks/use-can-view-ticket";
import type { MemberDetail } from "@/lib/types/organization/member-detail.type";

interface TicketAccessGuardProps {
  ticket: {
    client: MemberDetail | null;
    assignees: MemberDetail[];
  };
  children: ReactNode;
}

export default function TicketAccessGuard({
  ticket,
  children,
}: TicketAccessGuardProps) {
  const canView = useCanViewTicket(ticket);
  if (!canView) notFound();
  return <>{children}</>;
}
