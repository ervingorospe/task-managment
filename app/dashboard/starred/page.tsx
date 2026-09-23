"use client";

import { AccountTypeGuard } from "@/components/auth/account-type.guard";
import { ACCOUNT_TYPE } from "@/lib/constants/accoun-type.constant";
import PersonalTicketsPageClient from "@/components/ticket/personal-tickets-page-client";

/** Starred personal tickets — same guard as the personal tickets list. */
export default function PersonalStarredPage() {
  return (
    <AccountTypeGuard accountType={ACCOUNT_TYPE.OWNER}>
      <PersonalTicketsPageClient starredOnly />
    </AccountTypeGuard>
  );
}
