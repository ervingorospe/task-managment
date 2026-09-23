"use client";

import { useEffect, useState } from "react";
import {
  getPermissionOptions,
  getRuleCategories,
  type PermissionOption,
} from "@/lib/data/organizations";
import type { RuleCategory } from "@/lib/types/rule/rule-category.type";

interface Result {
  permissionOptions: PermissionOption[];
  ruleCategories: RuleCategory[];
  loading: boolean;
}

/** The full set of Rules/categories the system defines — reference data
 * for role editors, same everywhere, no org-scoping. Client-side for the
 * same reason as use-organization-by-slug.ts: it still requires being
 * logged in, which a Server Component fetch can't reliably prove in
 * production. */
export function useOrgReferenceData(): Result {
  const [permissionOptions, setPermissionOptions] = useState<
    PermissionOption[]
  >([]);
  const [ruleCategories, setRuleCategories] = useState<RuleCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getPermissionOptions(), getRuleCategories()]).then(
      ([options, categories]) => {
        if (cancelled) return;
        setPermissionOptions(options);
        setRuleCategories(categories);
        setLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  return { permissionOptions, ruleCategories, loading };
}
