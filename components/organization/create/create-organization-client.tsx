"use client";

import { useRouter } from "next/navigation";
import OrganizationStepContent from "@/components/organization/create/organization-step-content";
import Stepper from "@/components/ui/stepper/stepper";
import StepperActions from "@/components/ui/stepper/stepper-actions";
import { StepperProvider, useStepper } from "@/providers/stepper.provider";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { buildCreateOrganizationPayload } from "@/lib/helper/build-create-organization-payload";

const organizationSteps = [
  "Basic Info",
  "Settings",
  "Roles",
  "Invite People",
  "Default Tags",
];

function CreateOrganizationInner() {
  const { formData } = useStepper();
  const { currentUser } = useAuth();
  const toast = useToast();
  const router = useRouter();

  function handleCreateOrganization() {
    if (!currentUser) return;

    const payload = buildCreateOrganizationPayload(formData, currentUser.id);

    // TODO: POST /organizations, body: payload
    console.log("organization payload", payload);

    toast(`Organization "${payload.organizationName}" created`);
    router.push("/dashboard/my-organizations");
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
