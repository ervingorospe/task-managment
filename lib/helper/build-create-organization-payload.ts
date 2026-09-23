import type { RoleDetail } from "@/lib/types/organization/role-detail.type";
import type { TagDetail } from "@/lib/types/organization/tag-detail.type";
import type { MemberInviteDetail } from "@/lib/types/organization/member-invite-detail.type";
import type { CreateOrganizationPayload } from "@/lib/types/organization/create-organization-payload.type";

/**
 * Shapes the stepper's accumulated formData (raw step values, keyed by
 * field name) into the exact payload the Organization service expects —
 * trimming client-only bookkeeping (temp ids on roles/invites, full rule
 * objects) down to what the backend actually needs.
 */
export function buildCreateOrganizationPayload(
  formData: Record<string, unknown>,
): CreateOrganizationPayload {
  const roles = (formData.roles as RoleDetail[] | undefined) ?? [];
  const invites = (formData.invites as MemberInviteDetail[] | undefined) ?? [];
  const tags = (formData.tags as TagDetail[] | undefined) ?? [];

  return {
    organizationName: (formData.organizationName as string | undefined) ?? "",
    email: formData.email as string | undefined,
    website: formData.website as string | undefined,
    organizationDesc: formData.organizationDesc as string | undefined,
    logo: formData.logo as string | undefined,
    timezone: (formData.timezone as string | undefined) ?? "",
    roles: roles.map((role) => ({
      id: role.id,
      isDefault: role.isDefault,
      roleName: role.roleName,
      roleDesc: role.roleDesc,
      rules: role.rules.map((rule) => ({ id: rule.id })),
    })),
    invites: invites.map((invite) => ({
      email: invite.email,
      roleId: invite.roleId,
    })),
    tags: tags.map((tag) => ({
      id: tag.id,
      tagName: tag.tagName,
      color: tag.color,
      isDefault: tag.isDefault,
    })),
  };
}
