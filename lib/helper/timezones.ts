const fallbackTimezones = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Manila",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
];

export function getSystemTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

export function getTimezoneList(): string[] {
  try {
    // Not in older TS lib defs yet, but supported in modern browsers/Node 18+
    if (typeof (Intl as any).supportedValuesOf === "function") {
      const zones: string[] = (Intl as any).supportedValuesOf("timeZone");
      // supportedValuesOf's canonical list omits "UTC" (even "Etc/UTC" isn't
      // guaranteed), but stored org settings use the literal "UTC" — keep it
      // selectable so a <select> bound to that value always has a match.
      return zones.includes("UTC") ? zones : ["UTC", ...zones];
    }
  } catch {
    // fall through
  }
  return fallbackTimezones;
}
