"use client";

import { memo } from "react";
import Link from "next/link";
import { Pencil, Trash2, FolderKanban, User } from "lucide-react";
import { ProjectDetail } from "@/lib/types/organization/project-detail.type";
import { PERMISSIONS } from "@/lib/data/permissions";
import { Can } from "@/components/auth/can";
import { IconButton } from "@/components/ui/buttons";
import Avatar from "@/components/ui/avatar";
import Tooltip from "@/components/ui/tooltip";
import { toPlainText } from "@/lib/helper/render-description";
import { getMemberName } from "@/lib/helper/member-name";

interface ProjectCardProps {
  project: ProjectDetail;
  orgSlug: string;
  onEdit: (project: ProjectDetail) => void;
  onDelete: (project: ProjectDetail) => void;
}

function ProjectCard({ project, orgSlug, onEdit, onDelete }: ProjectCardProps) {
  const plainDescription = toPlainText(project.description);

  return (
    <Link
      href={`/dashboard/organizations/${orgSlug}/projects/${project.id}`}
      className="flex flex-col rounded border border-line bg-surface p-4 transition-colors hover:border-accent-text"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-accent-subtle text-accent-text">
          <FolderKanban size={16} strokeWidth={2} />
        </div>

        <div className="flex items-center gap-1">
          <Can
            allOf={[PERMISSIONS.PROJECT_UPDATE]}
            anyOf={[PERMISSIONS.PROJECT_VIEW, PERMISSIONS.PROJECT_VIEW_OWN]}
          >
            <IconButton
              label={`Edit ${project.name} project`}
              icon={<Pencil size={14} />}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit(project);
              }}
            />
          </Can>
          <Can
            allOf={[PERMISSIONS.PROJECT_REMOVE]}
            anyOf={[PERMISSIONS.PROJECT_VIEW, PERMISSIONS.PROJECT_VIEW_OWN]}
          >
            <IconButton
              label={`Delete ${project.name} project`}
              icon={<Trash2 size={14} />}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(project);
              }}
            />
          </Can>
        </div>
      </div>

      <p
        className="mt-3 truncate text-sm font-medium text-ink"
        title={project.name}
      >
        {project.name}
      </p>

      <p className="mt-1 line-clamp-2 min-h-[2.5em] text-xs text-ink-muted">
        {plainDescription || "No description"}
      </p>

      {project.client && (
        <p className="mt-2 flex items-center gap-1 truncate text-xs text-ink-faint">
          <User size={11} className="shrink-0" />
          {getMemberName(project.client)}
        </p>
      )}

      {project.assignees.length > 0 && (
        <div className="mt-2 flex -space-x-2">
          {project.assignees.map((member) => (
            <Tooltip key={member.id} label={getMemberName(member)}>
              <Avatar
                firstName={member.user?.firstName ?? member.firstName}
                lastName={member.user?.lastName ?? member.lastName}
                size="sm"
                className="ring-2 ring-surface"
              />
            </Tooltip>
          ))}
        </div>
      )}
    </Link>
  );
}

export default memo(ProjectCard);
