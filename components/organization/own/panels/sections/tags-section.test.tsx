import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TagsSection from "./tags-section";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { useLogActivity } from "@/hooks/use-log-activity";
import { createTag, updateTag, deleteTag } from "@/lib/api/tags";
import { PERMISSIONS } from "@/lib/data/permissions";
import type { TagDetail } from "@/lib/types/organization/tag-detail.type";

jest.mock("@/providers/auth-provider", () => {
  const actual = jest.requireActual("@/providers/auth-provider");
  return { ...actual, useAuth: jest.fn() };
});
jest.mock("@/providers/toast-provider", () => ({ useToast: jest.fn() }));
jest.mock("@/hooks/use-log-activity", () => ({ useLogActivity: jest.fn() }));
jest.mock("@/lib/api/tags", () => ({
  createTag: jest.fn(),
  updateTag: jest.fn(),
  deleteTag: jest.fn(),
}));

const mockedUseAuth = useAuth as jest.Mock;
const mockedUseToast = useToast as jest.Mock;
const mockedUseLogActivity = useLogActivity as jest.Mock;
const mockedCreateTag = createTag as jest.Mock;
const mockedUpdateTag = updateTag as jest.Mock;
const mockedDeleteTag = deleteTag as jest.Mock;

const toast = jest.fn();
const logActivity = jest.fn();

const TODO: TagDetail = { id: 1, tagName: "To Do", color: "#000000", isDefault: true, isDeleted: false };
const DONE: TagDetail = { id: 2, tagName: "Done", color: "#0F0F0F", isDefault: false, isDeleted: false };

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
  withPermissions([PERMISSIONS.TAG_VIEW, PERMISSIONS.TAG_ADD, PERMISSIONS.TAG_UPDATE, PERMISSIONS.TAG_REMOVE]);
  mockedUseToast.mockReturnValue(toast);
  mockedUseLogActivity.mockReturnValue(logActivity);
});

function renderSection(overrides: Partial<React.ComponentProps<typeof TagsSection>> = {}) {
  render(<TagsSection tags={[TODO, DONE]} capacity={10} orgId={6001} {...overrides} />);
}

it("shows the tag manager with the given tags", () => {
  renderSection();
  expect(screen.getByText("To Do")).toBeInTheDocument();
  expect(screen.getByText("Done")).toBeInTheDocument();
});

describe("add", () => {
  it("adds a tag optimistically, confirms via the API, logs activity, and shows an alert", async () => {
    mockedCreateTag.mockResolvedValue({ id: 99, tagName: "In Progress", color: "#94A39D", isDefault: false });
    renderSection();
    const input = screen.getByPlaceholderText("e.g. On Hold");
    await userEvent.type(input, "In Progress{Enter}");

    expect(screen.getByText("In Progress")).toBeInTheDocument();
    await waitFor(() =>
      expect(mockedCreateTag).toHaveBeenCalledWith(6001, { tagName: "In Progress", color: "#94A39D" }),
    );
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ orgId: 6001, action: "created", entityId: 99 }),
    );
    expect(await screen.findByText('Tag "In Progress" added')).toBeInTheDocument();
  });

  it("rejects a duplicate name before calling the API", async () => {
    renderSection();
    const input = screen.getByPlaceholderText("e.g. On Hold");
    await userEvent.type(input, "Done{Enter}");
    expect(await screen.findByText('A tag named "Done" already exists')).toBeInTheDocument();
    expect(mockedCreateTag).not.toHaveBeenCalled();
  });

  it("reverts the optimistic add and toasts on failure", async () => {
    mockedCreateTag.mockRejectedValue(new Error("boom"));
    renderSection();
    const input = screen.getByPlaceholderText("e.g. On Hold");
    await userEvent.type(input, "In Progress{Enter}");

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith('Failed to create tag "In Progress"', "error"),
    );
    expect(screen.queryByText("In Progress")).toBeNull();
  });
});

describe("color", () => {
  it("changes a tag's color optimistically, confirms via the API, and logs activity", async () => {
    mockedUpdateTag.mockResolvedValue(undefined);
    renderSection();
    const swatchTrigger = screen.getAllByLabelText("Choose color")[0];
    await userEvent.click(swatchTrigger);
    const swatch = document.querySelector('button[style*="background-color"]') as HTMLElement;
    await userEvent.click(swatch);

    await waitFor(() => expect(mockedUpdateTag).toHaveBeenCalledWith(1, { color: expect.any(String) }));
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ orgId: 6001, action: "color_changed", entityId: 1 }),
    );
  });

  it("reverts the color and toasts on failure", async () => {
    mockedUpdateTag.mockRejectedValue(new Error("boom"));
    renderSection();
    const swatchTrigger = screen.getAllByLabelText("Choose color")[0];
    await userEvent.click(swatchTrigger);
    const swatch = document.querySelector('button[style*="background-color"]') as HTMLElement;
    await userEvent.click(swatch);

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith("Failed to update tag color", "error"),
    );
  });
});

describe("rename", () => {
  it("renames a tag optimistically, confirms via the API, logs activity, and shows an alert", async () => {
    mockedUpdateTag.mockResolvedValue(undefined);
    renderSection();
    await userEvent.click(screen.getByRole("button", { name: "Rename To Do tag" }));
    const input = screen.getByDisplayValue("To Do");
    await userEvent.clear(input);
    await userEvent.type(input, "Backlog{Enter}");

    expect(screen.getByText("Backlog")).toBeInTheDocument();
    await waitFor(() => expect(mockedUpdateTag).toHaveBeenCalledWith(1, { tagName: "Backlog" }));
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ orgId: 6001, action: "renamed", entityId: 1 }),
    );
    expect(await screen.findByText("Tag renamed")).toBeInTheDocument();
  });

  it("rejects a duplicate name before calling the API", async () => {
    renderSection();
    await userEvent.click(screen.getByRole("button", { name: "Rename To Do tag" }));
    const input = screen.getByDisplayValue("To Do");
    await userEvent.clear(input);
    await userEvent.type(input, "Done{Enter}");

    expect(screen.getByText('A tag named "Done" already exists')).toBeInTheDocument();
    expect(mockedUpdateTag).not.toHaveBeenCalled();
  });

  it("reverts the rename and toasts on failure", async () => {
    mockedUpdateTag.mockRejectedValue(new Error("boom"));
    renderSection();
    await userEvent.click(screen.getByRole("button", { name: "Rename To Do tag" }));
    const input = screen.getByDisplayValue("To Do");
    await userEvent.clear(input);
    await userEvent.type(input, "Backlog{Enter}");

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith('Failed to rename tag to "Backlog"', "error"),
    );
    expect(await screen.findByText("To Do")).toBeInTheDocument();
  });
});

describe("delete", () => {
  it("opens a confirm dialog, deletes optimistically, confirms via the API, logs activity, and shows an alert", async () => {
    mockedDeleteTag.mockResolvedValue(undefined);
    renderSection();
    await userEvent.click(screen.getByRole("button", { name: "Delete To Do tag" }));
    expect(screen.getByText("Remove tag?")).toBeInTheDocument();

    const confirmButtons = screen.getAllByRole("button", { name: "Remove tag" });
    await userEvent.click(confirmButtons[confirmButtons.length - 1]);

    expect(screen.queryByText("To Do")).toBeNull();
    await waitFor(() => expect(mockedDeleteTag).toHaveBeenCalledWith(1));
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ orgId: 6001, action: "removed", entityId: 1 }),
    );
    expect(await screen.findByText('Tag "To Do" removed')).toBeInTheDocument();
  });

  it("reverts the optimistic delete and toasts on failure", async () => {
    mockedDeleteTag.mockRejectedValue(new Error("boom"));
    renderSection();
    await userEvent.click(screen.getByRole("button", { name: "Delete To Do tag" }));
    const confirmButtons = screen.getAllByRole("button", { name: "Remove tag" });
    await userEvent.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => expect(toast).toHaveBeenCalledWith("Failed to delete tag", "error"));
    expect(await screen.findByText("To Do")).toBeInTheDocument();
  });

  it("closes without deleting on cancel", async () => {
    renderSection();
    await userEvent.click(screen.getByRole("button", { name: "Delete To Do tag" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(mockedDeleteTag).not.toHaveBeenCalled();
    expect(screen.getByText("To Do")).toBeInTheDocument();
  });

  it("hides the confirm dialog gate without tag.remove", () => {
    withPermissions([PERMISSIONS.TAG_VIEW]);
    renderSection();
    expect(screen.queryByRole("button", { name: /Delete/ })).toBeNull();
  });
});
