export interface OrgSettingsDetail {
  id: number;
  slug: string;
  logo?: string;
  timezone: string;
  inviteExpiration: string;
  sendEmailNotif: boolean;
  org_id: number;
  isActive: boolean;
  isDeleted: boolean;
  createdAt?: string;
  updatedAt?: string;
}
