type EmptyStateProps = {
  children: React.ReactNode;
  title?: string;
  subtitle: string;
};

export default function EmptyState({
  children,
  title,
  subtitle,
}: EmptyStateProps) {
  return (
    <div className="rounded border border-dashed border-line p-10 text-center">
      {title ? <p className="text-sm font-medium text-ink">{title}</p> : null}

      <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>

      {children}
    </div>
  );
}
