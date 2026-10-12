"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/buttons/button";
import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import Input from "@/components/ui/form/input";
import { loginSchema, LoginValues } from "@/lib/schemas/login.schema";
import { GOOGLE_AUTH_URL } from "@/lib/api/client";
import { useDocumentTitle } from "@/hooks/use-document-title";

export default function LoginPage() {
  // useSearchParams() opts this page out of static rendering unless it's
  // inside a Suspense boundary (Next.js requirement) — the fallback is
  // never actually visible since there's no async work above it, just a
  // synchronous read of the query string.
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  useDocumentTitle("Log in");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  // Set by the backend when a redirect-based flow (Google OAuth, the email
  // verification link) fails after already leaving this page — those
  // handlers can't render a form error directly, so they bounce back here
  // with ?error= instead of dumping their raw JSON error in the browser.
  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      setFormError(error);
      router.replace("/login");
    }
  }, [searchParams, router]);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginValues) {
    const result = await login(values.email, values.password);
    if (!result.success) {
      if (result.needsVerification) {
        router.push(`/verify-pending?email=${encodeURIComponent(values.email)}`);
        return;
      }
      setFormError(result.error ?? "Login failed.");
      return;
    }
    router.push("/dashboard");
  }

  function handleGoogleLogin() {
    window.location.href = GOOGLE_AUTH_URL;
  }

  return (
    <AuthSplitLayout
      heading="Welcome back."
      tagline="Pick up right where you left off — tickets, projects, and your team are all still here."
    >
      <div className="mb-8 text-center">
        <h1 className="text-lg font-semibold text-ink">Log in</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Continue to your workspace.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 rounded border border-line bg-surface p-6 shadow-sm"
      >
        {formError && (
          <div className="rounded border border-danger bg-danger-subtle px-3 py-2 text-sm text-danger">
            {formError}
          </div>
        )}

        <Input
          name="email"
          control={control}
          label="Email"
          type="email"
          placeholder="you@company.com"
          icon={Mail}
          maxLength={255}
        />

        <Input
          name="password"
          control={control}
          label="Password"
          type="password"
          placeholder="••••••••"
          icon={Lock}
          maxLength={72}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Logging in..." : "Log in"}
        </Button>

        <div className="relative py-2 text-center text-xs text-ink-faint">
          <span className="bg-surface px-2">or</span>
          <div className="absolute inset-x-0 top-1/2 -z-10 h-px bg-line" />
        </div>

        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={handleGoogleLogin}
        >
          Continue with Google
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-ink-muted">
        Don&apos;t have an account?{" "}
        <a href="/signup" className="text-accent-text hover:underline">
          Sign up
        </a>
      </p>
    </AuthSplitLayout>
  );
}
