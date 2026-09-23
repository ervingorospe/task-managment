"use client";

import PersonalTicketsPageClient from "@/components/ticket/personal-tickets-page-client";

/** Personal tickets belong to the user directly, not any organization —
 * every user has a Personal space, regardless of org membership. */
export default function PersonalTicketsPage() {
  return <PersonalTicketsPageClient />;
}
