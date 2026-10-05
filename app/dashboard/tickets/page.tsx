"use client";

import PersonalTicketsPageClient from "@/components/ticket/personal-tickets-page-client";
import { useDocumentTitle } from "@/hooks/use-document-title";

/** Personal tickets belong to the user directly, not any organization —
 * every user has a Personal space, regardless of org membership. */
export default function PersonalTicketsPage() {
  useDocumentTitle("Tickets");
  return <PersonalTicketsPageClient />;
}
