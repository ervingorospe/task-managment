import type { Metadata } from "next";
import {
  Ticket,
  FolderKanban,
  Inbox,
  KeyRound,
  BarChart3,
  Zap,
  Building2,
} from "lucide-react";
import Card from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Services",
  description: "What Relay gives every team.",
};

const SERVICES = [
  {
    icon: Ticket,
    title: "Ticketing & work orders",
    desc: "Create, tag, assign, and track tickets through to resolution — with comments, attachments, and due dates built in. Personal tickets work the same way for solo, org-less tasks.",
  },
  {
    icon: FolderKanban,
    title: "Projects",
    desc: "Group related tickets under a project to see scope and progress at a glance, without losing the per-ticket detail underneath.",
  },
  {
    icon: Inbox,
    title: "Client request portal",
    desc: "Let clients submit requests without giving them ticket access. A member reviews each one and approves it into a real ticket, or rejects it with a reason.",
  },
  {
    icon: KeyRound,
    title: "Roles & permissions",
    desc: "Build roles from named bundles of fine-grained rules spanning tickets, projects, members, and settings — shaped to how your team actually works.",
  },
  {
    icon: BarChart3,
    title: "Reporting & analytics",
    desc: "Dashboards and reports break activity down by tag, assignee, and time, so trends show up before they become problems.",
  },
  {
    icon: Zap,
    title: "Real-time collaboration",
    desc: "When a ticket, request, or project changes, everyone viewing that list sees it update live — no manual refresh required.",
  },
  {
    icon: Building2,
    title: "Multi-tenant organizations",
    desc: "Every organization gets its own members, roles, tags, projects, and seat capacity — fully isolated from every other organization on Relay.",
  },
];

export default function ServicesPage() {
  return (
    <>
      <section className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          What Relay gives every team
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-ink-muted">
          One system for the work itself, who can see it, and how it&apos;s
          going — instead of three separate tools stitched together.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service) => (
            <Card key={service.title}>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-accent-subtle text-accent-text">
                  <service.icon size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-ink">
                    {service.title}
                  </h3>
                  <p className="mt-1 text-sm text-ink-muted">
                    {service.desc}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
