import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BasicInformationStep from "./basic-information-step";
import { StepperProvider } from "@/providers/stepper.provider";

function renderStep() {
  return render(
    <StepperProvider totalSteps={1}>
      <BasicInformationStep />
    </StepperProvider>,
  );
}

it("renders the heading and all fields", () => {
  renderStep();
  expect(screen.getByText("Basic Information")).toBeInTheDocument();
  expect(screen.getByText("Tell us a little about your organization.")).toBeInTheDocument();
  expect(screen.getByPlaceholderText("Acme Studio")).toBeInTheDocument();
  expect(screen.getByPlaceholderText("hello@acme.com")).toBeInTheDocument();
  expect(screen.getByPlaceholderText("https://acme.com")).toBeInTheDocument();
  expect(screen.getByPlaceholderText("What does your organization do?")).toBeInTheDocument();
});

it("shows a validation error for a too-short organization name", async () => {
  renderStep();
  const name = screen.getByPlaceholderText("Acme Studio");
  await userEvent.type(name, "A");
  await userEvent.tab();
  expect(
    await screen.findByText("Organization name must be at least 2 characters"),
  ).toBeInTheDocument();
});

it("shows a validation error for an invalid website URL", async () => {
  renderStep();
  const website = screen.getByPlaceholderText("https://acme.com");
  await userEvent.type(website, "not-a-url");
  await userEvent.tab();
  expect(
    await screen.findByText("Enter a valid URL, e.g. https://example.com"),
  ).toBeInTheDocument();
});

it("accepts a valid organization name with the optional fields left blank", async () => {
  renderStep();
  const name = screen.getByPlaceholderText("Acme Studio");
  await userEvent.type(name, "Acme Studio");
  expect(
    screen.queryByText("Organization name must be at least 2 characters"),
  ).toBeNull();
});
