/**
 * Shared test helpers. Tests require a running Postgres with PostGIS — the
 * docker-compose service in this repo works. They use TERMII_MODE=mock so no
 * SMS is ever sent; the OTP can instead be read from the otp_codes table via
 * a helper that also captures it from logs during tests.
 *
 * The mock Termii provider in src/config/termii.ts logs the OTP; to avoid
 * coupling tests to log parsing, these helpers hash-crack the OTP instead:
 * we know the generator produces a 6-digit numeric string, and we have the
 * bcrypt hash — but brute-forcing 1,000,000 candidates through bcrypt per
 * test is slow. Instead, we intercept the SMS provider by monkey-patching
 * before importing the app.
 */
import { pool } from '../src/config/db';

export async function getLatestOtpHash(phone: string): Promise<string | null> {
  const { rows } = await pool.query<{ code_hash: string }>(
    `SELECT code_hash FROM otp_codes
      WHERE phone = $1 AND consumed_at IS NULL
      ORDER BY created_at DESC LIMIT 1`,
    [phone],
  );
  return rows[0]?.code_hash ?? null;
}

export async function resetDb(): Promise<void> {
  // Order matters: child tables first to respect FKs.
  await pool.query(`
    TRUNCATE TABLE
      notifications, reviews, payments, messages, bookings,
      portfolio_items, artisan_categories, locations,
      refresh_tokens, otp_codes, artisan_profiles, users
    RESTART IDENTITY CASCADE;
  `);
}
