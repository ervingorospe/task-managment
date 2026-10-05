"use client";

import { Suspense, useEffect, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Lock,
  User,
  Building2,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/buttons/button";
import Input from "@/components/ui/form/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useAuth } from "@/providers/auth-provider";
import { ApiError } from "@/lib/api/client";
import {
  getInvite,
  acceptInvite,
  declineInvite,
  type InviteInfo,
} from "@/lib/api/auth";
import {
  acceptInviteSchema,
  type AcceptInviteValues,
} from "@/lib/schemas/accept-invite.schema";
import { useDocumentTitle } from "@/hooks/use-document-title";

type Status =
  | "loading"
  | "invalid"
  | "ready"
  | "accepting"
  | "declining"
  | "declined";

function CenteredCard({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm rounded-lg border border-line bg-surface p-8 text-center shadow-sm">
        {children}
      </div>
    </div>
  );
}

function AcceptInviteContent() {
  useDocumentTitle("Accept invite");
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const { refreshCurrentUser } = useAuth();

  const [status, setStatus] = useState<Status>("loading");
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDeclineConfirm, setShowDeclineConfirm] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("This invite link is missing its token.");
      setStatus("invalid");
      return;
    }
    let cancelled = false;
    getInvite(token)
      .then((info) => {
        if (cancelled) return;
        setInvite(info);
        setStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError ? err.message : "This invite link isn't valid.",
        );
        setStatus("invalid");
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<AcceptInviteValues>({
    resolver: zodResolver(acceptInviteSchema),
    defaultValues: { firstName: "", lastName: "", password: "", confirmPassword: "" },
  });

  async function completeAccept(payload: {
    firstName?: string;
    lastName?: string;
    password?: string;
  }) {
    setStatus("accepting");
    setError(null);
    try {
      await acceptInvite({ token, ...payload });
      await refreshCurrentUser();
      router.push("/dashboard");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to accept invite.",
      );
      setStatus("ready");
    }
  }

  async function onSubmitForm(values: AcceptInviteValues) {
    await completeAccept(values);
  }

  async function handleAcceptNoPassword() {
    await completeAccept({});
  }

  async function handleDecline() {
    setStatus("declining");
    setError(null);
    try {
      await declineInvite(token);
      setStatus("declined");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to decline invite.",
      );
      setStatus("ready");
    }
  }

  if (status === "declined") {
    return (
      <CenteredCard>
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-ink-faint/20 text-ink-muted">
          <XCircle size={28} strokeWidth={1.75} />
        </div>
        <h1 className="mt-5 text-lg font-semibold text-ink">Invite declined</h1>
        <p className="mt-2 text-sm text-ink-muted">
          You&apos;ve declined this invite. The organization has been notified.
        </p>
        <a
          href="/login"
          className="mt-5 inline-block text-sm text-accent-text hover:underline"
        >
          Back to log in
        </a>
      </CenteredCard>
    );
  }

  if (status === "loading") {
    return (
      <CenteredCard>
        <p className="text-sm text-ink-muted">Checking your invite…</p>
      </CenteredCard>
    );
  }

  if (status === "invalid") {
    return (
      <CenteredCard>
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-danger-subtle text-danger">
          <AlertCircle size={28} strokeWidth={1.75} />
        </div>
        <h1 className="mt-5 text-lg font-semibold text-ink">Invite not valid</h1>
        <p className="mt-2 text-sm text-ink-muted">{error}</p>
        <a
          href="/login"
          className="mt-5 inline-block text-sm text-accent-text hover:underline"
        >
          Back to log in
        </a>
      </CenteredCard>
    );
  }

  // Only reachable once status is "ready", which is only ever set
  // alongside setInvite(info) in the effect above — invite is guaranteed
  // non-null here.
  const info = invite!;

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm overflow-hidden rounded-lg border border-line bg-surface shadow-sm">
        <div className="h-1.5 w-full bg-accent" />

        <div className="p-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent-subtle text-accent-text">
            <Building2 size={28} strokeWidth={1.75} />
          </div>

          <div className="mt-5 text-center">
            <h1 className="text-lg font-semibold text-ink">You&apos;re invited</h1>
            <p className="mt-2 text-sm text-ink-muted">
              Join <span className="font-medium text-ink">{info.organizationName}</span>{" "}
              as a <span className="font-medium text-ink">{info.roleName}</span>.
            </p>
            <p className="mt-3">
              <span className="inline-block rounded-full border border-line bg-canvas px-3 py-1 text-sm font-medium text-ink">
                {info.email}
              </span>
            </p>
          </div>

          {error && (
            <div className="mt-5 flex items-center gap-2 rounded border border-danger bg-danger-subtle px-3 py-2 text-left text-sm text-danger">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          {info.requiresPassword ? (
            <form onSubmit={handleSubmit(onSubmitForm)} className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  name="firstName"
                  control={control}
                  label="First name"
                  icon={User}
                  maxLength={50}
                />
                <Input
                  name="lastName"
                  control={control}
                  label="Last name"
                  maxLength={50}
                />
              </div>

              <Input
                name="password"
                control={control}
                label="Password"
                type="password"
                placeholder="••••••••"
                icon={Lock}
              />

              <Input
                name="confirmPassword"
                control={control}
                label="Confirm password"
                type="password"
                placeholder="••••••••"
                icon={Lock}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || status !== "ready"}
              >
                {status === "accepting" ? "Setting up your account..." : "Accept invite"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => setShowDeclineConfirm(true)}
                disabled={isSubmitting || status !== "ready"}
              >
                {status === "declining" ? "Declining..." : "Decline invite"}
              </Button>
            </form>
          ) : (
            <div className="mt-6 space-y-3">
              <Button
                type="button"
                className="w-full gap-2"
                onClick={handleAcceptNoPassword}
                disabled={status !== "ready"}
              >
                <CheckCircle2 size={15} />
                {status === "accepting" ? "Joining..." : "Accept & continue"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => setShowDeclineConfirm(true)}
                disabled={status !== "ready"}
              >
                {status === "declining" ? "Declining..." : "Decline invite"}
              </Button>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={showDeclineConfirm}
        onClose={() => setShowDeclineConfirm(false)}
        onConfirm={handleDecline}
        title="Decline this invite?"
        description={`You won't join ${info.organizationName}, and the organization will be notified that you declined.`}
        confirmLabel="Decline invite"
      />
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={null}>
      <AcceptInviteContent />
    </Suspense>
  );
}
