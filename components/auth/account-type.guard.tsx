"use client";

import { AccountType } from "@/lib/constants/accoun-type.constant";
import { useAuth } from "@/providers/auth-provider";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

interface AccountTypeGuardProps {
  accountType: AccountType;
  children: ReactNode;
}

export function AccountTypeGuard({
  accountType,
  children,
}: AccountTypeGuardProps) {
  const { currentUser } = useAuth();

  if (!currentUser || currentUser.account_type !== accountType) {
    return null;
  }

  return <>{children}</>;
}
