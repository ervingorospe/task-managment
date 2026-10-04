/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The client Router Cache (separate from the fetch Data Cache, which is
  // already off — see lib/api/client.ts) otherwise reuses a page's RSC
  // payload from whenever it was last visited, including on router.back()
  // and plain Link navigation. Zeroing staleTimes means every navigation
  // to a page re-renders it server-side against current data, instead of
  // needing a router.refresh() call after every mutation that could affect
  // a page the user might navigate back to.
  //
  // Next.js 16 added a hard floor of 30s on staleTimes.static (dynamic can
  // still be 0) — 0 is no longer accepted. This is the closest allowed
  // value to the original intent; a statically-rendered page (e.g.
  // /dashboard/tickets) can now show up to 30s-stale data on a back
  // navigation right after a mutation, where before it was instant.
  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 30,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
      // Google account avatars — populated onto User.avatar from the
      // OAuth profile on Google sign-in/sign-up.
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      // Ticket attachments and org logos (see ticketing-backend's
      // S3Service) — wildcarded so it works for any bucket/region, not
      // just whichever one this env happens to be configured with.
      {
        protocol: "https",
        hostname: "*.s3.*.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;
