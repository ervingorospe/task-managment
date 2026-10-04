jest.mock("isomorphic-dompurify", () => ({ sanitize: (html: string) => html }));
jest.mock("@/components/ticket/tickets-page-client", () => ({
  __esModule: true,
  default: (props: { projectId?: number }) => (
    <div data-testid="tickets-page-client">project {props.projectId}</div>
  ),
}));
jest.mock("./project-form-modal", () => {
  const React = jest.requireActual("react");
  return {
    __esModule: true,
    ProjectFormModal: (props: {
      open: boolean;
      onSubmit: (v: unknown) => string | undefined;
      onClose: () => void;
    }) => {
      const [error, setError] = React.useState(undefined as string | undefined);
      if (!props.open) return null;
      return (
        <div data-testid="project-form-modal">
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

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProjectDetailPageClient from "./project-detail-page-client";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { useLogActivity } from "@/hooks/use-log-activity";
import { useInlineAlert } from "@/hooks/use-inline-alert";
import { updateProject } from "@/lib/api/projects";
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
jest.mock("@/lib/api/projects", () => ({ updateProject: jest.fn() }));

const mockedUseAuth = useAuth as jest.Mock;
const mockedUseToast = useToast as jest.Mock;
const mockedUseLogActivity = useLogActivity as jest.Mock;
const mockedUseInlineAlert = useInlineAlert as jest.Mock;
const mockedUpdateProject = updateProject as jest.Mock;

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
    capacity: {} as OrganizationDetail["capacity"],
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
  withPermissions([PERMISSIONS.PROJECT_VIEW, PERMISSIONS.PROJECT_UPDATE]);
  mockedUseToast.mockReturnValue(toast);
  mockedUseLogActivity.mockReturnValue(logActivity);
  mockedUseInlineAlert.mockReturnValue({ alert: null, showAlert, dismissAlert });
});

function renderPage(overrides: Partial<React.ComponentProps<typeof ProjectDetailPageClient>> = {}) {
  return render(<ProjectDetailPageClient organization={org()} project={project()} {...overrides} />);
}

it("links back to the org's projects page", () => {
  renderPage();
  expect(screen.getByRole("link", { name: /Projects/ })).toHaveAttribute(
    "href",
    "/dashboard/organizations/acme-studio/projects",
  );
});

it("shows the project name, client, and assignees", () => {
  renderPage({ project: project({ client: CLIENT_MEMBER, assignees: [MANAGER] }) });
  expect(screen.getByRole("heading", { name: "Website Revamp" })).toBeInTheDocument();
  expect(screen.getByText("Alex Kim")).toBeInTheDocument();
  expect(screen.getByLabelText("Jane Doe")).toBeInTheDocument();
});

it("shows no client line or assignee row when absent", () => {
  const { container } = renderPage({ project: project({ client: null, assignees: [] }) });
  expect(screen.queryByText("Alex Kim")).toBeNull();
  expect(container.querySelector(".-space-x-2")).toBeNull();
});

it("shows a fallback when there's no description", () => {
  renderPage({ project: project({ description: "" }) });
  expect(screen.getByText("No description provided.")).toBeInTheDocument();
});

it("renders the description HTML when present", () => {
  renderPage({ project: project({ description: "**Redesign** the homepage" }) });
  expect(screen.getByText(/the homepage/)).toBeInTheDocument();
  expect(screen.getByText("Redesign")).toBeInTheDocument();
});

it("passes the project id through to the embedded tickets page", () => {
  renderPage({ project: project({ id: 42 }) });
  expect(screen.getByTestId("tickets-page-client")).toHaveTextContent("project 42");
});

it("hides the Edit button without project.update", () => {
  withPermissions([]);
  renderPage();
  expect(screen.queryByRole("button", { name: /Edit project/ })).toBeNull();
});

describe("editing", () => {
  it("opens the edit modal and updates optimistically, confirming via the API and logging activity", async () => {
    mockedUpdateProject.mockResolvedValue(undefined);
    renderPage({ project: project({ id: 7, name: "Website Revamp" }) });

    await userEvent.click(screen.getByRole("button", { name: /Edit project/ }));
    expect(screen.getByTestId("project-form-modal")).toBeInTheDocument();
    await userEvent.click(screen.getByText("submit-form"));

    expect(screen.getByRole("heading", { name: "Mobile App" })).toBeInTheDocument();
    await waitFor(() =>
      expect(mockedUpdateProject).toHaveBeenCalledWith(7, {
        name: "Mobile App",
        description: "",
        clientId: 2,
        assigneeIds: [1],
      }),
    );
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ orgId: 6001, action: "updated", entityId: 7 }),
    );
    expect(showAlert).toHaveBeenCalledWith('Project "Mobile App" updated');
    expect(screen.queryByTestId("project-form-modal")).toBeNull();
  });

  it("rejects a duplicate name against another org project before calling the API", async () => {
    renderPage({
      organization: org({ projects: [project({ id: 1 }), project({ id: 2, name: "Duplicate Name" })] }),
      project: project({ id: 1, name: "Website Revamp" }),
    });
    await userEvent.click(screen.getByRole("button", { name: /Edit project/ }));
    await userEvent.click(screen.getByText("submit-duplicate"));

    expect(
      await screen.findByText('A project named "Duplicate Name" already exists'),
    ).toBeInTheDocument();
    expect(mockedUpdateProject).not.toHaveBeenCalled();
  });

  it("reverts the optimistic update and toasts on failure", async () => {
    mockedUpdateProject.mockRejectedValue(new Error("boom"));
    renderPage({ project: project({ id: 7, name: "Website Revamp" }) });
    await userEvent.click(screen.getByRole("button", { name: /Edit project/ }));
    await userEvent.click(screen.getByText("submit-form"));

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith('Failed to update project "Mobile App"', "error"),
    );
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Website Revamp" })).toBeInTheDocument(),
    );
  });

  it("closes without updating", async () => {
    renderPage();
    await userEvent.click(screen.getByRole("button", { name: /Edit project/ }));
    await userEvent.click(screen.getByText("close-form"));
    expect(screen.queryByTestId("project-form-modal")).toBeNull();
    expect(mockedUpdateProject).not.toHaveBeenCalled();
  });

  it("updates with no client when the client doesn't resolve to a member", async () => {
    mockedUpdateProject.mockResolvedValue(undefined);
    renderPage({ project: project({ id: 7, name: "Website Revamp" }) });
    await userEvent.click(screen.getByRole("button", { name: /Edit project/ }));
    await userEvent.click(screen.getByText("submit-no-client"));

    await waitFor(() =>
      expect(mockedUpdateProject).toHaveBeenCalledWith(7, {
        name: "No Client App",
        description: "",
        clientId: null,
        assigneeIds: [],
      }),
    );
  });
});

it("falls back to a '?' avatar for an assignee with no user", () => {
  const removed: MemberDetail = { ...member({ id: 3, firstName: "Priya", lastName: "Kapoor" }), user: null };
  renderPage({ project: project({ assignees: [removed] }) });
  expect(screen.getByText("?")).toBeInTheDocument();
});

it("shows the pending inline alert and dismisses it", async () => {
  mockedUseInlineAlert.mockReturnValue({
    alert: { message: "Project updated", variant: "success" },
    showAlert,
    dismissAlert,
  });
  renderPage();
  expect(screen.getByText("Project updated")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: /dismiss/i }));
  expect(dismissAlert).toHaveBeenCalled();
});
