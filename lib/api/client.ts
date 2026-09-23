import { AUTH_COOKIE_NAME } from "@/lib/constants/auth-cookie.constant";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// Attachment URLs come back from the backend as a path relative to it
// (e.g. "/uploads/<file>") since it just serves them off its own disk —
// resolve them against the API origin, not the frontend's.
export function toAbsoluteApiUrl(path: string): string {
  return /^https?:\/\//.test(path) ? path : `${API_BASE_URL}${path}`;
}

const MUTATING_METHODS = new Set(["POST", "PATCH", "PUT", "DELETE"]);

// GET caching is OFF for now (was a short-revalidate window — see git
// history). Real cache invalidation on mutation (revalidatePath/Tag) only
// works when the write goes through Next's own server; this app's writes
// hit the NestJS backend straight from the browser, so Next has no way to
// know a write happened. Short of proxying every mutation through a Next
// Route Handler just to call revalidatePath, "always fresh" is simpler
// and correct — revisit if repeated reads become expensive enough to
// need caching back, at which point proxying mutations is the real fix,
// not just re-adding a revalidate window.

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(
      (body as { message?: string } | null)?.message ??
        `Request failed (${status})`,
    );
    this.name = "ApiError";
  }
}

/** True for a 404 (genuinely doesn't exist) or a 403 (exists, but the
 * caller isn't authorized to see it — e.g. an org/ticket/request they
 * aren't a member of). Callers fetching a single resource by id treat
 * both the same and return null, which the page turns into a 404 via
 * notFound() — deliberately not revealing whether a resource exists to
 * someone who isn't allowed to see it. */
export function isNotFoundOrForbidden(error: unknown): boolean {
  return (
    error instanceof ApiError && (error.status === 404 || error.status === 403)
  );
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? "GET").toUpperCase();
  // FormData (file uploads) must NOT get a manual Content-Type — the
  // browser sets one itself with the multipart boundary the server needs.
  const isFormData = init?.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(init?.headers as Record<string, string> | undefined),
  };

  // One key per call, generated up front so it stays stable if this
  // request is ever retried (e.g. a network blip) — the backend uses it
  // to recognize a retried write as the same request instead of doing it
  // twice (a double-submit, or two tabs racing the same click).
  if (MUTATING_METHODS.has(method) && !headers["Idempotency-Key"]) {
    headers["Idempotency-Key"] = crypto.randomUUID();
  }

  // Server Components/Route Handlers run this fetch from the Next.js
  // server, not the browser — `credentials: "include"` below only
  // attaches cookies for a fetch the *browser* makes. Without this, every
  // server-rendered page's data fetch would silently hit the backend
  // logged out. A dynamic import keeps `next/headers` (server-only) out
  // of the client bundle, since this same file is also used client-side.
  if (typeof window === "undefined") {
    const { cookies } = await import("next/headers");
    const authCookie = (await cookies()).get(AUTH_COOKIE_NAME);
    if (authCookie) {
      headers["Cookie"] = `${AUTH_COOKIE_NAME}=${authCookie.value}`;
    }
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
    // The session cookie is httpOnly and set by the backend, a different
    // origin from this app (even in dev — different ports) — fetch won't
    // send/accept cookies cross-origin without this.
    credentials: "include",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, body);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  postForm: <T>(path: string, body: FormData) =>
    request<T>(path, { method: "POST", body }),
};
