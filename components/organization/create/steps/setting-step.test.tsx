import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OrganizationSettingsStep from "./setting-step";
import { StepperProvider } from "@/providers/stepper.provider";

beforeAll(() => {
  URL.createObjectURL = jest.fn(() => "blob:preview-url");
  URL.revokeObjectURL = jest.fn();
});

function renderStep() {
  return render(
    <StepperProvider totalSteps={1}>
      <OrganizationSettingsStep />
    </StepperProvider>,
  );
}

it("renders the heading and shows a placeholder icon with no logo", () => {
  renderStep();
  expect(screen.getByText("Organization Settings")).toBeInTheDocument();
  expect(screen.queryByAltText("Organization logo preview")).toBeNull();
  expect(screen.queryByRole("button", { name: /Remove/ })).toBeNull();
});

it("defaults the timezone to the system timezone (UTC, pinned in test env)", () => {
  renderStep();
  expect(screen.getByText(/Detected from your device: UTC\./)).toBeInTheDocument();
});

it("uploads a logo, showing the preview and a remove button", async () => {
  renderStep();
  const file = new File(["logo-bytes"], "logo.png", { type: "image/png" });
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;

  await userEvent.upload(input, file);

  expect(await screen.findByAltText("Organization logo preview")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Remove/ })).toBeInTheDocument();
});

it("does nothing when the file input changes with no file selected", async () => {
  renderStep();
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;

  fireEvent.change(input, { target: { files: [] } });

  expect(screen.queryByAltText("Organization logo preview")).toBeNull();
});

it("clears the logo via the Remove button", async () => {
  renderStep();
  const file = new File(["logo-bytes"], "logo.png", { type: "image/png" });
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  await userEvent.upload(input, file);

  await userEvent.click(screen.getByRole("button", { name: /Remove/ }));

  expect(screen.queryByAltText("Organization logo preview")).toBeNull();
  expect(screen.queryByRole("button", { name: /Remove/ })).toBeNull();
});
