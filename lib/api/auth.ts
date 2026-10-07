import { api, ApiError } from "./client";
import { adaptCurrentUser } from "./adapters";
import type { CurrentUser } from "@/lib/types/user/current-user.type";
import type { RawCurrentUser } from "./raw-types";

export interface SignupPayload {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
}

export async function signup(payload: SignupPayload): Promise<void> {
  await api.post("/auth/signup", payload);
}

/** Thrown specifically for the UNVERIFIED case (correct password, but the
 * account hasn't clicked its verification link yet) — the login page
 * needs to distinguish this from a plain wrong-password 401 to redirect
 * to /verify-pending instead of showing a generic error. */
export class UnverifiedAccountError extends Error {
  constructor(public email: string) {
    super("This account isn't verified yet.");
    this.name = "UnverifiedAccountError";
  }
}

export async function login(
  email: string,
  password: string,
): Promise<CurrentUser> {
  try {
    const user = await api.post<RawCurrentUser>("/auth/login", {
      email,
      password,
    });
    return adaptCurrentUser(user);
  } catch (error) {
    if (
      error instanceof ApiError &&
      (error.body as { code?: string } | null)?.code === "UNVERIFIED"
    ) {
      throw new UnverifiedAccountError(email);
    }
    throw error;
  }
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout");
}

/** Returns null if there's no active session (never logged in, or the
 * session expired/was cleared) instead of throwing — callers treat that
 * as the normal "logged out" state, not an error. */
export async function fetchCurrentUser(options?: {
  skipServerDownRedirect?: boolean;
}): Promise<CurrentUser | null> {
  try {
    const user = await api.get<RawCurrentUser>("/auth/me", options);
    return adaptCurrentUser(user);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

export async function resendVerification(email: string): Promise<void> {
  await api.post("/auth/resend-verification", { email });
}

export async function completeOnboarding(): Promise<void> {
  await api.patch("/auth/onboarding");
}

export interface InviteInfo {
  email: string;
  organizationName: string;
  roleName: string;
  /** False when the invitee has some other way to log in later without
   * one — an existing account, or a Gmail address that self-links the
   * first time they use "Continue with Google". */
  requiresPassword: boolean;
}

export async function getInvite(token: string): Promise<InviteInfo> {
  return api.get<InviteInfo>(`/auth/invite/${encodeURIComponent(token)}`);
}

export interface AcceptInvitePayload {
  token: string;
  firstName?: string;
  lastName?: string;
  password?: string;
}

export async function acceptInvite(
  payload: AcceptInvitePayload,
): Promise<CurrentUser> {
  const user = await api.post<RawCurrentUser>("/auth/accept-invite", payload);
  return adaptCurrentUser(user);
}

export async function declineInvite(token: string): Promise<void> {
  await api.post("/auth/decline-invite", { token });
}
