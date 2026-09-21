// Thin pass-through to the real backend — no mock data. The org-creation
// wizard and the "my organizations" pages read everything here.

import { api } from "@/lib/api/client";
import { adaptRole, adaptTag } from "@/lib/api/adapters";
import type { RawRole, RawRuleCategory, RawTag } from "@/lib/api/raw-types";
import type { RoleDetail } from "../types/organization/role-detail.type";
import type { RuleCategory } from "../types/rule/rule-category.type";
import type { TagDetail } from "../types/organization/tag-detail.type";
import type { OrgCapacity } from "../types/organization/organization-capacity.type";

export interface PermissionOption {
  id: number;
  action: string;
  name: string;
  desc: string;
  categoryId: number;
}

async function fetchDefaultCategories(): Promise<RawRuleCategory[]> {
  return api.get<RawRuleCategory[]>("/organizations/defaults/permissions");
}

export async function getDefaultRoles(): Promise<RoleDetail[]> {
  const roles = await api.get<RawRole[]>("/organizations/defaults/roles");
  return roles.map(adaptRole);
}

export async function getPermissionOptions(): Promise<PermissionOption[]> {
  const categories = await fetchDefaultCategories();
  return categories.flatMap((category) => category.rules);
}

export async function getDefaultTags(): Promise<TagDetail[]> {
  const tags = await api.get<RawTag[]>("/organizations/defaults/tags");
  return tags.map(adaptTag);
}

export async function getRuleCategories(): Promise<RuleCategory[]> {
  const categories = await fetchDefaultCategories();
  return categories.map(({ id, name }) => ({ id, name }));
}

export async function getOrgCapacity(): Promise<OrgCapacity> {
  // The backend assigns capacity defaults itself when an organization is
  // created (see OrganizationCapacity in prisma/schema.prisma) — the
  // wizard just needs something to display before that happens.
  return { members: 20, tags: 20, roles: 10, tickets: 1000, projects: 10 };
}
