# Ticketing App — UI Scaffold

Next.js 14 (App Router) + TypeScript + Tailwind. This is a **UI-first
scaffold** — no real backend, no real auth. It exists to validate flows and
screens before any service is wired up.

## Getting started

This was built in a sandboxed environment without internet access, so
dependencies aren't installed yet. On your machine:

```bash
npm install
npm run dev
```

Then open http://localhost:3000 — it redirects to `/login`.

## What's mocked right now

- **`lib/mock/session.tsx`** — stands in for the Auth module. `login()` just
  sets an in-memory user, no credential check. Refreshing the page loses the
  session on purpose (there's no real persistence yet).
- **`usePermission()`** — stands in for real RBAC. Permissions are hardcoded
  per role in the same file.
- **Topbar role switcher** — a dev-only control ("Preview as: admin / employee
  / client / superadmin") so you can see how the UI changes per role while
  building it. Remove this once real permissions are wired up — it's marked
  with a `// DEV ONLY` comment in `components/Topbar.tsx`.

Every mock is commented with `// MOCK:` so they're easy to grep for later:

```bash
grep -rn "MOCK:" .
```

## Structure

```
app/
  login/page.tsx          Login screen (mocked submit → dashboard)
  dashboard/
    layout.tsx             Sidebar + topbar shell, redirects if not "logged in"
    page.tsx                Overview stats + recent tickets
    tickets/page.tsx        Placeholder — ticket list goes here
    projects/page.tsx       Placeholder — project list goes here
    reports/page.tsx        Placeholder — reports go here
    organization/page.tsx   Placeholder — members/roles go here
components/
  Sidebar.tsx, Topbar.tsx
  ui/Button.tsx, ui/StatusBadge.tsx
lib/mock/session.tsx        Mock auth context + mock permission hook
```

## Design tokens

Defined in `tailwind.config.ts`. Light mode only — no dark theme yet.

| Token | Value | Use |
|---|---|---|
| `canvas` | `#F7F8F7` | Page background |
| `surface` | `#FFFFFF` | Cards, panels, inputs |
| `ink` / `ink-muted` / `ink-faint` | `#0E241C` / `#5B6B65` / `#94A39D` | Text hierarchy |
| `accent` | `#00FA9A` | **Backgrounds only** — buttons, header bg, badges |
| `accent-hover` | `#00C278` | Hover/pressed state — dark enough for white text |
| `accent-subtle` | `#E2F8F0` | Light tint for selected rows, subtle badges |
| `accent-text` | `#007A4B` | **Text/links/borders on white** — the raw accent fails contrast as text |
| `danger` / `warning` | `#E5484D` / `#E2A03F` | Error and warning states — deliberately not green, so they don't compete with the brand color's meaning |
| `status.*` | gray/blue/green/red | Ticket status dots |

**The one rule to keep in mind everywhere:** `#00FA9A` is bright enough that white
text on it fails accessibility contrast (~1.4:1, needs 4.5:1). Use `ink` (dark)
text on the raw accent, and reach for `accent-text` whenever green needs to be
a *foreground* color (links, small labels, borders) rather than a background.

Fonts: IBM Plex Sans (UI text), IBM Plex Mono (ticket IDs, timestamps).

## Next steps

- Build out `tickets/`, `projects/`, `reports/`, `organization/` pages with
  mock data (add a `lib/mock/data.ts` following the schema we planned)
- Add `/signup`, `/onboarding/*`, `/org/[orgId]/roles` pages
- Once UI is validated, swap `lib/mock/session.tsx` for real API calls —
  every consumer uses `useAuth()` / `usePermission()`, so the call sites
  don't change
