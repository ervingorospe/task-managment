export default function ReportsPage() {
  return (
    <div>
      <h1 className="text-lg font-semibold text-ink">Reports</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Generate daily, monthly, quarterly, or yearly reports.
      </p>
      <div className="mt-6 rounded border border-dashed border-line p-10 text-center">
        <p className="text-sm text-ink-muted">
          No reports generated yet. This view will connect to the Reporting
          module once it's built.
        </p>
      </div>
    </div>
  );
}
