"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Plus, FolderKanban, FolderOpen } from "lucide-react";
import { Can } from "@/components/auth/can";
import { PERMISSIONS } from "@/lib/data/permissions";
import { Button } from "@/components/ui/buttons/button";
import { SearchInput } from "@/components/ui/search-input";
import { MiniStatCard, type MiniStat } from "@/components/ui/mini-stat-card";
import { InlineAlert } from "@/components/ui/inline-alert";
import { useInlineAlert } from "@/hooks/use-inline-alert";
import { useToast } from "@/providers/toast-provider";
import { useLogActivity } from "@/hooks/use-log-activity";
import { lazyNamed } from "@/lib/helper/lazy-named";
import ProjectList from "@/components/organization/project/project-list";
import type { ProjectFormValues } from "@/lib/schemas/organization.schema";
import type { ProjectDetail } from "@/lib/types/organization/project-detail.type";
import type { OrganizationDetail } from "@/lib/types/organization/organization-detail.type";
import {
  createProject,
  updateProject as updateProjectApi,
  deleteProject,
} from "@/lib/api/projects";
import { notifyApiError } from "@/lib/helper/api-error-toast";

const ProjectFormModal = dynamic(
  () =>
    import("@/components/organization/project/project-form-modal").then(
      (mod) => mod.ProjectFormModal,
    ),
  { ssr: false },
);

const ConfirmDialog = lazyNamed(
  () => import("@/components/ui/confirm-dialog"),
  "ConfirmDialog",
);

interface ProjectsPageClientProps {
  organization: OrganizationDetail;
}

export default function ProjectsPageClient({
  organization,
}: ProjectsPageClientProps) {
  const toast = useToast();
  const { alert, showAlert, dismissAlert } = useInlineAlert();
  const logProjectActivity = useLogActivity("project");

  const [projects, setProjects] = useState<ProjectDetail[]>(
    organization.projects,
  );
  const [search, setSearch] = useState("");
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<
    ProjectDetail | undefined
  >(undefined);
  const [deletingProject, setDeletingProject] = useState<ProjectDetail | null>(
    null,
  );

  const capacity = organization.capacity.projects;
  const atCapacity = projects.length >= capacity;

  const filteredProjects = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return projects;
    return projects.filter((p) => p.name.toLowerCase().includes(term));
  }, [projects, search]);

  // Same "who counts as a client" resolution ticket-form-modal.tsx uses —
  // role name first, falling back to the org's Client role id for members
  // whose `role` didn't come back resolved.
  const clientRoleId = organization.roles.find(
    (r) => r.roleName === "Client",
  )?.id;
  const clientMembers = useMemo(
    () =>
      organization.members.filter(
        (m) => m.role?.roleName === "Client" || m.roleId === clientRoleId,
      ),
    [organization.members, clientRoleId],
  );
  const assignableMembers = useMemo(
    () =>
      organization.members.filter(
        (m) => m.role?.roleName !== "Client" && m.roleId !== clientRoleId,
      ),
    [organization.members, clientRoleId],
  );

  const statTiles: MiniStat[] = [
    {
      label: "Total",
      value: projects.length,
      icon: FolderKanban,
      tint: "bg-accent-subtle",
      iconColor: "text-accent-text",
      valueColor: "text-ink",
      barColor: "bg-accent",
    },
    {
      label: "Available",
      value: Math.max(capacity - projects.length, 0),
      icon: FolderOpen,
      tint: "bg-canvas",
      iconColor: "text-ink-faint",
      valueColor: "text-ink",
      barColor: "bg-line",
    },
  ];

  function openCreateModal() {
    setEditingProject(undefined);
    setFormModalOpen(true);
  }

  function openEditModal(project: ProjectDetail) {
    setEditingProject(project);
    setFormModalOpen(true);
  }

  function closeFormModal() {
    setFormModalOpen(false);
    setEditingProject(undefined);
  }

  function addProject(values: ProjectFormValues): string | undefined {
    if (
      projects.some((p) => p.name.toLowerCase() === values.name.toLowerCase())
    ) {
      return `A project named "${values.name}" already exists`;
    }

    const client = clientMembers.find((m) => String(m.id) === values.clientId);
    const assignees = assignableMembers.filter((m) =>
      values.assigneeIds.includes(m.id),
    );

    const tempId = Date.now();
    const newProject: ProjectDetail = {
      id: tempId,
      name: values.name,
      description: values.description,
      orgId: organization.id,
      clientId: client?.id ?? null,
      client: client ?? null,
      assignees,
      isDeleted: false,
    };

    setProjects((prev) => [...prev, newProject]);

    createProject(organization.id, {
      name: values.name,
      description: values.description,
      clientId: client?.id,
      assigneeIds: assignees.map((m) => m.id),
    })
      .then((created) => {
        setProjects((prev) => prev.map((p) => (p.id === tempId ? created : p)));
        logProjectActivity({
          orgId: organization.id,
          action: "created",
          entityId: created.id,
          entityLabel: created.name,
          description: `created project "${values.name}"`,
        });
        showAlert(`Project "${values.name}" added`);
      })
      .catch((error) => {
        setProjects((prev) => prev.filter((p) => p.id !== tempId));
        notifyApiError(
          toast,
          error,
          `Failed to create project "${values.name}"`,
        );
      });

    return undefined;
  }

  function updateProject(
    id: number,
    values: ProjectFormValues,
  ): string | undefined {
    if (
      projects.some(
        (p) =>
          p.id !== id && p.name.toLowerCase() === values.name.toLowerCase(),
      )
    ) {
      return `A project named "${values.name}" already exists`;
    }

    const client = clientMembers.find((m) => String(m.id) === values.clientId);
    const assignees = assignableMembers.filter((m) =>
      values.assigneeIds.includes(m.id),
    );
    // updateProject is only ever called with an id that already exists
    // in `projects`, so this lookup always succeeds.
    const previous = projects.find((p) => p.id === id)!;

    setProjects((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              name: values.name,
              description: values.description,
              clientId: client?.id ?? null,
              client: client ?? null,
              assignees,
            }
          : p,
      ),
    );

    updateProjectApi(id, {
      name: values.name,
      description: values.description,
      clientId: client?.id ?? null,
      assigneeIds: assignees.map((m) => m.id),
    })
      .then(() => {
        logProjectActivity({
          orgId: organization.id,
          action: "updated",
          entityId: id,
          entityLabel: values.name,
          description: `updated project "${values.name}"`,
        });
        showAlert(`Project "${values.name}" updated`);
      })
      .catch((error) => {
        setProjects((prev) => prev.map((p) => (p.id === id ? previous : p)));
        notifyApiError(
          toast,
          error,
          `Failed to update project "${values.name}"`,
        );
      });

    return undefined;
  }

  function handleSubmit(values: ProjectFormValues): string | undefined {
    const error = editingProject
      ? updateProject(editingProject.id, values)
      : addProject(values);
    if (error) return error;
    closeFormModal();
    return undefined;
  }

  // Only ever invoked as the delete ConfirmDialog's onConfirm, which only
  // renders once deletingProject is already set.
  function handleConfirmDelete() {
    const removed = deletingProject!;
    setProjects((prev) => prev.filter((p) => p.id !== removed.id));
    setDeletingProject(null);

    deleteProject(removed.id)
      .then(() => {
        logProjectActivity({
          orgId: organization.id,
          action: "removed",
          entityId: removed.id,
          entityLabel: removed.name,
          description: `removed project "${removed.name}"`,
        });
        showAlert(`Project "${removed.name}" removed`, "error");
      })
      .catch((error) => {
        setProjects((prev) => [...prev, removed]);
        notifyApiError(toast, error, "Failed to delete project");
      });
  }

  return (
    <div>
      {alert && (
        <InlineAlert
          message={alert.message}
          variant={alert.variant}
          onDismiss={dismissAlert}
        />
      )}

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-ink">Projects</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Group tickets under projects in {organization.organizationName}.
          </p>
        </div>

        <Can
          allOf={[PERMISSIONS.PROJECT_ADD]}
          anyOf={[PERMISSIONS.PROJECT_VIEW, PERMISSIONS.PROJECT_VIEW_OWN]}
        >
          <Button
            onClick={openCreateModal}
            disabled={atCapacity}
            title={
              atCapacity ? `Project limit reached (${capacity})` : undefined
            }
          >
            <Plus size={15} className="mr-1.5" /> Add project
          </Button>
        </Can>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:w-80">
        {statTiles.map((stat) => (
          <MiniStatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="mt-6 rounded border border-line bg-surface p-4">
        <SearchInput
          containerClassName="max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects"
        />

        <div className="mt-4">
          <ProjectList
            projects={filteredProjects}
            orgSlug={organization.settings.slug}
            onEdit={openEditModal}
            onDelete={setDeletingProject}
          />
        </div>
      </div>

      {formModalOpen && (
        <Can anyOf={[PERMISSIONS.PROJECT_ADD, PERMISSIONS.PROJECT_UPDATE]}>
          <ProjectFormModal
            open={formModalOpen}
            onClose={closeFormModal}
            onSubmit={handleSubmit}
            project={editingProject}
            clientMembers={clientMembers}
            assignableMembers={assignableMembers}
          />
        </Can>
      )}

      <Can action={PERMISSIONS.PROJECT_REMOVE}>
        <ConfirmDialog
          open={deletingProject !== null}
          onClose={() => setDeletingProject(null)}
          onConfirm={handleConfirmDelete}
          title="Remove project?"
          confirmLabel="Remove project"
          description={
            <>
              Tickets already in{" "}
              <span className="font-medium text-ink">
                {deletingProject?.name}
              </span>{" "}
              will become standalone — they won&apos;t be deleted.
            </>
          }
        />
      </Can>
    </div>
  );
}
