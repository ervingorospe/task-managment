"use client";

import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/providers/auth-provider";
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
  const { isInitializing } = useAuth();
  const canView = useCanViewTicket(ticket);

  // activeMembership is briefly null while the session is still being
  // restored — useCanViewTicket would read that as "can't view" and
  // permanently 404 someone who actually can. Wait for the real answer.
  if (isInitializing) return null;
  if (!canView) notFound();
  return <>{children}</>;
}
