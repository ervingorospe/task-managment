"use client";

import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import Avatar from "@/components/ui/avatar";
import Dropdown from "@/components/ui/dropdown";
import {
  ChevronDown,
  Bell,
  User,
  Settings,
  LogOut,
  Building2,
} from "lucide-react";
import { AccountTypeGuard } from "@/components/auth/account-type.guard";
import { ACCOUNT_TYPE } from "@/lib/constants/accoun-type.constant";
import { replaceUrlSlug } from "@/lib/helper/replace-url-slug";

export function Topbar() {
  const router = useRouter();
  const pathname = usePathname();

  const { currentUser, activeMembership, switchOrganization, logout } =
    useAuth();

  if (!currentUser || !activeMembership) return null;

  function handleOrganizationSwitch(organizationId: number) {
    const membership = currentUser?.memberships.find(
      (m) => m.organization.id === organizationId,
    );

    if (!membership) return;

    const newSlug = membership.organization.settings.slug;

    // Change the active organization in auth state.
    switchOrganization(organizationId);

    // Replace the organization slug in the current URL.
    const newPathname = replaceUrlSlug(pathname, newSlug);

    router.push(newPathname);
  }

  return (
    <header className="flex h-14 items-center justify-between bg-accent px-4">
      <Dropdown
        align="start"
        trigger={
          <span className="flex items-center gap-1.5 rounded px-2 py-1.5 text-sm font-medium text-ink hover:bg-black/5">
            {activeMembership.organization.organizationName}
            <ChevronDown size={14} className="text-ink/70" />
          </span>
        }
      >
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
        <button className="rounded p-1.5 text-ink/70 hover:bg-black/5 hover:text-ink">
          <Bell size={17} />
        </button>

        <Dropdown
          side="bottom"
          align="end"
          trigger={
            <Avatar
              firstName={currentUser.firstName}
              lastName={currentUser.lastName}
            />
          }
        >
          <div className="border-b border-line px-3 py-2">
            <p className="truncate text-sm font-medium text-ink">
              {currentUser.firstName} {currentUser.lastName}
            </p>

            <p className="truncate text-xs text-ink-muted">
              {activeMembership.role.roleName}
            </p>
          </div>

          <Dropdown.DropdownItem href="/profile">
            <User size={15} />
            Profile
          </Dropdown.DropdownItem>

          <Dropdown.DropdownItem href="/dashboard/settings">
            <Settings size={15} />
            Settings
          </Dropdown.DropdownItem>

          <AccountTypeGuard accountType={ACCOUNT_TYPE.OWNER}>
            <Dropdown.DropdownItem href="/dashboard/my-organizations">
              <Building2 size={15} />
              Organization
            </Dropdown.DropdownItem>
          </AccountTypeGuard>

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
