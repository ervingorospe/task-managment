"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileQuestion, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/buttons/button";
import { useAuth } from "@/providers/auth-provider";

export default function NotFound() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm text-center">
        <div className="relative mx-auto mb-6 h-20 w-20">
          <div className="absolute inset-0 rounded-full bg-warning-subtle" />
          <div className="absolute inset-0 flex items-center justify-center">
            <FileQuestion size={32} className="text-warning" />
          </div>
        </div>

        <p className="font-mono text-xs uppercase tracking-wide text-ink-faint">
          Error · 404
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-ink">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          The page you&apos;re looking for doesn&apos;t exist, was moved, or
          the link is broken.
        </p>

        <div className="mt-6 flex items-center justify-center gap-2">
          <Button variant="secondary" onClick={() => router.back()}>
            <ArrowLeft size={15} className="mr-1.5" />
            Go back
          </Button>

          <Link href={isAuthenticated ? "/dashboard" : "/login"}>
            <Button>{isAuthenticated ? "Back to Dashboard" : "Log in"}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
