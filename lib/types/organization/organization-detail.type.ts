import { MemberDetail } from "./member-detail.type";
import { MemberInviteDetail } from "./member-invite-detail.type";
import { OrgSettingsDetail } from "./organization-settings.type";
import { RoleDetail } from "./role-detail.type";
import { TagDetail } from "./tag-detail.type";
import { User } from "../user/user.type";
import { OrgCapacity } from "./organization-capacity.type";

export interface OrganizationDetail {
  id: number;
  organizationName: string;
  organizationDesc?: string;
  email?: string;
  website?: string;
  ownerId: number;
  createdAt?: string;
  updatedAt?: string;

  settings: OrgSettingsDetail;
  capacity: OrgCapacity;
  owner: User;
  roles: RoleDetail[];
  tags: TagDetail[];
  members: MemberDetail[];
  pendingInvites?: MemberInviteDetail[];
  pendingOwnershipTransfer?: MemberInviteDetail;
}
