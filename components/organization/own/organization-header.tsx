import Avatar from "@/components/ui/avatar";
import type { OrganizationDetail } from "@/lib/types/organization/organization-detail.type";

interface OrganizationHeaderProps {
  organization: OrganizationDetail;
}

export default function OrganizationHeader({
  organization,
}: OrganizationHeaderProps) {
  return (
    <div className="flex items-center gap-4">
      <Avatar
        firstName={organization.organizationName}
        src={organization.settings.logo}
        size="lg"
        className="rounded-lg"
      />

      <div className="min-w-0">
        <h1 className="text-lg font-semibold text-ink">
          {organization.organizationName}
        </h1>

        <p className="mt-1 max-w-2xl text-sm text-ink-muted">
          {organization.organizationDesc}
        </p>
      </div>
    </div>
  );
}
