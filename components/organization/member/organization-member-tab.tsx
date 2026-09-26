"use client";

import { useState } from "react";
import { Info, FolderKanban, Users } from "lucide-react";
import type { OrganizationDetail } from "@/lib/types/organization/organization-detail.type";
import OrganizationMembers from "@/components/organization/own/panels/organization-members";
import OrganizaionTab from "@/components/organization/member/organization-tab";
import TicketReports from "@/components/organization/ticket-reports/ticket-reports";
import { Can } from "@/components/auth/can";
import { PERMISSIONS } from "@/lib/data/permissions";
import EmptyState from "@/components/ui/empty-state";
import { OrganizationDisabledState } from "@/components/organization/organization-disabled-state";
import LeaveOrganizationSection, {
  LeaveOrganizationButton,
} from "./organization-leave";
import { useIsOrganizationOwner } from "@/hooks/use-is-organization-owner";

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
    // Reports/charts, not ticket management — gated on the dedicated
    // report.view.all rule rather than ticket.view.all, so a role that
    // just needs broad ticket visibility isn't also handed full reporting.
    permission: PERMISSIONS.REPORT_VIEW_ALL,
  },
] as const;
type Tab = (typeof tabs)[number]["id"];

export default function OrganizationMemberTabs({
  organization,
}: {
  organization: OrganizationDetail;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("info");
  const isOwner = useIsOrganizationOwner(organization.ownerId);

  // A member still needs a way out of a disabled org, so this page (unlike
  // the other /organizations/[slug]/** pages) isn't blocked wholesale by
  // MemberGuard — it handles the disabled state itself, keeping the leave
  // action available instead of hiding it along with everything else.
  if (!organization.settings.isActive) {
    return (
      <OrganizationDisabledState
        organizationName={organization.organizationName}
        action={
          !isOwner && (
            <LeaveOrganizationButton
              organizationName={organization.organizationName}
            />
          )
        }
      />
    );
  }

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
            {!isOwner && (
              <LeaveOrganizationSection
                organizationName={organization.organizationName}
              />
            )}
          </>
        )}

        {activeTab === "members" && (
          <Can
            action={PERMISSIONS.MEMBER_VIEW_MEMBERS}
            fallback={
              <EmptyState subtitle="You do not have permission to view organization members." />
            }
          >
            <OrganizationMembers organization={organization} />
          </Can>
        )}

        {activeTab === "tickets" && (
          <Can
            action={PERMISSIONS.REPORT_VIEW_ALL}
            fallback={
              <EmptyState subtitle="You do not have permission to view organization reports." />
            }
          >
            <TicketReports organization={organization} />
          </Can>
        )}
      </div>
    </div>
  );
}
