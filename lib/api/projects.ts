import { api, isNotFoundOrForbidden } from "./client";
import { adaptProject } from "./adapters";
import type { ProjectDetail } from "@/lib/types/organization/project-detail.type";
import type { RawProject } from "./raw-types";

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
