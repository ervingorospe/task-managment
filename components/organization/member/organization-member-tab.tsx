"use client";

import { useState } from "react";
import { Info, FolderKanban, Users } from "lucide-react";
import type { OrganizationDetail } from "@/lib/types/organization/organization-detail.type";
import OrganizationMembers from "@/components/organization/own/panels/organization-members";
import OrganizaionTab from "@/components/organization/member/organization-tab";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/auth/can";
import { PERMISSIONS } from "@/lib/data/permissions";
import EmptyState from "@/components/ui/empty-state";
import LeaveOrganizationSection from "./organization-leave";
import { AccountTypeGuard } from "@/components/auth/account-type.guard";
import { ACCOUNT_TYPE } from "@/lib/constants/accoun-type.constant";

const tabs = [
  {
    id: "info",
    label: "Info",
    icon: Info,
    permission: null,
  },
  {
    id: "members",
    label: "Members",
    icon: Users,
    permission: PERMISSIONS.MEMBER_VIEW_MEMBERS,
  },
  {
    id: "tickets",
    label: "Tickets",
    icon: FolderKanban,
    permission: PERMISSIONS.TICKET_VIEW_ALL,
  },
] as const;
type Tab = (typeof tabs)[number]["id"];

export default function OrganizationMemberTabs({
  organization,
}: {
  organization: OrganizationDetail;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("info");

  return (
    <div>
      <div className="flex items-center gap-3">
        <img
          src={organization.settings.logo}
          alt={organization.organizationName}
          className="h-10 w-10 rounded-lg object-cover"
        />

        <div>
          <h1 className="text-lg font-semibold text-ink">
            {organization.organizationName}
          </h1>

          <p className="text-sm text-ink-muted">
            {organization.organizationDesc}
          </p>
        </div>
      </div>

      <div className="mt-6 flex gap-1 border-b border-line">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;

          const button = (
            <button
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "border-accent-text text-accent-text"
                  : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );

          if (!tab.permission) {
            return <div key={tab.id}>{button}</div>;
          }

          return (
            <Can key={tab.id} action={tab.permission}>
              {button}
            </Can>
          );
        })}
      </div>

      <div className="mt-6 space-y-6">
        {activeTab === "info" && (
          <>
            <OrganizaionTab organization={organization} />
            <AccountTypeGuard accountType={ACCOUNT_TYPE.MEMBER}>
              <LeaveOrganizationSection
                organizationName={organization.organizationName}
              />
            </AccountTypeGuard>
          </>
        )}

        {activeTab === "members" && (
          <Can
            action={PERMISSIONS.MEMBER_VIEW_MEMBERS}
            fallback={
              <div className="rounded border border-dashed border-line p-10 text-center">
                <p className="text-sm text-ink-muted">
                  You do not have permission to view organization members.
                </p>
              </div>
            }
          >
            <OrganizationMembers organization={organization} />
          </Can>
        )}

        {activeTab === "tickets" && (
          <Can
            action={PERMISSIONS.TICKET_VIEW_ALL}
            fallback={
              <div className="rounded border border-dashed border-line p-10 text-center">
                <p className="text-sm text-ink-muted">
                  You do not have permission to view organization tickets.
                </p>
              </div>
            }
          >
            <EmptyState
              title="No tickets yet"
              subtitle="Tickets you're part of in this organization will show up
                here."
            >
              <Can action={PERMISSIONS.TICKET_VIEW_ALL}>
                <Button className="mt-4">Create Ticket</Button>
              </Can>
            </EmptyState>
          </Can>
        )}
      </div>
    </div>
  );
}
