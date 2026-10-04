import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BasicInformation from "./basic-info-section";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { updateOrganizationBasicInfo } from "@/lib/api/organizations";
import { PERMISSIONS } from "@/lib/data/permissions";
import type { OrganizationDetail } from "@/lib/types/organization/organization-detail.type";

jest.mock("@/providers/auth-provider", () => {
  const actual = jest.requireActual("@/providers/auth-provider");
  return { ...actual, useAuth: jest.fn() };
});
jest.mock("@/providers/toast-provider", () => ({ useToast: jest.fn() }));
jest.mock("@/lib/api/organizations", () => ({ updateOrganizationBasicInfo: jest.fn() }));

const mockedUseAuth = useAuth as jest.Mock;
const mockedUseToast = useToast as jest.Mock;
const mockedUpdateBasicInfo = updateOrganizationBasicInfo as jest.Mock;

const toast = jest.fn();

function org(overrides: Partial<OrganizationDetail> = {}): OrganizationDetail {
  return {
    id: 6001,
    organizationName: "Acme Studio",
    organizationDesc: "A design studio",
    email: "hello@acme.com",
    website: "https://acme.com",
    ownerId: 1,
    settings: {} as OrganizationDetail["settings"],
    capacity: {} as OrganizationDetail["capacity"],
    owner: {} as OrganizationDetail["owner"],
    roles: [],
    tags: [],
    projects: [],
    members: [],
    tickets: [],
    ticketRequests: [],
    ...overrides,
  } as OrganizationDetail;
}

function withPermissions(actions: string[]) {
  mockedUseAuth.mockReturnValue({
    activeMembership: {
      role: {
        rules: actions.map((action, i) => ({ id: i, action, name: action, desc: "", categoryId: 1 })),
      },
    },
    isPersonalMode: false,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  withPermissions([PERMISSIONS.ORGANIZATION_UPDATE_BASIC_INFO]);
  mockedUseToast.mockReturnValue(toast);
});

function renderSection(overrides: Partial<React.ComponentProps<typeof BasicInformation>> = {}) {
  render(<BasicInformation organization={org()} {...overrides} />);
}

it("shows the organization's info in read-only view", () => {
  renderSection();
  expect(screen.getByText("Acme Studio")).toBeInTheDocument();
  expect(screen.getByText("hello@acme.com")).toBeInTheDocument();
  expect(screen.getByText("https://acme.com")).toBeInTheDocument();
  expect(screen.getByText("A design studio")).toBeInTheDocument();
});

it("shows fallbacks for missing optional fields", () => {
  renderSection({ organization: org({ email: undefined, website: undefined, organizationDesc: undefined }) });
  expect(screen.getAllByText("Not provided")).toHaveLength(2);
  expect(screen.getByText("No description provided")).toBeInTheDocument();
});

it("links the website out in a new tab", () => {
  renderSection();
  expect(screen.getByRole("link")).toHaveAttribute("href", "https://acme.com");
});

it("points the website link at an empty href when there's no website", () => {
  // displayInfo.website is seeded via `organization.website ?? ""`, so
  // it's always a string, never null/undefined.
  renderSection({ organization: org({ website: undefined }) });
  expect(document.querySelector("a")).toHaveAttribute("href", "");
});

it("hides the Edit button without organization.update_basic_info", () => {
  withPermissions([]);
  renderSection();
  expect(screen.queryByRole("button", { name: /Edit/ })).toBeNull();
});

describe("editing", () => {
  it("enters edit mode with fields prefilled", async () => {
    renderSection();
    await userEvent.click(screen.getByRole("button", { name: /Edit/ }));
    expect(screen.getByDisplayValue("Acme Studio")).toBeInTheDocument();
    expect(screen.getByDisplayValue("hello@acme.com")).toBeInTheDocument();
    expect(screen.getByDisplayValue("https://acme.com")).toBeInTheDocument();
    expect(screen.getByDisplayValue("A design studio")).toBeInTheDocument();
  });

  it("cancels without saving, discarding the draft", async () => {
    renderSection();
    await userEvent.click(screen.getByRole("button", { name: /Edit/ }));
    const nameInput = screen.getByDisplayValue("Acme Studio");
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "Renamed Co");
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByText("Acme Studio")).toBeInTheDocument();
    expect(mockedUpdateBasicInfo).not.toHaveBeenCalled();
  });

  it("does nothing (just exits edit mode) when nothing changed", async () => {
    renderSection();
    await userEvent.click(screen.getByRole("button", { name: /Edit/ }));
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(mockedUpdateBasicInfo).not.toHaveBeenCalled();
    expect(screen.getByText("Acme Studio")).toBeInTheDocument();
  });

  it("shows a validation error for an invalid email", async () => {
    renderSection();
    await userEvent.click(screen.getByRole("button", { name: /Edit/ }));
    const emailInput = screen.getByDisplayValue("hello@acme.com");
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, "not-an-email");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Enter a valid email address")).toBeInTheDocument();
    expect(mockedUpdateBasicInfo).not.toHaveBeenCalled();
  });

  it("saves only the changed fields, shows the updated info, and an alert", async () => {
    mockedUpdateBasicInfo.mockResolvedValue(undefined);
    renderSection();
    await userEvent.click(screen.getByRole("button", { name: /Edit/ }));
    const nameInput = screen.getByDisplayValue("Acme Studio");
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "Renamed Co");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(mockedUpdateBasicInfo).toHaveBeenCalledWith(6001, { organizationName: "Renamed Co" }),
    );
    expect(screen.getByText("Renamed Co")).toBeInTheDocument();
    expect(await screen.findByText("Organization information updated")).toBeInTheDocument();
  });

  it("toasts and stays in edit mode with the draft intact on failure", async () => {
    mockedUpdateBasicInfo.mockRejectedValue(new Error("boom"));
    renderSection();
    await userEvent.click(screen.getByRole("button", { name: /Edit/ }));
    const nameInput = screen.getByDisplayValue("Acme Studio");
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "Renamed Co");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith("Failed to update organization information", "error"),
    );
    expect(screen.getByDisplayValue("Renamed Co")).toBeInTheDocument();
  });
});
