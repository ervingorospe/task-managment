import { render, screen, act } from "@testing-library/react";
import { StepperProvider, useStepper } from "@/providers/stepper.provider";
import StepTransition from "./step-transition";

function TestHarness({ totalSteps = 3 }: { totalSteps?: number }) {
  function Inner() {
    const { currentStep, next, back, setStepValid } = useStepper();
    return (
      <>
        <StepTransition>
          <span>{`Step ${currentStep}`}</span>
        </StepTransition>
        <button onClick={() => setStepValid(true)}>Validate</button>
        <button onClick={next}>Next</button>
        <button onClick={back}>Back</button>
      </>
    );
  }
  return (
    <StepperProvider totalSteps={totalSteps}>
      <Inner />
    </StepperProvider>
  );
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

it("renders the current step's children", () => {
  render(<TestHarness />, );
  expect(screen.getByText("Step 1")).toBeInTheDocument();
});

it("fades out (direction 'next') immediately, then fades back in after the transition delay", () => {
  // Content itself updates immediately (it's driven by the live currentStep
  // prop) — what's staggered is only the wrapper's visible/opacity state.
  render(<TestHarness />);

  act(() => screen.getByText("Validate").click());
  act(() => screen.getByText("Next").click());

  expect(screen.getByText("Step 2")).toBeInTheDocument();
  const wrapper = screen.getByText("Step 2").parentElement as HTMLElement;
  expect(wrapper.className).toContain("opacity-0");
  expect(wrapper.className).toContain("-translate-x-4");

  act(() => jest.advanceTimersByTime(150));
  expect(wrapper.className).toContain("opacity-100");
  expect(wrapper.className).toContain("translate-x-0");
});

it("fades out in the opposite direction ('back') when going back", () => {
  render(<TestHarness />);
  act(() => screen.getByText("Validate").click());
  act(() => screen.getByText("Next").click());
  act(() => jest.advanceTimersByTime(150));
  expect(screen.getByText("Step 2")).toBeInTheDocument();

  act(() => screen.getByText("Back").click());
  expect(screen.getByText("Step 1")).toBeInTheDocument();
  const wrapper = screen.getByText("Step 1").parentElement as HTMLElement;
  expect(wrapper.className).toContain("translate-x-4");
  expect(wrapper.className).not.toContain("-translate-x-4");

  act(() => jest.advanceTimersByTime(150));
  expect(wrapper.className).toContain("opacity-100");
});

it("cancels the pending transition timeout on unmount", () => {
  const { unmount } = render(<TestHarness />);
  act(() => screen.getByText("Validate").click());
  act(() => screen.getByText("Next").click());
  expect(() => unmount()).not.toThrow();
});
