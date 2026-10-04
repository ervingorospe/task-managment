// ProjectList/ProjectCard pull in toPlainText -> isomorphic-dompurify,
// same ESM chain issue as lib/helper/render-description.test.ts.
jest.mock("isomorphic-dompurify", () => ({ sanitize: (html: string) => html }));
jest.mock("./project-form-modal", () => {
  const React = jest.requireActual("react");
  return {
    __esModule: true,
    ProjectFormModal: (props: {
      open: boolean;
      onSubmit: (v: unknown) => string | undefined;
      onClose: () => void;
      project?: { name: string };
    }) => {
      const [error, setError] = React.useState(undefined as string | undefined);
      if (!props.open) return null;
      return (
        <div data-testid="project-form-modal">
          {props.project ? `Editing ${props.project.name}` : "Creating"}
          {error && <p>{error}</p>}
          <button
            onClick={() =>
              setError(props.onSubmit({ name: "Mobile App", description: "", clientId: "2", assigneeIds: [1] }))
            }
          >
            submit-form
          </button>
          <button
            onClick={() =>
              setError(props.onSubmit({ name: "Duplicate Name", description: "", clientId: null, assigneeIds: [] }))
            }
          >
            submit-duplicate
          </button>
          <button
            onClick={() =>
              setError(props.onSubmit({ name: "No Client App", description: "", clientId: null, assigneeIds: [] }))
            }
          >
            submit-no-client
          </button>
          <button onClick={props.onClose}>close-form</button>
        </div>
      );
    },
  };
});
jest.mock("@/components/ui/confirm-dialog", () => ({
  __esModule: true,
  ConfirmDialog: (props: { open: boolean; onClose: () => void; onConfirm: () => void; title: string }) =>
    props.open ? (
      <div data-testid="confirm-dialog">
        {props.title}
        <button onClick={props.onConfirm}>confirm-delete</button>
        <button onClick={props.onClose}>cancel-delete</button>
      </div>
    ) : null,
}));

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProjectsPageClient from "./projects-page-client";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { useLogActivity } from "@/hooks/use-log-activity";
import { useInlineAlert } from "@/hooks/use-inline-alert";
import { createProject, updateProject, deleteProject } from "@/lib/api/projects";
import { PERMISSIONS } from "@/lib/data/permissions";
import type { OrganizationDetail } from "@/lib/types/organization/organization-detail.type";
import type { ProjectDetail } from "@/lib/types/organization/project-detail.type";
import type { MemberDetail } from "@/lib/types/organization/member-detail.type";

jest.mock("@/providers/auth-provider", () => {
  const actual = jest.requireActual("@/providers/auth-provider");
  return { ...actual, useAuth: jest.fn() };
});
jest.mock("@/providers/toast-provider", () => ({ useToast: jest.fn() }));
jest.mock("@/hooks/use-log-activity", () => ({ useLogActivity: jest.fn() }));
jest.mock("@/hooks/use-inline-alert", () => ({ useInlineAlert: jest.fn() }));
jest.mock("@/lib/api/projects", () => ({
  createProject: jest.fn(),
  updateProject: jest.fn(),
  deleteProject: jest.fn(),
}));

const mockedUseAuth = useAuth as jest.Mock;
const mockedUseToast = useToast as jest.Mock;
const mockedUseLogActivity = useLogActivity as jest.Mock;
const mockedUseInlineAlert = useInlineAlert as jest.Mock;
const mockedCreateProject = createProject as jest.Mock;
const mockedUpdateProject = updateProject as jest.Mock;
const mockedDeleteProject = deleteProject as jest.Mock;

const toast = jest.fn();
const logActivity = jest.fn();
const showAlert = jest.fn();
const dismissAlert = jest.fn();

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

const MANAGER = member({ id: 1, firstName: "Jane", lastName: "Doe" });
const CLIENT_MEMBER = member({ id: 2, firstName: "Alex", lastName: "Kim", role: { id: 2, roleName: "Client" } as MemberDetail["role"] });

function project(overrides: Partial<ProjectDetail> = {}): ProjectDetail {
  return {
    id: 1,
    name: "Website Revamp",
    description: "",
    orgId: 6001,
    clientId: null,
    client: null,
    assignees: [],
    isDeleted: false,
    ...overrides,
  };
}

function org(overrides: Partial<OrganizationDetail> = {}): OrganizationDetail {
  return {
    id: 6001,
    organizationName: "Acme Studio",
    ownerId: 1,
    settings: { slug: "acme-studio" } as OrganizationDetail["settings"],
    capacity: { projects: 10 } as OrganizationDetail["capacity"],
    owner: {} as OrganizationDetail["owner"],
    roles: [{ id: 2, roleName: "Client" } as OrganizationDetail["roles"][number]],
    tags: [],
    projects: [],
    members: [MANAGER, CLIENT_MEMBER],
    tickets: [],
    ticketRequests: [],
    ...overrides,
  } as OrganizationDetail;
}

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
  withPermissions([PERMISSIONS.PROJECT_VIEW, PERMISSIONS.PROJECT_ADD, PERMISSIONS.PROJECT_UPDATE, PERMISSIONS.PROJECT_REMOVE]);
  mockedUseToast.mockReturnValue(toast);
  mockedUseLogActivity.mockReturnValue(logActivity);
  mockedUseInlineAlert.mockReturnValue({ alert: null, showAlert, dismissAlert });
});

function renderPage(overrides: Partial<React.ComponentProps<typeof ProjectsPageClient>> = {}) {
  return render(<ProjectsPageClient organization={org()} {...overrides} />);
}

it("shows the heading and subtitle with the org name", () => {
  renderPage();
  expect(screen.getByRole("heading", { name: "Projects" })).toBeInTheDocument();
  expect(screen.getByText("Group tickets under projects in Acme Studio.")).toBeInTheDocument();
});

it("still shows the project list without project.view or project.view_own (view access is gated server-side)", () => {
  withPermissions([]);
  renderPage({ organization: org({ projects: [project()] }) });
  expect(screen.getByText("Website Revamp")).toBeInTheDocument();
});

it("shows the stat tiles", () => {
  renderPage({ organization: org({ projects: [project({ id: 1 })], capacity: { projects: 4 } as OrganizationDetail["capacity"] }) });
  function statValue(label: string) {
    return screen.getByText(label).nextElementSibling?.textContent;
  }
  expect(statValue("Total")).toBe("1");
  expect(statValue("Available")).toBe("3");
});

it("never shows a negative 'Available' count", () => {
  renderPage({
    organization: org({
      projects: [project({ id: 1 }), project({ id: 2 })],
      capacity: { projects: 1 } as OrganizationDetail["capacity"],
    }),
  });
  function statValue(label: string) {
    return screen.getByText(label).nextElementSibling?.textContent;
  }
  expect(statValue("Available")).toBe("0");
});

it("searches projects by name", async () => {
  renderPage({
    organization: org({
      projects: [project({ id: 1, name: "Website Revamp" }), project({ id: 2, name: "Mobile App" })],
    }),
  });
  await userEvent.type(screen.getByPlaceholderText("Search projects"), "mobile");
  expect(screen.getByText("Mobile App")).toBeInTheDocument();
  expect(screen.queryByText("Website Revamp")).toBeNull();
});

it("hides Add project without project.add", () => {
  withPermissions([PERMISSIONS.PROJECT_VIEW]);
  renderPage();
  expect(screen.queryByRole("button", { name: /Add project/ })).toBeNull();
});

it("disables Add project and shows a tooltip once at capacity", () => {
  renderPage({ organization: org({ projects: [project()], capacity: { projects: 1 } as OrganizationDetail["capacity"] }) });
  const button = screen.getByRole("button", { name: /Add project/ });
  expect(button).toBeDisabled();
  expect(button).toHaveAttribute("title", "Project limit reached (1)");
});

describe("create", () => {
  it("opens the form in create mode, adds optimistically, confirms via the API, logs activity, and shows an alert", async () => {
    mockedCreateProject.mockResolvedValue(project({ id: 99, name: "Mobile App", client: CLIENT_MEMBER, clientId: 2, assignees: [MANAGER] }));
    renderPage({ organization: org({ projects: [project({ id: 1, name: "Other Project" })] }) });

    await userEvent.click(screen.getByRole("button", { name: /Add project/ }));
    expect(await screen.findByText("Creating")).toBeInTheDocument();
    await userEvent.click(screen.getByText("submit-form"));

    expect(screen.getByText("Mobile App")).toBeInTheDocument();
    expect(screen.getByText("Other Project")).toBeInTheDocument();
    await waitFor(() =>
      expect(mockedCreateProject).toHaveBeenCalledWith(6001, {
        name: "Mobile App",
        description: "",
        clientId: 2,
        assigneeIds: [1],
      }),
    );
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ orgId: 6001, action: "created", entityId: 99 }),
    );
    expect(showAlert).toHaveBeenCalledWith('Project "Mobile App" added');
    expect(screen.queryByTestId("project-form-modal")).toBeNull();
  });

  it("rejects a duplicate name before calling the API", async () => {
    renderPage({ organization: org({ projects: [project({ name: "Duplicate Name" })] }) });
    await userEvent.click(screen.getByRole("button", { name: /Add project/ }));
    await screen.findByText("Creating");
    await userEvent.click(screen.getByText("submit-duplicate"));

    expect(
      await screen.findByText('A project named "Duplicate Name" already exists'),
    ).toBeInTheDocument();
    expect(mockedCreateProject).not.toHaveBeenCalled();
    expect(screen.getByTestId("project-form-modal")).toBeInTheDocument();
  });

  it("reverts the optimistic add and toasts on failure", async () => {
    mockedCreateProject.mockRejectedValue(new Error("boom"));
    renderPage();
    await userEvent.click(screen.getByRole("button", { name: /Add project/ }));
    await screen.findByText("Creating");
    await userEvent.click(screen.getByText("submit-form"));

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith("Failed to create project \"Mobile App\"", "error"),
    );
    expect(screen.queryByText("Mobile App")).toBeNull();
  });

  it("closes without creating", async () => {
    renderPage();
    await userEvent.click(screen.getByRole("button", { name: /Add project/ }));
    await screen.findByText("Creating");
    await userEvent.click(screen.getByText("close-form"));
    expect(screen.queryByTestId("project-form-modal")).toBeNull();
    expect(mockedCreateProject).not.toHaveBeenCalled();
  });

  it("does not open the create modal once at capacity", () => {
    renderPage({ organization: org({ projects: [project()], capacity: { projects: 1 } as OrganizationDetail["capacity"] }) });
    expect(screen.getByRole("button", { name: /Add project/ })).toBeDisabled();
  });
});

describe("edit", () => {
  it("opens the form in edit mode and updates optimistically, confirming via the API and logging activity", async () => {
    mockedUpdateProject.mockResolvedValue(undefined);
    renderPage({
      organization: org({
        projects: [project({ id: 1, name: "Website Revamp" }), project({ id: 2, name: "Other Project" })],
      }),
    });

    await userEvent.click(screen.getByRole("button", { name: "Edit Website Revamp project" }));
    expect(await screen.findByText("Editing Website Revamp")).toBeInTheDocument();
    await userEvent.click(screen.getByText("submit-form"));

    expect(screen.getByText("Mobile App")).toBeInTheDocument();
    expect(screen.getByText("Other Project")).toBeInTheDocument();
    await waitFor(() =>
      expect(mockedUpdateProject).toHaveBeenCalledWith(1, {
        name: "Mobile App",
        description: "",
        clientId: 2,
        assigneeIds: [1],
      }),
    );
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ orgId: 6001, action: "updated", entityId: 1 }),
    );
    expect(showAlert).toHaveBeenCalledWith('Project "Mobile App" updated');
  });

  it("rejects a duplicate name against another project before calling the API", async () => {
    renderPage({
      organization: org({
        projects: [project({ id: 1, name: "Website Revamp" }), project({ id: 2, name: "Duplicate Name" })],
      }),
    });
    await userEvent.click(screen.getByRole("button", { name: "Edit Website Revamp project" }));
    await screen.findByText("Editing Website Revamp");
    await userEvent.click(screen.getByText("submit-duplicate"));

    expect(
      await screen.findByText('A project named "Duplicate Name" already exists'),
    ).toBeInTheDocument();
    expect(mockedUpdateProject).not.toHaveBeenCalled();
  });

  it("reverts the optimistic update and toasts on failure", async () => {
    mockedUpdateProject.mockRejectedValue(new Error("boom"));
    renderPage({
      organization: org({
        projects: [project({ id: 1, name: "Website Revamp" }), project({ id: 2, name: "Other Project" })],
      }),
    });
    await userEvent.click(screen.getByRole("button", { name: "Edit Website Revamp project" }));
    await screen.findByText("Editing Website Revamp");
    await userEvent.click(screen.getByText("submit-form"));

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith("Failed to update project \"Mobile App\"", "error"),
    );
    await waitFor(() => expect(screen.getByText("Website Revamp")).toBeInTheDocument());
    expect(screen.getByText("Other Project")).toBeInTheDocument();
  });

  it("creates with no client when the client doesn't resolve to a member", async () => {
    mockedCreateProject.mockResolvedValue(project({ id: 50, name: "No Client App" }));
    renderPage({ organization: org({ projects: [] }) });
    await userEvent.click(screen.getByRole("button", { name: /Add project/ }));
    await screen.findByText("Creating");
    await userEvent.click(screen.getByText("submit-no-client"));

    await waitFor(() =>
      expect(mockedCreateProject).toHaveBeenCalledWith(6001, {
        name: "No Client App",
        description: "",
        clientId: undefined,
        assigneeIds: [],
      }),
    );
  });

  it("updates with no client when the client doesn't resolve to a member", async () => {
    mockedUpdateProject.mockResolvedValue(undefined);
    renderPage({ organization: org({ projects: [project({ id: 1, name: "Website Revamp" })] }) });
    await userEvent.click(screen.getByRole("button", { name: "Edit Website Revamp project" }));
    await screen.findByText("Editing Website Revamp");
    await userEvent.click(screen.getByText("submit-no-client"));

    await waitFor(() =>
      expect(mockedUpdateProject).toHaveBeenCalledWith(1, {
        name: "No Client App",
        description: "",
        clientId: null,
        assigneeIds: [],
      }),
    );
  });
});

describe("delete", () => {
  it("opens a confirm dialog, deletes optimistically, confirms via the API, and logs activity", async () => {
    mockedDeleteProject.mockResolvedValue(undefined);
    renderPage({ organization: org({ projects: [project({ id: 1, name: "Website Revamp" })] }) });
    await userEvent.click(screen.getByRole("button", { name: "Delete Website Revamp project" }));
    expect(screen.getByTestId("confirm-dialog")).toBeInTheDocument();
    await userEvent.click(screen.getByText("confirm-delete"));

    expect(screen.queryByText("Website Revamp")).toBeNull();
    await waitFor(() => expect(mockedDeleteProject).toHaveBeenCalledWith(1));
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ orgId: 6001, action: "removed", entityId: 1 }),
    );
    expect(showAlert).toHaveBeenCalledWith('Project "Website Revamp" removed', "error");
  });

  it("reverts the optimistic delete and toasts on failure", async () => {
    mockedDeleteProject.mockRejectedValue(new Error("boom"));
    renderPage({ organization: org({ projects: [project({ id: 1, name: "Website Revamp" })] }) });
    await userEvent.click(screen.getByRole("button", { name: "Delete Website Revamp project" }));
    await userEvent.click(screen.getByText("confirm-delete"));

    await waitFor(() => expect(toast).toHaveBeenCalledWith("Failed to delete project", "error"));
    await waitFor(() => expect(screen.getByText("Website Revamp")).toBeInTheDocument());
  });

  it("closes without deleting on cancel", async () => {
    renderPage({ organization: org({ projects: [project({ id: 1, name: "Website Revamp" })] }) });
    await userEvent.click(screen.getByRole("button", { name: "Delete Website Revamp project" }));
    await userEvent.click(screen.getByText("cancel-delete"));
    expect(mockedDeleteProject).not.toHaveBeenCalled();
    expect(screen.getByText("Website Revamp")).toBeInTheDocument();
  });

  it("hides the confirm dialog's gate without project.remove", () => {
    withPermissions([PERMISSIONS.PROJECT_VIEW]);
    renderPage({ organization: org({ projects: [project({ id: 1, name: "Website Revamp" })] }) });
    expect(screen.queryByRole("button", { name: /Delete/ })).toBeNull();
  });
});

it("shows the pending inline alert and dismisses it", async () => {
  mockedUseInlineAlert.mockReturnValue({
    alert: { message: "Project X removed", variant: "error" },
    showAlert,
    dismissAlert,
  });
  renderPage();
  expect(screen.getByText("Project X removed")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: /dismiss/i }));
  expect(dismissAlert).toHaveBeenCalled();
});
