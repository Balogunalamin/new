/* eslint-disable no-console */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { Pool } from 'pg';
import 'dotenv/config';

const SEEDS_DIR = join(__dirname, '..', 'seeds');

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');

  const pool = new Pool({ connectionString: url });
  const files = readdirSync(SEEDS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  try {
    for (const file of files) {
      const sql = readFileSync(join(SEEDS_DIR, file), 'utf8');
      console.log(`seed  ${file}`);
      await pool.query(sql);
    }
    console.log('seeds complete');
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
