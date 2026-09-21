import { api } from "./client";
import { adaptRole } from "./adapters";
import type { RoleDetail } from "@/lib/types/organization/role-detail.type";
import type { RawRole } from "./raw-types";

export async function createRole(
  orgId: number,
  payload: { roleName: string; roleDesc?: string; ruleIds: number[] },
): Promise<RoleDetail> {
  const role = await api.post<RawRole>(`/roles?orgId=${orgId}`, {
    roleName: payload.roleName,
    roleDesc: payload.roleDesc,
    rules: payload.ruleIds.map((id) => ({ id })),
  });
  return adaptRole(role);
}

export async function updateRoleInfo(
  roleId: number,
  payload: { roleName?: string; roleDesc?: string },
): Promise<RoleDetail> {
  const role = await api.patch<RawRole>(`/roles/${roleId}`, payload);
  return adaptRole(role);
}

export async function updateRoleRules(
  roleId: number,
  ruleIds: number[],
): Promise<RoleDetail> {
  const role = await api.patch<RawRole>(`/roles/${roleId}/rules`, {
    rules: ruleIds.map((id) => ({ id })),
  });
  return adaptRole(role);
}

export async function deleteRole(roleId: number): Promise<void> {
  await api.delete(`/roles/${roleId}`);
}
