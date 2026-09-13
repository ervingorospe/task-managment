"use client";

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

export function Topbar() {
  const { currentUser, activeMembership, switchOrganization, logout } =
    useAuth();

  if (!currentUser || !activeMembership) return null;

  return (
    <header className="flex h-14 items-center justify-between bg-accent px-4">
      <Dropdown
        align="start"
        trigger={
          <span className="flex items-center gap-1.5 rounded px-2 py-1.5 text-sm font-medium text-ink hover:bg-black/5">
            {activeMembership.organization.organization_name}
            <ChevronDown size={14} className="text-ink/70" />
          </span>
        }
      >
        {currentUser.memberships.map((m) => (
          <Dropdown.DropdownItem
            key={m.organization.id}
            onClick={() => switchOrganization(m.organization.id)}
          >
            {m.organization.organization_name}
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
              firstName={currentUser.first_name}
              lastName={currentUser.last_name}
            />
          }
        >
          <div className="border-b border-line px-3 py-2">
            <p className="truncate text-sm font-medium text-ink">
              {currentUser.first_name} {currentUser.last_name}
            </p>
            <p className="truncate text-xs text-ink-muted">
              {activeMembership.role.role_name}
            </p>
          </div>
          <Dropdown.DropdownItem href="/profile">
            <User size={15} /> Profile
          </Dropdown.DropdownItem>
          <Dropdown.DropdownItem href="/dashboard/settings">
            <Settings size={15} /> Settings
          </Dropdown.DropdownItem>
          <Dropdown.DropdownItem href="/dashboard/my-organizations">
            <Building2 size={15} /> Organization
          </Dropdown.DropdownItem>
          <Dropdown.DropdownSeparator />
          <Dropdown.DropdownItem danger onClick={logout}>
            <LogOut size={15} /> Log out
          </Dropdown.DropdownItem>
        </Dropdown>
      </div>
    </header>
  );
}
