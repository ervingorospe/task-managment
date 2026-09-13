"use client";

import { useState } from "react";
import { Building2, Settings, Users } from "lucide-react";
import OrganizationHeader from "@/components/organization/own/organization-header";
import OrganizationInformation from "./panels/organization-information";
import OrganizationMembers from "./panels/organization-members";
import Container from "@/components/layout/container";
import OrganizationSettings from "./panels/organization-settings";
import { OrganizationDetail } from "@/lib/types/organization/organization-detail.type";

interface OrganizationPageProps {
  organization: OrganizationDetail;
}

type OrganizationTab = "information" | "members" | "settings";

const tabs: {
  id: OrganizationTab;
  label: string;
  icon: typeof Building2;
}[] = [
  {
    id: "information",
    label: "Information",
    icon: Building2,
  },
  {
    id: "members",
    label: "Members",
    icon: Users,
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
  },
];

export default function OrganizationTabs({
  organization,
}: OrganizationPageProps) {
  const [activeTab, setActiveTab] = useState<OrganizationTab>("information");

  return (
    <Container>
      <OrganizationHeader organization={organization} />

      <div className="border-b border-line">
        <nav className="flex gap-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={[
                  "flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition-colors",
                  active
                    ? "border-accent-text text-accent-text"
                    : "border-transparent text-ink-muted hover:text-ink",
                ].join(" ")}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {activeTab === "information" && (
        <OrganizationInformation organization={organization} />
      )}

      {activeTab === "members" && (
        <OrganizationMembers organization={organization} />
      )}

      {activeTab === "settings" && (
        <OrganizationSettings organization={organization} />
      )}
    </Container>
  );
}
