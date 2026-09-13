import { RoleDetail } from "../organization/role-detail.type";
import { UserOrganization } from "./user-organization.type";

export interface UserMembership {
  id: number;
  role: RoleDetail;
  organization: UserOrganization;
}
