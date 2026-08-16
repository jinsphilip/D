// MongoDB-backed key/value store. The frontend already treats each
// top-level piece of app state (sites, employees, attendance, ...) as one
// opaque JSON blob, so rather than modeling separate collections we keep
// that shape server-side too: one document per key in a single `store`
// collection, `{ _id: key, value: <anything>, updatedAt }`. This keeps the
// REST contract (GET/PUT /api/data/:key) identical to the earlier
// Postgres/file-based versions — only this file changed.

const { MongoClient } = require('mongodb');
const seedStore = require('./seedData');

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI is not set. Set it to a MongoDB connection string (see DEPLOY.md).');
  process.exit(1);
}

// Fixed database name regardless of what (if anything) is in the URI's own
// path — Atlas connection strings often omit it, which would otherwise
// default to a generic "test" database.
const DB_NAME = 'nep_payroll';
const COLLECTION = 'store';

const client = new MongoClient(uri);
let collectionPromise = null;

function getCollection() {
  if (!collectionPromise) {
    collectionPromise = client.connect().then(() => client.db(DB_NAME).collection(COLLECTION));
  }
  return collectionPromise;
}

async function initDb() {
  const store = await getCollection();
  const existing = await store.find({}, { projection: { _id: 1 } }).toArray();
  const existingKeys = new Set(existing.map((doc) => doc._id));
  const defaults = seedStore();
  const missing = Object.keys(defaults).filter((k) => !existingKeys.has(k));

  if (missing.length > 0) {
    await store.insertMany(
      missing.map((key) => ({ _id: key, value: defaults[key], updatedAt: new Date() }))
    );
    console.log('Seeded default data for keys:', missing.join(', '));
  }
}

async function getAll() {
  const store = await getCollection();
  const docs = await store.find({}).toArray();
  const result = {};
  docs.forEach((doc) => { result[doc._id] = doc.value; });
  return result;
}

async function getValue(key) {
  const store = await getCollection();
  const doc = await store.findOne({ _id: key });
  return doc ? doc.value : null;
}

async function setValue(key, value) {
  const store = await getCollection();
  await store.updateOne(
    { _id: key },
    { $set: { value, updatedAt: new Date() } },
    { upsert: true }
  );
}

module.exports = { initDb, getAll, getValue, setValue };
