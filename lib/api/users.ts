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
