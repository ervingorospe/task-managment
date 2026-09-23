export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string | null;
  isActive: boolean;
  isVerified: boolean;
  hasOnboarded: boolean;
}
