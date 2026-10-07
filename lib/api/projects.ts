import { api, isNotFoundOrForbidden } from "./client";
import { adaptProject } from "./adapters";
import type { ProjectDetail } from "@/lib/types/organization/project-detail.type";
import type { RawProject } from "./raw-types";

/** Every project the caller can see in the org — view.all sees them
 * all, view.own only the ones they're assigned to (resolved server-side,
 * see project.controller.ts/project.service.ts). Used to refresh the
 * projects list in place after a live push, without re-fetching the
 * whole org-detail payload the page started from. */
export async function fetchProjectsByOrg(
  orgId: number,
): Promise<ProjectDetail[]> {
  const projects = await api.get<RawProject[]>(`/projects?orgId=${orgId}`);
  return projects.map(adaptProject);
}

export async function fetchProjectById(
  projectId: number,
): Promise<ProjectDetail | null> {
  try {
    const project = await api.get<RawProject>(`/projects/${projectId}`);
    return adaptProject(project);
  } catch (error) {
    if (isNotFoundOrForbidden(error)) return null;
    throw error;
  }
}

export async function createProject(
  orgId: number,
  payload: {
    name: string;
    description?: string;
    clientId?: number;
    assigneeIds?: number[];
  },
): Promise<ProjectDetail> {
  const project = await api.post<RawProject>(`/projects?orgId=${orgId}`, payload);
  return adaptProject(project);
}

export async function updateProject(
  projectId: number,
  payload: {
    name?: string;
    description?: string;
    clientId?: number | null;
    assigneeIds?: number[];
  },
): Promise<ProjectDetail> {
  const project = await api.patch<RawProject>(`/projects/${projectId}`, payload);
  return adaptProject(project);
}

export async function deleteProject(projectId: number): Promise<void> {
  await api.delete(`/projects/${projectId}`);
}
