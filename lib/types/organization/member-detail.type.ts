import { User } from "../user/user.type";

export interface MemberDetail {
  id: number;
  first_name: string; // only use when user was remove from org
  last_name: string; // only use when user was remove from org
  email: string; // only use when user was remove from org
  org_id: number;
  role_id: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  user: User | null;
}
