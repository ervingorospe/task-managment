"use client";

import { AccountTypeGuard } from "@/components/auth/account-type.guard";
import Card from "@/components/ui/card";
import { ACCOUNT_TYPE } from "@/lib/constants/accoun-type.constant";
import { useOrganizationDefaults } from "@/providers/organization-defaults.provider";

export default function Capacities() {
  const { capacity } = useOrganizationDefaults();

  const capacityItems = [
    {
      label: "Members",
      value: capacity.members,
      description: "Maximum members allowed in the organization.",
    },
    {
      label: "Tags",
      value: capacity.tags,
      description: "Maximum tags that can be created.",
    },
    {
      label: "Roles",
      value: capacity.roles,
      description: "Maximum custom roles available.",
    },
    {
      label: "Tickets",
      value: capacity.tickets,
      description: "Maximum tickets allowed.",
    },
    {
      label: "Projects",
      value: capacity.projects,
      description: "Maximum projects that can be created.",
    },
  ];

  return (
    <AccountTypeGuard accountType={ACCOUNT_TYPE.OWNER}>
      <Card
        title="Organization Limits"
        subtitle="Maximum resources available to this organization."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {capacityItems.map((item) => (
            <div
              key={item.label}
              className="rounded border border-line bg-surface px-4 py-3"
            >
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-medium text-ink">{item.label}</p>

                <p className="text-base font-semibold text-ink">{item.value}</p>
              </div>

              <p className="mt-1 text-xs text-ink-muted">{item.description}</p>
            </div>
          ))}
        </div>
      </Card>
    </AccountTypeGuard>
  );
}
