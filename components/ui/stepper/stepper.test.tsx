import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StepperProvider } from "@/providers/stepper.provider";
import Stepper from "./stepper";

const STEPS = ["Basic Info", "Settings", "Invites"];

function TestHarness({ initialStep = 1 }: { initialStep?: number }) {
  return (
    <StepperProvider totalSteps={STEPS.length} initialStep={initialStep}>
      <Stepper steps={STEPS} />
    </StepperProvider>
  );
}

it("renders every step's number and label", () => {
  render(<TestHarness />);
  expect(screen.getByText("1")).toBeInTheDocument();
  expect(screen.getByText("Basic Info")).toBeInTheDocument();
  expect(screen.getByText("Settings")).toBeInTheDocument();
  expect(screen.getByText("Invites")).toBeInTheDocument();
});

it("marks the current step active and disables future steps", () => {
  render(<TestHarness initialStep={2} />);
  const futureStepButton = screen.getByRole("button", { name: /3\s*Invites/ });
  expect(futureStepButton).toBeDisabled();
  const currentStepButton = screen.getByRole("button", { name: /2\s*Settings/ });
  expect(currentStepButton).not.toBeDisabled();
});

it("navigates to a completed (past) step when clicked", async () => {
  render(<TestHarness initialStep={2} />);
  await userEvent.click(screen.getByRole("button", { name: /1\s*Basic Info/ }));
  // Step 1 is now current — its number bubble should carry the active style.
  const step1Button = screen.getByRole("button", { name: /1\s*Basic Info/ });
  expect(step1Button.className).toContain("text-ink");
});

it("does nothing when clicking a disabled future step", async () => {
  render(<TestHarness initialStep={1} />);
  await userEvent.click(screen.getByRole("button", { name: /3\s*Invites/ }));
  const step1Button = screen.getByRole("button", { name: /1\s*Basic Info/ });
  expect(step1Button.className).toContain("text-ink");
});

it("does not render a connecting line after the last step", () => {
  const { container } = render(<TestHarness />);
  const items = container.querySelectorAll("li");
  const lastItem = items[items.length - 1];
  expect(lastItem.querySelector(".mx-3")).toBeNull();
});
