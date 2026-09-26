import { api } from "./client";

export async function updateUser(
  userId: number,
  patch: {
    firstName?: string;
    lastName?: string;
    email?: string;
    avatar?: string | null;
  },
): Promise<void> {
  await api.patch(`/users/${userId}`, patch);
}

export async function uploadUserAvatar(
  userId: number,
  file: File,
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const result = await api.postForm<{ url: string }>(
    `/users/${userId}/avatar`,
    formData,
  );
  return result.url;
}

export interface ChangePasswordPayload {
  /** Omitted when the account has no password yet (Google-only) — see
   * ChangePasswordSection. */
  currentPassword?: string;
  newPassword: string;
  confirmPassword: string;
}

export async function changeUserPassword(
  userId: number,
  payload: ChangePasswordPayload,
): Promise<void> {
  await api.patch(`/users/${userId}/password`, payload);
}

export async function deleteUserAccount(userId: number): Promise<void> {
  await api.delete(`/users/${userId}`);
}
