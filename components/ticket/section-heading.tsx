import type { ComponentType, ReactNode } from "react";
import type { LucideProps } from "lucide-react";

interface SectionHeadingProps {
  icon: ComponentType<LucideProps>;
  children: ReactNode;
}

export function SectionHeading({ icon: Icon, children }: SectionHeadingProps) {
  return (
    <h3 className="flex items-center gap-1.5 text-sm font-medium text-ink">
      <Icon size={14} className="text-ink-faint" />
      {children}
    </h3>
  );
}
