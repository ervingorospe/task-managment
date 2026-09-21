import { api } from "./client";
import { adaptTag } from "./adapters";
import type { TagDetail } from "@/lib/types/organization/tag-detail.type";
import type { RawTag } from "./raw-types";

export async function createTag(
  orgId: number,
  payload: { tagName: string; color: string },
): Promise<TagDetail> {
  const tag = await api.post<RawTag>(`/tags?orgId=${orgId}`, payload);
  return adaptTag(tag);
}

export async function updateTag(
  tagId: number,
  payload: { tagName?: string; color?: string },
): Promise<TagDetail> {
  const tag = await api.patch<RawTag>(`/tags/${tagId}`, payload);
  return adaptTag(tag);
}

export async function deleteTag(tagId: number): Promise<void> {
  await api.delete(`/tags/${tagId}`);
}
