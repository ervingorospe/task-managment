import { api, ApiError } from "./client";
import { adaptCurrentUser } from "./adapters";
import type { CurrentUser } from "@/lib/types/user/current-user.type";
import type { RawCurrentUser } from "./raw-types";

export async function fetchUserByEmail(email: string): Promise<CurrentUser | null> {
  try {
    const user = await api.get<RawCurrentUser>(
      `/users/by-email/${encodeURIComponent(email)}`,
    );
    return adaptCurrentUser(user);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
