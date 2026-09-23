/** Must match ticketing-backend's AUTH_COOKIE_NAME (src/modules/auth/
 * auth.constants.ts) exactly — this is only used to forward the cookie
 * along on server-side requests (see lib/api/client.ts); the frontend
 * never reads or sets it directly, since it's httpOnly. */
export const AUTH_COOKIE_NAME = "ticketing_auth";
