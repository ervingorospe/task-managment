import EmptyState from "@/components/ui/empty-state";

export function OrganizationDisabledState({
  organizationName,
  action,
}: {
  organizationName: string;
  /** Rendered below the message — e.g. a "Leave Organization" button for
   * pages where a member needs an action even while the org is disabled. */
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <EmptyState
        title="Organization disabled"
        subtitle={`"${organizationName}" has been disabled by its owner. Contact them for more information.`}
      >
        {action && <div className="mt-4">{action}</div>}
      </EmptyState>
    </div>
  );
}
