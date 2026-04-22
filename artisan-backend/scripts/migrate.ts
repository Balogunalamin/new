/* eslint-disable no-console */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Pool } from 'pg';
import 'dotenv/config';

const MIGRATIONS_DIR = join(__dirname, '..', 'migrations');

async function ensureTable(pool: Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      run_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

async function applied(pool: Pool): Promise<Set<string>> {
  const { rows } = await pool.query<{ name: string }>('SELECT name FROM _migrations');
  return new Set(rows.map((r) => r.name));
}

async function up(pool: Pool): Promise<void> {
  await ensureTable(pool);
  const done = await applied(pool);
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (done.has(file)) {
      console.log(`skip  ${file} (already applied)`);
      continue;
    }
    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8');
    console.log(`apply ${file}`);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO _migrations(name) VALUES ($1)', [file]);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
  console.log('migrations complete');
}

async function down(pool: Pool): Promise<void> {
  // Phase 1 ships a single init migration; down simply drops everything the
  // init created, the bluntest possible rollback. Replace with per-migration
  // DOWN sections once there are many files.
  console.log('rolling back: DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
}

async function main(): Promise<void> {
  const direction = process.argv[2] ?? 'up';
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');

  const pool = new Pool({ connectionString: url });
  try {
    if (direction === 'up') await up(pool);
    else if (direction === 'down') await down(pool);
    else throw new Error(`unknown direction: ${direction}`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
