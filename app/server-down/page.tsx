"use client";

import { ServerCrash, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/buttons/button";
import { SERVER_DOWN_RETURN_TO_KEY } from "@/lib/api/client";

function retry() {
  const returnTo = sessionStorage.getItem(SERVER_DOWN_RETURN_TO_KEY);
  window.location.href = returnTo || "/dashboard";
}

export default function ServerDownPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm text-center">
        <div className="relative mx-auto mb-6 h-20 w-20">
          <div className="absolute inset-0 rounded-full bg-danger-subtle" />
          <div className="absolute inset-0 flex items-center justify-center">
            <ServerCrash size={32} className="text-danger" />
          </div>
        </div>

        <p className="font-mono text-xs uppercase tracking-wide text-ink-faint">
          Error · Server unavailable
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-ink">
          We can&apos;t reach the server
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          The server is down or unreachable right now. This usually resolves
          on its own — try again in a moment.
        </p>

        <div className="mt-6 flex items-center justify-center">
          <Button onClick={retry}>
            <RotateCw size={15} className="mr-1.5" />
            Try again
          </Button>
        </div>
      </div>
    </div>
  );
}
