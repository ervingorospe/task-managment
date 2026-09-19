"use client";

import Container from "@/components/layout/container";
import ProfileInfoSection from "./profile-info-section";
import ProfileOrganizationsSection from "./profile-organizations-section";

export default function ProfileClient() {
  return (
    <div>
      <div>
        <h1 className="text-lg font-semibold text-ink">Profile</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Manage your personal information.
        </p>
      </div>

      <div className="mt-6">
        <Container>
          <ProfileInfoSection />
          <ProfileOrganizationsSection />
        </Container>
      </div>
    </div>
  );
}
