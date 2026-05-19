#!/usr/bin/env node
// migrate-to-prod.js — Copies sets + questions from dev Supabase → prod Supabase
//
// Uses UPSERT (not truncate), so it's safe to re-run. Existing rows in prod
// are updated; new rows are inserted. Nothing is deleted.
//
// Requires Node 18+ (uses built-in fetch). No npm install needed.
//
// Get your service_role keys from:
//   Supabase dashboard → Settings → API → "service_role secret"
//   (Do NOT use the anon keys from config.js — they can't write past RLS)
//
// Run:
//   DEV_SERVICE_KEY=your_dev_service_role_key \
//   PROD_SERVICE_KEY=your_prod_service_role_key \
//   node migrate-to-prod.js

const DEV_URL  = 'https://ywejteozxichsmterelj.supabase.co';
const PROD_URL = 'https://lvbqmaarriglqaegemgc.supabase.co';

const DEV_KEY  = process.env.DEV_SERVICE_KEY;
const PROD_KEY = process.env.PROD_SERVICE_KEY;

if (!DEV_KEY || !PROD_KEY) {
  console.error(
    '\nMissing service role keys. Run as:\n' +
    '  DEV_SERVICE_KEY=xxx PROD_SERVICE_KEY=yyy node migrate-to-prod.js\n'
  );
  process.exit(1);
}

// Fetches all rows from a table using offset pagination (handles > 1000 rows)
async function fetchAll(baseUrl, key, table) {
  const rows = [];
  const BATCH = 1000;
  let offset = 0;

  while (true) {
    const res = await fetch(
      `${baseUrl}/rest/v1/${table}?select=*&limit=${BATCH}&offset=${offset}`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    );
    if (!res.ok) {
      throw new Error(`[${table}] export failed ${res.status}: ${await res.text()}`);
    }
    const batch = await res.json();
    rows.push(...batch);
    if (batch.length < BATCH) break;
    offset += BATCH;
  }
  return rows;
}

// Upserts rows into a table in chunks of 100 (stays well under PostgREST payload limits)
async function upsert(baseUrl, key, table, rows) {
  const CHUNK = 100;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const res = await fetch(`${baseUrl}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        // merge-duplicates = upsert on primary key conflict
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(chunk),
    });
    if (!res.ok) {
      throw new Error(
        `[${table}] upsert rows ${i}–${i + chunk.length} failed ${res.status}: ${await res.text()}`
      );
    }
    const done = Math.min(i + CHUNK, rows.length);
    process.stdout.write(`  ${table}: ${done} / ${rows.length} rows\r`);
  }
  console.log(`  ${table}: ✓ ${rows.length} rows`);
}

async function migrate() {
  console.log('CATalyst dev → prod migration');
  console.log('DEV: ', DEV_URL);
  console.log('PROD:', PROD_URL);
  console.log('');

  // ── Step 1: sets (must come before questions — questions.set_id FK references sets.id)
  console.log('Exporting sets from dev...');
  const sets = await fetchAll(DEV_URL, DEV_KEY, 'sets');
  console.log(`  Found ${sets.length} sets`);

  if (sets.length > 0) {
    console.log('Upserting sets into prod...');
    await upsert(PROD_URL, PROD_KEY, 'sets', sets);
  }

  // ── Step 2: questions
  console.log('');
  console.log('Exporting questions from dev...');
  const questions = await fetchAll(DEV_URL, DEV_KEY, 'questions');
  console.log(`  Found ${questions.length} questions`);

  if (questions.length > 0) {
    console.log('Upserting questions into prod...');
    // Prod schema has no option_e column — strip it before upserting
    const cleaned = questions.map(({ option_e, ...q }) => q);
    await upsert(PROD_URL, PROD_KEY, 'questions', cleaned);
  }

  console.log('');
  console.log(`✓ Done. ${sets.length} sets + ${questions.length} questions copied to prod.`);
}

migrate().catch(err => {
  console.error('\n✗ Migration failed:', err.message);
  process.exit(1);
});
