import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DefaultTagsStep from "./default-tags-step";
import { StepperProvider } from "@/providers/stepper.provider";
import { OrganizationDefaultsProvider } from "@/providers/organization-defaults.provider";
import type { TagDetail } from "@/lib/types/organization/tag-detail.type";

jest.mock("@/components/organization/tag/tag-manager", () => {
  return function MockTagManager(props: any) {
    return (
      <div>
        <div data-testid="tags">
          {props.tags.map((t: TagDetail) => `${t.tagName}:${t.color}`).join(",")}
        </div>
        <div data-testid="capacity">{props.capacity}</div>
        <button onClick={() => (window as any).__addResult = props.addTag("Urgent")}>
          add-urgent
        </button>
        <button onClick={() => (window as any).__addResult = props.addTag("Brand New")}>
          add-new
        </button>
        <button onClick={() => props.updateTagColor(1, "#FF0000")}>
          recolor
        </button>
        <button onClick={() => (window as any).__renameResult = props.renameTag(2, "Urgent")}>
          rename-to-urgent
        </button>
        <button onClick={() => (window as any).__renameResult = props.renameTag(2, "Renamed")}>
          rename-ok
        </button>
        <button onClick={() => props.onDeleteTag(1)}>delete-1</button>
      </div>
    );
  };
});

const defaultTags: TagDetail[] = [
  { id: 1, tagName: "Urgent", color: "#FF0000", isDefault: true },
  { id: 2, tagName: "Bug", color: "#00FF00", isDefault: false },
];

function renderStep(tags: TagDetail[] = defaultTags) {
  return render(
    <OrganizationDefaultsProvider
      roles={[]}
      permissionOptions={[]}
      ruleCategories={[]}
      tags={tags}
      capacity={{ members: 10, tags: 5, roles: 5, tickets: 10, projects: 10 }}
    >
      <StepperProvider totalSteps={1}>
        <DefaultTagsStep />
      </StepperProvider>
    </OrganizationDefaultsProvider>,
  );
}

beforeEach(() => {
  delete (window as any).__addResult;
  delete (window as any).__renameResult;
});

it("seeds the tag list from organization defaults and passes capacity through", () => {
  renderStep();
  expect(screen.getByTestId("tags")).toHaveTextContent("Urgent:#FF0000,Bug:#00FF00");
  expect(screen.getByTestId("capacity")).toHaveTextContent("5");
});

it("rejects adding a tag whose name already exists (case-insensitive)", async () => {
  renderStep();
  await userEvent.click(screen.getByText("add-urgent"));
  expect((window as any).__addResult).toBe('A tag named "Urgent" already exists');
  expect(screen.getByTestId("tags")).toHaveTextContent("Urgent:#FF0000,Bug:#00FF00");
});

it("adds a new tag", async () => {
  renderStep();
  await userEvent.click(screen.getByText("add-new"));
  expect((window as any).__addResult).toBeUndefined();
  expect(screen.getByTestId("tags")).toHaveTextContent("Brand New");
});

it("updates a tag's color", async () => {
  renderStep();
  await userEvent.click(screen.getByText("recolor"));
  expect(screen.getByTestId("tags")).toHaveTextContent("Urgent:#FF0000");
});

it("rejects renaming a tag to a name that already exists on another tag", async () => {
  renderStep();
  await userEvent.click(screen.getByText("rename-to-urgent"));
  expect((window as any).__renameResult).toBe('A tag named "Urgent" already exists');
  expect(screen.getByTestId("tags")).toHaveTextContent("Bug:#00FF00");
});

it("renames a tag", async () => {
  renderStep();
  await userEvent.click(screen.getByText("rename-ok"));
  expect((window as any).__renameResult).toBeUndefined();
  expect(screen.getByTestId("tags")).toHaveTextContent("Renamed:#00FF00");
});

it("deletes a tag", async () => {
  renderStep();
  await userEvent.click(screen.getByText("delete-1"));
  expect(screen.getByTestId("tags")).toHaveTextContent("Bug:#00FF00");
  expect(screen.getByTestId("tags")).not.toHaveTextContent("Urgent");
});
