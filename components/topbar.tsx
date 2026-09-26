"use client";

import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import Avatar from "@/components/ui/avatar";
import Dropdown from "@/components/ui/dropdown";
import {
  ChevronDown,
  User,
  Settings,
  LogOut,
  Building2,
  UserRound,
} from "lucide-react";
import { replaceUrlSlug } from "@/lib/helper/replace-url-slug";
import { TopbarClock } from "@/components/topbar-clock";

export function Topbar() {
  const router = useRouter();
  const pathname = usePathname();

  const {
    currentUser,
    activeMembership,
    isPersonalMode,
    switchOrganization,
    logout,
  } = useAuth();

  if (!currentUser) return null;

  function handleOrganizationSwitch(organizationId: number) {
    const membership = currentUser?.memberships.find(
      (m) => m.organization.id === organizationId,
    );

    if (!membership) return;

    switchOrganization(organizationId);

    // Coming from Personal mode, the current URL (e.g. /dashboard/tickets)
    // has no org slug to swap in — land on a safe, always-valid page
    // instead of leaving a stale personal-only route in the address bar.
    const newPathname = isPersonalMode
      ? "/dashboard"
      : replaceUrlSlug(pathname, membership.organization.settings.slug);

    router.push(newPathname);
  }

  function handlePersonalSwitch() {
    switchOrganization("personal");
    router.push("/dashboard");
  }

  return (
    <header className="flex h-14 items-center justify-between bg-accent px-4 print:hidden">
      <Dropdown
        align="start"
        trigger={
          <span className="flex items-center gap-1.5 rounded px-2 py-1.5 text-sm font-medium text-ink hover:bg-black/5">
            {isPersonalMode ? (
              <UserRound size={14} className="text-ink/70" />
            ) : null}
            {isPersonalMode
              ? "Personal"
              : activeMembership?.organization.organizationName}
            <ChevronDown size={14} className="text-ink/70" />
          </span>
        }
      >
        <Dropdown.DropdownItem onClick={handlePersonalSwitch}>
          <UserRound size={14} />
          Personal
        </Dropdown.DropdownItem>
        {currentUser.memberships.length > 0 && <Dropdown.DropdownSeparator />}

        {currentUser.memberships.map((membership) => (
          <Dropdown.DropdownItem
            key={membership.id}
            onClick={() => handleOrganizationSwitch(membership.organization.id)}
          >
            {membership.organization.organizationName}
          </Dropdown.DropdownItem>
        ))}
      </Dropdown>

      <div className="flex items-center gap-3">
        <TopbarClock
          timeZone={activeMembership?.organization.settings.timezone}
        />

        <Dropdown
          side="bottom"
          align="end"
          trigger={
            <Avatar
              firstName={currentUser.firstName}
              lastName={currentUser.lastName}
              src={currentUser.avatar}
            />
          }
        >
          <div className="border-b border-line px-3 py-2">
            <p className="truncate text-sm font-medium text-ink">
              {currentUser.firstName} {currentUser.lastName}
            </p>

            <p className="truncate text-xs text-ink-muted">
              {isPersonalMode ? "Personal" : activeMembership?.role.roleName}
            </p>
          </div>

          <Dropdown.DropdownItem href="/dashboard/profile">
            <User size={15} />
            Profile
          </Dropdown.DropdownItem>

          <Dropdown.DropdownItem href="/dashboard/settings">
            <Settings size={15} />
            Settings
          </Dropdown.DropdownItem>

          {!currentUser.createdViaInvite && (
            <Dropdown.DropdownItem href="/dashboard/my-organizations">
              <Building2 size={15} />
              Organization
            </Dropdown.DropdownItem>
          )}

          <Dropdown.DropdownSeparator />

          <Dropdown.DropdownItem danger onClick={logout}>
            <LogOut size={15} />
            Log out
          </Dropdown.DropdownItem>
        </Dropdown>
      </div>
    </header>
  );
}
