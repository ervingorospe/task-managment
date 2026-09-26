// user/current-user.type.ts
import { User } from "./user.type";
import { UserMembership } from "./user-membership.type";

/** The logged-in user's full identity, used for session state and the org switcher. */
export interface CurrentUser extends User {
  memberships: UserMembership[];
  /** False for a Google-only account that's never set one — profile
   * settings shows a "set password" flow instead of "change password". */
  hasPassword: boolean;
  /** True only for an account first created by accepting an org invite —
   * never signed up directly. Can't delete its own account or create an
   * organization (see account-danger-zone-section.tsx). */
  createdViaInvite: boolean;
}
