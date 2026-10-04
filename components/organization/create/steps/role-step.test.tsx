import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RolesStep from "./role-step";
import { StepperProvider } from "@/providers/stepper.provider";
import { OrganizationDefaultsProvider } from "@/providers/organization-defaults.provider";
import type { RoleDetail } from "@/lib/types/organization/role-detail.type";
import type { RoleFormValues } from "@/lib/schemas/organization.schema";

jest.mock("@/components/organization/role/role-manager", () => {
  return function MockRoleManager(props: any) {
    return (
      <div>
        <div data-testid="roles">
          {props.roles
            .map((r: RoleDetail) => `${r.roleName}:${r.rules.map((rule: any) => rule.action).join("+")}`)
            .join(",")}
        </div>
        <div data-testid="capacity">{props.capacity}</div>
        <button
          onClick={() =>
            ((window as any).__result = props.addRole({
              roleName: "Manager",
              roleDesc: "",
              rules: [1],
            } as RoleFormValues))
          }
        >
          add-duplicate
        </button>
        <button
          onClick={() =>
            ((window as any).__result = props.addRole({
              roleName: "Reviewer",
              roleDesc: "Reviews work",
              rules: [1, 2],
            } as RoleFormValues))
          }
        >
          add-new
        </button>
        <button
          onClick={() =>
            ((window as any).__result = props.addRole({
              roleName: "NoDesc",
              rules: [1],
            } as RoleFormValues))
          }
        >
          add-no-desc
        </button>
        <button
          onClick={() =>
            ((window as any).__result = props.updateRole(1, {
              roleName: "Manager",
              roleDesc: "",
              rules: [2],
            } as RoleFormValues))
          }
        >
          update-ok
        </button>
        <button
          onClick={() =>
            ((window as any).__result = props.updateRole(1, {
              roleName: "Client",
              roleDesc: "",
              rules: [1],
            } as RoleFormValues))
          }
        >
          update-duplicate
        </button>
        <button
          onClick={() =>
            ((window as any).__result = props.updateRole(1, {
              roleName: "Manager",
              rules: [1],
            } as RoleFormValues))
          }
        >
          update-no-desc
        </button>
        <button onClick={() => props.onDeleteRole({ id: 2 } as RoleDetail)}>
          delete-client
        </button>
      </div>
    );
  };
});

const MANAGER: RoleDetail = {
  id: 1,
  roleName: "Manager",
  roleDesc: "",
  isDefault: false,
  orgId: null,
  isLocked: false,
  isDeleted: false,
  rules: [{ id: 1, action: "view", name: "view", desc: "", categoryId: 1 }],
};
const CLIENT: RoleDetail = {
  id: 2,
  roleName: "Client",
  roleDesc: "",
  isDefault: true,
  orgId: null,
  isLocked: true,
  isDeleted: false,
  rules: [],
};

const permissionOptions = [
  { id: 1, action: "view", name: "view", desc: "", categoryId: 1 },
  { id: 2, action: "edit", name: "edit", desc: "", categoryId: 1 },
];

function renderStep(roles: RoleDetail[] = [MANAGER, CLIENT]) {
  return render(
    <OrganizationDefaultsProvider
      roles={roles}
      permissionOptions={permissionOptions}
      ruleCategories={[]}
      tags={[]}
      capacity={{ members: 10, tags: 5, roles: 6, tickets: 10, projects: 10 }}
    >
      <StepperProvider totalSteps={1}>
        <RolesStep />
      </StepperProvider>
    </OrganizationDefaultsProvider>,
  );
}

beforeEach(() => {
  delete (window as any).__result;
});

it("seeds roles from organization defaults and passes capacity through", () => {
  renderStep();
  expect(screen.getByTestId("roles")).toHaveTextContent("Manager:view,Client:");
  expect(screen.getByTestId("capacity")).toHaveTextContent("6");
});

it("rejects adding a role whose name already exists (case-insensitive)", async () => {
  renderStep();
  await userEvent.click(screen.getByText("add-duplicate"));
  expect((window as any).__result).toBe('A role named "Manager" already exists.');
  expect(screen.getByTestId("roles")).not.toHaveTextContent("Reviewer");
});

it("adds a new role, resolving its rule ids against the permission catalog", async () => {
  renderStep();
  await userEvent.click(screen.getByText("add-new"));
  expect((window as any).__result).toBeUndefined();
  expect(screen.getByTestId("roles")).toHaveTextContent("Reviewer:view+edit");
});

it("rejects updating a role to a name that collides with another role", async () => {
  renderStep();
  await userEvent.click(screen.getByText("update-duplicate"));
  expect((window as any).__result).toBe('A role named "Client" already exists.');
  expect(screen.getByTestId("roles")).toHaveTextContent("Manager:view");
});

it("updates a role's name and rules, leaving other roles untouched", async () => {
  renderStep();
  await userEvent.click(screen.getByText("update-ok"));
  expect((window as any).__result).toBeUndefined();
  expect(screen.getByTestId("roles")).toHaveTextContent("Manager:edit,Client:");
});

it("defaults roleDesc to an empty string when adding a role without one", async () => {
  renderStep();
  await userEvent.click(screen.getByText("add-no-desc"));
  expect((window as any).__result).toBeUndefined();
  expect(screen.getByTestId("roles")).toHaveTextContent("NoDesc:view");
});

it("defaults roleDesc to an empty string when updating a role without one", async () => {
  renderStep();
  await userEvent.click(screen.getByText("update-no-desc"));
  expect((window as any).__result).toBeUndefined();
  expect(screen.getByTestId("roles")).toHaveTextContent("Manager:view");
});

it("deletes a role", async () => {
  renderStep();
  await userEvent.click(screen.getByText("delete-client"));
  expect(screen.getByTestId("roles")).toHaveTextContent("Manager:view");
  expect(screen.getByTestId("roles")).not.toHaveTextContent("Client");
});
