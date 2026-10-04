// Same isomorphic-dompurify ESM chain issue as lib/helper/render-description.test.ts.
jest.mock("isomorphic-dompurify", () => ({
  sanitize: (html: string, options?: { ALLOWED_TAGS?: string[] }) =>
    options?.ALLOWED_TAGS?.length === 0 ? html.replace(/<[^>]*>/g, "") : html,
}));

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProjectCard from "./project-card";
import { useAuth } from "@/providers/auth-provider";
import { PERMISSIONS } from "@/lib/data/permissions";
import type { ProjectDetail } from "@/lib/types/organization/project-detail.type";
import type { MemberDetail } from "@/lib/types/organization/member-detail.type";

jest.mock("@/providers/auth-provider", () => {
  const actual = jest.requireActual("@/providers/auth-provider");
  return { ...actual, useAuth: jest.fn() };
});

const mockedUseAuth = useAuth as jest.Mock;

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
    description: "",
    orgId: 6001,
    clientId: null,
    client: null,
    assignees: [],
    isDeleted: false,
    ...overrides,
  };
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
  withPermissions([PERMISSIONS.PROJECT_VIEW, PERMISSIONS.PROJECT_UPDATE, PERMISSIONS.PROJECT_REMOVE]);
});

function renderCard(overrides: Partial<React.ComponentProps<typeof ProjectCard>> = {}) {
  const onEdit = jest.fn();
  const onDelete = jest.fn();
  const { container } = render(
    <ProjectCard project={project()} orgSlug="acme-studio" onEdit={onEdit} onDelete={onDelete} {...overrides} />,
  );
  return { onEdit, onDelete, container };
}

it("links to the project's detail page", () => {
  renderCard({ project: project({ id: 7 }) });
  expect(screen.getByRole("link")).toHaveAttribute(
    "href",
    "/dashboard/organizations/acme-studio/projects/7",
  );
});

it("shows the project name", () => {
  renderCard();
  expect(screen.getByText("Website Revamp")).toBeInTheDocument();
});

it("shows the plain-text description", () => {
  renderCard({ project: project({ description: "**Redesign** the homepage" }) });
  expect(screen.getByText(/Redesign the homepage/)).toBeInTheDocument();
});

it("shows a fallback when there's no description", () => {
  renderCard({ project: project({ description: "" }) });
  expect(screen.getByText("No description")).toBeInTheDocument();
});

it("shows the client's name when present", () => {
  renderCard({ project: project({ client: CLIENT }) });
  expect(screen.getByText("Alex Kim")).toBeInTheDocument();
});

it("shows no client line when absent", () => {
  renderCard({ project: project({ client: null }) });
  expect(screen.queryByText("Alex Kim")).toBeNull();
});

it("shows assignee avatars when present", () => {
  renderCard({ project: project({ assignees: [ASSIGNEE] }) });
  expect(screen.getByLabelText("Jane Doe")).toBeInTheDocument();
});

it("shows no assignee row when there are none", () => {
  const { container } = renderCard({ project: project({ assignees: [] }) });
  expect(container.querySelector(".-space-x-2")).toBeNull();
});

it("falls back to a '?' avatar for an assignee with no user", () => {
  const removed: MemberDetail = { ...member({ id: 3, firstName: "Priya", lastName: "Kapoor" }), user: null };
  renderCard({ project: project({ assignees: [removed] }) });
  expect(screen.getByText("?")).toBeInTheDocument();
});

describe("edit and delete", () => {
  it("calls onEdit without navigating", async () => {
    const { onEdit } = renderCard({ project: project({ name: "Website Revamp" }) });
    await userEvent.click(screen.getByRole("button", { name: "Edit Website Revamp project" }));
    expect(onEdit).toHaveBeenCalledWith(project({ name: "Website Revamp" }));
  });

  it("calls onDelete without navigating", async () => {
    const { onDelete } = renderCard({ project: project({ name: "Website Revamp" }) });
    await userEvent.click(screen.getByRole("button", { name: "Delete Website Revamp project" }));
    expect(onDelete).toHaveBeenCalledWith(project({ name: "Website Revamp" }));
  });

  it("hides Edit without project.update", () => {
    withPermissions([PERMISSIONS.PROJECT_VIEW, PERMISSIONS.PROJECT_REMOVE]);
    renderCard();
    expect(screen.queryByRole("button", { name: /Edit/ })).toBeNull();
  });

  it("hides Delete without project.remove", () => {
    withPermissions([PERMISSIONS.PROJECT_VIEW, PERMISSIONS.PROJECT_UPDATE]);
    renderCard();
    expect(screen.queryByRole("button", { name: /Delete/ })).toBeNull();
  });

  it("hides both without project.view or project.view_own", () => {
    withPermissions([PERMISSIONS.PROJECT_UPDATE, PERMISSIONS.PROJECT_REMOVE]);
    renderCard();
    expect(screen.queryByRole("button", { name: /Edit|Delete/ })).toBeNull();
  });

  it("shows both with only project.view_own", () => {
    withPermissions([PERMISSIONS.PROJECT_VIEW_OWN, PERMISSIONS.PROJECT_UPDATE, PERMISSIONS.PROJECT_REMOVE]);
    renderCard();
    expect(screen.getByRole("button", { name: /Edit/ })).toBeInTheDocument();
  });
});
