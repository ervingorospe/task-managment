"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Mail, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/buttons/button";
import { ApiError } from "@/lib/api/client";
import { resendVerification } from "@/lib/api/auth";
import { useDocumentTitle } from "@/hooks/use-document-title";

// Matches the backend's actual cooldown (see auth.constants.ts) — this is
// just an optimistic local countdown to disable the button; the backend
// is still the real enforcement, and a too-early click just surfaces its
// "wait Xs" error message below instead of silently failing.
const COOLDOWN_SECONDS = 5 * 60;

function VerifyPendingContent() {
  useDocumentTitle("Verify your email");
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  async function handleResend() {
    setMessage(null);
    try {
      await resendVerification(email);
      setStatus("sent");
      setCooldown(COOLDOWN_SECONDS);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof ApiError ? error.message : "Failed to resend.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm overflow-hidden rounded-lg border border-line bg-surface shadow-sm">
        <div className="h-1.5 w-full bg-accent" />

        <div className="p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent-subtle text-accent-text">
            <Mail size={28} strokeWidth={1.75} />
          </div>

          <h1 className="mt-5 text-lg font-semibold text-ink">
            Check your email
          </h1>

          {email ? (
            <>
              <p className="mt-2 text-sm text-ink-muted">
                We sent a verification link to
              </p>
              <p className="mt-2">
                <span className="inline-block rounded-full border border-line bg-canvas px-3 py-1 text-sm font-medium text-ink">
                  {email}
                </span>
              </p>
              <p className="mt-3 text-sm text-ink-muted">
                Click it to activate your account.
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-ink-muted">
              Check your inbox for the verification link we sent you.
            </p>
          )}

          {status === "sent" && (
            <div className="mt-5 flex items-center gap-2 rounded border border-accent-text/25 bg-accent-subtle px-3 py-2 text-left text-sm text-accent-text">
              <CheckCircle2 size={16} className="shrink-0" />
              Verification email sent — check your inbox.
            </div>
          )}

          {status === "error" && message && (
            <div className="mt-5 flex items-center gap-2 rounded border border-danger bg-danger-subtle px-3 py-2 text-left text-sm text-danger">
              <AlertCircle size={16} className="shrink-0" />
              {message}
            </div>
          )}

          <Button
            type="button"
            className="mt-6 w-full gap-2"
            disabled={!email || cooldown > 0}
            onClick={handleResend}
          >
            <RefreshCw size={15} />
            {cooldown > 0
              ? `Resend in ${Math.floor(cooldown / 60)}:${String(cooldown % 60).padStart(2, "0")}`
              : "Resend email"}
          </Button>

          <a
            href="/login"
            className="mt-5 inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-accent-text"
          >
            <ArrowLeft size={14} />
            Back to log in
          </a>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPendingPage() {
  return (
    <Suspense fallback={null}>
      <VerifyPendingContent />
    </Suspense>
  );
}
