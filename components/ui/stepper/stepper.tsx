"use client";

import clsx from "clsx";
import { useStepper } from "@/providers/stepper.provider";

interface StepperProps {
  steps: string[];
}

export default function Stepper({ steps }: StepperProps) {
  const { currentStep, goTo } = useStepper();

  return (
    <nav aria-label="Progress">
      <ol className="flex items-center">
        {steps.map((label, index) => {
          const step = index + 1;
          const completed = step < currentStep;
          const active = step === currentStep;
          const last = step === steps.length;

          return (
            <li
              key={label}
              className={clsx("flex items-center", !last && "flex-1")}
            >
              <button
                type="button"
                disabled={step > currentStep}
                onClick={() => goTo(step)}
                className={clsx(
                  "flex items-center gap-2 text-sm transition-colors duration-200",
                  active && "text-ink",
                  completed && "text-accent-text",
                  !active && !completed && "text-ink-faint",
                  step > currentStep && "cursor-default",
                )}
              >
                <span
                  className={clsx(
                    "flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold transition-all duration-200",
                    active && "border-accent bg-accent text-ink shadow-sm",
                    completed &&
                      "border-accent bg-accent-subtle text-accent-text",
                    !active &&
                      !completed &&
                      "border-line bg-surface text-ink-faint",
                  )}
                >
                  {step}
                </span>

                <span className="hidden md:inline">{label}</span>
              </button>

              {!last && (
                <div
                  className={clsx(
                    "mx-3 h-px flex-1 transition-colors duration-300",
                    completed ? "bg-accent" : "bg-line",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
