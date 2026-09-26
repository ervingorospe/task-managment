import { RoleDetail } from "../organization/role-detail.type";
import { UserOrganization } from "./user-organization.type";

export interface UserMembership {
  id: number;
  role: RoleDetail;
  organization: UserOrganization;
  /** False if an org admin deactivated this specific membership — distinct
   * from the organization itself being disabled (OrgSettingsDetail.isActive).
   * A deactivated member keeps the row (so it can be reactivated) but loses
   * access — see MemberGuard. */
  isActive: boolean;
}
