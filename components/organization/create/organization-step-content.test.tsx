import { render, screen } from "@testing-library/react";
import OrganizationStepContent from "./organization-step-content";
import { useStepper } from "@/providers/stepper.provider";

jest.mock("@/providers/stepper.provider", () => {
  const actual = jest.requireActual("@/providers/stepper.provider");
  return { ...actual, useStepper: jest.fn() };
});
jest.mock("./steps/basic-information-step", () => function MockBasicInformationStep() {
  return <div>Basic Info Step</div>;
});
jest.mock("./steps/setting-step", () => function MockSettingStep() {
  return <div>Settings Step</div>;
});
jest.mock("./steps/role-step", () => function MockRoleStep() {
  return <div>Roles Step</div>;
});
jest.mock("./steps/invite-people-step", () => function MockInvitePeopleStep() {
  return <div>Invite People Step</div>;
});
jest.mock("./steps/default-tags-step", () => function MockDefaultTagsStep() {
  return <div>Default Tags Step</div>;
});

const mockedUseStepper = useStepper as jest.Mock;

function renderAtStep(currentStep: number) {
  mockedUseStepper.mockReturnValue({ currentStep });
  return render(<OrganizationStepContent />);
}

it.each([
  [1, "Basic Info Step"],
  [2, "Settings Step"],
  [3, "Roles Step"],
  [4, "Invite People Step"],
  [5, "Default Tags Step"],
])("renders the step component for currentStep %i", (currentStep, expectedText) => {
  renderAtStep(currentStep);
  expect(screen.getByText(expectedText)).toBeInTheDocument();
});
