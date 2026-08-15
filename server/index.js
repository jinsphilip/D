// Shared-data server for the Nikhila Engineering Attendance & Payroll app.
//
// Persists the whole application state (sites, employees, attendance,
// settings, messes, mess expenses, advances) in PostgreSQL, so every browser
// that opens this server sees and edits the same data instead of each
// browser having its own isolated localStorage copy. See DEPLOY.md for
// hosting this on Render with a managed Postgres database.

const express = require('express');
const path = require('path');
const cors = require('cors');
const db = require('./db');

const ROOT_DIR = path.join(__dirname, '..');
const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.get('/api/data', async (req, res) => {
  try {
    res.json(await db.getAll());
  } catch (e) {
    console.error('Failed to read store:', e);
    res.status(500).json({ error: 'Failed to read data' });
  }
});

app.get('/api/data/:key', async (req, res) => {
  try {
    res.json(await db.getValue(req.params.key));
  } catch (e) {
    console.error('Failed to read key:', req.params.key, e);
    res.status(500).json({ error: 'Failed to read data' });
  }
});

app.put('/api/data/:key', async (req, res) => {
  try {
    await db.setValue(req.params.key, req.body);
    res.json({ ok: true });
  } catch (e) {
    console.error('Failed to write key:', req.params.key, e);
    res.status(500).json({ ok: false, error: 'Failed to persist data' });
  }
});

// Serve only the known frontend paths — never the whole repo root, so the
// server/ directory (env vars, source) is never web-accessible.
app.get('/', (req, res) => res.sendFile(path.join(ROOT_DIR, 'index.html')));
app.use('/css', express.static(path.join(ROOT_DIR, 'css')));
app.use('/js', express.static(path.join(ROOT_DIR, 'js')));

db.initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Nikhila Engineering payroll server listening on port ${PORT}`);
    });
  })
  .catch((e) => {
    console.error('Failed to initialize database:', e);
    process.exit(1);
  });
