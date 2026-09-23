"use client";

import { AccountTypeGuard } from "@/components/auth/account-type.guard";
import { ACCOUNT_TYPE } from "@/lib/constants/accoun-type.constant";
import PersonalTicketsPageClient from "@/components/ticket/personal-tickets-page-client";

/** Personal tickets belong to the user directly, not any organization —
 * owner-only, same guard as My Organizations. */
export default function PersonalTicketsPage() {
  return (
    <AccountTypeGuard accountType={ACCOUNT_TYPE.OWNER}>
      <PersonalTicketsPageClient />
    </AccountTypeGuard>
  );
}
