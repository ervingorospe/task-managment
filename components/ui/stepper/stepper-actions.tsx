"use client";

import { Button } from "@/components/ui/Button";
import { useStepper } from "@/providers/stepper.provider";

interface StepperActionsProps {
  onComplete?: () => void;
  completeLabel?: string;
  skippableSteps?: number[];
  onSkip?: () => void;
}

export default function StepperActions({
  onComplete,
  completeLabel = "Finish",
  skippableSteps = [],
  onSkip,
}: StepperActionsProps) {
  const { back, next, currentStep, isStepValid, isFirstStep, isLastStep } =
    useStepper();

  const canSkip = skippableSteps.includes(currentStep);

  return (
    <div className="mt-8 flex items-center justify-between border-t border-line pt-5">
      <div>
        {!isFirstStep && (
          <Button variant="ghost" onClick={back}>
            Back
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {!isLastStep && (
          <>
            {canSkip && (
              <Button variant="ghost" onClick={onSkip ?? next}>
                Skip for now
              </Button>
            )}

            <Button onClick={next} disabled={!isStepValid}>
              Continue
            </Button>
          </>
        )}

        {isLastStep && (
          <Button onClick={onComplete} disabled={!isStepValid}>
            {completeLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
