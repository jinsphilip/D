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

## Deploy to Render + Supabase

This app runs on two pieces: **Render** hosts the Node/Express web service,
**Supabase** hosts the Postgres database. They're independent — the web
service just needs a `DATABASE_URL` pointing at Supabase.

### 1. Get your Supabase connection string

1. In your Supabase project → gear icon **Project Settings** → **Database**.
2. Under **Connection string**, open the **URI** tab and copy the
   **Transaction pooler** string (port `6543`), not the direct connection
   (port `5432`). The pooler works from anywhere (Render included); the
   direct connection is IPv6-only on Supabase's free tier and most hosts,
   Render included, can't reach it.
3. It looks like
   `postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres` —
   fill in your actual password.

### 2. Deploy the web service to Render

Using the included `render.yaml` Blueprint:

1. Go to the [Render Dashboard](https://dashboard.render.com) → **New +** →
   **Blueprint** → connect this repository.
2. Render reads `render.yaml` and shows the `nep-payroll-app` web service
   it's about to create. Since `DATABASE_URL` is a secret, Render will
   prompt you for it right there in the deploy flow — paste the Supabase
   connection string from step 1. Click **Apply**.
3. Once it finishes building and boots, open the URL Render gives you
   (something like `https://nep-payroll-app.onrender.com`). The server
   creates its `store` table and seeds the demo dataset into Supabase on
   first boot — check Supabase's **Table Editor** afterward and you'll see
   it there.

Share that URL with everyone who needs to use the app — they're all now
reading and writing the same Supabase database, no matter which device or
browser they're on.

Forgot to paste `DATABASE_URL` during setup, or need to change it later?
Render Dashboard → the `nep-payroll-app` service → **Environment** tab.

### If you'd rather not use the Blueprint

**New +** → **Web Service** → connect this repo:
- Root Directory: `server`
- Build Command: `npm install`
- Start Command: `npm start`
- Environment → add `DATABASE_URL` = your Supabase connection string.

## Local development

Requires Node.js and a PostgreSQL instance (local, or a remote one like
Supabase — anything that gives you a connection string works).

```bash
cd server
npm install
cp .env.example .env
```

Edit `.env` and paste your real connection string as `DATABASE_URL=...`,
then:

```bash
npm start
```

Using a `.env` file (rather than setting the environment variable inline on
the command line) is deliberate: `VAR=value command` only works in
bash/zsh — it's not valid syntax in Windows `cmd.exe` or PowerShell, and
was a common source of confusion when this was the only documented option.
A `.env` file works identically on every OS. `.env` is gitignored, so your
credentials never get committed — only commit `.env.example`.

If you'd rather not use a file, the inline forms still work, per shell:

```bash
# bash / zsh (macOS, Linux)
DATABASE_URL="postgresql://user:password@host:5432/dbname" npm start
```
```cmd
:: Windows cmd.exe
set DATABASE_URL=postgresql://user:password@host:5432/dbname
npm start
```
```powershell
# Windows PowerShell
$env:DATABASE_URL="postgresql://user:password@host:5432/dbname"
npm start
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
- **Supabase's free project pauses after 7 days with no database
  activity.** Data isn't lost, but someone has to open the Supabase
  dashboard and click "Restore" before the app works again. If the app
  gets used at least weekly this never comes up; if it might sit idle
  longer than that, upgrade to Supabase's Pro plan to remove the pause.
- **Render's free web service spins down when idle** and takes ~30–50
  seconds to "wake up" on the next request after ~15 minutes of no
  traffic. Upgrade the web service plan (~$7/mo) if that cold-start delay
  is a problem for your users.
