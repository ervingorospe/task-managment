jest.mock("@/components/organization/own/change-owner-modal", () => ({
  __esModule: true,
  ChangeOwnerModal: (props: { open: boolean; onClose: () => void; onSent: (email: string) => void }) =>
    props.open ? (
      <div data-testid="change-owner-modal">
        <button
          onClick={() => {
            // Mirrors the real ChangeOwnerModal, which calls onSent then
            // onClose together on a successful submit.
            props.onSent("new-owner@acme.com");
            props.onClose();
          }}
        >
          submit-owner-form
        </button>
        <button onClick={props.onClose}>close-owner-form</button>
      </div>
    ) : null,
}));

import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OrganizationInfoSection from "./organization-info-section";
import { useToast } from "@/providers/toast-provider";
import { useAuth } from "@/providers/auth-provider";
import {
  updateOrganizationTimezone,
  uploadOrganizationLogo,
  cancelOwnershipTransfer,
} from "@/lib/api/organizations";
import type { OrganizationDetail } from "@/lib/types/organization/organization-detail.type";

jest.mock("@/providers/toast-provider", () => ({ useToast: jest.fn() }));
jest.mock("@/providers/auth-provider", () => ({ useAuth: jest.fn() }));
jest.mock("@/lib/api/organizations", () => ({
  updateOrganizationTimezone: jest.fn(),
  uploadOrganizationLogo: jest.fn(),
  cancelOwnershipTransfer: jest.fn(),
}));

const mockedUseToast = useToast as jest.Mock;
const mockedUseAuth = useAuth as jest.Mock;
const mockedUpdateTimezone = updateOrganizationTimezone as jest.Mock;
const mockedUploadLogo = uploadOrganizationLogo as jest.Mock;
const mockedCancelTransfer = cancelOwnershipTransfer as jest.Mock;

const toast = jest.fn();
const refreshCurrentUser = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseToast.mockReturnValue(toast);
  mockedUseAuth.mockReturnValue({ refreshCurrentUser });
  refreshCurrentUser.mockResolvedValue(undefined);
  URL.createObjectURL = jest.fn(() => "blob:preview-url");
  URL.revokeObjectURL = jest.fn();
});

function org(overrides: Partial<OrganizationDetail> = {}): OrganizationDetail {
  return {
    id: 6001,
    organizationName: "Acme Studio",
    ownerId: 1,
    settings: { logo: "", timezone: "UTC" } as OrganizationDetail["settings"],
    capacity: {} as OrganizationDetail["capacity"],
    owner: { id: 1, firstName: "Jane", lastName: "Doe", email: "jane@acmestudio.com" } as OrganizationDetail["owner"],
    roles: [],
    tags: [],
    projects: [],
    members: [],
    tickets: [],
    ticketRequests: [],
    pendingOwnershipTransfer: undefined,
    ...overrides,
  } as OrganizationDetail;
}

function file(name: string) {
  return new File(["x"], name, { type: "image/png" });
}

function renderSection(overrides: Partial<React.ComponentProps<typeof OrganizationInfoSection>> = {}) {
  render(<OrganizationInfoSection organization={org()} {...overrides} />);
}

it("shows a placeholder avatar with no logo", () => {
  renderSection();
  expect(screen.queryByAltText("Organization logo")).toBeNull();
});

it("shows the uploaded logo image", () => {
  renderSection({ organization: org({ settings: { logo: "https://cdn/logo.png", timezone: "UTC" } as OrganizationDetail["settings"] }) });
  expect(screen.getByAltText("Organization logo")).toHaveAttribute("src", "https://cdn/logo.png");
});

it("shows the owner's name and email", () => {
  renderSection();
  expect(screen.getByText("Jane Doe · jane@acmestudio.com")).toBeInTheDocument();
});

describe("logo upload", () => {
  it("previews the file immediately, uploads, and swaps to the real url", async () => {
    mockedUploadLogo.mockResolvedValue("https://cdn/new-logo.png");
    renderSection();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, file("logo.png"));

    expect(await screen.findByAltText("Organization logo")).toHaveAttribute("src", "https://cdn/new-logo.png");
    expect(mockedUploadLogo).toHaveBeenCalledWith(6001, expect.any(File));
  });

  it("shows 'Uploading…' while in flight", async () => {
    let resolveUpload!: (url: string) => void;
    mockedUploadLogo.mockReturnValue(new Promise((resolve) => (resolveUpload = resolve)));
    renderSection();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, file("logo.png"));

    expect(screen.getByText("Uploading…")).toBeInTheDocument();
    resolveUpload("https://cdn/new-logo.png");
    expect(await screen.findByText("Change Logo")).toBeInTheDocument();
  });

  it("reverts to the previous logo and toasts on failure", async () => {
    mockedUploadLogo.mockRejectedValue(new Error("boom"));
    renderSection({ organization: org({ settings: { logo: "https://cdn/old-logo.png", timezone: "UTC" } as OrganizationDetail["settings"] }) });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, file("logo.png"));

    await waitFor(() => expect(toast).toHaveBeenCalledWith("Failed to update logo", "error"));
    expect(await screen.findByAltText("Organization logo")).toHaveAttribute("src", "https://cdn/old-logo.png");
  });

  it("does nothing when the file picker is dismissed without a file", () => {
    renderSection();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [] } });
    expect(mockedUploadLogo).not.toHaveBeenCalled();
  });
});

describe("timezone", () => {
  it("disables the select until Update is clicked", () => {
    renderSection();
    expect(screen.getByRole("combobox")).toBeDisabled();
  });

  it("enables editing, saves, refreshes the user, and exits edit mode", async () => {
    mockedUpdateTimezone.mockResolvedValue(undefined);
    renderSection();
    await userEvent.click(screen.getByRole("button", { name: "Update" }));
    expect(screen.getByRole("combobox")).toBeEnabled();

    await userEvent.selectOptions(screen.getByRole("combobox"), "America/New_York");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(mockedUpdateTimezone).toHaveBeenCalledWith(6001, "America/New_York"),
    );
    expect(refreshCurrentUser).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Update" })).toBeInTheDocument();
  });

  it("renders the stored UTC timezone as selected, not a mismatched option", () => {
    // Intl.supportedValuesOf("timeZone") doesn't list a bare "UTC" entry,
    // so getTimezoneList() must inject it — otherwise this <select> has no
    // option matching the stored value and silently shows whichever option
    // is first instead.
    renderSection();
    expect(screen.getByRole("combobox")).toHaveValue("UTC");
  });

  it("submits the stored timezone unchanged when Save is clicked without editing it", async () => {
    mockedUpdateTimezone.mockResolvedValue(undefined);
    renderSection();
    await userEvent.click(screen.getByRole("button", { name: "Update" }));
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(mockedUpdateTimezone).toHaveBeenCalledWith(6001, "UTC"),
    );
  });

  it("cancels, reverting to the original timezone", async () => {
    renderSection({
      organization: org({ settings: { logo: "", timezone: "Europe/London" } as OrganizationDetail["settings"] }),
    });
    await userEvent.click(screen.getByRole("button", { name: "Update" }));
    await userEvent.selectOptions(screen.getByRole("combobox"), "America/New_York");
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByRole("combobox")).toHaveValue("Europe/London");
    expect(mockedUpdateTimezone).not.toHaveBeenCalled();
  });

  it("toasts and stays in edit mode on failure", async () => {
    mockedUpdateTimezone.mockRejectedValue(new Error("boom"));
    renderSection();
    await userEvent.click(screen.getByRole("button", { name: "Update" }));
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith("Failed to update timezone", "error"),
    );
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(refreshCurrentUser).not.toHaveBeenCalled();
  });
});

describe("ownership transfer", () => {
  it("opens the change-owner modal and records a pending transfer on success", async () => {
    renderSection();
    await userEvent.click(screen.getByRole("button", { name: /Change/ }));
    expect(screen.getByTestId("change-owner-modal")).toBeInTheDocument();
    await userEvent.click(screen.getByText("submit-owner-form"));

    expect(
      screen.getByText(/An ownership transfer to/),
    ).toBeInTheDocument();
    expect(screen.getByText("new-owner@acme.com")).toBeInTheDocument();
    expect(screen.queryByTestId("change-owner-modal")).toBeNull();
  });

  it("closes the change-owner modal without sending", async () => {
    renderSection();
    await userEvent.click(screen.getByRole("button", { name: /Change/ }));
    await userEvent.click(screen.getByText("close-owner-form"));
    expect(screen.queryByTestId("change-owner-modal")).toBeNull();
    expect(screen.queryByText(/An ownership transfer to/)).toBeNull();
  });

  it("disables the Change button while a transfer is pending", () => {
    renderSection({
      organization: org({
        pendingOwnershipTransfer: { id: 1, email: "pending@acme.com", roleId: 1, createdAt: "2026-01-01T00:00:00.000Z" } as OrganizationDetail["pendingOwnershipTransfer"],
      }),
    });
    expect(screen.getByRole("button", { name: /Change/ })).toBeDisabled();
    expect(screen.getByText("pending@acme.com")).toBeInTheDocument();
  });

  it("opens a confirm dialog, cancels the transfer, and shows a toast", async () => {
    mockedCancelTransfer.mockResolvedValue(undefined);
    renderSection({
      organization: org({
        pendingOwnershipTransfer: { id: 1, email: "pending@acme.com", roleId: 1, createdAt: "2026-01-01T00:00:00.000Z" } as OrganizationDetail["pendingOwnershipTransfer"],
      }),
    });
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByText("Cancel ownership transfer?")).toBeInTheDocument();

    const confirmButtons = screen.getAllByRole("button", { name: "Cancel transfer" });
    await userEvent.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => expect(mockedCancelTransfer).toHaveBeenCalledWith(6001));
    expect(toast).toHaveBeenCalledWith("Ownership transfer cancelled", "error");
    expect(screen.queryByText(/An ownership transfer to/)).toBeNull();
  });

  it("toasts and keeps the transfer pending on cancellation failure", async () => {
    mockedCancelTransfer.mockRejectedValue(new Error("boom"));
    renderSection({
      organization: org({
        pendingOwnershipTransfer: { id: 1, email: "pending@acme.com", roleId: 1, createdAt: "2026-01-01T00:00:00.000Z" } as OrganizationDetail["pendingOwnershipTransfer"],
      }),
    });
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    const confirmButtons = screen.getAllByRole("button", { name: "Cancel transfer" });
    await userEvent.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith("Failed to cancel ownership transfer", "error"),
    );
    expect(screen.getByText("pending@acme.com")).toBeInTheDocument();
  });

  it("closes the confirm dialog without cancelling", async () => {
    renderSection({
      organization: org({
        pendingOwnershipTransfer: { id: 1, email: "pending@acme.com", roleId: 1, createdAt: "2026-01-01T00:00:00.000Z" } as OrganizationDetail["pendingOwnershipTransfer"],
      }),
    });
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    const cancelButtons = screen.getAllByRole("button", { name: "Cancel" });
    await userEvent.click(cancelButtons[cancelButtons.length - 1]);
    expect(mockedCancelTransfer).not.toHaveBeenCalled();
  });
});
