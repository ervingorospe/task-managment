"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, Pencil, User } from "lucide-react";
import { Can } from "@/components/auth/can";
import { PERMISSIONS } from "@/lib/data/permissions";
import { Button } from "@/components/ui/buttons/button";
import MemberAvatar from "@/components/organization/member/member-avatar";
import Tooltip from "@/components/ui/tooltip";
import { InlineAlert } from "@/components/ui/inline-alert";
import { useInlineAlert } from "@/hooks/use-inline-alert";
import { useToast } from "@/providers/toast-provider";
import { useLogActivity } from "@/hooks/use-log-activity";
import TicketsPageClient from "@/components/ticket/tickets-page-client";
import { renderDescription } from "@/lib/helper/render-description";
import { getMemberName } from "@/lib/helper/member-name";
import { updateProject as updateProjectApi } from "@/lib/api/projects";
import { notifyApiError } from "@/lib/helper/api-error-toast";
import type { ProjectFormValues } from "@/lib/schemas/organization.schema";
import type { OrganizationDetail } from "@/lib/types/organization/organization-detail.type";
import type { ProjectDetail } from "@/lib/types/organization/project-detail.type";

const ProjectFormModal = dynamic(
  () =>
    import("@/components/organization/project/project-form-modal").then(
      (mod) => mod.ProjectFormModal,
    ),
  { ssr: false },
);

interface ProjectDetailPageClientProps {
  organization: OrganizationDetail;
  project: ProjectDetail;
}

export default function ProjectDetailPageClient({
  organization,
  project: initialProject,
}: ProjectDetailPageClientProps) {
  const toast = useToast();
  const { alert, showAlert, dismissAlert } = useInlineAlert();
  const logProjectActivity = useLogActivity("project");

  const [project, setProject] = useState<ProjectDetail>(initialProject);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const hasDescription = Boolean(project.description?.trim());

  // Same "who counts as a client" resolution the Projects list page uses.
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

  function handleUpdate(values: ProjectFormValues): string | undefined {
    if (
      organization.projects.some(
        (p) =>
          p.id !== project.id &&
          p.name.toLowerCase() === values.name.toLowerCase(),
      )
    ) {
      return `A project named "${values.name}" already exists`;
    }

    const previous = project;
    const client = clientMembers.find((m) => String(m.id) === values.clientId);
    const assignees = assignableMembers.filter((m) =>
      values.assigneeIds.includes(m.id),
    );

    setProject((prev) => ({
      ...prev,
      name: values.name,
      description: values.description,
      clientId: client?.id ?? null,
      client: client ?? null,
      assignees,
    }));

    updateProjectApi(project.id, {
      name: values.name,
      description: values.description,
      clientId: client?.id ?? null,
      assigneeIds: assignees.map((m) => m.id),
    })
      .then(() => {
        logProjectActivity({
          orgId: organization.id,
          action: "updated",
          entityId: project.id,
          entityLabel: values.name,
          description: `updated project "${values.name}"`,
        });
        showAlert(`Project "${values.name}" updated`);
      })
      .catch((error) => {
        setProject(previous);
        notifyApiError(
          toast,
          error,
          `Failed to update project "${values.name}"`,
        );
      });

    setEditModalOpen(false);
    return undefined;
  }

  return (
    <div>
      <Link
        href={`/dashboard/organizations/${organization.settings.slug}/projects`}
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft size={14} />
        Projects
      </Link>

      {alert && (
        <div className="mt-3">
          <InlineAlert
            message={alert.message}
            variant={alert.variant}
            onDismiss={dismissAlert}
          />
        </div>
      )}

      <div className="mt-3 flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-ink">{project.name}</h1>
          {project.client && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-muted">
              <User size={13} />
              {getMemberName(project.client)}
            </p>
          )}
          {project.assignees.length > 0 && (
            <div className="mt-2 flex -space-x-2">
              {project.assignees.map((member) => (
                <Tooltip key={member.id} label={getMemberName(member)}>
                  <MemberAvatar
                    member={member}
                    size="sm"
                    className="ring-2 ring-surface"
                  />
                </Tooltip>
              ))}
            </div>
          )}
        </div>

        <Can
          allOf={[PERMISSIONS.PROJECT_UPDATE]}
          anyOf={[PERMISSIONS.PROJECT_VIEW, PERMISSIONS.PROJECT_VIEW_OWN]}
        >
          <Button variant="secondary" onClick={() => setEditModalOpen(true)}>
            <Pencil size={14} className="mr-1.5" />
            Edit project
          </Button>
        </Can>
      </div>

      <div className="mt-4 rounded border border-line bg-surface p-4">
        {hasDescription ? (
          <div
            className="ticket-description"
            dangerouslySetInnerHTML={{
              __html: renderDescription(project.description),
            }}
          />
        ) : (
          <p className="text-sm text-ink-faint">No description provided.</p>
        )}
      </div>

      <div className="mt-8">
        <TicketsPageClient organization={organization} projectId={project.id} />
      </div>

      {editModalOpen && (
        <Can action={PERMISSIONS.PROJECT_UPDATE}>
          <ProjectFormModal
            open={editModalOpen}
            onClose={() => setEditModalOpen(false)}
            onSubmit={handleUpdate}
            project={project}
            clientMembers={clientMembers}
            assignableMembers={assignableMembers}
          />
        </Can>
      )}
    </div>
  );
}
