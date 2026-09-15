type CardProps = {
  title?: string;
  subtitle?: string;
  desc?: string;
  headerActions?: React.ReactNode;
  footerActions?: React.ReactNode;
  children: React.ReactNode;
};

export default function Card({
  title,
  subtitle,
  desc,
  headerActions,
  footerActions,
  children,
}: CardProps) {
  return (
    <div className="rounded border border-line bg-surface p-6">
      <div className="space-y-5">
        <div className="flex items-start justify-between">
          <div>
            {title ? (
              <h2 className="text-base font-semibold text-ink">{title}</h2>
            ) : null}

            {subtitle ? (
              <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>
            ) : null}
            {desc ? (
              <p className="mt-1 text-xs text-ink-faint">{desc}</p>
            ) : null}
          </div>

          {headerActions ? <div>{headerActions}</div> : null}
        </div>

        {children}

        {footerActions ? (
          <div className="mt-8 flex items-center justify-between border-t border-line pt-5">
            {footerActions}
          </div>
        ) : null}
      </div>
    </div>
  );
}
