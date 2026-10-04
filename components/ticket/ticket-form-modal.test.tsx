// Real Tiptap isn't worth exercising here — this file is about
// TicketFormModal's own composition/logic, not the editor's internals
// (already covered in markdown-editor.test.tsx). Stand in with a plain
// textarea wired to the same react-hook-form control.
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

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TicketFormModal from "./ticket-form-modal";
import type { OrganizationDetail } from "@/lib/types/organization/organization-detail.type";
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
    role: { id: 1, roleName: "Manager" } as MemberDetail["role"],
    ...overrides,
  };
  return {
    ...base,
    user: { id: base.id, firstName: base.firstName, lastName: base.lastName, email: base.email } as MemberDetail["user"],
  };
}

const MANAGER = member({ id: 1, firstName: "Jane", lastName: "Doe", roleId: 1, role: { id: 1, roleName: "Manager" } as MemberDetail["role"] });
const CLIENT_MEMBER = member({ id: 2, firstName: "Alex", lastName: "Kim", roleId: 2, role: { id: 2, roleName: "Client" } as MemberDetail["role"] });
// role is undefined; only roleId identifies them — exercises the clientRoleId fallback.
const UNRESOLVED_CLIENT: MemberDetail = { ...member({ id: 3, firstName: "Sam", lastName: "Lee", roleId: 2, role: undefined }) };

function org(overrides: Partial<OrganizationDetail> = {}): OrganizationDetail {
  return {
    id: 6001,
    organizationName: "Acme Studio",
    ownerId: 1,
    settings: {} as OrganizationDetail["settings"],
    capacity: {} as OrganizationDetail["capacity"],
    owner: {} as OrganizationDetail["owner"],
    roles: [
      { id: 1, roleName: "Manager" } as OrganizationDetail["roles"][number],
      { id: 2, roleName: "Client" } as OrganizationDetail["roles"][number],
    ],
    tags: [],
    projects: [{ id: 1, name: "Website Revamp" } as OrganizationDetail["projects"][number]],
    members: [MANAGER, CLIENT_MEMBER],
    tickets: [],
    ticketRequests: [],
    ...overrides,
  } as OrganizationDetail;
}

const ORG_A = org();
const ORG_B = org({
  id: 6002,
  organizationName: "ClientCo",
  members: [member({ id: 4, firstName: "Priya", lastName: "Kapoor" })],
  projects: [],
});

function renderModal(overrides: Partial<React.ComponentProps<typeof TicketFormModal>> = {}) {
  const onClose = jest.fn();
  const onSubmit = jest.fn();
  render(
    <TicketFormModal
      open
      onClose={onClose}
      onSubmit={onSubmit}
      organizations={[ORG_A, ORG_B]}
      currentOrganizationId={ORG_A.id}
      {...overrides}
    />,
  );
  return { onClose, onSubmit };
}

async function fillTitle(text: string) {
  await userEvent.type(screen.getByLabelText(/Title/), text);
}

// Select renders bare <select> elements with no htmlFor/aria-labelledby
// association to their <label> — order in the DOM is organization, client,
// then project (the JSX order in ticket-form-modal.tsx).
function selects() {
  const [organizationSelect, clientSelect, projectSelect] =
    screen.getAllByRole("combobox");
  return { organizationSelect, clientSelect, projectSelect };
}

it("renders nothing when closed", () => {
  renderModal({ open: false });
  expect(screen.queryByText("Create ticket")).toBeNull();
});

it("uses the default 'Create ticket' title and submit label", () => {
  renderModal();
  expect(screen.getAllByText("Create ticket").length).toBeGreaterThan(0);
});

it("uses a custom title", () => {
  renderModal({ title: "New ticket from request" });
  expect(screen.getByText("New ticket from request")).toBeInTheDocument();
});

it("prefills from initialValues", () => {
  renderModal({ initialValues: { title: "Prefilled title", description: "Prefilled desc" } });
  expect(screen.getByLabelText(/Title/)).toHaveValue("Prefilled title");
  expect(screen.getByLabelText("description-editor")).toHaveValue("Prefilled desc");
});

it("sets the due date input's min to today", () => {
  render(
    <TicketFormModal
      open
      onClose={jest.fn()}
      onSubmit={jest.fn()}
      organizations={[ORG_A]}
      currentOrganizationId={ORG_A.id}
    />,
  );
  const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
  expect(dateInput).toHaveAttribute("min");
});

describe("organization-scoped fields", () => {
  it("populates assignable members, client options, and projects for the selected org", async () => {
    renderModal();
    const { clientSelect, projectSelect } = selects();
    expect(within(clientSelect).getByText("Alex Kim")).toBeInTheDocument();
    expect(within(projectSelect).getByText("Website Revamp")).toBeInTheDocument();
  });

  it("treats a member with only a matching roleId as a client (no role resolved)", () => {
    renderModal({ organizations: [org({ members: [MANAGER, UNRESOLVED_CLIENT] })] });
    const { clientSelect } = selects();
    expect(within(clientSelect).getByText("Sam Lee")).toBeInTheDocument();
  });

  it("resets assignees, client, and project when the organization changes", async () => {
    renderModal();
    await userEvent.selectOptions(selects().clientSelect, "2");
    expect(selects().clientSelect).toHaveValue("2");

    await userEvent.selectOptions(selects().organizationSelect, String(ORG_B.id));

    expect(selects().clientSelect).toHaveValue("");
    expect(within(selects().projectSelect).queryByText("Website Revamp")).toBeNull();
  });

  it("does not reset a prefilled organization's selections on mount", () => {
    renderModal({
      initialValues: { organizationId: String(ORG_A.id), clientId: "2" },
    });
    expect(selects().clientSelect).toHaveValue("2");
  });

  it("shows empty assignee/client/project options when no organization matches the selected id", () => {
    renderModal({ organizations: [], currentOrganizationId: 9999 });
    const { clientSelect, projectSelect } = selects();
    expect(within(clientSelect).getAllByRole("option")).toHaveLength(1);
    expect(within(projectSelect).getAllByRole("option")).toHaveLength(1);
  });

  it("shows a member whose user account was removed from the org as an assignee/client option", () => {
    const removedUserMember: MemberDetail = { ...member({ id: 5, firstName: "Removed", lastName: "Person", roleId: 1, role: { id: 1, roleName: "Manager" } as MemberDetail["role"] }), user: null };
    const removedUserClient: MemberDetail = { ...member({ id: 6, firstName: "Gone", lastName: "Client", roleId: 2, role: { id: 2, roleName: "Client" } as MemberDetail["role"] }), user: null };
    renderModal({
      organizations: [org({ members: [MANAGER, CLIENT_MEMBER, removedUserMember, removedUserClient] })],
    });
    const { clientSelect } = selects();
    expect(within(clientSelect).getByRole("option", { name: "undefined undefined" })).toBeInTheDocument();
  });
});

describe("attachments", () => {
  it("shows no 'attached with the request' section when there are none", () => {
    renderModal();
    expect(screen.queryByText("Attached with the request")).toBeNull();
    expect(screen.getByText("Attachments")).toBeInTheDocument();
  });

  it("lists existing attachments and relabels the input to 'Add more attachments'", () => {
    renderModal({
      existingAttachments: [{ id: 1, name: "screenshot.png", url: "https://cdn/screenshot.png", size: 500 * 1024 }],
    });
    const link = screen.getByRole("link", { name: /screenshot\.png/ });
    expect(link).toHaveAttribute("href", "https://cdn/screenshot.png");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByText(/500 KB/)).toBeInTheDocument();
    expect(screen.getByText("Add more attachments")).toBeInTheDocument();
  });

  it("shows an existing attachment's size in MB when at least 1MB", () => {
    renderModal({
      existingAttachments: [{ id: 1, name: "recording.mov", url: "https://cdn/recording.mov", size: 2.5 * 1024 * 1024 }],
    });
    expect(screen.getByText(/2\.5 MB/)).toBeInTheDocument();
  });
});

describe("validation", () => {
  it("shows an error and does not submit when the title is too short", async () => {
    const { onSubmit } = renderModal();
    await fillTitle("A");
    await userEvent.click(screen.getByRole("button", { name: "Create ticket" }));
    expect(await screen.findByText("Title must be at least 2 characters")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows an error for a past due date", async () => {
    const { onSubmit } = renderModal();
    await fillTitle("Fix the login page");
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    await userEvent.type(dateInput, "2020-01-01");
    await userEvent.click(screen.getByRole("button", { name: "Create ticket" }));
    expect(await screen.findByText("Due date can't be in the past")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe("submit and cancel", () => {
  it("assigns a member via the dropdown and submits the full form", async () => {
    const { onSubmit, onClose } = renderModal();
    await fillTitle("Fix the login page");

    const trigger = document.querySelector('[aria-haspopup="menu"]') as HTMLElement;
    await userEvent.click(trigger);
    await userEvent.click(screen.getByLabelText("Jane Doe"));

    await userEvent.selectOptions(selects().clientSelect, "2");
    await userEvent.selectOptions(selects().projectSelect, "1");

    await userEvent.click(screen.getByRole("button", { name: "Create ticket" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    const values = onSubmit.mock.calls[0][0];
    expect(values.title).toBe("Fix the login page");
    expect(values.assigneeIds).toEqual([1]);
    expect(values.clientId).toBe("2");
    expect(values.projectId).toBe("1");
    expect(onClose).toHaveBeenCalled();
  });

  it("closes without submitting on Cancel", async () => {
    const { onSubmit, onClose } = renderModal();
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
