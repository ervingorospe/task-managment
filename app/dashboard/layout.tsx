"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { ActivityLogProvider } from "@/providers/activity-log-provider";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { OrganizationDisabledState } from "@/components/organization/organization-disabled-state";
import { MemberRemovedState } from "@/components/organization/member-removed-state";

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
  const {
    isAuthenticated,
    isInitializing,
    activeOrganization,
    activeMembership,
    currentUser,
  } = useAuth();
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
  // Checked from currentUser.memberships (already in hand, no fetch)
  // *before* children ever mount — children's data hooks (tickets,
  // requests, org detail) all hit org-scoped backend routes that require
  // an *active* membership (see permissions.service.ts's getMembership),
  // so letting them mount first for a deactivated member means every one
  // of those fetches 403s, several of them uncaught. This is the specific
  // fix for that: block before any of it fires.
  const isMemberDeactivated = !isExempt && activeMembership?.isActive === false;
  const isOrgDisabled =
    !isExempt && !isMemberDeactivated && activeOrganization?.settings.isActive === false;

  return (
    <ActivityLogProvider>
      <div className="flex min-h-screen bg-canvas print:block">
        <Sidebar />
        {/* min-w-0 overrides this flex item's default min-width: auto —
            without it, a wide child further down (e.g. a table with its
            own min-width + overflow-x-auto) can force this whole column,
            and the page along with it, to scroll horizontally instead of
            the table scrolling on its own. */}
        <div className="flex min-w-0 flex-1 flex-col pb-[100px] print:pb-0">
          <Topbar />
          <main className="flex-1 p-6 print:p-0">
            {isMemberDeactivated ? (
              <MemberRemovedState
                organizationName={activeOrganization!.organizationName}
              />
            ) : isOrgDisabled ? (
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
