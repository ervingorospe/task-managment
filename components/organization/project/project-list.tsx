"use client";

import ProjectCard from "@/components/organization/project/project-card";
import { ProjectDetail } from "@/lib/types/organization/project-detail.type";
import EmptyState from "@/components/ui/empty-state";

interface ProjectListProps {
  projects: ProjectDetail[];
  orgSlug: string;
  onEdit: (project: ProjectDetail) => void;
  onDelete: (project: ProjectDetail) => void;
}

export default function ProjectList({
  projects,
  orgSlug,
  onEdit,
  onDelete,
}: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <EmptyState
        title="No projects yet"
        subtitle="Create a project to start grouping tickets under it."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          orgSlug={orgSlug}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
