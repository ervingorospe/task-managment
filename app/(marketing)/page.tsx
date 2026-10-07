import Link from "next/link";
import type { Metadata } from "next";
import {
  Building2,
  KeyRound,
  Ticket,
  Users,
  ShieldCheck,
  Zap,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/buttons/button";
import Card from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Home",
  description: "Ticketing, projects, and reporting for teams.",
};

const FEATURES = [
  {
    icon: Building2,
    title: "Multi-tenant organizations",
    desc: "Each organization runs fully isolated — its own members, roles, tags, projects, and seat capacity.",
  },
  {
    icon: KeyRound,
    title: "Granular access control",
    desc: "Role-based permissions built from fine-grained rules across 9 categories, not a fixed admin/member split.",
  },
  {
    icon: Ticket,
    title: "Tickets, projects & requests",
    desc: "Track org tickets and personal tasks side by side, and turn client-submitted requests into real tickets in one click.",
  },
  {
    icon: Users,
    title: "Invite-only membership",
    desc: "Members join by invite only, with expiring tokens and resend cooldowns. Invited accounts can never spin up their own organization.",
  },
  {
    icon: ShieldCheck,
    title: "Real authentication",
    desc: "Email/password signup with mandatory verification, Google OAuth, and secure httpOnly sessions.",
  },
  {
    icon: Zap,
    title: "Live updates",
    desc: "New tickets, requests, and project changes show up instantly for everyone viewing that list — no refresh needed.",
  },
];

const STEPS = [
  {
    title: "Choose your space",
    desc: "Start a personal workspace for solo tracking, or create and invite others into an organization.",
  },
  {
    title: "Triage the work",
    desc: "Assign tickets, tag by status, and approve incoming client requests into real tickets.",
  },
  {
    title: "Stay on top of it",
    desc: "Reports roll activity up by tag, assignee, and time — so nothing slips through.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 py-20 text-center sm:py-28">
        <h1 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-ink sm:text-5xl">
          Ticketing, projects, and reporting — without the chaos.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-ink-muted sm:text-lg">
          Relay is a multi-tenant work-order platform. Every organization
          gets its own isolated workspace — members, roles, tags, projects,
          and tickets that never leak across tenants.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/signup">
            <Button>
              Get started
              <ArrowRight size={15} className="ml-1.5" />
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary">Log in</Button>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <Card key={feature.title}>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-accent-subtle text-accent-text">
                  <feature.icon size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-ink">
                    {feature.title}
                  </h3>
                  <p className="mt-1 text-sm text-ink-muted">{feature.desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-2xl font-semibold text-ink">
          How it works
        </h2>
        <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <div key={step.title} className="text-center sm:text-left">
              <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white sm:mx-0">
                {index + 1}
              </div>
              <h3 className="mt-4 text-sm font-semibold text-ink">
                {step.title}
              </h3>
              <p className="mt-1 text-sm text-ink-muted">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="rounded border border-line bg-surface px-8 py-12 text-center">
          <h2 className="text-2xl font-semibold text-ink">
            Ready to get organized?
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
            Create your workspace in minutes — no credit card, no setup call.
          </p>
          <div className="mt-6">
            <Link href="/signup">
              <Button>
                Get started
                <ArrowRight size={15} className="ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
