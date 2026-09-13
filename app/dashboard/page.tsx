import { StatusBadge } from "@/components/ui/status-badge";

const stats = [
  { label: "Open tickets", value: "24" },
  { label: "Due this week", value: "6" },
  { label: "Overdue", value: "2", flagged: true },
  { label: "Active projects", value: "5" },
];

const recentTickets = [
  {
    id: "TCK-1042",
    title: "Checkout button not responding on mobile",
    owner: "R. Alvarez",
    status: "progress" as const,
  },
  {
    id: "TCK-1041",
    title: "Add export to CSV on reports page",
    owner: "J. Doe",
    status: "todo" as const,
  },
  {
    id: "TCK-1038",
    title: "Client onboarding email not sending",
    owner: "M. Cruz",
    status: "blocked" as const,
  },
  {
    id: "TCK-1035",
    title: "Update Q3 project timeline",
    owner: "J. Doe",
    status: "done" as const,
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-ink">Dashboard</h1>
        <p className="text-sm text-ink-muted">
          Here&apos;s what&apos;s moving across your organization.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded border border-line bg-line sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-surface p-4">
            <p className="text-sm text-ink-muted">{stat.label}</p>
            <p
              className={`mt-1 text-2xl font-semibold ${
                stat.flagged ? "text-signal" : "text-ink"
              }`}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded border border-line bg-surface">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="text-sm font-medium text-ink">Recent tickets</h2>
          <a
            href="/dashboard/tickets"
            className="text-sm text-accent-text hover:underline"
          >
            View all
          </a>
        </div>
        <table className="w-full text-sm">
          <tbody>
            {recentTickets.map((ticket) => (
              <tr
                key={ticket.id}
                className="border-b border-line last:border-0"
              >
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-ink-muted">
                  {ticket.id}
                </td>
                <td className="px-4 py-3 text-ink">{ticket.title}</td>
                <td className="whitespace-nowrap px-4 py-3 text-ink-muted">
                  {ticket.owner}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <StatusBadge status={ticket.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
