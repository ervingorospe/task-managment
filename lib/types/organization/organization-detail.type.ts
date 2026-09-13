import { MemberDetail } from "./member-detail.type";
import { MemberInviteDetail } from "./member-invite-detail.type";
import { OrgSettingsDetail } from "./organization-settings.type";
import { RoleDetail } from "./role-detail.type";
import { TagDetail } from "./tag-detail.type";
import { User } from "../user/user.type";

export interface OrganizationDetail {
  id: number;
  organization_name: string;
  organization_desc?: string;
  email?: string;
  website?: string;
  owner_id: number;
  createdAt?: string;
  updatedAt?: string;

  settings: OrgSettingsDetail;
  owner: User;
  roles: RoleDetail[];
  tags: TagDetail[];
  members: MemberDetail[];
  pendingInvites?: MemberInviteDetail[];
  pendingOwnershipTransfer?: MemberInviteDetail;
}
