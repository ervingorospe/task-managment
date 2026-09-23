"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, User as UserIcon } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { completeOnboarding } from "@/lib/api/auth";
import {
  getDefaultRoles,
  getPermissionOptions,
  getDefaultTags,
  getRuleCategories,
  getOrgCapacity,
} from "@/lib/data/organizations";
import { OrganizationDefaultsProvider } from "@/providers/organization-defaults.provider";
import { CreateOrganizationClient } from "@/components/organization/create/create-organization-client";
import type { RoleDetail } from "@/lib/types/organization/role-detail.type";
import type { TagDetail } from "@/lib/types/organization/tag-detail.type";
import type { Rule } from "@/lib/types/rule/rule.type";
import type { RuleCategory } from "@/lib/types/rule/rule-category.type";
import type { OrgCapacity } from "@/lib/types/organization/organization-capacity.type";

interface OrgDefaults {
  roles: RoleDetail[];
  permissionOptions: Rule[];
  tags: TagDetail[];
  ruleCategories: RuleCategory[];
  capacity: OrgCapacity;
}

function ChooseStep({ onChoose }: { onChoose: (choice: "personal" | "organization") => void }) {
  return (
    <div className="mx-auto max-w-xl">
      <div className="text-center">
        <h1 className="text-lg font-semibold text-ink">
          What brings you here?
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          This decides how your workspace is set up — you can still create
          an organization later either way.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onChoose("personal")}
          className="flex flex-col items-center gap-3 rounded border border-line bg-surface p-6 text-center transition-colors hover:border-accent-text hover:bg-accent-subtle"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-subtle text-accent-text">
            <UserIcon size={22} />
          </span>
          <span className="font-medium text-ink">Just for me</span>
          <span className="text-sm text-ink-muted">
            Track your own standalone tickets — no team, no organization.
          </span>
        </button>

        <button
          type="button"
          onClick={() => onChoose("organization")}
          className="flex flex-col items-center gap-3 rounded border border-line bg-surface p-6 text-center transition-colors hover:border-accent-text hover:bg-accent-subtle"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-subtle text-accent-text">
            <Building2 size={22} />
          </span>
          <span className="font-medium text-ink">My organization</span>
          <span className="text-sm text-ink-muted">
            Set up a workspace your team can join and collaborate in.
          </span>
        </button>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const { currentUser, isInitializing, isAuthenticated, refreshCurrentUser } =
    useAuth();

  const [step, setStep] = useState<"choose" | "organization">("choose");
  const [isSubmittingPersonal, setIsSubmittingPersonal] = useState(false);
  const [defaults, setDefaults] = useState<OrgDefaults | null>(null);

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) router.replace("/login");
  }, [isInitializing, isAuthenticated, router]);

  // Already onboarded *on arrival* (e.g. a stale bookmark/back-button) —
  // nothing to do here. Checked once on mount only, not reactively: the
  // "Organization" choice below also flips hasOnboarded true as a side
  // effect of creating the org, and its own handler already navigates
  // somewhere specific (the new org's page) — a reactive check here would
  // race that navigation and win, stranding the user on generic
  // /dashboard instead.
  const checkedOnboardedOnMount = useRef(false);
  useEffect(() => {
    if (checkedOnboardedOnMount.current || !currentUser) return;
    checkedOnboardedOnMount.current = true;
    if (currentUser.hasOnboarded) router.replace("/dashboard");
  }, [currentUser, router]);

  useEffect(() => {
    if (step !== "organization" || defaults) return;
    Promise.all([
      getDefaultRoles(),
      getPermissionOptions(),
      getDefaultTags(),
      getRuleCategories(),
      getOrgCapacity(),
    ]).then(([roles, permissionOptions, tags, ruleCategories, capacity]) => {
      setDefaults({ roles, permissionOptions, tags, ruleCategories, capacity });
    });
  }, [step, defaults]);

  async function handleChoosePersonal() {
    setIsSubmittingPersonal(true);
    try {
      await completeOnboarding();
      await refreshCurrentUser();
      router.push("/dashboard");
    } finally {
      setIsSubmittingPersonal(false);
    }
  }

  if (isInitializing || !isAuthenticated || currentUser?.hasOnboarded) {
    return null;
  }

  if (step === "organization") {
    if (!defaults) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-canvas">
          <p className="text-sm text-ink-muted">Loading…</p>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-canvas px-4 py-10">
        <OrganizationDefaultsProvider {...defaults}>
          <CreateOrganizationClient />
        </OrganizationDefaultsProvider>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      {isSubmittingPersonal ? (
        <p className="text-sm text-ink-muted">Setting things up…</p>
      ) : (
        <ChooseStep
          onChoose={(choice) =>
            choice === "personal"
              ? handleChoosePersonal()
              : setStep("organization")
          }
        />
      )}
    </div>
  );
}
