"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/buttons/button";
import List from "@/components/ui/list";
import Avatar from "@/components/ui/avatar";
import EmptyState from "@/components/ui/empty-state";
import { fetchMyOwnOrganizations, type OwnedOrganization } from "@/lib/api/organizations";
import { useAuth } from "@/providers/auth-provider";
import { ListSkeleton } from "@/components/ui/skeletons";

// No server-side session yet, so this has to fetch client-side against
// whoever useAuth() says is logged in — see auth-provider.tsx's own note
// on why login doesn't set a cookie/token yet.
export default function MyOrganizationsPage() {
  const { currentUser } = useAuth();
  const [organizations, setOrganizations] = useState<OwnedOrganization[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!currentUser) {
      setOrganizations([]);
      return;
    }
    fetchMyOwnOrganizations(currentUser.id).then((orgs) => {
      if (!cancelled) setOrganizations(orgs);
    });
    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  return (
    <>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-ink">My Organizations</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Organizations you own. Manage their team, roles, and projects.
          </p>
        </div>
        {organizations && organizations.length > 0 && (
          <Link href="/dashboard/my-organizations/create">
            <Button>
              <Plus size={15} className="mr-1.5" /> Create Organization
            </Button>
          </Link>
        )}
      </div>

      {organizations === null ? (
        <div className="mt-6">
          <ListSkeleton rows={3} />
        </div>
      ) : organizations.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="You don't own any organizations yet."
            subtitle="Create an organization to start managing your team, roles, and projects."
          >
            <Link href="/dashboard/my-organizations/create">
              <Button className="mt-4">Create Organization</Button>
            </Link>
          </EmptyState>
        </div>
      ) : (
        <List className="mt-6">
          {organizations.map((org) => (
            <div key={org.id} className="flex items-center gap-4 px-4 py-4">
              <Avatar
                firstName={org.organizationName}
                size="lg"
                className="rounded-lg"
              />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">
                  {org.organizationName}
                </p>
                <p className="mt-0.5 text-xs text-ink-muted">
                  {org.organizationDesc}
                </p>
              </div>

              <Link
                href={`/dashboard/my-organizations/${org.slug}`}
                className="flex shrink-0 items-center gap-1 rounded border border-line px-3 py-1.5 text-xs font-medium text-ink hover:border-accent-text hover:text-accent-text"
              >
                View details <ChevronRight size={14} />
              </Link>
            </div>
          ))}
        </List>
      )}
    </>
  );
}
