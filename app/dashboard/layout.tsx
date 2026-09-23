"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { ActivityLogProvider } from "@/providers/activity-log-provider";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { OrganizationDisabledState } from "@/components/organization/organization-disabled-state";

// Pages under these prefixes aren't scoped to `activeOrganization` (the
// topbar switcher's selection) the way /dashboard, /reports and /activity
// are:
//  - /my-organizations, /profile, /settings are either the user's own
//    account or an owner's org-management pages, and stay reachable even
//    while the active organization is disabled — /my-organizations is the
//    only place an owner can turn it back on.
//  - /organizations/[slug]/** pages fetch their own organization by the
//    URL's slug (reached via the sidenav's org list, not the switcher),
//    which can be a *different* org than whatever's currently active in
//    the topbar — gating those here against activeOrganization would
//    check the wrong org. MemberGuard gates them instead, correctly,
//    against the org each page actually fetched.
const EXEMPT_PREFIXES = [
  "/dashboard/my-organizations",
  "/dashboard/profile",
  "/dashboard/settings",
  "/dashboard/organizations",
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isInitializing, activeOrganization, currentUser } =
    useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // A reload restores the session from the backend (see
  // auth-provider.tsx's GET /auth/me call) before this fires —
  // isInitializing gates the redirect so a real session doesn't get
  // bounced to /login while that restore is still in flight. There's no
  // server-side middleware doing this anymore (it can't — the session
  // cookie is httpOnly and set by a different origin, invisible to the
  // Next.js server), so this client-side check is now the only gate.
  useEffect(() => {
    if (!isInitializing && !isAuthenticated) router.replace("/login");
  }, [isInitializing, isAuthenticated, router]);

  // First-login onboarding (personal vs. organization) — a verified user
  // who hasn't completed it yet gets sent there before anything else in
  // the dashboard renders, regardless of which page they landed on.
  useEffect(() => {
    if (isInitializing || !isAuthenticated || !currentUser) return;
    if (!currentUser.hasOnboarded) router.replace("/onboarding");
  }, [isInitializing, isAuthenticated, currentUser, router]);

  // Force every dashboard page to refetch on navigation instead of
  // reusing Next's client Router Cache. This matters most for
  // router.back()/forward() (the Back button, or the browser's own
  // buttons) — those always restore whatever RSC payload was cached for
  // that route when it was last left, regardless of next.config.mjs's
  // staleTimes: 0 (which only governs Link/push navigation). Skips the
  // very first render so it doesn't double-fetch the page you land on.
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    router.refresh();
  }, [pathname, router]);

  if (isInitializing || !isAuthenticated) return null;
  if (currentUser && !currentUser.hasOnboarded) return null;

  const isExempt = EXEMPT_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );
  const isOrgDisabled =
    !isExempt && activeOrganization?.settings.isActive === false;

  return (
    <ActivityLogProvider>
      <div className="flex min-h-screen bg-canvas print:block">
        <Sidebar />
        <div className="flex flex-1 flex-col pb-[100px] print:pb-0">
          <Topbar />
          <main className="flex-1 p-6 print:p-0">
            {isOrgDisabled ? (
              <OrganizationDisabledState
                organizationName={activeOrganization!.organizationName}
              />
            ) : (
              children
            )}
          </main>
        </div>
      </div>
    </ActivityLogProvider>
  );
}
