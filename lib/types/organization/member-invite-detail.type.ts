export interface MemberInviteDetail {
  id: number;
  email: string;
  token?: string;
  expiry?: string;
  resentCount?: number;
  type?: "membership" | "ownership";
  status?: string;
  roleId: number;
  orgId?: number;
  createdAt?: string;
  updatedAt?: string;
}
