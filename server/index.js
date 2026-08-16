// Shared-data server for the Nikhila Engineering Attendance & Payroll app.
//
// Persists the whole application state (sites, employees, attendance,
// settings, messes, mess expenses, advances) in MongoDB, so every browser
// that opens this server sees and edits the same data instead of each
// browser having its own isolated localStorage copy. See DEPLOY.md for
// hosting this on Render with a MongoDB Atlas database.

// Load MONGODB_URI (and any other config) from a local .env file if one
// exists — see .env.example. Harmless no-op in production, where the host
// (e.g. Render) injects real environment variables directly.
require('dotenv').config();

// Some managed-database hostnames (Atlas's mongodb+srv:// records included)
// resolve to both an IPv4 and an IPv6 address. Node can default to trying
// IPv6 first, which fails with ENETUNREACH on hosts (Render included) that
// have no outbound IPv6 route, even though a working IPv4 address exists
// for the same hostname. Prefer IPv4 globally so every DNS lookup in this
// process picks the address that's actually reachable.
require('dns').setDefaultResultOrder('ipv4first');

const express = require('express');
const path = require('path');
const cors = require('cors');
const db = require('./db');
const auth = require('./auth');

const ROOT_DIR = path.join(__dirname, '..');
const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (req, res) => res.json({ ok: true }));

// --- Auth (public — no session required) ---------------------------------

app.get('/api/auth/me', (req, res) => {
  const username = auth.getSessionUsername(req);
  if (!username) return res.status(401).json({ error: 'Not authenticated' });
  res.json({ username });
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });
    const ok = await auth.verifyLogin(username, password);
    if (!ok) return res.status(401).json({ error: 'Invalid username or password' });
    auth.setSessionCookie(req, res, auth.createSessionToken(username));
    res.json({ ok: true, username });
  } catch (e) {
    console.error('Login failed:', e);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  auth.clearSessionCookie(req, res);
  res.json({ ok: true });
});

app.post('/api/auth/change-password', auth.requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Current and new password are required' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });
    const ok = await auth.changePassword(currentPassword, newPassword);
    if (!ok) return res.status(401).json({ error: 'Current password is incorrect' });
    res.json({ ok: true });
  } catch (e) {
    console.error('Change password failed:', e);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// --- App data (protected — requires a valid session) ----------------------

app.get('/api/data', auth.requireAuth, async (req, res) => {
  try {
    res.json(await db.getAll());
  } catch (e) {
    console.error('Failed to read store:', e);
    res.status(500).json({ error: 'Failed to read data' });
  }
});

app.get('/api/data/:key', auth.requireAuth, async (req, res) => {
  try {
    res.json(await db.getValue(req.params.key));
  } catch (e) {
    console.error('Failed to read key:', req.params.key, e);
    res.status(500).json({ error: 'Failed to read data' });
  }
});

app.put('/api/data/:key', auth.requireAuth, async (req, res) => {
  try {
    await db.setValue(req.params.key, req.body);
    res.json({ ok: true });
  } catch (e) {
    console.error('Failed to write key:', req.params.key, e);
    res.status(500).json({ ok: false, error: 'Failed to persist data' });
  }
});

// Serve only the known frontend paths — never the whole repo root, so the
// server/ directory (env vars, source) is never web-accessible. These stay
// public: the login page itself is part of this same static bundle.
app.get('/', (req, res) => res.sendFile(path.join(ROOT_DIR, 'index.html')));
app.use('/css', express.static(path.join(ROOT_DIR, 'css')));
app.use('/js', express.static(path.join(ROOT_DIR, 'js')));
app.use('/icons', express.static(path.join(ROOT_DIR, 'icons')));
app.get('/manifest.json', (req, res) => res.sendFile(path.join(ROOT_DIR, 'manifest.json')));

db.initDb()
  .then(() => auth.ensureAdminSeeded())
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Nikhila Engineering payroll server listening on port ${PORT}`);
    });
  })
  .catch((e) => {
    console.error('Failed to initialize database:', e);
    process.exit(1);
  });
