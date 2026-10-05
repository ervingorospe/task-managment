"use client";

import PersonalTicketsPageClient from "@/components/ticket/personal-tickets-page-client";
import { useDocumentTitle } from "@/hooks/use-document-title";

/** Starred personal tickets — same space as the personal tickets list,
 * available to every user. */
export default function PersonalStarredPage() {
  useDocumentTitle("Starred");
  return <PersonalTicketsPageClient starredOnly />;
}
