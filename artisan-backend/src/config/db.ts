import { Pool } from 'pg';
import { env } from './env';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
});

pool.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('Unexpected Postgres pool error', err);
});

export async function pingDb(): Promise<boolean> {
  const { rows } = await pool.query<{ ok: number }>('SELECT 1 AS ok');
  return rows[0]?.ok === 1;
}
