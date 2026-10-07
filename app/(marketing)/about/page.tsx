import type { Metadata } from "next";
import { Lock, Layers, Sparkles, Workflow } from "lucide-react";

export const metadata: Metadata = {
  title: "About",
  description: "Why Relay exists and the principles behind it.",
};

const PRINCIPLES = [
  {
    icon: Lock,
    title: "Isolation is non-negotiable",
    desc: "Organizations never see each other's data. Every query is scoped at the data layer, not just hidden in the UI.",
  },
  {
    icon: Layers,
    title: "Permissions should be composable",
    desc: "Access is built from named bundles of fine-grained rules, so a role can be shaped to how a team actually works — not squeezed into \"admin\" or \"member.\"",
  },
  {
    icon: Sparkles,
    title: "Clarity over clutter",
    desc: "Every screen earns its place. No feature ships just because a bigger platform has it.",
  },
  {
    icon: Workflow,
    title: "Built for real workflows",
    desc: "Client-submitted requests, projects, personal tasks, and reporting all live in one system, instead of being bolted on as an afterthought.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          About Relay
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-ink-muted">
          Relay was built to answer a simple question: what would a
          ticketing system look like if it took multi-tenancy and
          permissions seriously from day one — instead of bolting them on
          after the fact?
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-10">
        <h2 className="text-lg font-semibold text-ink">Why Relay exists</h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          Most ticketing tools land on one of two extremes. Lightweight
          boards are easy to pick up but treat every user the same, with no
          real boundary between teams or clients. Enterprise help-desk
          suites go the other way — genuinely granular, but buried under
          years of accumulated configuration screens. Relay aims for the
          middle: real organizational boundaries and fine-grained roles,
          without the sprawl.
        </p>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10">
        <h2 className="text-center text-lg font-semibold text-ink">
          What we believe
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {PRINCIPLES.map((principle) => (
            <div key={principle.title} className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-accent-subtle text-accent-text">
                <principle.icon size={18} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ink">
                  {principle.title}
                </h3>
                <p className="mt-1 text-sm text-ink-muted">
                  {principle.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
