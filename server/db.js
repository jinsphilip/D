// PostgreSQL-backed key/value store. The frontend already treats each
// top-level piece of app state (sites, employees, attendance, ...) as one
// opaque JSON blob, so rather than modeling a full relational schema we keep
// that shape server-side too: one row per key, a JSONB column for the value.
// This keeps the REST contract (GET/PUT /api/data/:key) identical to the
// earlier flat-file version while giving real concurrent-write safety and
// durability independent of the web service's filesystem.

const { Pool } = require('pg');
const seedStore = require('./seedData');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not set. Set it to a PostgreSQL connection string (see DEPLOY.md).');
  process.exit(1);
}

// Render (and most managed Postgres providers) terminate SSL with a
// certificate that isn't in Node's default trust store; a local dev
// Postgres on localhost has no SSL listener at all. Toggle accordingly.
const useSsl = !/localhost|127\.0\.0\.1/.test(connectionString);

const pool = new Pool({
  connectionString,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS store (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  const { rows } = await pool.query('SELECT key FROM store');
  const existingKeys = new Set(rows.map((r) => r.key));
  const defaults = seedStore();
  const missing = Object.keys(defaults).filter((k) => !existingKeys.has(k));

  if (missing.length > 0) {
    for (const key of missing) {
      await pool.query(
        'INSERT INTO store (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING',
        [key, JSON.stringify(defaults[key])]
      );
    }
    console.log('Seeded default data for keys:', missing.join(', '));
  }
}

async function getAll() {
  const { rows } = await pool.query('SELECT key, value FROM store');
  const result = {};
  rows.forEach((r) => { result[r.key] = r.value; });
  return result;
}

async function getValue(key) {
  const { rows } = await pool.query('SELECT value FROM store WHERE key = $1', [key]);
  return rows.length > 0 ? rows[0].value : null;
}

async function setValue(key, value) {
  await pool.query(
    `INSERT INTO store (key, value, updated_at) VALUES ($1, $2, now())
     ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = now()`,
    [key, JSON.stringify(value)]
  );
}

module.exports = { pool, initDb, getAll, getValue, setValue };
