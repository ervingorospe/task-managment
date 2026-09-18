import Card from "@/components/ui/card";
import { formatDateTime } from "@/lib/helper/format-date";

interface TicketActivityCardProps {
  createdAt: string;
  updatedAt: string;
}

export default function TicketActivityCard({
  createdAt,
  updatedAt,
}: TicketActivityCardProps) {
  return (
    <Card title="Activity" subtitle="Timeline of ticket changes.">
      <ul className="space-y-2 text-xs text-ink-muted">
        <li>Created {formatDateTime(createdAt)}</li>
        <li>Last updated {formatDateTime(updatedAt)}</li>
      </ul>
    </Card>
  );
}
