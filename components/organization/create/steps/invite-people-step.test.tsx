import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InvitePeopleStep from "./invite-people-step";
import { useStepper } from "@/providers/stepper.provider";
import { OrganizationDefaultsProvider } from "@/providers/organization-defaults.provider";
import type { MemberInviteDetail } from "@/lib/types/organization/member-invite-detail.type";
import type { RoleDetail } from "@/lib/types/organization/role-detail.type";

jest.mock("@/providers/stepper.provider", () => {
  const actual = jest.requireActual("@/providers/stepper.provider");
  return { ...actual, useStepper: jest.fn() };
});
jest.mock("@/components/organization/member/invite-manager", () => {
  return function MockInviteManager(props: any) {
    return (
      <div>
        <div data-testid="invites">
          {props.invites.map((i: MemberInviteDetail) => `${i.email}:${i.roleId}`).join(",")}
        </div>
        <div data-testid="roles">{props.roles.map((r: RoleDetail) => r.roleName).join(",")}</div>
        <div data-testid="capacity">{props.capacity}</div>
        <button onClick={() => props.onAdd(["new@acmestudio.com"])}>add-new</button>
        <button onClick={() => props.onAdd(["existing@acmestudio.com"])}>add-duplicate</button>
        <button onClick={() => props.onAdd([])}>add-empty</button>
        <button onClick={() => props.onRemove(1)}>remove-1</button>
        <button onClick={() => props.onChangeRole(1, 9)}>change-role</button>
      </div>
    );
  };
});

const mockedUseStepper = useStepper as jest.Mock;
const setStepValid = jest.fn();
const updateFormData = jest.fn();

const existingInvite: MemberInviteDetail = {
  id: 1,
  email: "existing@acmestudio.com",
  roleId: 3,
};

function withFormData(formData: Record<string, unknown>) {
  mockedUseStepper.mockReturnValue({
    formData,
    setStepValid,
    updateFormData,
    currentStep: 1,
    totalSteps: 1,
    next: jest.fn(),
    back: jest.fn(),
    goTo: jest.fn(),
    isStepValid: true,
    isFirstStep: true,
    isLastStep: true,
  });
}

function renderStep(formData: Record<string, unknown> = {}, roles: RoleDetail[] = []) {
  withFormData(formData);
  return render(
    <OrganizationDefaultsProvider
      roles={roles}
      permissionOptions={[]}
      ruleCategories={[]}
      tags={[]}
      capacity={{ members: 8, tags: 5, roles: 5, tickets: 10, projects: 10 }}
    >
      <InvitePeopleStep />
    </OrganizationDefaultsProvider>,
  );
}

const defaultRole: RoleDetail = {
  id: 3,
  roleName: "Client",
  roleDesc: "",
  isDefault: true,
  orgId: null,
  isLocked: true,
  isDeleted: false,
  rules: [],
};

const customRole: RoleDetail = {
  id: 9,
  roleName: "Custom",
  roleDesc: "",
  isDefault: false,
  orgId: null,
  isLocked: false,
  isDeleted: false,
  rules: [],
};

it("falls back to the organization default roles when the roles step hasn't been visited", () => {
  renderStep({}, [defaultRole]);
  expect(screen.getByTestId("roles")).toHaveTextContent("Client");
  expect(screen.getByTestId("capacity")).toHaveTextContent("8");
});

it("uses the roles already set in an earlier wizard step over the defaults", () => {
  renderStep({ roles: [customRole] }, [defaultRole]);
  expect(screen.getByTestId("roles")).toHaveTextContent("Custom");
  expect(screen.getByTestId("roles")).not.toHaveTextContent("Client");
});

it("adds a new invite with the fixed client role", async () => {
  renderStep({ invites: [existingInvite] });
  await userEvent.click(screen.getByText("add-new"));
  expect(screen.getByTestId("invites")).toHaveTextContent("existing@acmestudio.com:3,new@acmestudio.com:3");
});

it("skips adding an email that's already queued (case-insensitive)", async () => {
  renderStep({ invites: [existingInvite] });
  await userEvent.click(screen.getByText("add-duplicate"));
  expect(screen.getByTestId("invites")).toHaveTextContent("existing@acmestudio.com:3");
  expect(screen.getByTestId("invites").textContent?.split(",")).toHaveLength(1);
});

it("does nothing when every submitted email is filtered out", async () => {
  renderStep({ invites: [existingInvite] });
  await userEvent.click(screen.getByText("add-empty"));
  expect(screen.getByTestId("invites")).toHaveTextContent("existing@acmestudio.com:3");
});

it("removes a queued invite, leaving other invites untouched", async () => {
  const bystander: MemberInviteDetail = { id: 2, email: "bystander@acmestudio.com", roleId: 3 };
  renderStep({ invites: [existingInvite, bystander] });
  await userEvent.click(screen.getByText("remove-1"));
  expect(screen.getByTestId("invites")).toHaveTextContent("bystander@acmestudio.com:3");
  expect(screen.getByTestId("invites")).not.toHaveTextContent("existing@acmestudio.com");
});

it("changes a queued invite's role, leaving other invites untouched", async () => {
  const bystander: MemberInviteDetail = { id: 2, email: "bystander@acmestudio.com", roleId: 3 };
  renderStep({ invites: [existingInvite, bystander] });
  await userEvent.click(screen.getByText("change-role"));
  expect(screen.getByTestId("invites")).toHaveTextContent(
    "existing@acmestudio.com:9,bystander@acmestudio.com:3",
  );
});
