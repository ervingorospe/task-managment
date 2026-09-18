# CLAUDE.md

Guidance for Claude Code sessions working in this repo. This file is
auto-loaded into context at the start of every session here — keep it
current when conventions change, rather than letting it go stale like
`README.md` has (it still references files like `Sidebar.tsx` /
`lib/mock/session.tsx` that no longer exist at those paths).

## What this is

Next.js 14 (App Router) + TypeScript + Tailwind ticketing app. **UI-first
scaffold — no real backend.** Every mutation is local React state with a
`// TODO: PATCH/POST/DELETE ...` comment marking where the API call goes
later. Don't build the backend call; just keep following that pattern.

Auth is mocked in `providers/auth-provider.tsx` — login accepts any
`@domain.com` email with password `123` (see the login page for the seeded
test accounts: jane/marco/priya @acmestudio.com, alex@clientco.com). Session
is in-memory only; a hard page navigation (not a client-side route change)
loses it and bounces to `/login`.

## Component conventions

**Standalone-component pattern (ticket detail page as the reference):**
`components/ticket/ticket-detail-client.tsx` composes several small,
self-contained components rather than being one big file:
- `ticket-overview-card.tsx`, `ticket-details-card.tsx`,
  `ticket-activity-card.tsx` — one per `Card` on the page.
- Inside Overview: `ticket-description-section.tsx`,
  `ticket-attachments-section.tsx`, `ticket-comments-section.tsx`.

Each of these owns its *own* local state (edit-mode toggles, forms,
confirm dialogs) instead of lifting it to the parent, and pulls data it
needs from hooks directly (e.g. `TicketCommentsSection` calls `useAuth()`
itself rather than receiving `currentUser` as a prop) rather than having
it threaded through props. Only lift state up when something *else* on the
page genuinely depends on the current value (e.g. the ticket title is kept
in the parent because the delete-confirmation dialog text needs it).
Follow this pattern for other large page components before they grow into
monoliths — don't wait for them to hit 600+ lines first.

**Check `components/ui/` before writing a new small component.** These
exist specifically to avoid re-duplicating patterns that were previously
copy-pasted across files:

| Component | Use for |
|---|---|
| `card.tsx` | Titled/subtitled bordered panel — the standard section container |
| `property-row.tsx` | Label above content. `variant="caption"` (default): uppercase tracked label, arbitrary children — used for property/filter sections. `variant="plain"`: small muted label + icon/value row — used for read-only info displays |
| `empty-state.tsx` | "Nothing here yet" block (dashed border, title + subtitle) |
| `meta-badge.tsx` | Small uppercase tag pill (e.g. "Default", "Deactivated") — text-only, no color state |
| `capacity-header.tsx` | Section header pattern: title + subtitle + "x / capacity used" line, optional trailing action |
| `danger-zone-card.tsx` | `DangerZoneCard` + `DangerZoneRow` — the bordered destructive-action row (used in org settings: deactivate/delete/leave org) |
| `confirm-dialog.tsx` | Reuse this for *any* destructive-action confirmation — don't build a new modal |
| `avatar.tsx`, `buttons/*`, `form/*`, `dropdown.tsx`, `list.tsx`, `modal.tsx`, `tooltip.tsx`, `status-badge.tsx`, `color-picker.tsx`, `data-table.tsx`, `pagination.tsx` | Standard building blocks, already shared |

`components/ticket/` also has domain-shared pieces: `due-chip.tsx` (overdue/due-today pill), `section-heading.tsx` (icon + label heading used inside the Overview sub-sections).

**Before adding a new one-off `<span className="...">` badge, label, or
bordered box**, grep for the exact className string first — if it appears
in 2+ places already, it should probably be one of the above instead of a
third copy.

## Design tokens

Defined in `tailwind.config.ts`, light mode only. `accent` (`#00FA9A`) is
a *background-only* color — it fails contrast as text. Use `accent-text`
for green links/labels/borders on white, `ink`/`ink-muted`/`ink-faint` for
the text hierarchy, `danger`/`danger-subtle` and `warning`/`warning-subtle`
for status/error states.

## Verifying changes

- `npx tsc --noEmit -p tsconfig.json` and `npx next lint` should both be
  clean before considering a change done (delete `tsconfig.tsbuildinfo`
  after — it's a local build cache, not meant to be committed).
- For UI changes, actually click through the flow in the browser rather
  than trusting the diff — this app has no test suite yet.
