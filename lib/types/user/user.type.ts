export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string | null;
  accountType: "owner" | "member";
  isActive: boolean;
}
