import type { InviteExpiryState } from "@/lib/helper/invite-status";

export function InviteExpiryChip({
  state,
}: {
  state: Exclude<InviteExpiryState, null>;
}) {
  const isExpired = state === "expired";
  return (
    <span
      className={`rounded-sm px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
        isExpired
          ? "bg-danger-subtle text-danger"
          : "bg-warning-subtle text-warning"
      }`}
    >
      {isExpired ? "Expired" : "Expiring soon"}
    </span>
  );
}
