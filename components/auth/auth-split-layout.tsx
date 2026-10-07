import type { ReactNode } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Logo } from "@/components/ui/logo";

const HIGHLIGHTS = [
  "Isolated workspaces for every organization",
  "Role-based access down to the permission",
  "Live updates — no refresh, ever",
];

/**
 * Shared shell for /login and /signup: a branded panel on large screens
 * (reinforcing what Relay is while the form does its job) that collapses
 * to just a logo above the form on small screens, where there's no room
 * for a second column.
 */
export function AuthSplitLayout({
  heading,
  tagline,
  children,
}: {
  heading: string;
  tagline: string;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-ink lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />

        <Link href="/" className="relative inline-flex items-center gap-2">
          <Logo size={32} />
          <span className="text-base font-semibold text-white">Relay</span>
        </Link>

        <div className="relative">
          <h2 className="max-w-sm text-3xl font-semibold leading-tight text-white">
            {heading}
          </h2>
          <p className="mt-3 max-w-sm text-sm text-white/60">{tagline}</p>

          <ul className="mt-8 space-y-3">
            {HIGHLIGHTS.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2.5 text-sm text-white/70"
              >
                <Check size={16} className="mt-0.5 shrink-0 text-accent" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/40">
          © {new Date().getFullYear()} Relay
        </p>
      </div>

      <div className="flex items-center justify-center bg-canvas px-4 py-12">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="mb-8 flex items-center justify-center gap-2 lg:hidden"
          >
            <Logo size={32} />
            <span className="text-base font-semibold text-ink">Relay</span>
          </Link>

          {children}
        </div>
      </div>
    </div>
  );
}
