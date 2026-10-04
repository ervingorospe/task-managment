import { renderHook, act } from "@testing-library/react";
import { StepperProvider, useStepper } from "./stepper.provider";

function wrapperFor(totalSteps: number, initialStep?: number) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <StepperProvider totalSteps={totalSteps} initialStep={initialStep}>
        {children}
      </StepperProvider>
    );
  };
}

it("throws when used outside a StepperProvider", () => {
  expect(() => renderHook(() => useStepper())).toThrow(
    "useStepper must be used within StepperProvider",
  );
});

it("defaults to step 1, invalid, with isFirstStep true", () => {
  const { result } = renderHook(() => useStepper(), { wrapper: wrapperFor(3) });
  expect(result.current.currentStep).toBe(1);
  expect(result.current.isStepValid).toBe(false);
  expect(result.current.isFirstStep).toBe(true);
  expect(result.current.isLastStep).toBe(false);
});

it("honors a custom initialStep", () => {
  const { result } = renderHook(() => useStepper(), { wrapper: wrapperFor(3, 2) });
  expect(result.current.currentStep).toBe(2);
});

describe("next", () => {
  it("does nothing while the current step is invalid", () => {
    const { result } = renderHook(() => useStepper(), { wrapper: wrapperFor(3) });
    act(() => result.current.next());
    expect(result.current.currentStep).toBe(1);
  });

  it("advances and resets validity once the step is valid", () => {
    const { result } = renderHook(() => useStepper(), { wrapper: wrapperFor(3) });
    act(() => result.current.setStepValid(true));
    act(() => result.current.next());
    expect(result.current.currentStep).toBe(2);
    expect(result.current.isStepValid).toBe(false);
  });

  it("does nothing at the last step even if valid", () => {
    const { result } = renderHook(() => useStepper(), { wrapper: wrapperFor(1) });
    act(() => result.current.setStepValid(true));
    act(() => result.current.next());
    expect(result.current.currentStep).toBe(1);
    expect(result.current.isLastStep).toBe(true);
  });
});

describe("back", () => {
  it("does nothing at step 1", () => {
    const { result } = renderHook(() => useStepper(), { wrapper: wrapperFor(3) });
    act(() => result.current.back());
    expect(result.current.currentStep).toBe(1);
  });

  it("decrements and resets validity", () => {
    const { result } = renderHook(() => useStepper(), { wrapper: wrapperFor(3, 2) });
    act(() => result.current.setStepValid(true));
    act(() => result.current.back());
    expect(result.current.currentStep).toBe(1);
    expect(result.current.isStepValid).toBe(false);
  });
});

describe("goTo", () => {
  it("ignores an out-of-range step (below 1 or above totalSteps)", () => {
    const { result } = renderHook(() => useStepper(), { wrapper: wrapperFor(3, 2) });
    act(() => result.current.goTo(0));
    expect(result.current.currentStep).toBe(2);
    act(() => result.current.goTo(4));
    expect(result.current.currentStep).toBe(2);
  });

  it("jumps to a valid step and resets validity", () => {
    const { result } = renderHook(() => useStepper(), { wrapper: wrapperFor(3) });
    act(() => result.current.setStepValid(true));
    act(() => result.current.goTo(3));
    expect(result.current.currentStep).toBe(3);
    expect(result.current.isStepValid).toBe(false);
    expect(result.current.isLastStep).toBe(true);
  });
});

describe("updateFormData", () => {
  it("merges new values into the accumulated formData", () => {
    const { result } = renderHook(() => useStepper(), { wrapper: wrapperFor(3) });
    act(() => result.current.updateFormData({ name: "Acme Studio" }));
    act(() => result.current.updateFormData({ email: "hello@acmestudio.com" }));
    expect(result.current.formData).toEqual({
      name: "Acme Studio",
      email: "hello@acmestudio.com",
    });
  });

  it("overwrites a field on a later update", () => {
    const { result } = renderHook(() => useStepper(), { wrapper: wrapperFor(3) });
    act(() => result.current.updateFormData({ name: "First" }));
    act(() => result.current.updateFormData({ name: "Second" }));
    expect(result.current.formData).toEqual({ name: "Second" });
  });
});
