import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LeaveOrganizationSection, { LeaveOrganizationButton } from "./organization-leave";
import { useToast } from "@/providers/toast-provider";

jest.mock("@/providers/toast-provider", () => ({ useToast: jest.fn() }));

const mockedUseToast = useToast as jest.Mock;
const toast = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseToast.mockReturnValue(toast);
});

describe("LeaveOrganizationSection", () => {
  it("shows the danger-zone row", () => {
    render(<LeaveOrganizationSection organizationName="Acme Studio" />);
    expect(screen.getByText("Leave this organization")).toBeInTheDocument();
    expect(screen.getByText("Permanently leave this organization.")).toBeInTheDocument();
  });

  it("opens a confirm dialog naming the organization", async () => {
    render(<LeaveOrganizationSection organizationName="Acme Studio" />);
    await userEvent.click(screen.getByRole("button", { name: "Leave organization" }));
    expect(await screen.findByText('Leave "Acme Studio"?')).toBeInTheDocument();
  });

  it("toasts and closes the dialog on confirm", async () => {
    render(<LeaveOrganizationSection organizationName="Acme Studio" />);
    await userEvent.click(screen.getByRole("button", { name: "Leave organization" }));
    await screen.findByText('Leave "Acme Studio"?');
    const confirmButtons = screen.getAllByRole("button", { name: "Leave organization" });
    await userEvent.click(confirmButtons[confirmButtons.length - 1]);

    expect(toast).toHaveBeenCalledWith('Left "Acme Studio"', "error");
    await waitFor(() => expect(screen.queryByText('Leave "Acme Studio"?')).toBeNull());
  });

  it("closes without toasting on cancel", async () => {
    render(<LeaveOrganizationSection organizationName="Acme Studio" />);
    await userEvent.click(screen.getByRole("button", { name: "Leave organization" }));
    await screen.findByText('Leave "Acme Studio"?');
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(toast).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByText('Leave "Acme Studio"?')).toBeNull());
  });
});

describe("LeaveOrganizationButton", () => {
  it("shows a plain danger button", () => {
    render(<LeaveOrganizationButton organizationName="Acme Studio" />);
    expect(screen.getByRole("button", { name: "Leave Organization" })).toBeInTheDocument();
  });

  it("opens the same confirm dialog and toasts on confirm", async () => {
    render(<LeaveOrganizationButton organizationName="Acme Studio" />);
    await userEvent.click(screen.getByRole("button", { name: "Leave Organization" }));
    await screen.findByText('Leave "Acme Studio"?');
    await userEvent.click(screen.getByRole("button", { name: "Leave organization" }));

    expect(toast).toHaveBeenCalledWith('Left "Acme Studio"', "error");
  });
});
