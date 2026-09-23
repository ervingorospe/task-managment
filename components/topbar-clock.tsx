"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface TopbarClockProps {
  timeZone?: string;
}

/** Renders nothing until mounted — avoids an SSR/client markup mismatch,
 * since the server and the browser can render this at different instants. */
export function TopbarClock({ timeZone }: TopbarClockProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1_000);
    return () => clearInterval(id);
  }, []);

  if (!now) return null;

  const time = now.toLocaleTimeString(undefined, {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
  const zoneLabel = now
    .toLocaleTimeString(undefined, { timeZone, timeZoneName: "short" })
    .split(" ")
    .pop();

  return (
    <span className="hidden items-center gap-1.5 rounded-full bg-white/40 px-3 py-1.5 text-sm font-medium text-ink sm:inline-flex">
      <Clock size={13} className="text-ink/60" />
      <span className="tabular-nums">{time}</span>
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ink/40" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-ink/60" />
      </span>
      <span className="text-xs font-normal text-ink/60">{zoneLabel}</span>
    </span>
  );
}
