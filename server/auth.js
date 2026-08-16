// Single shared login for the app: one username/password pair, bootstrapped
// from ADMIN_USERNAME/ADMIN_PASSWORD env vars on first boot, changeable
// afterward from the Settings screen. Not a per-employee account system —
// this just keeps the app private to whoever the team shares the login
// with, consistent with the rest of the app's "no per-user RBAC" scope.

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('./db');

const AUTH_KEY = 'nep_auth';
const SESSION_COOKIE = 'nep_session';
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  console.error('SESSION_SECRET is not set. Set it to any long random string (see DEPLOY.md).');
  process.exit(1);
}

async function ensureAdminSeeded() {
  const existing = await db.getValue(AUTH_KEY);
  if (existing) return;

  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) {
    console.error(
      'No login exists yet and ADMIN_USERNAME/ADMIN_PASSWORD are not set. ' +
      'Set both env vars to bootstrap the first login (see DEPLOY.md).'
    );
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await db.setValue(AUTH_KEY, { username, passwordHash });
  console.log(`Bootstrapped login for user "${username}" from ADMIN_USERNAME/ADMIN_PASSWORD.`);
}

async function verifyLogin(username, password) {
  const auth = await db.getValue(AUTH_KEY);
  if (!auth || auth.username !== username) return false;
  return bcrypt.compare(password, auth.passwordHash);
}

async function changePassword(currentPassword, newPassword) {
  const auth = await db.getValue(AUTH_KEY);
  if (!auth) throw new Error('No login is configured');
  const ok = await bcrypt.compare(currentPassword, auth.passwordHash);
  if (!ok) return false;
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db.setValue(AUTH_KEY, { ...auth, passwordHash });
  return true;
}

function sign(value) {
  return crypto.createHmac('sha256', sessionSecret).update(value).digest('hex');
}

// Session token: "<username>.<expiryMs>.<hmacSignature>" — stateless (no
// server-side session store needed), tamper-evident, self-expiring.
function createSessionToken(username) {
  const expires = Date.now() + SESSION_MAX_AGE_MS;
  const payload = `${username}.${expires}`;
  return `${payload}.${sign(payload)}`;
}

function verifySessionToken(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [username, expiresStr, signature] = parts;
  const payload = `${username}.${expiresStr}`;
  const expected = sign(payload);
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }
  if (Date.now() > Number(expiresStr)) return null;
  return username;
}

function parseCookies(header) {
  const cookies = {};
  if (!header) return cookies;
  header.split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx === -1) return;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    cookies[key] = decodeURIComponent(value);
  });
  return cookies;
}

function setSessionCookie(req, res, token) {
  const secure = req.protocol === 'https';
  res.setHeader('Set-Cookie',
    `${SESSION_COOKIE}=${encodeURIComponent(token)}; Max-Age=${Math.floor(SESSION_MAX_AGE_MS / 1000)}; Path=/; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`
  );
}

function clearSessionCookie(req, res) {
  const secure = req.protocol === 'https';
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`);
}

function getSessionUsername(req) {
  const cookies = parseCookies(req.headers.cookie);
  return verifySessionToken(cookies[SESSION_COOKIE]);
}

// Express middleware: 401s any request without a valid session cookie.
function requireAuth(req, res, next) {
  const username = getSessionUsername(req);
  if (!username) return res.status(401).json({ error: 'Not authenticated' });
  req.username = username;
  next();
}

module.exports = {
  ensureAdminSeeded,
  verifyLogin,
  changePassword,
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
  getSessionUsername,
  requireAuth,
};
