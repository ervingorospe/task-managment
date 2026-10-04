jest.mock("@/providers/organization-defaults.provider", () => ({
  useOrganizationDefaults: jest.fn(),
}));

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RoleFormModal } from "./role-form-modal";
import { useOrganizationDefaults } from "@/providers/organization-defaults.provider";
import type { RoleDetail } from "@/lib/types/organization/role-detail.type";
import type { Rule } from "@/lib/types/rule/rule.type";
import type { RuleCategory } from "@/lib/types/rule/rule-category.type";

const mockedUseOrgDefaults = useOrganizationDefaults as jest.Mock;

const TICKET_VIEW: Rule = { id: 1, action: "ticket.view", name: "View tickets", desc: "", categoryId: 1 };
const TICKET_UPDATE: Rule = { id: 2, action: "ticket.update", name: "Update tickets", desc: "", categoryId: 1 };
const MEMBER_INVITE: Rule = { id: 3, action: "member.invite", name: "Invite members", desc: "", categoryId: 2 };
const UNCATEGORIZED: Rule = { id: 4, action: "misc.rule", name: "Misc rule", desc: "", categoryId: 999 };

const CATEGORIES: RuleCategory[] = [
  { id: 1, name: "Tickets" },
  { id: 2, name: "Members" },
];

function role(overrides: Partial<RoleDetail> = {}): RoleDetail {
  return {
    id: 1,
    roleName: "Manager",
    roleDesc: "Can manage tickets",
    isDefault: false,
    orgId: 6001,
    isLocked: false,
    isDeleted: false,
    rules: [TICKET_VIEW],
    ...overrides,
  };
}

beforeEach(() => {
  mockedUseOrgDefaults.mockReturnValue({
    permissionOptions: [TICKET_VIEW, TICKET_UPDATE, MEMBER_INVITE],
    ruleCategories: CATEGORIES,
  });
});

function renderModal(overrides: Partial<React.ComponentProps<typeof RoleFormModal>> = {}) {
  const onClose = jest.fn();
  const onSubmit = jest.fn();
  render(<RoleFormModal open onClose={onClose} onSubmit={onSubmit} {...overrides} />);
  return { onClose, onSubmit };
}

it("shows 'Add role' / 'Create role' for a new role", () => {
  renderModal();
  expect(screen.getAllByText("Add role").length).toBeGreaterThan(0);
  expect(screen.getByRole("button", { name: "Create role" })).toBeInTheDocument();
});

it("shows 'Edit role' / 'Save changes' and prefills an existing role", () => {
  renderModal({ role: role() });
  expect(screen.getAllByText("Edit role").length).toBeGreaterThan(0);
  expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
  expect(screen.getByDisplayValue("Manager")).toBeInTheDocument();
  expect(screen.getByDisplayValue("Can manage tickets")).toBeInTheDocument();
  expect(screen.getByLabelText("View tickets")).toBeChecked();
});

it("groups permissions by category, falling back to 'Other'", () => {
  mockedUseOrgDefaults.mockReturnValue({
    permissionOptions: [TICKET_VIEW, MEMBER_INVITE, UNCATEGORIZED],
    ruleCategories: CATEGORIES,
  });
  renderModal();
  expect(screen.getByText("Tickets")).toBeInTheDocument();
  expect(screen.getByText("Members")).toBeInTheDocument();
  expect(screen.getByText("Other")).toBeInTheDocument();
  expect(screen.getByLabelText("Misc rule")).toBeInTheDocument();
});

describe("select all", () => {
  it("is unchecked when nothing is selected", () => {
    renderModal();
    expect(screen.getByRole("checkbox", { name: "Select all" })).not.toBeChecked();
  });

  it("selects every permission when toggled on", async () => {
    renderModal();
    await userEvent.click(screen.getByRole("checkbox", { name: "Select all" }));
    expect(screen.getByLabelText("View tickets")).toBeChecked();
    expect(screen.getByLabelText("Update tickets")).toBeChecked();
    expect(screen.getByLabelText("Invite members")).toBeChecked();
  });

  it("clears every permission when toggled off from fully checked", async () => {
    renderModal({ role: role({ rules: [TICKET_VIEW, TICKET_UPDATE, MEMBER_INVITE] }) });
    const selectAll = screen.getByRole("checkbox", { name: "Select all" });
    expect(selectAll).toBeChecked();
    await userEvent.click(selectAll);
    expect(screen.getByLabelText("View tickets")).not.toBeChecked();
    expect(screen.getByLabelText("Update tickets")).not.toBeChecked();
    expect(screen.getByLabelText("Invite members")).not.toBeChecked();
  });
});

describe("individual permissions", () => {
  it("checks and unchecks a single permission", async () => {
    renderModal();
    const checkbox = screen.getByLabelText("View tickets");
    await userEvent.click(checkbox);
    expect(checkbox).toBeChecked();
    await userEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });
});

describe("validation", () => {
  it("shows an error when the role name is too short", async () => {
    renderModal();
    await userEvent.type(screen.getByLabelText(/Role name/), "A");
    await userEvent.click(screen.getByLabelText("View tickets"));
    await userEvent.click(screen.getByRole("button", { name: "Create role" }));
    expect(await screen.findByText("Role name must be at least 2 characters")).toBeInTheDocument();
  });

  it("shows an error when no permission is selected", async () => {
    renderModal();
    await userEvent.type(screen.getByLabelText(/Role name/), "Auditor");
    await userEvent.click(screen.getByRole("button", { name: "Create role" }));
    expect(await screen.findByText("Select at least one permission")).toBeInTheDocument();
  });
});

describe("submit and cancel", () => {
  it("submits and resets on success", async () => {
    const { onSubmit } = renderModal();
    onSubmit.mockReturnValue(undefined);
    await userEvent.type(screen.getByLabelText(/Role name/), "Auditor");
    await userEvent.click(screen.getByLabelText("View tickets"));
    await userEvent.click(screen.getByRole("button", { name: "Create role" }));

    expect(onSubmit).toHaveBeenCalledWith({
      roleName: "Auditor",
      roleDesc: "",
      rules: [1],
    });
  });

  it("shows a duplicate-name error inline and keeps the form open", async () => {
    const { onSubmit } = renderModal();
    onSubmit.mockReturnValue("That role name is already taken");
    await userEvent.type(screen.getByLabelText(/Role name/), "Manager");
    await userEvent.click(screen.getByLabelText("View tickets"));
    await userEvent.click(screen.getByRole("button", { name: "Create role" }));

    expect(
      (await screen.findAllByText("That role name is already taken")).length,
    ).toBeGreaterThan(0);
    expect(screen.getByDisplayValue("Manager")).toBeInTheDocument();
  });

  it("closes and resets on Cancel", async () => {
    const { onClose, onSubmit } = renderModal();
    await userEvent.type(screen.getByLabelText(/Role name/), "Draft role name");
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("re-seeds the form each time it reopens for a different role", () => {
    const { rerender } = render(
      <RoleFormModal open={false} onClose={jest.fn()} onSubmit={jest.fn()} role={role({ id: 1, roleName: "Manager" })} />,
    );
    rerender(
      <RoleFormModal open onClose={jest.fn()} onSubmit={jest.fn()} role={role({ id: 2, roleName: "Client Lead" })} />,
    );
    expect(screen.getByDisplayValue("Client Lead")).toBeInTheDocument();
  });
});
