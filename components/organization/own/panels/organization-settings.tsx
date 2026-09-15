"use client";

import Container from "@/components/layout/container";
import OrganizationInfoSection from "./sections/organization-info-section";
import InviteSettingsSection from "./sections/invite-settings-section";
import NotificationSettingsSection from "./sections/notification-settings-section";
import RulesSection from "./sections/rules-section";
import DeactivateOrganizationSection from "./sections/deactivate-organization-section";
import { OrganizationDetail } from "@/lib/types/organization/organization-detail.type";
import Capacities from "./sections/organization-capacities";

interface OrganizationSettingsProps {
  organization: OrganizationDetail;
}

export default function OrganizationSettings({
  organization,
}: OrganizationSettingsProps) {
  return (
    <Container>
      <div className="space-y-6">
        <OrganizationInfoSection organization={organization} />
        <InviteSettingsSection
          initialExpiration={organization.settings.inviteExpiration}
        />
        <NotificationSettingsSection
          initialValue={organization.settings.sendEmailNotif}
        />
        <RulesSection />
        <Capacities />
        <DeactivateOrganizationSection
          organizationName={organization.organizationName}
        />
      </div>
    </Container>
  );
}
