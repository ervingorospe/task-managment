"use client";

import Container from "@/components/layout/container";
import ChangePasswordSection from "./change-password-section";
import NotificationPreferencesSection from "./notification-preferences-section";
import AccountDangerZoneSection from "./account-danger-zone-section";

export default function AccountSettingsClient() {
  return (
    <div>
      <div>
        <h1 className="text-lg font-semibold text-ink">Account Settings</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Manage your password, notifications, and account access.
        </p>
      </div>

      <div className="mt-6">
        <Container>
          <ChangePasswordSection />
          <NotificationPreferencesSection />
          <AccountDangerZoneSection />
        </Container>
      </div>
    </div>
  );
}
