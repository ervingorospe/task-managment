// user/user-organization.type.ts
import type { OrganizationDetail } from "../organization/organization-detail.type";

/** The lightweight org shape shown in the org switcher — a subset of OrganizationDetail, not a separate entity. */
export type UserOrganization = Pick<
  OrganizationDetail,
  | "id"
  | "organizationName"
  | "organizationDesc"
  | "email"
  | "website"
  | "ownerId"
  | "settings"
>;
