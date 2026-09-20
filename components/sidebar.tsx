"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";
import {
  LayoutGrid,
  Ticket,
  FileBarChart,
  Building2,
  ChevronDown,
  Star,
  Users,
  Inbox,
  History,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { Can } from "@/components/auth/can";
import { PERMISSIONS, type Permission } from "@/lib/data/permissions";
import Tooltip from "@/components/ui/tooltip";

type StaticNavItem = {
  href: string;
  label: string;
  icon: typeof LayoutGrid;
  permission: Permission | null;
};

// Dashboard leads; day-to-day work items (Tickets/Starred/Requests/Members,
// rendered separately below since their hrefs depend on activeOrganization)
// come next; Reports/Activity Log are insights, so they sit after those;
// Organization management is always last.
const primaryNavItems: StaticNavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid, permission: null },
];

const insightNavItems: StaticNavItem[] = [
  {
    href: "/dashboard/reports",
    label: "Reports",
    icon: FileBarChart,
    permission: PERMISSIONS.REPORT_VIEW,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { currentUser, activeOrganization } = useAuth();

  const memberships = currentUser?.memberships ?? [];

  const ticketsHref = activeOrganization
    ? `/dashboard/organizations/${activeOrganization.settings.slug}/tickets`
    : "/dashboard";

  const ticketActive = pathname === ticketsHref;

  const starredHref = activeOrganization
    ? `/dashboard/organizations/${activeOrganization.settings.slug}/starred`
    : "/dashboard";

  const starredActive = pathname === starredHref;

  const requestsHref = activeOrganization
    ? `/dashboard/organizations/${activeOrganization.settings.slug}/requests`
    : "/dashboard";

  const requestsActive = pathname === requestsHref;

  const membersHref = activeOrganization
    ? `/dashboard/organizations/${activeOrganization.settings.slug}/members`
    : "/dashboard";

  const membersActive = pathname === membersHref;

  const activityActive = pathname.startsWith("/dashboard/activity");

  // An organization's own landing page is exactly /dashboard/organizations/{slug}
  // — no further segments. That's distinct from the Tickets nav link, which
  // routes through /dashboard/organizations/{slug}/tickets and shares the same
  // prefix, so a startsWith() check here would wrongly open this dropdown
  // whenever Tickets is active.
  const isOrgOwnPage = memberships.some(
    (membership) =>
      pathname === `/dashboard/organizations/${membership.organization.settings.slug}`,
  );

  const [orgMenuOpen, setOrgMenuOpen] = useState(isOrgOwnPage);

  // Keep the dropdown in sync with the route: leaving an organization's own
  // page for another tab should close it, not leave it hanging open.
  useEffect(() => {
    setOrgMenuOpen(isOrgOwnPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Shown by default; collapsing only hides labels/sub-menus, never the
  // whole rail, so navigation stays one click away.
  const [collapsed, setCollapsed] = useState(false);

  function navLinkClass(active: boolean) {
    return clsx(
      "flex items-center gap-2.5 rounded px-3 py-2 text-sm transition-colors",
      collapsed && "justify-center px-2",
      active
        ? "bg-accent-subtle font-medium text-accent-text"
        : "text-ink-muted hover:bg-canvas hover:text-ink",
    );
  }

  function withTooltip(label: string, node: React.ReactNode) {
    return collapsed ? <Tooltip label={label}>{node}</Tooltip> : node;
  }

  function renderStaticNavItem({
    href,
    label,
    icon: Icon,
    permission,
  }: StaticNavItem) {
    const active =
      href === "/dashboard"
        ? pathname === href
        : pathname.startsWith(`${href}/`) || pathname === href;

    const link = withTooltip(
      label,
      <Link href={href} className={navLinkClass(active)}>
        <Icon size={16} strokeWidth={2} />
        {!collapsed && label}
      </Link>,
    );

    if (!permission) {
      return <div key={href}>{link}</div>;
    }

    return (
      <Can key={href} action={permission}>
        {link}
      </Can>
    );
  }

  return (
    <aside
      className={clsx(
        "flex shrink-0 flex-col border-r border-line bg-surface transition-[width] duration-150 print:hidden",
        collapsed ? "w-16" : "w-56",
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-line px-4">
        {!collapsed && (
          <span className="truncate text-sm font-semibold text-ink">
            Work Orders
          </span>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={clsx(
            "rounded p-1.5 text-ink-faint hover:bg-canvas hover:text-ink",
            collapsed && "mx-auto",
          )}
        >
          {collapsed ? (
            <PanelLeftOpen size={16} strokeWidth={2} />
          ) : (
            <PanelLeftClose size={16} strokeWidth={2} />
          )}
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 p-2">
        {/* Dashboard */}
        {primaryNavItems.map(renderStaticNavItem)}

        {/* Tickets */}
        {withTooltip(
          "Tickets",
          <Link href={ticketsHref} className={navLinkClass(ticketActive)}>
            <Ticket size={16} strokeWidth={2} />
            {!collapsed && "Tickets"}
          </Link>,
        )}

        {/* Starred */}
        {withTooltip(
          "Starred",
          <Link href={starredHref} className={navLinkClass(starredActive)}>
            <Star size={16} strokeWidth={2} />
            {!collapsed && "Starred"}
          </Link>,
        )}

        {/* Requests — visible to staff (ticket.view.all) and clients (ticket.request) alike */}
        <Can
          anyOf={[PERMISSIONS.TICKET_VIEW_ALL, PERMISSIONS.TICKET_REQUEST]}
        >
          {withTooltip(
            "Requests",
            <Link
              href={requestsHref}
              className={navLinkClass(requestsActive)}
            >
              <Inbox size={16} strokeWidth={2} />
              {!collapsed && "Requests"}
            </Link>,
          )}
        </Can>

        {/* Members */}
        <Can action={PERMISSIONS.MEMBER_VIEW_MEMBERS}>
          {withTooltip(
            "Members",
            <Link href={membersHref} className={navLinkClass(membersActive)}>
              <Users size={16} strokeWidth={2} />
              {!collapsed && "Members"}
            </Link>,
          )}
        </Can>

        {/* Reports */}
        {insightNavItems.map(renderStaticNavItem)}

        {/* Activity Log — visible to anyone who can see all activity or just their own */}
        <Can
          anyOf={[
            PERMISSIONS.ACTIVITY_LOG_VIEW_ALL,
            PERMISSIONS.ACTIVITY_LOG_VIEW_INCLUDED,
          ]}
        >
          {withTooltip(
            "Activity Log",
            <Link
              href="/dashboard/activity"
              className={navLinkClass(activityActive)}
            >
              <History size={16} strokeWidth={2} />
              {!collapsed && "Activity Log"}
            </Link>,
          )}
        </Can>

        {/* Organization */}
        <div>
          {withTooltip(
            "Organization",
            <button
              type="button"
              onClick={() => {
                // Collapsed: clicking just re-opens the rail (with the menu
                // already expanded) instead of trying to fit a submenu into
                // an icon-only strip.
                if (collapsed) {
                  setCollapsed(false);
                  setOrgMenuOpen(true);
                  return;
                }
                setOrgMenuOpen((value) => !value);
              }}
              className={clsx(
                "flex w-full items-center gap-2.5 rounded px-3 py-2 text-sm transition-colors",
                collapsed ? "justify-center px-2" : "justify-between",
                isOrgOwnPage
                  ? "font-medium text-accent-text"
                  : "text-ink-muted hover:bg-canvas hover:text-ink",
              )}
            >
              <span className="flex items-center gap-2.5">
                <Building2 size={16} strokeWidth={2} />
                {!collapsed && "Organization"}
              </span>

              {!collapsed && (
                <ChevronDown
                  size={14}
                  className={clsx(
                    "transition-transform",
                    orgMenuOpen && "rotate-180",
                  )}
                />
              )}
            </button>,
          )}

          {!collapsed && orgMenuOpen && (
            <div className="mt-0.5 space-y-0.5 pl-7">
              {memberships.length === 0 ? (
                <p className="px-3 py-1.5 text-xs text-ink-faint">
                  Not part of any organization yet
                </p>
              ) : (
                memberships.map((membership) => {
                  const slug = membership.organization.settings.slug;

                  // Organization's own landing page.
                  const href = `/dashboard/organizations/${slug}`;

                  // IMPORTANT:
                  // Only active when the URL is exactly the organization's
                  // landing page.
                  const active = pathname === href;

                  return (
                    <Link
                      key={membership.organization.id}
                      href={href}
                      className={clsx(
                        "block truncate rounded px-3 py-1.5 text-sm transition-colors",
                        active
                          ? "bg-accent-subtle font-medium text-accent-text"
                          : "text-ink-muted hover:bg-canvas hover:text-ink",
                      )}
                    >
                      {membership.organization.organizationName}
                    </Link>
                  );
                })
              )}
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
}
