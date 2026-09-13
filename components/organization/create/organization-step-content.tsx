"use client";

import BasicInformationStep from "./steps/basic-information-step";
import DefaultTagsStep from "./steps/default-tags-step";
import InvitePeopleStep from "./steps/invite-people-step";
import OrganizationSettingsStep from "./steps/setting-step";
import RolesStep from "./steps/role-step";
import StepperTransition from "@/components/ui/stepper/step-transition";
import { useStepper } from "@/providers/stepper.provider";

const stepComponents = {
  1: BasicInformationStep,
  2: OrganizationSettingsStep,
  3: RolesStep,
  4: InvitePeopleStep,
  5: DefaultTagsStep,
} as const;

export default function OrganizationStepContent() {
  const { currentStep } = useStepper();

  const Step = stepComponents[currentStep as keyof typeof stepComponents];

  return (
    <StepperTransition>
      <Step />
    </StepperTransition>
  );
}
