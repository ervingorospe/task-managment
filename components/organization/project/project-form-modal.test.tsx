jest.mock("@/components/ui/form", () => {
  const actual = jest.requireActual("@/components/ui/form");
  return {
    ...actual,
    MarkdownEditor: ({ name, control }: { name: string; control: unknown }) => {
      const { useController } = jest.requireActual("react-hook-form");
      const { field } = useController({ name, control });
      return (
        <textarea
          aria-label="description-editor"
          value={field.value}
          onChange={(e) => field.onChange(e.target.value)}
        />
      );
    },
  };
});

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProjectFormModal } from "./project-form-modal";
import type { ProjectDetail } from "@/lib/types/organization/project-detail.type";
import type { MemberDetail } from "@/lib/types/organization/member-detail.type";

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

function project(overrides: Partial<ProjectDetail> = {}): ProjectDetail {
  return {
    id: 1,
    name: "Website Revamp",
    description: "Redesign the homepage",
    orgId: 6001,
    clientId: 2,
    client: CLIENT,
    assignees: [ASSIGNEE],
    isDeleted: false,
    ...overrides,
  };
}

function renderModal(overrides: Partial<React.ComponentProps<typeof ProjectFormModal>> = {}) {
  const onClose = jest.fn();
  const onSubmit = jest.fn();
  render(
    <ProjectFormModal
      open
      onClose={onClose}
      onSubmit={onSubmit}
      clientMembers={[CLIENT]}
      assignableMembers={[ASSIGNEE]}
      {...overrides}
    />,
  );
  return { onClose, onSubmit };
}

it("shows 'Add project' / 'Create project' for a new project", () => {
  renderModal();
  expect(screen.getAllByText("Add project").length).toBeGreaterThan(0);
  expect(screen.getByRole("button", { name: "Create project" })).toBeInTheDocument();
});

it("shows 'Edit project' / 'Save changes' and prefills an existing project", () => {
  renderModal({ project: project() });
  expect(screen.getAllByText("Edit project").length).toBeGreaterThan(0);
  expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
  expect(screen.getByDisplayValue("Website Revamp")).toBeInTheDocument();
  expect(screen.getByLabelText("description-editor")).toHaveValue("Redesign the homepage");
  expect(screen.getByRole("combobox")).toHaveValue("2");
});

it("defaults an existing project's missing description to an empty string", () => {
  renderModal({ project: project({ description: undefined }) });
  expect(screen.getByLabelText("description-editor")).toHaveValue("");
});

it("defaults clientId to null (no client selected) for a new project", () => {
  renderModal();
  expect(screen.getByRole("combobox")).toHaveValue("");
});

it("renders client and assignee options for a member whose user account was removed from the org", () => {
  const removedUserMember: MemberDetail = { ...member({ id: 3 }), user: null };
  renderModal({ clientMembers: [CLIENT, removedUserMember], assignableMembers: [ASSIGNEE, removedUserMember] });
  expect(within(screen.getByRole("combobox")).getByRole("option", { name: "" })).toHaveValue("3");
});

describe("validation", () => {
  it("shows an error when the name is too short", async () => {
    renderModal();
    await userEvent.type(screen.getByLabelText(/Project name/), "A");
    await userEvent.click(screen.getByRole("button", { name: "Create project" }));
    expect(await screen.findByText("Project name must be at least 2 characters")).toBeInTheDocument();
  });
});

describe("submit and cancel", () => {
  it("assigns a member via the dropdown and submits with a client selected", async () => {
    const { onSubmit } = renderModal();
    onSubmit.mockReturnValue(undefined);
    await userEvent.type(screen.getByLabelText(/Project name/), "Mobile App");
    await userEvent.selectOptions(screen.getByRole("combobox"), "2");

    const trigger = document.querySelector('[aria-haspopup="menu"]') as HTMLElement;
    await userEvent.click(trigger);
    await userEvent.click(screen.getByLabelText("Jane Doe"));

    await userEvent.click(screen.getByRole("button", { name: "Create project" }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: "Mobile App",
      description: "",
      clientId: "2",
      assigneeIds: [1],
    });
  });

  it("shows a duplicate-name error inline and keeps the form open", async () => {
    const { onSubmit } = renderModal();
    onSubmit.mockReturnValue('A project named "Website Revamp" already exists');
    await userEvent.type(screen.getByLabelText(/Project name/), "Website Revamp");
    await userEvent.click(screen.getByRole("button", { name: "Create project" }));

    expect(
      (await screen.findAllByText('A project named "Website Revamp" already exists')).length,
    ).toBeGreaterThan(0);
    expect(screen.getByDisplayValue("Website Revamp")).toBeInTheDocument();
  });

  it("closes and resets on Cancel", async () => {
    const { onClose, onSubmit } = renderModal();
    await userEvent.type(screen.getByLabelText(/Project name/), "Draft name");
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("re-seeds the form each time it reopens for a different project", () => {
    const { rerender } = render(
      <ProjectFormModal
        open={false}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        clientMembers={[CLIENT]}
        assignableMembers={[ASSIGNEE]}
        project={project({ id: 1, name: "Website Revamp" })}
      />,
    );
    rerender(
      <ProjectFormModal
        open
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        clientMembers={[CLIENT]}
        assignableMembers={[ASSIGNEE]}
        project={project({ id: 2, name: "Mobile App", clientId: null, client: null })}
      />,
    );
    expect(screen.getByDisplayValue("Mobile App")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveValue("");
  });
});
