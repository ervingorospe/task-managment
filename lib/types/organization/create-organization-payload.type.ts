export interface CreateOrganizationPayload {
  organizationName: string;
  email?: string;
  website?: string;
  organizationDesc?: string;
  logo?: string;
  timezone: string;
  roles: {
    id: number;
    isDefault: boolean;
    roleName: string;
    roleDesc?: string;
    rules: { id: number }[];
  }[];
  invites: {
    email: string;
    roleId: number;
  }[];
  tags: {
    id: number;
    tagName: string;
    color: string;
    isDefault: boolean;
  }[];
}
