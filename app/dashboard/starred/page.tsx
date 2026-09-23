"use client";

import PersonalTicketsPageClient from "@/components/ticket/personal-tickets-page-client";

/** Starred personal tickets — same space as the personal tickets list,
 * available to every user. */
export default function PersonalStarredPage() {
  return <PersonalTicketsPageClient starredOnly />;
}
