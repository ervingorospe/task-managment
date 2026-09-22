/** Presence-only marker cookie — there's no real backend auth yet (see
 * auth-provider.tsx), so this isn't a token and carries no signature or
 * claims. It exists purely so middleware, which runs server-side and can't
 * see the in-memory auth state, has *something* to check before letting a
 * request through to a protected route. */
export const SESSION_COOKIE_NAME = "ticketing_session";
