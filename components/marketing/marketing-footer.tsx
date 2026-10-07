import Link from "next/link";
import { Logo } from "@/components/ui/logo";

const PRODUCT_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/contact", label: "Contact" },
];

const ACCOUNT_LINKS = [
  { href: "/login", label: "Log in" },
  { href: "/signup", label: "Sign up" },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <Logo size={24} />
              <span className="text-sm font-semibold text-ink">Relay</span>
            </div>
            <p className="mt-2 max-w-xs text-sm text-ink-muted">
              Ticketing, projects, and reporting for teams that have outgrown
              a shared inbox.
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
              Product
            </p>
            <ul className="mt-3 space-y-2">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-ink-muted hover:text-ink"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
              Account
            </p>
            <ul className="mt-3 space-y-2">
              {ACCOUNT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-ink-muted hover:text-ink"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-line pt-6">
          <p className="text-xs text-ink-faint">
            © {new Date().getFullYear()} Relay. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
