"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/buttons/button";
import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import Input from "@/components/ui/form/input";
import { ApiError, GOOGLE_AUTH_URL } from "@/lib/api/client";
import { signup } from "@/lib/api/auth";
import { signupSchema, type SignupValues } from "@/lib/schemas/signup.schema";
import { useDocumentTitle } from "@/hooks/use-document-title";

export default function SignupPage() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [checkEmailFor, setCheckEmailFor] = useState<string | null>(null);
  useDocumentTitle(checkEmailFor ? "Check your email" : "Sign up");

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: SignupValues) {
    setFormError(null);
    try {
      await signup(values);
      setCheckEmailFor(values.email);
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : "Signup failed.",
      );
    }
  }

  function handleGoogleSignup() {
    window.location.href = GOOGLE_AUTH_URL;
  }

  if (checkEmailFor) {
    return (
      <AuthSplitLayout
        heading="Almost there."
        tagline="Confirm your email to activate your account and start building your workspace."
      >
        <div className="text-center">
          <h1 className="text-lg font-semibold text-ink">Check your email</h1>
          <p className="mt-2 text-sm text-ink-muted">
            We sent a verification link to{" "}
            <span className="font-medium text-ink">{checkEmailFor}</span>.
            Click it to activate your account.
          </p>
          <a
            href="/login"
            className="mt-6 inline-block text-sm text-accent-text hover:underline"
          >
            Back to log in
          </a>
        </div>
      </AuthSplitLayout>
    );
  }

  return (
    <AuthSplitLayout
      heading="Start your workspace."
      tagline="Create tickets, invite your team, and keep everything in one place — free to start."
    >
      <div className="mb-8 text-center">
        <h1 className="text-lg font-semibold text-ink">Sign up</h1>
        <p className="mt-1 text-sm text-ink-muted">Create your workspace.</p>
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

        <Input
          name="confirmPassword"
          control={control}
          label="Confirm password"
          type="password"
          placeholder="••••••••"
          maxLength={72}
          icon={Lock}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating account..." : "Sign up"}
        </Button>

        <div className="relative py-2 text-center text-xs text-ink-faint">
          <span className="bg-surface px-2">or</span>
          <div className="absolute inset-x-0 top-1/2 -z-10 h-px bg-line" />
        </div>

        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={handleGoogleSignup}
        >
          Continue with Google
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-ink-muted">
        Already have an account?{" "}
        <a href="/login" className="text-accent-text hover:underline">
          Log in
        </a>
      </p>
    </AuthSplitLayout>
  );
}
