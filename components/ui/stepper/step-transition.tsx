"use client";

import { useEffect, useState, type ReactNode } from "react";
import clsx from "clsx";
import { useStepper } from "@/providers/stepper.provider";

interface StepTransitionProps {
  children: ReactNode;
}

export default function StepTransition({ children }: StepTransitionProps) {
  const { currentStep } = useStepper();

  const [displayedStep, setDisplayedStep] = useState(currentStep);
  const [direction, setDirection] = useState<"next" | "back">("next");
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (currentStep === displayedStep) return;

    setDirection(currentStep > displayedStep ? "next" : "back");
    setVisible(false);

    const timeout = window.setTimeout(() => {
      setDisplayedStep(currentStep);
      setVisible(true);
    }, 150);

    return () => window.clearTimeout(timeout);
  }, [currentStep, displayedStep]);

  return (
    <div className="overflow-hidden">
      <div
        className={clsx(
          "transition-all duration-200 ease-out",
          visible
            ? "translate-x-0 opacity-100"
            : direction === "next"
              ? "-translate-x-4 opacity-0"
              : "translate-x-4 opacity-0",
        )}
      >
        {children}
      </div>
    </div>
  );
}
