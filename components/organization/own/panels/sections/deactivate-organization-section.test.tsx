import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import DeactivateOrganizationSection from "./deactivate-organization-section";
import { useToast } from "@/providers/toast-provider";
import { useAuth } from "@/providers/auth-provider";
import { updateOrganizationActiveState, deleteOrganization } from "@/lib/api/organizations";

jest.mock("next/navigation", () => ({ useRouter: jest.fn() }));
jest.mock("@/providers/toast-provider", () => ({ useToast: jest.fn() }));
jest.mock("@/providers/auth-provider", () => ({ useAuth: jest.fn() }));
jest.mock("@/lib/api/organizations", () => ({
  updateOrganizationActiveState: jest.fn(),
  deleteOrganization: jest.fn(),
}));

const mockedUseRouter = useRouter as jest.Mock;
const mockedUseToast = useToast as jest.Mock;
const mockedUseAuth = useAuth as jest.Mock;
const mockedUpdateActiveState = updateOrganizationActiveState as jest.Mock;
const mockedDeleteOrganization = deleteOrganization as jest.Mock;

const push = jest.fn();
const toast = jest.fn();
const removeMembership = jest.fn();
const refreshCurrentUser = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseRouter.mockReturnValue({ push });
  mockedUseToast.mockReturnValue(toast);
  mockedUseAuth.mockReturnValue({ removeMembership, refreshCurrentUser });
  refreshCurrentUser.mockResolvedValue(undefined);
});

function renderSection(overrides: Partial<React.ComponentProps<typeof DeactivateOrganizationSection>> = {}) {
  render(<DeactivateOrganizationSection orgId={6001} organizationName="Acme Studio" {...overrides} />);
}

it("shows the deactivate row and action for an active org", () => {
  renderSection();
  expect(screen.getByText("Deactivate this organization")).toBeInTheDocument();
  expect(screen.getByText("Members will lose access. You can reactivate at any time.")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Deactivate" })).toBeInTheDocument();
});

it("shows the activate row and action for an inactive org", () => {
  renderSection({ initialIsActive: false });
  expect(screen.getByText("Activate this organization")).toBeInTheDocument();
  expect(
    screen.getByText("This organization is currently deactivated. Members have no access."),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Activate" })).toBeInTheDocument();
});

describe("deactivate", () => {
  it("opens a confirm dialog, deactivates, flips to the activate row, and refreshes the user", async () => {
    mockedUpdateActiveState.mockResolvedValue(undefined);
    renderSection();
    await userEvent.click(screen.getByRole("button", { name: "Deactivate" }));
    expect(await screen.findByText('Deactivate "Acme Studio"?')).toBeInTheDocument();

    const confirmButtons = screen.getAllByRole("button", { name: "Deactivate organization" });
    await userEvent.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => expect(mockedUpdateActiveState).toHaveBeenCalledWith(6001, false));
    expect(await screen.findByText("Activate this organization")).toBeInTheDocument();
    await waitFor(() => expect(refreshCurrentUser).toHaveBeenCalled());
  });

  it("toasts and keeps the org active on failure", async () => {
    mockedUpdateActiveState.mockRejectedValue(new Error("boom"));
    renderSection();
    await userEvent.click(screen.getByRole("button", { name: "Deactivate" }));
    const confirmButtons = await screen.findAllByRole("button", { name: "Deactivate organization" });
    await userEvent.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith("Failed to deactivate organization", "error"),
    );
    expect(screen.getByText("Deactivate this organization")).toBeInTheDocument();
    expect(refreshCurrentUser).not.toHaveBeenCalled();
  });

  it("closes without deactivating on cancel", async () => {
    renderSection();
    await userEvent.click(screen.getByRole("button", { name: "Deactivate" }));
    await screen.findByText('Deactivate "Acme Studio"?');
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(mockedUpdateActiveState).not.toHaveBeenCalled();
  });
});

describe("activate", () => {
  it("opens a confirm dialog, activates, toasts, flips to the deactivate row, and refreshes the user", async () => {
    mockedUpdateActiveState.mockResolvedValue(undefined);
    renderSection({ initialIsActive: false });
    await userEvent.click(screen.getByRole("button", { name: "Activate" }));
    expect(await screen.findByText('Activate "Acme Studio"?')).toBeInTheDocument();

    const confirmButtons = screen.getAllByRole("button", { name: "Activate organization" });
    await userEvent.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => expect(mockedUpdateActiveState).toHaveBeenCalledWith(6001, true));
    expect(toast).toHaveBeenCalledWith('"Acme Studio" activated');
    expect(await screen.findByText("Deactivate this organization")).toBeInTheDocument();
    await waitFor(() => expect(refreshCurrentUser).toHaveBeenCalled());
  });

  it("toasts and keeps the org inactive on failure", async () => {
    mockedUpdateActiveState.mockRejectedValue(new Error("boom"));
    renderSection({ initialIsActive: false });
    await userEvent.click(screen.getByRole("button", { name: "Activate" }));
    const confirmButtons = await screen.findAllByRole("button", { name: "Activate organization" });
    await userEvent.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith("Failed to activate organization", "error"),
    );
    expect(screen.getByText("Activate this organization")).toBeInTheDocument();
  });
});

describe("delete", () => {
  it("opens a confirm dialog, deletes, removes the membership, and redirects", async () => {
    mockedDeleteOrganization.mockResolvedValue(undefined);
    renderSection();
    await userEvent.click(screen.getByRole("button", { name: "Delete organization" }));
    expect(await screen.findByText('Delete "Acme Studio"?')).toBeInTheDocument();

    const confirmButtons = screen.getAllByRole("button", { name: "Delete organization" });
    await userEvent.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => expect(mockedDeleteOrganization).toHaveBeenCalledWith(6001));
    expect(removeMembership).toHaveBeenCalledWith(6001);
    expect(push).toHaveBeenCalledWith("/dashboard/my-organizations");
  });

  it("toasts and does not redirect on failure", async () => {
    mockedDeleteOrganization.mockRejectedValue(new Error("boom"));
    renderSection();
    await userEvent.click(screen.getByRole("button", { name: "Delete organization" }));
    const confirmButtons = await screen.findAllByRole("button", { name: "Delete organization" });
    await userEvent.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith("Failed to delete organization", "error"),
    );
    expect(removeMembership).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("closes without deleting on cancel", async () => {
    renderSection();
    await userEvent.click(screen.getByRole("button", { name: "Delete organization" }));
    await screen.findByText('Delete "Acme Studio"?');
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(mockedDeleteOrganization).not.toHaveBeenCalled();
  });
});
