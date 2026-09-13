"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

interface StepperContextValue {
  currentStep: number;
  totalSteps: number;
  next: () => void;
  back: () => void;
  goTo: (step: number) => void;
  setStepValid: (valid: boolean) => void;
  isStepValid: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
  /** Accumulated values from every step's form, merged as each one changes. */
  formData: Record<string, unknown>;
  updateFormData: (values: Record<string, unknown>) => void;
}

interface StepperProviderProps extends PropsWithChildren {
  totalSteps: number;
  initialStep?: number;
}

const StepperContext = createContext<StepperContextValue | null>(null);

export function StepperProvider({
  children,
  totalSteps,
  initialStep = 1,
}: StepperProviderProps) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isStepValid, setIsStepValid] = useState(false);
  const [formData, setFormData] = useState<Record<string, unknown>>({});

  function goTo(step: number) {
    if (step < 1 || step > totalSteps) return;
    setCurrentStep(step);
    setIsStepValid(false);
  }

  function next() {
    if (!isStepValid || currentStep >= totalSteps) return;
    setCurrentStep((step) => step + 1);
    setIsStepValid(false);
  }

  function back() {
    if (currentStep <= 1) return;
    setCurrentStep((step) => step - 1);
    setIsStepValid(false);
  }

  function updateFormData(values: Record<string, unknown>) {
    setFormData((prev) => ({ ...prev, ...values }));
  }

  const value = useMemo<StepperContextValue>(
    () => ({
      currentStep,
      totalSteps,
      next,
      back,
      goTo,
      setStepValid: setIsStepValid,
      isStepValid,
      isFirstStep: currentStep === 1,
      isLastStep: currentStep === totalSteps,
      formData,
      updateFormData,
    }),
    [currentStep, totalSteps, isStepValid, formData],
  );

  return (
    <StepperContext.Provider value={value}>{children}</StepperContext.Provider>
  );
}

export function useStepper() {
  const context = useContext(StepperContext);
  if (!context) {
    throw new Error("useStepper must be used within StepperProvider");
  }
  return context;
}
