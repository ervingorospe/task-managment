export interface MemberInviteDetail {
  id: number;
  email: string;
  token?: string;
  expiry?: string;
  resentCount?: number;
  type?: "membership" | "ownership";
  status?: string;
  role_id: number;
  org_id?: number;
  createdAt?: string;
  updatedAt?: string;
}
