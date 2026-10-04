import { render, screen } from "@testing-library/react";
import { useEffect } from "react";
import userEvent from "@testing-library/user-event";
import { StepperProvider, useStepper } from "@/providers/stepper.provider";
import StepperActions from "./stepper-actions";

function TestHarness({
  totalSteps = 3,
  initialStep = 1,
  valid = false,
  ...actionProps
}: {
  totalSteps?: number;
  initialStep?: number;
  valid?: boolean;
} & React.ComponentProps<typeof StepperActions>) {
  function Inner() {
    const { setStepValid, currentStep } = useStepper();
    useEffect(() => setStepValid(valid), [setStepValid, currentStep]);
    return <StepperActions {...actionProps} />;
  }
  return (
    <StepperProvider totalSteps={totalSteps} initialStep={initialStep}>
      <Inner />
    </StepperProvider>
  );
}

it("hides Back on the first step", () => {
  render(<TestHarness initialStep={1} />);
  expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
});

it("shows Back on a later step and it navigates back", async () => {
  render(<TestHarness initialStep={2} totalSteps={3} />);
  await userEvent.click(screen.getByRole("button", { name: "Back" }));
  // Now on step 1: Back should be gone again.
  expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
});

it("shows Continue, disabled until the step is valid", () => {
  render(<TestHarness initialStep={1} totalSteps={3} valid={false} />);
  expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
});

it("enables Continue once valid, and advances the step on click", async () => {
  render(<TestHarness initialStep={1} totalSteps={3} valid />);
  const continueButton = screen.getByRole("button", { name: "Continue" });
  expect(continueButton).not.toBeDisabled();
  await userEvent.click(continueButton);
  // Now on step 2 — Back should now be visible.
  expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();
});

it("shows Finish (not Continue) on the last step, using the default label", () => {
  render(<TestHarness initialStep={3} totalSteps={3} valid />);
  expect(screen.getByRole("button", { name: "Finish" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Continue" })).toBeNull();
});

it("uses a custom completeLabel and calls onComplete when clicked", async () => {
  const onComplete = jest.fn();
  render(
    <TestHarness
      initialStep={3}
      totalSteps={3}
      valid
      completeLabel="Create organization"
      onComplete={onComplete}
    />,
  );
  await userEvent.click(screen.getByRole("button", { name: "Create organization" }));
  expect(onComplete).toHaveBeenCalledTimes(1);
});

it("disables Finish until the step is valid", () => {
  render(<TestHarness initialStep={3} totalSteps={3} valid={false} />);
  expect(screen.getByRole("button", { name: "Finish" })).toBeDisabled();
});

it("does not show Skip for now when the current step isn't skippable", () => {
  render(<TestHarness initialStep={1} totalSteps={3} skippableSteps={[2]} />);
  expect(screen.queryByRole("button", { name: "Skip for now" })).toBeNull();
});

it("Skip for now falls back to next(), which is still gated by step validity", async () => {
  // Skip's default handler is next() itself (not a bypass of it) — with
  // the step invalid, next() no-ops, so Skip doesn't advance either.
  render(<TestHarness initialStep={1} totalSteps={3} skippableSteps={[1]} valid={false} />);
  await userEvent.click(screen.getByRole("button", { name: "Skip for now" }));
  expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
});

it("Skip for now advances via next() once the step is valid", async () => {
  render(<TestHarness initialStep={1} totalSteps={3} skippableSteps={[1]} valid />);
  await userEvent.click(screen.getByRole("button", { name: "Skip for now" }));
  expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();
});

it("calls a custom onSkip instead of next() when provided", async () => {
  const onSkip = jest.fn();
  render(<TestHarness initialStep={1} totalSteps={3} skippableSteps={[1]} onSkip={onSkip} />);
  await userEvent.click(screen.getByRole("button", { name: "Skip for now" }));
  expect(onSkip).toHaveBeenCalledTimes(1);
  // Should NOT have advanced, since onSkip overrides next().
  expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
});
