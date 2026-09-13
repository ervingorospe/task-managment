import { Rule } from "../rule/rule.type";

export interface RoleDetail {
  id: number;
  role_name: string;
  role_desc?: string;
  isDefault: boolean;
  org_id: number | null;
  isLocked: boolean;
  isDeleted: boolean;
  createdAt?: string;
  updatedAt?: string;
  rules: Rule[];
}
