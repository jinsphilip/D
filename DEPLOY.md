# Running & Deploying

## What changed

The app used to store everything in the browser's `localStorage` — fine for
one person, useless for a team, since every browser had its own isolated
copy. It now talks to a small Node/Express server (`server/`) backed by
PostgreSQL. All data (sites, employees, attendance, mess, advances,
settings) lives in one shared database; every browser that opens the app
reads and writes the same records. Changes made by one person show up for
everyone else within a few seconds (the frontend polls the server every 6s —
see "How syncing works" below).

## Deploy to Render (recommended)

This repo includes a `render.yaml` Blueprint, so Render can provision both
the web service and a Postgres database from one file.

1. Push this repo to GitHub if it isn't already (it is, on this branch).
2. Go to the [Render Dashboard](https://dashboard.render.com) → **New +** →
   **Blueprint**.
3. Connect your GitHub account and select this repository.
4. Render reads `render.yaml` and shows you two resources it's about to
   create: a **Postgres database** (`nep-payroll-db`) and a **web service**
   (`nep-payroll-app`). Click **Apply**.
5. Render provisions the database first, then builds and starts the web
   service with `DATABASE_URL` wired to it automatically — you don't need
   to copy any connection string by hand.
6. Once the deploy finishes, open the URL Render gives the web service
   (something like `https://nep-payroll-app.onrender.com`). The server
   seeds the demo dataset (sites, employees, etc.) into Postgres on its
   first boot, same as the old localStorage version did.

Share that URL with everyone who needs to use the app — they're all now
reading and writing the same backend, no matter which device or browser
they're on.

### If you'd rather set it up by hand instead of using the Blueprint

1. **New +** → **PostgreSQL** → create a database. Copy its **Internal
   Database URL** once it's ready.
2. **New +** → **Web Service** → connect this repo.
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Add an environment variable `DATABASE_URL` = the internal connection
     string from step 1.
3. Deploy.

## Local development

Requires Node.js and a PostgreSQL instance (local or remote).

```bash
cd server
npm install
DATABASE_URL="postgresql://user:password@localhost:5432/nep_payroll" npm start
```

Then open `http://localhost:3000` — the Express server serves the frontend
(`index.html`, `css/`, `js/`) itself and exposes the API under `/api/data/*`.
You no longer open `index.html` directly or use a separate static file
server; everything is served from the one Node process so the frontend's
`fetch('/api/data/...')` calls resolve correctly.

## How syncing works (and its limits)

- Each browser fetches its data on load, and polls the server every 6
  seconds for changes made elsewhere.
- Edits save immediately (optimistic UI: your own screen updates instantly,
  then the change is sent to the server in the background).
- This is **not** real-time (no websockets) and it's **last-write-wins**:
  if two people edit the exact same record within the same few seconds,
  whichever save lands last on the server wins, silently. Fine for a small
  team logging attendance and running payroll; not built for heavy
  simultaneous editing of the same row.

## Things to know before relying on this in production

- **No login / access control.** Anyone with the URL can view and edit all
  data — there's no username/password gate. If this needs to be private,
  either keep the URL unlisted, put it behind your own auth layer (a
  reverse proxy with basic auth, a VPN, Render's IP allowlist on paid
  plans), or ask to have a simple login added.
- **Render's free Postgres plan expires.** Render's free-tier databases are
  deleted a fixed number of days after creation (check Render's current
  policy — it has changed before, historically ~30 days). For anything you
  can't afford to lose, upgrade to a paid Postgres plan before that
  happens; the free tier is fine for trying this out, not for running
  payroll long-term.
- **Free web services spin down when idle** and take a few seconds to
  "wake up" on the next request after ~15 minutes of no traffic. Upgrade
  the web service plan if that cold-start delay is a problem for your
  users.
