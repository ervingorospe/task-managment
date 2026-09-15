import { User } from "../user/user.type";

export interface MemberDetail {
  id: number;
  firstName: string; // only use when user was remove from org
  lastName: string; // only use when user was remove from org
  email: string; // only use when user was remove from org
  orgId: number;
  roleId: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  user: User | null;
}
