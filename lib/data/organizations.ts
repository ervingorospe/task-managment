import { RoleDetail } from "../types/organization/role-detail.type";
import { RuleCategory } from "../types/rule/rule-category.type";
import { TagDetail } from "../types/organization/tag-detail.type";
import { mockDefaultRoles } from "./default-roles";
import { rules } from "./default-rules";
import { mockDefaultTags } from "./default-tags";
import { rulesCategories } from "./rules-category";

export interface OwnedOrganization {
  id: string;
  name: string;
  logo?: string;
  slug: string;
  organization_desc?: "A small studio building tools for independent creators.";
}

const mockOrganizations: OwnedOrganization[] = [
  {
    id: "acme-studio",
    name: "Acme Studio",
    slug: "acme-studio",
    organization_desc:
      "A small studio building tools for independent creators.",
  },
];

export async function getOwnedOrganizations(): Promise<OwnedOrganization[]> {
  // TODO: replace with a real fetch to the Organization service, e.g.:
  // const res = await fetch(`${process.env.API_URL}/organizations/owned`, { headers: authHeaders() });
  // return res.json();
  return mockOrganizations;
}

export interface PermissionOption {
  id: number;
  action: string;
  name: string;
  desc: string;
  categoryId: number;
}

// functions get be use transfer to lib/api/
export async function getDefaultRoles(): Promise<RoleDetail[]> {
  // TODO: GET /organizations/defaults/roles
  return mockDefaultRoles;
}

export async function getPermissionOptions(): Promise<PermissionOption[]> {
  // TODO: GET /organizations/defaults/permissions
  return rules;
}

export async function getDefaultTags(): Promise<TagDetail[]> {
  // TODO: GET /organizations/defaults/tags
  return mockDefaultTags;
}

export async function getRuleCategories(): Promise<RuleCategory[]> {
  // TODO: GET /organizations/defaults/tags
  return rulesCategories;
}
