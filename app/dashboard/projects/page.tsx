export default function ProjectsPage() {
  return (
    <div>
      <h1 className="text-lg font-semibold text-ink">Projects</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Group related tickets under a timeframe and an owner.
      </p>
      <div className="mt-6 rounded border border-dashed border-line p-10 text-center">
        <p className="text-sm text-ink-muted">
          No projects yet. This view will list projects once the Project
          module is wired up.
        </p>
      </div>
    </div>
  );
}
