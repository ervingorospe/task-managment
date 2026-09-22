import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/constants/session-cookie.constant";

/**
 * Blocks anonymous requests to /dashboard/** before any page HTML/JS is
 * sent, instead of the previous behavior where the layout's client-side
 * `useEffect` only redirected to /login *after* the protected page had
 * already loaded. There's no real backend session yet, so this checks for
 * the presence of a marker cookie set by auth-provider.tsx on login — not a
 * verified token, just enough for the server to tell "no session" apart
 * from "has one."
 */
export function middleware(request: NextRequest) {
  const hasSession = request.cookies.has(SESSION_COOKIE_NAME);
  if (hasSession) return NextResponse.next();

  // A rewrite (not a redirect) keeps the URL the user actually requested
  // in the address bar while rendering the app's not-found.tsx — "/404"
  // isn't a real route, so Next falls through to it. This is the
  // documented way to serve a 404 from middleware in the App Router.
  return NextResponse.rewrite(new URL("/404", request.url));
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
