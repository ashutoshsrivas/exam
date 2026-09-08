# ExamPanel — Next.js + Express port

Modern rewrite of the PHP `exam` app:

- **Frontend**: Next.js 14 (App Router) + Tailwind CSS + shadcn-style components
- **Backend**: Node.js + Express + MySQL2 (uses the same `exam` schema as the PHP app)
- **Auth**: JWT (stateless). Existing sha256 passwords from the PHP DB are accepted and transparently re-hashed with bcrypt on first login

## Layout

```
exam-next/
├── server/   # Express API on :4000
└── web/      # Next.js app on :3000
```

## Prerequisites

- Node.js 18.18+ (20 recommended)
- MySQL (XAMPP works) with the existing `exam` database imported (use `../exam/exam.sql`)

## 1. Database

The schema is identical to the PHP app. If you already have it loaded in XAMPP MySQL, you're done. Otherwise:

```bash
mysql -u root exam < /Applications/XAMPP/xamppfiles/htdocs/exam/exam.sql
```

## 2. Backend

```bash
cd server
cp .env.example .env       # edit DB creds + JWT_SECRET
npm install
npm run dev
```

Listens on `http://localhost:4000`. Endpoints under `/api/*`:

| Resource       | Endpoints |
| -------------- | --------- |
| `auth`         | `POST /login`, `GET /me`, `POST /change-password` |
| `users`        | `GET /`, `POST /`, `PUT /:id`, `DELETE /:id` (admin) |
| `duties`       | `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`, `PATCH /:id/booking-status` |
| `slots`        | `GET /?duty=`, `GET /:id`, `GET /:id/participants`, `POST /`, `PUT /:id`, `DELETE /:id`, `POST /generate` |
| `rooms`        | `GET /`, `POST /`, `PUT /:id`, `DELETE /:id` (admin) |
| `preferences`  | `GET /?duty=`, `GET /mine`, `POST /` |
| `reports`      | `GET /?type=…&duty=…&slot=…&csv=0|1` (admin) |

Roles: a user with `role = 'Admin'` can hit admin-only endpoints; everyone else is treated as faculty.

## 3. Frontend

```bash
cd web
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:4000
npm install
npm run dev
```

Open `http://localhost:3000`. Login with any existing user from your `exam` database — the default sha256 hashes from the PHP app continue to work.

## Auth model

- `POST /api/auth/login` returns `{ token, user }`. The web app stores both in `localStorage`.
- All API requests include `Authorization: Bearer <token>`.
- On the first successful login with a legacy sha256 password, the backend transparently re-hashes that user's password with bcrypt (`$2…`) and updates the row. No data migration needed.
- A 401 response from any endpoint clears storage and redirects to `/login`.

## Feature parity with the PHP app

| PHP page | Next.js route | API |
| --- | --- | --- |
| `login.php` | `/login` | `POST /api/auth/login` |
| `logout.php` | sidebar Logout button | (client-side token clear) |
| `admin/dashboard.php` | `/admin/dashboard` | — |
| `admin/users.php` | `/admin/users` | `/api/users*` |
| `admin/duties.php` | `/admin/duties` | `/api/duties*` |
| `admin/classes.php` | `/admin/rooms` | `/api/rooms*` |
| `admin/slots.php` | `/admin/slots` | `/api/slots*` |
| `admin/slot_applicants.php` | `/admin/slots/[id]/applicants` | `/api/slots/:id/participants`, `/api/reports?type=slot_attendees&csv=1` |
| `admin/report.php` | `/admin/reports` | `/api/reports*` |
| `user/dashboard.php` | `/dashboard` | `GET /api/duties?accepting=1` |
| `user/slots.php` | `/duties/[id]/slots` | `/api/slots?duty=…`, `/api/preferences*` |
| `user/bookings.php` | `/bookings` | `GET /api/preferences/mine` |
| `user/profile.php` | `/profile` | `POST /api/auth/change-password` |

## Notes / differences from the PHP version

- Sessions → JWT in `localStorage` + `Authorization: Bearer …` header
- Server-rendered HTML → React on the client; the API returns JSON only
- shadcn-style Tailwind components replace the hand-written CSS in `public/style/*`
- The `classes.php` page worked off whichever table existed (`rooms`/`classes`/…). The new code targets `rooms` directly, with `{id, name, need}` columns — matching what's actually used by `auto-generate slots` and the rest of the system
- `users.email` is optional in the PHP app — same here

## Production

```bash
cd web && npm run build && npm start    # serves on :3000
cd server && npm start                  # serves on :4000
```

Use a process manager (`pm2`, `systemd`) and put both behind a reverse proxy (Nginx/Caddy). Set a strong `JWT_SECRET` and lock `CORS_ORIGIN` to your real domain(s).
