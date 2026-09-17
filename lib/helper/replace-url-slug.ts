export function replaceUrlSlug(pathname: string, newSlug: string): string {
  const segments = pathname.split("/").filter(Boolean);

  /*
   * Supported routes:
   *
   * /dashboard/organizations/:slug/...
   * /dashboard/organization/:slug/...
   * /dashboard/reports/:slug/...
   */

  const organizationIndex = segments.findIndex(
    (segment) =>
      segment === "organizations" ||
      segment === "organization" ||
      segment === "reports",
  );

  if (organizationIndex === -1) {
    return pathname;
  }

  const slugIndex = organizationIndex + 1;

  if (slugIndex >= segments.length) {
    return pathname;
  }

  segments[slugIndex] = newSlug;

  return `/${segments.join("/")}`;
}
