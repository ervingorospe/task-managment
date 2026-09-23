"use client";

import { useEffect, useState } from "react";
import {
  getDefaultRoles,
  getDefaultTags,
  getOrgCapacity,
  getPermissionOptions,
  getRuleCategories,
  type PermissionOption,
} from "@/lib/data/organizations";
import { OrganizationDefaultsProvider } from "@/providers/organization-defaults.provider";
import { CreateOrganizationClient } from "@/components/organization/create/create-organization-client";
import BackButton from "@/components/ui/buttons/button-back";
import type { RoleDetail } from "@/lib/types/organization/role-detail.type";
import type { TagDetail } from "@/lib/types/organization/tag-detail.type";
import type { RuleCategory } from "@/lib/types/rule/rule-category.type";
import type { OrgCapacity } from "@/lib/types/organization/organization-capacity.type";
import Loading from "./loading";

interface DefaultsData {
  defaultRoles: RoleDetail[];
  permissionOptions: PermissionOption[];
  defaultTags: TagDetail[];
  ruleCategories: RuleCategory[];
  capacity: OrgCapacity;
}

// Client-side, not a Server Component fetch — the session cookie belongs
// to the backend's own domain, so a plain server-rendered request to this
// page never carries it in production (only a real browser fetch,
// credentials: "include", does). See hooks/use-organization-by-slug.ts.
export default function CreateOrganizationPage() {
  const [data, setData] = useState<DefaultsData | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getDefaultRoles(),
      getPermissionOptions(),
      getDefaultTags(),
      getRuleCategories(),
      getOrgCapacity(),
    ]).then(([defaultRoles, permissionOptions, defaultTags, ruleCategories, capacity]) => {
      if (cancelled) return;
      setData({ defaultRoles, permissionOptions, defaultTags, ruleCategories, capacity });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!data) return <Loading />;

  return (
    <OrganizationDefaultsProvider
      roles={data.defaultRoles}
      permissionOptions={data.permissionOptions}
      tags={data.defaultTags}
      ruleCategories={data.ruleCategories}
      capacity={data.capacity}
    >
      <BackButton />
      <CreateOrganizationClient />
    </OrganizationDefaultsProvider>
  );
}
