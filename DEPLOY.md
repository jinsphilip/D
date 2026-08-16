# Running & Deploying

## What changed

The app used to store everything in the browser's `localStorage` — fine for
one person, useless for a team, since every browser had its own isolated
copy. It now talks to a small Node/Express server (`server/`) backed by
MongoDB. All data (sites, employees, attendance, mess, advances, settings)
lives in one shared database; every browser that opens the app reads and
writes the same records. Changes made by one person show up for everyone
else within a few seconds (the frontend polls the server every 6s — see
"How syncing works" below).

The app also now sits behind a login screen — see "Login / access control"
below for how the first login gets set up and how it works.

## Deploy to Render + MongoDB Atlas

This app runs on two pieces: **Render** hosts the Node/Express web service,
**MongoDB Atlas** hosts the database. They're independent — the web service
just needs a `MONGODB_URI` pointing at Atlas.

### 1. Create a free Atlas cluster (skip if you already have one)

1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) → create an
   account → create a new project → **Build a Database** → pick the free
   **M0** tier → choose any region → create.
2. When prompted for a database user, set a username and password (letters
   and digits only — avoids any URL-encoding issues later). Save it
   somewhere.
3. **Network Access** (left sidebar) → **Add IP Address** → **Allow Access
   From Anywhere** (`0.0.0.0/0`). This step is easy to miss and the server
   simply can't connect without it — Render's free plan doesn't have a
   fixed outbound IP to allowlist individually.

### 2. Get your connection string

**Database** (left sidebar) → **Connect** on your cluster → **Drivers** →
copy the connection string shown. It looks like:
```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```
Replace `<password>` with the real password from step 1. You don't need to
add a database name into this string — the server always uses a fixed
database (`nep_payroll`) regardless of what's here.

### 3. Deploy the web service to Render

Using the included `render.yaml` Blueprint:

1. Go to the [Render Dashboard](https://dashboard.render.com) → **New +** →
   **Blueprint** → connect this repository.
2. Render reads `render.yaml` and shows the `nep-payroll-app` web service
   it's about to create, and prompts you for three secrets right there in
   the deploy flow (a fourth, `SESSION_SECRET`, is generated for you
   automatically — no input needed):
   - `MONGODB_URI` — the Atlas connection string from step 2.
   - `ADMIN_USERNAME` / `ADMIN_PASSWORD` — whatever you want the first
     login to be. These are only ever read once, the very first time the
     server boots with no login configured yet; after that, change the
     password from inside the app's Settings screen instead — these two
     env vars are ignored on every later boot.

   Click **Apply**.
3. Once it finishes building and boots, open the URL Render gives you
   (something like `https://nep-payroll-app.onrender.com`) and sign in
   with the `ADMIN_USERNAME`/`ADMIN_PASSWORD` you just set. The server
   creates its `store` collection and seeds the demo dataset into Atlas on
   first boot — check Atlas's **Browse Collections** afterward and you'll
   see `nep_payroll.store` there.

Share the URL *and* the login with everyone who needs to use the app —
they're all now reading and writing the same Atlas database, no matter
which device or browser they're on.

Need to change any of these env vars later? Render Dashboard → the
`nep-payroll-app` service → **Environment** tab. (Changing `ADMIN_USERNAME`/
`ADMIN_PASSWORD` there does nothing after the first boot — see above. To
reset a forgotten password instead, see "Login / access control" below.)

### If you'd rather not use the Blueprint

**New +** → **Web Service** → connect this repo:
- Build Command: `cd server && npm install`
- Start Command: `cd server && npm start`
- Environment → add `MONGODB_URI`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and
  `SESSION_SECRET` (any long random string — e.g. run
  `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
  locally and paste the output).

## Local development

Requires Node.js and a MongoDB connection string (Atlas, per above, works
fine for local dev too — no need for a separate local database).

```bash
cd server
npm install
cp .env.example .env
```

Edit `.env` and fill in `MONGODB_URI`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`,
and `SESSION_SECRET` (see the comments in `.env.example` for what each one
means), then:

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
MONGODB_URI="mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority" npm start
```
```cmd
:: Windows cmd.exe
set MONGODB_URI=mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
npm start
```
```powershell
# Windows PowerShell
$env:MONGODB_URI="mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority"
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

## Login / access control

There's one shared login (a single username/password), not a separate
account per person — everyone who uses the app signs in with the same
credentials. That pair is set once, the very first time the server boots
with no login configured yet in the database, from the `ADMIN_USERNAME`/
`ADMIN_PASSWORD` env vars. After that first boot those two env vars are
never read again — changing them in Render's Environment tab later has no
effect. To actually change the password, sign into the app and use
**Settings → Change Password**.

**Forgot the password and can't sign in to change it?** The login itself
lives in MongoDB (in the same `store` collection, under the key
`nep_auth`), not in the env vars. Open Atlas → Browse Collections →
`nep_payroll.store` → delete the `nep_auth` document → restart the Render
service (Manual Deploy, or just wait for it to redeploy). On that next
boot, with no login in the database, it re-bootstraps from
`ADMIN_USERNAME`/`ADMIN_PASSWORD` again — update those in Render's
Environment tab first if you want the reset login to be different from the
original one.

Sessions last 7 days and are stored as a signed cookie (not a server-side
session table), so logging in on one device doesn't affect any other
device's session.

## Things to know before relying on this in production

- **This is one shared login, not per-person accounts.** There's no way to
  tell which team member made a given change, and no role-based
  permissions (everyone who's logged in can do everything). Good enough
  for a small trusted team; not a substitute for real user management if
  that's ever needed.
- **No brute-force protection on login.** There's no rate limiting or
  lockout after repeated failed attempts. Low risk for an internal tool
  with an unlisted URL, but worth knowing.
- **MongoDB Atlas's free M0 tier does not auto-pause from inactivity** —
  unlike some other free-tier databases, it's just always on. The one real
  limit is storage (512MB), which is far more than this app will ever use
  for a small team's records.
- **Render's free web service spins down when idle** and takes ~30–50
  seconds to "wake up" on the next request after ~15 minutes of no
  traffic. Upgrade the web service plan (~$7/mo) if that cold-start delay
  is a problem for your users.
