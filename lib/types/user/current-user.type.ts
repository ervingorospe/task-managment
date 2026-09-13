// user/current-user.type.ts
import { User } from "./user.type";
import { UserMembership } from "./user-membership.type";

/** The logged-in user's full identity, used for session state and the org switcher. */
export interface CurrentUser extends User {
  memberships: UserMembership[];
}
