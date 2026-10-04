import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateOrganizationClient } from "./create-organization-client";
import { useStepper } from "@/providers/stepper.provider";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { createOrganization } from "@/lib/api/organizations";
import { useRouter } from "next/navigation";

jest.mock("@/providers/stepper.provider", () => {
  const actual = jest.requireActual("@/providers/stepper.provider");
  return { ...actual, useStepper: jest.fn() };
});
jest.mock("@/providers/auth-provider", () => ({ useAuth: jest.fn() }));
jest.mock("@/providers/toast-provider", () => ({ useToast: jest.fn() }));
jest.mock("@/lib/api/organizations", () => ({ createOrganization: jest.fn() }));
jest.mock("next/navigation", () => ({ useRouter: jest.fn() }));
jest.mock("@/components/organization/create/organization-step-content", () => function MockOrganizationStepContent() {
  return <div>Step Content</div>;
});

const mockedUseStepper = useStepper as jest.Mock;
const mockedUseAuth = useAuth as jest.Mock;
const mockedUseToast = useToast as jest.Mock;
const mockedCreateOrganization = createOrganization as jest.Mock;
const mockedUseRouter = useRouter as jest.Mock;

const toast = jest.fn();
const push = jest.fn();
const refreshCurrentUser = jest.fn();
const next = jest.fn();
const back = jest.fn();
const goTo = jest.fn();

function withStepperState(overrides: Partial<ReturnType<typeof useStepper>> = {}) {
  mockedUseStepper.mockReturnValue({
    formData: { organizationName: "Acme Studio", timezone: "UTC", roles: [], invites: [], tags: [] },
    currentStep: 5,
    totalSteps: 5,
    next,
    back,
    goTo,
    setStepValid: jest.fn(),
    isStepValid: true,
    isFirstStep: false,
    isLastStep: true,
    updateFormData: jest.fn(),
    ...overrides,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  withStepperState();
  mockedUseAuth.mockReturnValue({
    currentUser: { id: 1, email: "jane@acmestudio.com" },
    refreshCurrentUser,
  });
  mockedUseToast.mockReturnValue(toast);
  mockedUseRouter.mockReturnValue({ push });
});

it("renders the heading, stepper nav, and step content", () => {
  render(<CreateOrganizationClient />);
  expect(screen.getByRole("heading", { name: "Create Organization" })).toBeInTheDocument();
  expect(screen.getByText("Step Content")).toBeInTheDocument();
  expect(screen.getByText("Basic Info")).toBeInTheDocument();
  expect(screen.getByText("Default Tags")).toBeInTheDocument();
});

it("creates the organization from the accumulated form data, toasts, refreshes the user, and redirects", async () => {
  mockedCreateOrganization.mockResolvedValue({
    organizationName: "Acme Studio",
    settings: { slug: "acme-studio" },
  });
  render(<CreateOrganizationClient />);

  await userEvent.click(screen.getByRole("button", { name: "Create Organization" }));

  expect(mockedCreateOrganization).toHaveBeenCalledWith(
    expect.objectContaining({ organizationName: "Acme Studio", timezone: "UTC" }),
  );
  expect(toast).toHaveBeenCalledWith('Organization "Acme Studio" created');
  expect(refreshCurrentUser).toHaveBeenCalled();
  expect(push).toHaveBeenCalledWith("/dashboard/my-organizations/acme-studio");
});

it("toasts the error message and does not navigate when creation fails", async () => {
  mockedCreateOrganization.mockRejectedValue(new Error("Name already taken"));
  render(<CreateOrganizationClient />);

  await userEvent.click(screen.getByRole("button", { name: "Create Organization" }));

  expect(toast).toHaveBeenCalledWith("Name already taken", "error");
  expect(refreshCurrentUser).not.toHaveBeenCalled();
  expect(push).not.toHaveBeenCalled();
});

it("falls back to a generic error message when the failure isn't an Error instance", async () => {
  mockedCreateOrganization.mockRejectedValue("network down");
  render(<CreateOrganizationClient />);

  await userEvent.click(screen.getByRole("button", { name: "Create Organization" }));

  expect(toast).toHaveBeenCalledWith("Failed to create organization", "error");
});

it("does nothing if there's no current user", async () => {
  mockedUseAuth.mockReturnValue({ currentUser: null, refreshCurrentUser });
  render(<CreateOrganizationClient />);

  await userEvent.click(screen.getByRole("button", { name: "Create Organization" }));

  expect(mockedCreateOrganization).not.toHaveBeenCalled();
});
