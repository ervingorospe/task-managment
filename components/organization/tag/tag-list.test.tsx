import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TagList from "./tag-list";
import { useAuth } from "@/providers/auth-provider";
import { PERMISSIONS } from "@/lib/data/permissions";
import type { TagDetail } from "@/lib/types/organization/tag-detail.type";

jest.mock("@/providers/auth-provider", () => {
  const actual = jest.requireActual("@/providers/auth-provider");
  return { ...actual, useAuth: jest.fn() };
});

const mockedUseAuth = useAuth as jest.Mock;

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
  withPermissions([PERMISSIONS.TAG_VIEW, PERMISSIONS.TAG_UPDATE, PERMISSIONS.TAG_REMOVE]);
});

function renderList(overrides: Partial<React.ComponentProps<typeof TagList>> = {}) {
  const onUpdateTagColor = jest.fn();
  const onRemoveTag = jest.fn();
  const onRenameTag = jest.fn();
  render(
    <TagList
      tags={[TODO, DONE]}
      onUpdateTagColor={onUpdateTagColor}
      onRemoveTag={onRemoveTag}
      onRenameTag={onRenameTag}
      {...overrides}
    />,
  );
  return { onUpdateTagColor, onRemoveTag, onRenameTag };
}

it("renders nothing without tag.view", () => {
  withPermissions([]);
  renderList();
  expect(screen.queryByText("To Do")).toBeNull();
});

it("lists tags and marks the default one", () => {
  renderList();
  expect(screen.getByText("To Do")).toBeInTheDocument();
  expect(screen.getByText("Default")).toBeInTheDocument();
  expect(screen.getByText("Done")).toBeInTheDocument();
});

describe("rename", () => {
  it("hides the rename button without tag.update", () => {
    withPermissions([PERMISSIONS.TAG_VIEW]);
    renderList();
    expect(screen.queryByRole("button", { name: /Rename/ })).toBeNull();
  });

  it("enters edit mode prefilled with the current name", async () => {
    renderList();
    await userEvent.click(screen.getByRole("button", { name: "Rename To Do tag" }));
    expect(screen.getByDisplayValue("To Do")).toBeInTheDocument();
  });

  it("saves a valid rename on Enter", async () => {
    const { onRenameTag } = renderList();
    onRenameTag.mockReturnValue(undefined);
    await userEvent.click(screen.getByRole("button", { name: "Rename To Do tag" }));
    const input = screen.getByDisplayValue("To Do");
    await userEvent.clear(input);
    await userEvent.type(input, "Backlog{Enter}");

    expect(onRenameTag).toHaveBeenCalledWith(1, "Backlog");
    expect(screen.queryByDisplayValue("Backlog")).toBeNull();
  });

  it("saves via the Save button", async () => {
    const { onRenameTag } = renderList();
    onRenameTag.mockReturnValue(undefined);
    await userEvent.click(screen.getByRole("button", { name: "Rename To Do tag" }));
    const input = screen.getByDisplayValue("To Do");
    await userEvent.clear(input);
    await userEvent.type(input, "Backlog");
    await userEvent.click(screen.getByRole("button", { name: "Save tag name" }));

    expect(onRenameTag).toHaveBeenCalledWith(1, "Backlog");
  });

  it("shows a validation error and stays in edit mode when the rename is rejected", async () => {
    const { onRenameTag } = renderList();
    onRenameTag.mockReturnValue("That name is already taken");
    await userEvent.click(screen.getByRole("button", { name: "Rename To Do tag" }));
    const input = screen.getByDisplayValue("To Do");
    await userEvent.clear(input);
    await userEvent.type(input, "Done{Enter}");

    expect(screen.getByText("That name is already taken")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Done")).toBeInTheDocument();
  });

  it("clears a previous error once the draft is edited again", async () => {
    const { onRenameTag } = renderList();
    onRenameTag.mockReturnValue("That name is already taken");
    await userEvent.click(screen.getByRole("button", { name: "Rename To Do tag" }));
    const input = screen.getByDisplayValue("To Do");
    await userEvent.clear(input);
    await userEvent.type(input, "Done{Enter}");
    expect(screen.getByText("That name is already taken")).toBeInTheDocument();

    await userEvent.type(input, "!");
    expect(screen.queryByText("That name is already taken")).toBeNull();
  });

  it("cancels editing on Escape without saving", async () => {
    const { onRenameTag } = renderList();
    await userEvent.click(screen.getByRole("button", { name: "Rename To Do tag" }));
    const input = screen.getByDisplayValue("To Do");
    await userEvent.clear(input);
    await userEvent.type(input, "Should not stick{Escape}");

    expect(onRenameTag).not.toHaveBeenCalled();
    expect(screen.getByText("To Do")).toBeInTheDocument();
  });

  it("cancels editing via the X button", async () => {
    const { onRenameTag } = renderList();
    await userEvent.click(screen.getByRole("button", { name: "Rename To Do tag" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onRenameTag).not.toHaveBeenCalled();
    expect(screen.getByText("To Do")).toBeInTheDocument();
  });

  it("does not save and exits edit mode when the draft is cleared to blank", async () => {
    const { onRenameTag } = renderList();
    await userEvent.click(screen.getByRole("button", { name: "Rename To Do tag" }));
    const input = screen.getByDisplayValue("To Do");
    await userEvent.clear(input);
    await userEvent.type(input, "{Enter}");

    expect(onRenameTag).not.toHaveBeenCalled();
    expect(screen.getByText("To Do")).toBeInTheDocument();
  });

  it("does not save and exits edit mode when the draft is unchanged", async () => {
    const { onRenameTag } = renderList();
    await userEvent.click(screen.getByRole("button", { name: "Rename To Do tag" }));
    const input = screen.getByDisplayValue("To Do");
    await userEvent.type(input, "{Enter}");

    expect(onRenameTag).not.toHaveBeenCalled();
    expect(screen.getByText("To Do")).toBeInTheDocument();
  });
});

describe("color", () => {
  it("changes a tag's color via the picker", async () => {
    const { onUpdateTagColor } = renderList();
    await userEvent.click(screen.getAllByRole("button")[0]);
    const swatch = document.querySelector('button[style*="background-color"]') as HTMLElement;
    await userEvent.click(swatch);
    expect(onUpdateTagColor).toHaveBeenCalledWith(1, expect.any(String));
  });
});

describe("delete", () => {
  it("hides the delete button without tag.remove", () => {
    withPermissions([PERMISSIONS.TAG_VIEW]);
    renderList();
    expect(screen.queryByRole("button", { name: /Delete|At least one/ })).toBeNull();
  });

  it("removes a tag when more than one exists", async () => {
    const { onRemoveTag } = renderList();
    await userEvent.click(screen.getByRole("button", { name: "Delete To Do tag" }));
    expect(onRemoveTag).toHaveBeenCalledWith(1);
  });

  it("disables delete for the only remaining tag", () => {
    renderList({ tags: [TODO] });
    expect(
      screen.getByRole("button", { name: "At least one tag is required" }),
    ).toBeDisabled();
  });
});
