import EmptyState from "@/components/ui/empty-state";

export function MemberRemovedState({
  organizationName,
}: {
  organizationName: string;
}) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <EmptyState
        title="You no longer have access"
        subtitle={`Your membership in "${organizationName}" has been deactivated. Contact an admin there for more information.`}
      />
    </div>
  );
}
