"use client";

import { useRouter } from "next/navigation";
import Card from "@/components/ui/card";
import List from "@/components/ui/list";
import Avatar from "@/components/ui/avatar";
import EmptyState from "@/components/ui/empty-state";
import { MetaBadge } from "@/components/ui/meta-badge";
import { InlineButton } from "@/components/ui/buttons";
import { useAuth } from "@/providers/auth-provider";

export default function ProfileOrganizationsSection() {
  const router = useRouter();
  const { currentUser, activeOrganization, switchOrganization } = useAuth();

  if (!currentUser) return null;

  const memberships = currentUser.memberships;

  function handleSwitch(organizationId: number) {
    switchOrganization(organizationId);
    router.push("/dashboard");
  }

  return (
    <Card
      title="Organizations"
      subtitle="Organizations you're a member of, and your role in each."
    >
      {memberships.length === 0 ? (
        <EmptyState subtitle="You're not part of any organization yet." />
      ) : (
        <List>
          {memberships.map((membership) => {
            const isActive =
              membership.organization.id === activeOrganization?.id;

            return (
              <List.ListItem
                key={membership.organization.id}
                leading={
                  <Avatar
                    firstName={membership.organization.organizationName}
                    src={membership.organization.settings.logo}
                    size="md"
                  />
                }
                title={
                  <span className="flex items-center gap-2">
                    {membership.organization.organizationName}
                    {isActive && <MetaBadge>Current</MetaBadge>}
                  </span>
                }
                subtitle={membership.role.roleName}
                trailing={
                  !isActive && (
                    <InlineButton
                      onClick={() => handleSwitch(membership.organization.id)}
                    >
                      Switch to this
                    </InlineButton>
                  )
                }
              />
            );
          })}
        </List>
      )}
    </Card>
  );
}
