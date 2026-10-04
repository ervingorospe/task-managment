// ProjectCard pulls in toPlainText -> isomorphic-dompurify, same ESM chain
// issue as lib/helper/render-description.test.ts.
jest.mock("isomorphic-dompurify", () => ({ sanitize: (html: string) => html }));

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProjectList from "./project-list";
import { useAuth } from "@/providers/auth-provider";
import { PERMISSIONS } from "@/lib/data/permissions";
import type { ProjectDetail } from "@/lib/types/organization/project-detail.type";

jest.mock("@/providers/auth-provider", () => {
  const actual = jest.requireActual("@/providers/auth-provider");
  return { ...actual, useAuth: jest.fn() };
});

const mockedUseAuth = useAuth as jest.Mock;

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

beforeEach(() => {
  mockedUseAuth.mockReturnValue({
    activeMembership: {
      role: {
        rules: [PERMISSIONS.PROJECT_VIEW, PERMISSIONS.PROJECT_UPDATE, PERMISSIONS.PROJECT_REMOVE].map(
          (action, i) => ({ id: i, action, name: action, desc: "", categoryId: 1 }),
        ),
      },
    },
    isPersonalMode: false,
  });
});

it("shows an empty state with no projects", () => {
  render(<ProjectList projects={[]} orgSlug="acme-studio" onEdit={jest.fn()} onDelete={jest.fn()} />);
  expect(screen.getByText("No projects yet")).toBeInTheDocument();
  expect(
    screen.getByText("Create a project to start grouping tickets under it."),
  ).toBeInTheDocument();
});

it("renders one card per project", () => {
  render(
    <ProjectList
      projects={[project({ id: 1, name: "Website Revamp" }), project({ id: 2, name: "Mobile App" })]}
      orgSlug="acme-studio"
      onEdit={jest.fn()}
      onDelete={jest.fn()}
    />,
  );
  expect(screen.getByText("Website Revamp")).toBeInTheDocument();
  expect(screen.getByText("Mobile App")).toBeInTheDocument();
});

it("wires onEdit/onDelete through to the right project", async () => {
  const onEdit = jest.fn();
  const onDelete = jest.fn();
  render(
    <ProjectList
      projects={[project({ id: 1, name: "Website Revamp" }), project({ id: 2, name: "Mobile App" })]}
      orgSlug="acme-studio"
      onEdit={onEdit}
      onDelete={onDelete}
    />,
  );
  await userEvent.click(screen.getByRole("button", { name: "Edit Mobile App project" }));
  expect(onEdit).toHaveBeenCalledWith(project({ id: 2, name: "Mobile App" }));

  await userEvent.click(screen.getByRole("button", { name: "Delete Website Revamp project" }));
  expect(onDelete).toHaveBeenCalledWith(project({ id: 1, name: "Website Revamp" }));
});
