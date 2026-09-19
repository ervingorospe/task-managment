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
} from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { Can } from "@/components/auth/can";
import { PERMISSIONS, type Permission } from "@/lib/data/permissions";

const staticNavItems: {
  href: string;
  label: string;
  icon: typeof LayoutGrid;
  permission: Permission | null;
}[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid, permission: null },
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

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-line bg-surface">
      <div className="flex h-14 items-center border-b border-line px-4">
        <span className="text-sm font-semibold text-ink">Work Orders</span>
      </div>

      <nav className="flex-1 space-y-0.5 p-2">
        {/* Static navigation */}
        {staticNavItems.map(({ href, label, icon: Icon, permission }) => {
          const active =
            href === "/dashboard"
              ? pathname === href
              : pathname.startsWith(`${href}/`) || pathname === href;

          const link = (
            <Link
              href={href}
              className={clsx(
                "flex items-center gap-2.5 rounded px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-accent-subtle font-medium text-accent-text"
                  : "text-ink-muted hover:bg-canvas hover:text-ink",
              )}
            >
              <Icon size={16} strokeWidth={2} />
              {label}
            </Link>
          );

          if (!permission) {
            return <div key={href}>{link}</div>;
          }

          return (
            <Can key={href} action={permission}>
              {link}
            </Can>
          );
        })}

        {/* Tickets */}
        <Link
          href={ticketsHref}
          className={clsx(
            "flex items-center gap-2.5 rounded px-3 py-2 text-sm transition-colors",
            ticketActive
              ? "bg-accent-subtle font-medium text-accent-text"
              : "text-ink-muted hover:bg-canvas hover:text-ink",
          )}
        >
          <Ticket size={16} strokeWidth={2} />
          Tickets
        </Link>

        {/* Starred */}
        <Link
          href={starredHref}
          className={clsx(
            "flex items-center gap-2.5 rounded px-3 py-2 text-sm transition-colors",
            starredActive
              ? "bg-accent-subtle font-medium text-accent-text"
              : "text-ink-muted hover:bg-canvas hover:text-ink",
          )}
        >
          <Star size={16} strokeWidth={2} />
          Starred
        </Link>

        {/* Requests — visible to staff (ticket.view.all) and clients (ticket.request) alike */}
        <Can
          anyOf={[PERMISSIONS.TICKET_VIEW_ALL, PERMISSIONS.TICKET_REQUEST]}
        >
          <Link
            href={requestsHref}
            className={clsx(
              "flex items-center gap-2.5 rounded px-3 py-2 text-sm transition-colors",
              requestsActive
                ? "bg-accent-subtle font-medium text-accent-text"
                : "text-ink-muted hover:bg-canvas hover:text-ink",
            )}
          >
            <Inbox size={16} strokeWidth={2} />
            Requests
          </Link>
        </Can>

        {/* Members */}
        <Can action={PERMISSIONS.MEMBER_VIEW_MEMBERS}>
          <Link
            href={membersHref}
            className={clsx(
              "flex items-center gap-2.5 rounded px-3 py-2 text-sm transition-colors",
              membersActive
                ? "bg-accent-subtle font-medium text-accent-text"
                : "text-ink-muted hover:bg-canvas hover:text-ink",
            )}
          >
            <Users size={16} strokeWidth={2} />
            Members
          </Link>
        </Can>

        {/* Organization */}
        <div>
          <button
            type="button"
            onClick={() => setOrgMenuOpen((value) => !value)}
            className={clsx(
              "flex w-full items-center justify-between gap-2.5 rounded px-3 py-2 text-sm transition-colors",
              isOrgOwnPage
                ? "font-medium text-accent-text"
                : "text-ink-muted hover:bg-canvas hover:text-ink",
            )}
          >
            <span className="flex items-center gap-2.5">
              <Building2 size={16} strokeWidth={2} />
              Organization
            </span>

            <ChevronDown
              size={14}
              className={clsx(
                "transition-transform",
                orgMenuOpen && "rotate-180",
              )}
            />
          </button>

          {orgMenuOpen && (
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
