# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

ExamPanel — invigilation duty management for academic exams. A port of an older PHP app (`../exam`) that still runs against **the same MySQL `exam` database and legacy table names** (`users`, `duties`, `slot`, `preferences`, `rooms`). Two independent apps, no monorepo tooling:

- `backend/` — Express 4 API on `:4000` (ESM, plain JS, no build step, no tests, no linter)
- `frontend/` — Next.js 14 App Router + TypeScript + Tailwind on `:3000`

Note: `README.md` predates the current tree — it calls the directories `server/` and `web/` and omits the `cohorts`, `allocations`, `attendance`, and `stats` route groups. Trust the code over the README.

## Commands

```bash
cd backend && npm install && npm run dev     # node --watch src/index.js → :4000
cd frontend && npm install && npm run dev    # next dev → :3000
```

Production: `npm start` in both (`next build` first in `frontend`).

Env files are per-app and copied from the checked-in examples: `backend/.env` (DB creds, `JWT_SECRET`, `CORS_ORIGIN`) and `frontend/.env.local` (`NEXT_PUBLIC_API_URL`).

There is **no test suite and no lint setup** — `frontend`'s `npm run lint` is the stock `next lint` script with no ESLint config present, so it prompts for setup. Typecheck the frontend with `npx tsc --noEmit` in `frontend/`. Verify backend changes by hitting the API (`curl localhost:4000/health`) with a real MySQL instance running.

## Architecture

### Schema evolution lives in code, not migrations

`backend/src/db.js` → `ensureSchema()` runs on every boot and is the only schema authority for anything the PHP app didn't have. It adds columns (`users.phone`, `slot.hidden`, `duties.cohort_id`, `cohorts.system_default`), `CREATE TABLE IF NOT EXISTS`es the new tables (`cohorts`, `cohort_members`, `allocations`, `attendance`), and runs a one-time backfill that creates the "All users" cohort on a fresh install. **New schema changes go here**, written idempotently (`SHOW COLUMNS … LIKE`, `IF NOT EXISTS`). A failure is logged and the server still starts.

The legacy tables have **no foreign keys**, so deletes must cascade by hand inside a transaction. Every destructive handler does this: deleting a user, duty, or slot clears its dependent `preferences` / `allocations` / `attendance` rows first. Deleting a room instead nulls `allocations.room_id` (those people fall back to the reserved tray) and is **refused** while any `attendance` row references it, since that roll-call cannot be reconstructed. Adding a new delete path means extending this list.

### Auth

JWT, stateless. `POST /api/auth/login` accepts an `identifier` matched against `name`, `email`, *or* `employeeid`. `backend/src/auth.js#verifyPassword` accepts both legacy PHP sha256 hashes and bcrypt, returning `needsUpgrade` so the login handler transparently re-hashes to bcrypt on first successful legacy login — don't break this dual path.

Every route module does `router.use(requireAuth)` (and `requireAdmin` where admin-only) at the top rather than per-handler. Async handlers are wrapped in `asyncHandler` from `backend/src/middleware.js` so throws reach the single error middleware in `index.js`, which returns `{ error }` with `err.status || 500`.

Role check is always `String(role).toLowerCase() === 'admin'`; everyone else is faculty. `src/utils/access.js` holds the cohort gate — `canSeeDuty(user, dutyId)` (admins pass; faculty must belong to the duty's cohort, and `cohort_id IS NULL` means admin-only). **Any faculty-reachable route that names a duty, directly or via a slot, must go through it**, or the model that `/api/duties` enforces can be sidestepped by asking for the duty's slots instead. The canonical role list (`Professor`, `Assistant Professor`, `Associate Professor`, `Research Scholar`, `Special Role 1–4`, `Admin`) is duplicated in `routes/users.js` and `routes/cohorts.js` (the latter also carries an alias map for spreadsheet imports) — keep them in sync.

### The domain flow

1. **Cohorts** group users. Exactly one cohort carries `system_default = 1`; it cannot be deleted and every user created through any path is auto-added via `addToSystemCohort()`.
2. **Duties** target one cohort. Visibility for non-admins is entirely cohort-driven: `cohort_id IS NULL` means admin-only, otherwise the user must be a member *and* `accepting_bookings = 1`. `GET /api/duties/:id` repeats that membership check.
3. **Slots** belong to a duty. `slot.hidden = 1` removes it from non-admin listings and blocks new bookings. `POST /api/slots/generate` is a dates × templates cross product.
4. **Preferences** are faculty slot picks. `POST /api/preferences` enforces a per-role count taken from the duty row (`ROLE_LIMIT_COLUMN` maps role name → duty column; a role with no column has **no** quota — it must not fall back to another role's), per-slot capacity against `slot.requirement`, and is **write-once** — once a user has any preference for a duty it cannot be changed. Booking is a stampede workload, so the whole check-and-insert runs in one transaction with `FOR UPDATE`, takes slot locks in ascending id order, and retries twice on `ER_LOCK_DEADLOCK`/`ER_LOCK_WAIT_TIMEOUT` — a losing racer then gets "slot is already full" rather than a driver error. `uniq_pref (slotid, userid)` backs this up at the schema level.
5. **Allocations** (`routes/allocations.js`) assign who invigilates where. `allocateSlot()` sorts faculty by lifetime reserved count *descending* so previously-reserved people get rooms first, spills the tail into `room_id = NULL` ("reserved"/backup), then interleaves by role across a round-robin of room capacity so rooms get a mixed roster. Regenerating reads the reserved history *before* deleting the duty's old rows.
6. **Attendance** (`routes/attendance.js`) is the separate ground-truth roll-call, keyed `(slot_id, room_id, seat_index)` with a second unique key preventing a user from appearing twice in a slot (returns 409 naming the conflicting seat).

Reports (`routes/reports.js`) share one `runReport(type, dutyId, slotId)` switch; `?csv=1` streams the same rows through `utils/csv.js` instead of JSON. `duty_not_opted` is scoped to the duty's cohort — "did not opt" is only meaningful for people who could have. Note `preferences.userid` is nullable, so use `NOT EXISTS`, never `NOT IN` (a single NULL makes `NOT IN` return nothing at all).

Quota columns and `rooms.need` are clamped to whole non-negative counts on write, and read back through `Math.max(0, …)`: a stored negative used to satisfy neither branch of the preference check and silently removed the limit.

### Frontend

Client-only — every page is `'use client'`, no server components fetch data, no Next.js API routes or rewrites. The browser talks to `:4000` directly, so CORS_ORIGIN matters.

`frontend/src/lib/api.ts` is the single fetch wrapper: attaches `Authorization: Bearer`, unwraps `{ error }` bodies into `ApiError`, and on any 401 clears `localStorage` and hard-redirects to `/login`. `apiDownload()` is the blob variant for CSV exports. Auth state is `localStorage` (`exam_token`, `exam_user`) read through `getToken()`/`getStoredUser()`.

Route groups do the gating: `src/app/admin/layout.tsx` and `src/app/(user)/layout.tsx` each wrap children in `<AuthProvider requireRole="admin"|"user">`, which redirects mismatched roles, and render the shared `Shell` with their own nav array. `src/app/page.tsx` just bounces to the right dashboard.

UI is hand-vendored shadcn-style components in `src/components/ui/` (Radix + `cva` + `cn`), themed by HSL CSS variables in `globals.css` and mapped in `tailwind.config.ts` — use the semantic tokens (`primary`, `muted`, `success`, `warning`, `info`) rather than raw Tailwind palette colors. Imports use the `@/*` alias.

`UserPicker` (debounced typeahead against `GET /api/users?q=`) is the standard faculty-selection control. `xlsx` is used client-side only, in `src/app/admin/cohorts/[id]/page.tsx`, to parse bulk-import spreadsheets and generate the template before POSTing rows to `/api/cohorts/:id/members/import-users`.
