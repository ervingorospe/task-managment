"use client";

import { useRouter } from "next/navigation";
import OrganizationStepContent from "@/components/organization/create/organization-step-content";
import Stepper from "@/components/ui/stepper/stepper";
import StepperActions from "@/components/ui/stepper/stepper-actions";
import { StepperProvider, useStepper } from "@/providers/stepper.provider";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { buildCreateOrganizationPayload } from "@/lib/helper/build-create-organization-payload";
import { createOrganization } from "@/lib/api/organizations";

const organizationSteps = [
  "Basic Info",
  "Settings",
  "Roles",
  "Invite People",
  "Default Tags",
];

function CreateOrganizationInner() {
  const { formData } = useStepper();
  const { currentUser, refreshCurrentUser } = useAuth();
  const toast = useToast();
  const router = useRouter();

  async function handleCreateOrganization() {
    if (!currentUser) return;

    const payload = buildCreateOrganizationPayload(formData, currentUser.id);

    let organization;
    try {
      organization = await createOrganization(payload);
    } catch (error) {
      toast(
        error instanceof Error
          ? error.message
          : "Failed to create organization",
        "error",
      );
      return;
    }

    toast(`Organization "${organization.organizationName}" created`);
    await refreshCurrentUser();
    router.push(`/dashboard/my-organizations/${organization.settings.slug}`);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div>
        <h1 className="text-lg font-semibold text-ink">Create Organization</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Set up your organization in a few simple steps.
        </p>
      </div>
      <div className="mt-8">
        <Stepper steps={organizationSteps} />
      </div>
      <div className="mt-8 rounded border border-line bg-surface p-6">
        <OrganizationStepContent />
        <StepperActions
          skippableSteps={[3, 4]}
          completeLabel="Create Organization"
          onComplete={handleCreateOrganization}
        />
      </div>
    </div>
  );
}

export function CreateOrganizationClient() {
  return (
    <StepperProvider totalSteps={organizationSteps.length}>
      <CreateOrganizationInner />
    </StepperProvider>
  );
}
