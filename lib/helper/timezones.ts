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
      return (Intl as any).supportedValuesOf("timeZone");
    }
  } catch {
    // fall through
  }
  return fallbackTimezones;
}
