"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import Input from "@/components/ui/form/input";
import { loginSchema, LoginValues } from "@/lib/schemas/login.schema";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  function onSubmit(values: LoginValues) {
    const result = login(values.email, values.password);
    if (!result.success) {
      setFormError(result.error ?? "Login failed.");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-lg font-semibold text-ink">Log in</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Continue to your workspace.
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 rounded border border-line bg-surface p-6"
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
          />

          <Input
            name="password"
            control={control}
            label="Password"
            type="password"
            placeholder="••••••••"
            icon={Lock}
          />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Logging in..." : "Log in"}
          </Button>

          <div className="relative py-2 text-center text-xs text-ink-faint">
            <span className="bg-surface px-2">or</span>
            <div className="absolute inset-x-0 top-1/2 -z-10 h-px bg-line" />
          </div>

          <Button type="button" variant="secondary" className="w-full">
            Continue with Google
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-ink-muted">
          Don&apos;t have an account?{" "}
          <a href="/signup" className="text-accent-text hover:underline">
            Sign up
          </a>
        </p>

        <p className="mt-4 text-center text-xs text-ink-faint">
          Test accounts (password: 123): jane@acmestudio.com (Superadmin) ·
          marco@acmestudio.com (Admin) · priya@acmestudio.com (Member) ·
          alex@clientco.com (Client)
        </p>
      </div>
    </div>
  );
}
