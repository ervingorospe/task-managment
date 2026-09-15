"use client";

import { createContext, useContext, type PropsWithChildren } from "react";
import { RoleDetail } from "@/lib/types/organization/role-detail.type";
import { TagDetail } from "@/lib/types/organization/tag-detail.type";
import { Rule } from "@/lib/types/rule/rule.type";
import { RuleCategory } from "@/lib/types/rule/rule-category.type";
import { OrgCapacity } from "@/lib/types/organization/organization-capacity.type";

interface OrganizationDefaultsValue {
  roles: RoleDetail[];
  permissionOptions: Rule[];
  ruleCategories: RuleCategory[];
  tags: TagDetail[];
  capacity: OrgCapacity;
}

const OrganizationDefaultsContext =
  createContext<OrganizationDefaultsValue | null>(null);

interface OrganizationDefaultsProviderProps
  extends PropsWithChildren, OrganizationDefaultsValue {}

// Distributes server-fetched catalog data (roles/permissions/tags) to the
// stepper's client components. Not a form provider — nothing here is user
// input, so it doesn't conflict with the per-step form isolation decision.
export function OrganizationDefaultsProvider({
  children,
  ...value
}: OrganizationDefaultsProviderProps) {
  return (
    <OrganizationDefaultsContext.Provider value={value}>
      {children}
    </OrganizationDefaultsContext.Provider>
  );
}

export function useOrganizationDefaults() {
  const context = useContext(OrganizationDefaultsContext);
  if (!context) {
    throw new Error(
      "useOrganizationDefaults must be used within OrganizationDefaultsProvider",
    );
  }
  return context;
}
