"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import {
  LayoutGrid,
  Ticket,
  FolderKanban,
  FileBarChart,
  Building2,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/providers/auth-provider";

const staticNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/dashboard/tickets", label: "Tickets", icon: Ticket },
  { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
  { href: "/dashboard/reports", label: "Reports", icon: FileBarChart },
];

export function Sidebar() {
  const pathname = usePathname();
  const { currentUser } = useAuth();
  const [orgMenuOpen, setOrgMenuOpen] = useState(
    pathname.startsWith("/dashboard/organizations"),
  );

  const memberships = currentUser?.memberships ?? [];

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-line bg-surface">
      <div className="flex h-14 items-center border-b border-line px-4">
        <span className="text-sm font-semibold text-ink">Work Orders</span>
      </div>

      <nav className="flex-1 space-y-0.5 p-2">
        {staticNavItems.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/dashboard"
              ? pathname === href
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-2.5 rounded px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-accent-subtle text-accent-text font-medium"
                  : "text-ink-muted hover:bg-canvas hover:text-ink",
              )}
            >
              <Icon size={16} strokeWidth={2} />
              {label}
            </Link>
          );
        })}

        {/* Organization submenu — one entry per org the user belongs to */}
        <div>
          <button
            type="button"
            onClick={() => setOrgMenuOpen((v) => !v)}
            className={clsx(
              "flex w-full items-center justify-between gap-2.5 rounded px-3 py-2 text-sm transition-colors",
              pathname.startsWith("/dashboard/organizations")
                ? "text-accent-text font-medium"
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
                  const href = `/dashboard/organizations/${slug}`;
                  const active = pathname.startsWith(href);
                  return (
                    <Link
                      key={membership.id}
                      href={href}
                      className={clsx(
                        "block truncate rounded px-3 py-1.5 text-sm transition-colors",
                        active
                          ? "bg-accent-subtle text-accent-text font-medium"
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
