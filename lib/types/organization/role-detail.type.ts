import { Rule } from "../rule/rule.type";

export interface RoleDetail {
  id: number;
  roleName: string;
  roleDesc?: string;
  isDefault: boolean;
  orgId: number | null;
  isLocked: boolean;
  isDeleted: boolean;
  createdAt?: string;
  updatedAt?: string;
  rules: Rule[];
}
