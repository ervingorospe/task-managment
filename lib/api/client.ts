import { AUTH_COOKIE_NAME } from "@/lib/constants/auth-cookie.constant";

// The backend's own origin, no version prefix — used for anything that
// isn't a versioned JSON API call (see toAbsoluteApiUrl below).
const BACKEND_ORIGIN =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// Every JSON API route is versioned (see main.ts's enableVersioning) —
// this is the one place that adds /v1, so a version bump later is a
// one-line change here instead of touching every lib/api/*.ts call site.
export const API_BASE_URL = `${BACKEND_ORIGIN}/v1`;

// Attachment URLs come back from the backend as a path relative to it
// (e.g. "/uploads/<file>") for any that aren't already absolute S3 URLs —
// resolve them against the backend's origin, not the frontend's, and
// deliberately not through the versioned API_BASE_URL, since this isn't
// an API call.
export function toAbsoluteApiUrl(path: string): string {
  return /^https?:\/\//.test(path) ? path : `${BACKEND_ORIGIN}${path}`;
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

/** Thrown when the backend itself can't be reached at all — connection
 * refused/DNS failure (fetch throws) or its host's gateway reporting it's
 * down (502/503/504) — as opposed to ApiError, which means the backend
 * DID respond, just with an error status. Most call sites never see this:
 * handleServerUnreachable() below redirects before it has a chance to
 * become an unhandled rejection in a hook with no .catch(). */
export class ServerUnreachableError extends Error {
  constructor() {
    super("Unable to reach the server.");
    this.name = "ServerUnreachableError";
  }
}

const GATEWAY_DOWN_STATUSES = new Set([502, 503, 504]);

// Read by the server-down page's "Try again" button, so it can send the
// user back to whatever they were on instead of just reloading itself.
export const SERVER_DOWN_RETURN_TO_KEY = "server_down_return_to";

function handleServerUnreachable(): void {
  if (typeof window === "undefined") return;
  if (window.location.pathname === "/server-down") return;
  sessionStorage.setItem(
    SERVER_DOWN_RETURN_TO_KEY,
    window.location.pathname + window.location.search,
  );
  window.location.href = "/server-down";
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

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      cache: "no-store",
      // The session cookie is httpOnly and set by the backend, a different
      // origin from this app (even in dev — different ports) — fetch won't
      // send/accept cookies cross-origin without this.
      credentials: "include",
    });
  } catch {
    handleServerUnreachable();
    throw new ServerUnreachableError();
  }

  if (GATEWAY_DOWN_STATUSES.has(res.status)) {
    handleServerUnreachable();
    throw new ServerUnreachableError();
  }

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
