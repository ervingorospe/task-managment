"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Clock, MessageSquare } from "lucide-react";
import { useToast } from "@/providers/toast-provider";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { Button } from "@/components/ui/buttons/button";
import Input from "@/components/ui/form/input";
import Textarea from "@/components/ui/form/textarea";
import { contactSchema, type ContactValues } from "@/lib/schemas/contact.schema";

const INFO = [
  {
    icon: Mail,
    title: "Email",
    desc: "hello@relay.app",
  },
  {
    icon: Clock,
    title: "Response time",
    desc: "We typically reply within 1 business day.",
  },
  {
    icon: MessageSquare,
    title: "What to include",
    desc: "Your organization name (if you have one) and a short description of what you need.",
  },
];

export default function ContactPage() {
  useDocumentTitle("Contact");
  const toast = useToast();

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", message: "" },
  });

  async function onSubmit() {
    // TODO: POST /contact once a backend endpoint exists for this form.
    await new Promise((resolve) => setTimeout(resolve, 600));
    toast("Message sent — we'll get back to you soon.");
    reset();
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-20">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Get in touch
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-ink-muted">
          Questions about Relay, or want a walkthrough? Send a message and
          we&apos;ll follow up.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-10 sm:grid-cols-[1fr_1.3fr]">
        <div className="space-y-6">
          {INFO.map((item) => (
            <div key={item.title} className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-accent-subtle text-accent-text">
                <item.icon size={18} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ink">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm text-ink-muted">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 rounded border border-line bg-surface p-6"
        >
          <Input
            name="name"
            control={control}
            label="Name"
            placeholder="Jane Doe"
            maxLength={100}
          />
          <Input
            name="email"
            control={control}
            label="Email"
            type="email"
            placeholder="you@company.com"
            maxLength={255}
          />
          <Textarea
            name="message"
            control={control}
            label="Message"
            placeholder="Tell us what you need..."
            rows={5}
            maxLength={2000}
          />
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send message"}
          </Button>
        </form>
      </div>
    </section>
  );
}
