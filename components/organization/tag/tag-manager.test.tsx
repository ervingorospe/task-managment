import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TagManager from "./tag-manager";
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
  withPermissions([PERMISSIONS.TAG_VIEW, PERMISSIONS.TAG_ADD, PERMISSIONS.TAG_UPDATE, PERMISSIONS.TAG_REMOVE]);
});

function renderManager(overrides: Partial<React.ComponentProps<typeof TagManager>> = {}) {
  const addTag = jest.fn();
  const onDeleteTag = jest.fn();
  const updateTagColor = jest.fn();
  const renameTag = jest.fn();
  render(
    <TagManager
      tags={[TODO, DONE]}
      capacity={10}
      addTag={addTag}
      onDeleteTag={onDeleteTag}
      updateTagColor={updateTagColor}
      renameTag={renameTag}
      {...overrides}
    />,
  );
  return { addTag, onDeleteTag, updateTagColor, renameTag };
}

it("renders nothing without tag.view", () => {
  withPermissions([]);
  renderManager();
  expect(screen.queryByText("Tags")).toBeNull();
});

it("shows the default title, subtitle, and capacity usage", () => {
  renderManager();
  expect(screen.getByText("Tags")).toBeInTheDocument();
  expect(screen.getByText("Create and manage tags.")).toBeInTheDocument();
  expect(screen.getByText("2 / 10 tags used")).toBeInTheDocument();
});

it("shows a custom title, subtitle, and banner", () => {
  renderManager({ title: "Org Tags", subtitle: "Custom subtitle", banner: <p>Saved!</p> });
  expect(screen.getByText("Org Tags")).toBeInTheDocument();
  expect(screen.getByText("Custom subtitle")).toBeInTheDocument();
  expect(screen.getByText("Saved!")).toBeInTheDocument();
});

it("renders the tag list", () => {
  renderManager();
  expect(screen.getByText("To Do")).toBeInTheDocument();
  expect(screen.getByText("Done")).toBeInTheDocument();
});

describe("add tag input", () => {
  it("hides the add input without tag.add", () => {
    withPermissions([PERMISSIONS.TAG_VIEW]);
    renderManager();
    expect(screen.queryByPlaceholderText("e.g. On Hold")).toBeNull();
  });

  it("adds a tag on Enter and clears the input", async () => {
    const { addTag } = renderManager();
    addTag.mockReturnValue(undefined);
    const input = screen.getByPlaceholderText("e.g. On Hold");
    await userEvent.type(input, "On Hold{Enter}");

    expect(addTag).toHaveBeenCalledWith("On Hold");
    expect(input).toHaveValue("");
  });

  it("adds a tag via the Add button", async () => {
    const { addTag } = renderManager();
    addTag.mockReturnValue(undefined);
    await userEvent.type(screen.getByPlaceholderText("e.g. On Hold"), "On Hold");
    await userEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(addTag).toHaveBeenCalledWith("On Hold");
  });

  it("does not add a blank or whitespace-only name", async () => {
    const { addTag } = renderManager();
    await userEvent.type(screen.getByPlaceholderText("e.g. On Hold"), "   {Enter}");
    expect(addTag).not.toHaveBeenCalled();
  });

  it("shows a validation error and keeps the input when the add is rejected", async () => {
    const { addTag } = renderManager();
    addTag.mockReturnValue("That name is already taken");
    const input = screen.getByPlaceholderText("e.g. On Hold");
    await userEvent.type(input, "Done{Enter}");

    expect(screen.getByText("That name is already taken")).toBeInTheDocument();
    expect(input).toHaveValue("Done");
  });

  it("clears a previous error once the input is edited again", async () => {
    const { addTag } = renderManager();
    addTag.mockReturnValue("That name is already taken");
    const input = screen.getByPlaceholderText("e.g. On Hold");
    await userEvent.type(input, "Done{Enter}");
    expect(screen.getByText("That name is already taken")).toBeInTheDocument();

    await userEvent.type(input, "!");
    expect(screen.queryByText("That name is already taken")).toBeNull();
  });

  it("disables Add and shows a tooltip once at capacity", () => {
    renderManager({ tags: [TODO, DONE], capacity: 2 });
    const addButton = screen.getByRole("button", { name: "Add" });
    expect(addButton).toBeDisabled();
    expect(addButton).toHaveAttribute("title", "Tag limit reached (2)");
  });

  it("has no tooltip and is enabled under capacity", () => {
    renderManager({ tags: [TODO], capacity: 10 });
    const addButton = screen.getByRole("button", { name: "Add" });
    expect(addButton).toBeEnabled();
    expect(addButton).not.toHaveAttribute("title");
  });
});
