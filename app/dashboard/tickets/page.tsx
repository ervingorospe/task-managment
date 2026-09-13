export default function TicketsPage() {
  return (
    <div>
      <h1 className="text-lg font-semibold text-ink">Tickets</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Every ticket across your organization will show up here.
      </p>
      <div className="mt-6 rounded border border-dashed border-line p-10 text-center">
        <p className="text-sm text-ink-muted">
          No tickets yet. This view will list, filter, and let you create
          tickets once the Ticket module is wired up.
        </p>
      </div>
    </div>
  );
}
