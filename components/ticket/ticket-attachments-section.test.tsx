import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TicketAttachmentsSection from "./ticket-attachments-section";
import { useToast } from "@/providers/toast-provider";
import { useLogActivity } from "@/hooks/use-log-activity";
import { uploadTicketAttachment, removeTicketAttachment } from "@/lib/api/tickets";
import type { TicketAttachment } from "@/lib/types/ticket/ticket-detail.type";
import type { MemberDetail } from "@/lib/types/organization/member-detail.type";
import type { OrganizationDetail } from "@/lib/types/organization/organization-detail.type";

jest.mock("@/providers/toast-provider", () => ({ useToast: jest.fn() }));
jest.mock("@/hooks/use-log-activity", () => ({ useLogActivity: jest.fn() }));
jest.mock("@/lib/api/tickets", () => ({
  uploadTicketAttachment: jest.fn(),
  removeTicketAttachment: jest.fn(),
}));

const mockedUseToast = useToast as jest.Mock;
const mockedUseLogActivity = useLogActivity as jest.Mock;
const mockedUpload = uploadTicketAttachment as jest.Mock;
const mockedRemove = removeTicketAttachment as jest.Mock;

const toast = jest.fn();
const logActivity = jest.fn();

function member(overrides: Partial<MemberDetail> = {}): MemberDetail {
  const base = {
    id: 1,
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@acmestudio.com",
    orgId: 6001,
    roleId: 1,
    isActive: true,
    ...overrides,
  };
  return {
    ...base,
    user: { id: base.id, firstName: base.firstName, lastName: base.lastName, email: base.email } as MemberDetail["user"],
  };
}

const CLIENT = member({ id: 2, firstName: "Alex", lastName: "Kim" });
const ASSIGNEE = member({ id: 1, firstName: "Jane", lastName: "Doe" });

function attachment(overrides: Partial<TicketAttachment> = {}): TicketAttachment {
  return { id: 1, name: "screenshot.png", url: "https://cdn/screenshot.png", size: 500 * 1024, ...overrides };
}

function file(name: string, sizeBytes: number) {
  const f = new File(["x"], name);
  Object.defineProperty(f, "size", { value: sizeBytes });
  return f;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseToast.mockReturnValue(toast);
  mockedUseLogActivity.mockReturnValue(logActivity);
});

function renderSection(overrides: Partial<React.ComponentProps<typeof TicketAttachmentsSection>> = {}) {
  render(
    <TicketAttachmentsSection
      ticketId={1}
      ticketTitle="Fix the login page"
      referenceId="TCK-1"
      attachments={[]}
      client={CLIENT}
      assignees={[ASSIGNEE]}
      organization={{ id: 6001 } as OrganizationDetail}
      {...overrides}
    />,
  );
}

it("shows 'No files attached.' when empty", () => {
  renderSection();
  expect(screen.getByText("No files attached.")).toBeInTheDocument();
  expect(screen.getByText("Attachments")).toBeInTheDocument();
});

it("lists attachments with their size and a count badge", () => {
  renderSection({ attachments: [attachment(), attachment({ id: 2, name: "recording.mov", size: 2.5 * 1024 * 1024 })] });
  expect(screen.getByText("(2)")).toBeInTheDocument();
  const link = screen.getByRole("link", { name: "screenshot.png" });
  expect(link).toHaveAttribute("href", "https://cdn/screenshot.png");
  expect(link).toHaveAttribute("target", "_blank");
  expect(link).toHaveAttribute("rel", "noopener noreferrer");
  expect(screen.getByText("500 KB")).toBeInTheDocument();
  expect(screen.getByText("2.5 MB")).toBeInTheDocument();
});

describe("upload", () => {
  it("clicking 'Add file' opens the hidden file picker", async () => {
    renderSection();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = jest.spyOn(input, "click");
    await userEvent.click(screen.getByRole("button", { name: "Add file" }));
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it("uploads a file, adds it to the list, and logs activity with involved users", async () => {
    const uploaded = attachment({ id: 3, name: "new-file.png" });
    mockedUpload.mockResolvedValue(uploaded);
    renderSection();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, file("new-file.png", 1024));

    expect(mockedUpload).toHaveBeenCalledWith(1, expect.any(File));
    expect(await screen.findByText("new-file.png")).toBeInTheDocument();
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        orgId: 6001,
        action: "attachment_added",
        involvedUserIds: [2, 1],
        description: 'attached "new-file.png" to "Fix the login page"',
      }),
    );
  });

  it("shows 'Uploading…' while the request is in flight", async () => {
    let resolveUpload!: (v: TicketAttachment) => void;
    mockedUpload.mockReturnValue(new Promise((resolve) => (resolveUpload = resolve)));
    renderSection();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, file("new-file.png", 1024));

    expect(screen.getByText("Uploading…")).toBeInTheDocument();
    resolveUpload(attachment({ id: 3, name: "new-file.png" }));
    expect(await screen.findByText("Add file")).toBeInTheDocument();
  });

  it("toasts and does not add anything when upload fails", async () => {
    mockedUpload.mockRejectedValue(new Error("boom"));
    renderSection();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, file("new-file.png", 1024));

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith("Failed to upload attachment", "error"),
    );
    expect(screen.getByText("No files attached.")).toBeInTheDocument();
  });

  it("does nothing when the file picker is dismissed without a file", () => {
    renderSection();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [] } });
    expect(mockedUpload).not.toHaveBeenCalled();
  });

  it("passes undefined orgId for a personal (org-less) ticket", async () => {
    mockedUpload.mockResolvedValue(attachment({ id: 3, name: "new-file.png" }));
    renderSection({ organization: null, client: null, assignees: [] });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, file("new-file.png", 1024));

    await waitFor(() =>
      expect(logActivity).toHaveBeenCalledWith(
        expect.objectContaining({ orgId: undefined, involvedUserIds: [] }),
      ),
    );
  });
});

describe("remove", () => {
  it("opens a confirm dialog naming the attachment and removes it on confirm, logging activity", async () => {
    mockedRemove.mockResolvedValue(undefined);
    renderSection({ attachments: [attachment()] });
    await userEvent.click(screen.getByRole("button", { name: "Remove screenshot.png" }));
    expect(
      screen.getByText('Are you sure you want to remove "screenshot.png"? This can\'t be undone.'),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Remove" }));
    await waitFor(() => expect(mockedRemove).toHaveBeenCalledWith(1, 1));
    expect(screen.getByText("No files attached.")).toBeInTheDocument();
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "attachment_removed",
        description: 'removed "screenshot.png" from "Fix the login page"',
      }),
    );
  });

  it("closes without removing on cancel", async () => {
    renderSection({ attachments: [attachment()] });
    await userEvent.click(screen.getByRole("button", { name: "Remove screenshot.png" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(mockedRemove).not.toHaveBeenCalled();
    expect(screen.getByText("screenshot.png")).toBeInTheDocument();
  });

  it("toasts and keeps the attachment when removal fails", async () => {
    mockedRemove.mockRejectedValue(new Error("boom"));
    renderSection({ attachments: [attachment()] });
    await userEvent.click(screen.getByRole("button", { name: "Remove screenshot.png" }));
    await userEvent.click(screen.getByRole("button", { name: "Remove" }));

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith("Failed to remove attachment", "error"),
    );
    expect(screen.getByText("screenshot.png")).toBeInTheDocument();
  });
});
