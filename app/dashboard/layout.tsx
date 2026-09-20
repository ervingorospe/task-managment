"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { ActivityLogProvider } from "@/providers/activity-log-provider";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // MOCK: since there's no real session yet, this just checks
  // in-memory state. A hard refresh loses it — that's expected
  // for now, and will be replaced by a real session check.
  useEffect(() => {
    if (!isAuthenticated) router.replace("/login");
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  return (
    <ActivityLogProvider>
      <div className="flex min-h-screen bg-canvas print:block">
        <Sidebar />
        <div className="flex flex-1 flex-col pb-[100px] print:pb-0">
          <Topbar />
          <main className="flex-1 p-6 print:p-0">{children}</main>
        </div>
      </div>
    </ActivityLogProvider>
  );
}
