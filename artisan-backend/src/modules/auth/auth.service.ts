import { createHash } from 'node:crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { pool } from '../../config/db';
import { env } from '../../config/env';
import { smsProvider } from '../../config/termii';
import { badRequest, unauthorized } from '../../utils/http';
import { compareOtp, generateOtp, hashOtp } from '../../utils/otp';

export type Role = 'client' | 'artisan' | 'admin';

export interface AuthUser {
  id: string;
  phone: string;
  email: string | null;
  full_name: string | null;
  role: Role;
  profile_photo: string | null;
  is_verified: boolean;
  is_active: boolean;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// ---------------------------------------------------------------------------
// OTP lifecycle
// ---------------------------------------------------------------------------

export async function requestOtp(phone: string): Promise<void> {
  // TODO(spec §16): rate-limit per phone + per IP. Deferred: needs a rate-limit
  // middleware store (Redis in prod, in-memory for dev). Tracked in roadmap.
  const code = generateOtp();
  const codeHash = await hashOtp(code);
  const expiresAt = new Date(Date.now() + env.OTP_TTL_SECONDS * 1000);

  await pool.query(
    `UPDATE otp_codes
       SET consumed_at = now()
     WHERE phone = $1 AND consumed_at IS NULL`,
    [phone],
  );
  await pool.query(
    `INSERT INTO otp_codes (phone, code_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [phone, codeHash, expiresAt],
  );

  await smsProvider.sendOtp(phone, code);
}

export async function verifyOtp(
  phone: string,
  code: string,
  role: Extract<Role, 'client' | 'artisan'> = 'client',
): Promise<{ user: AuthUser; tokens: TokenPair }> {
  const { rows } = await pool.query<{
    id: string;
    code_hash: string;
    attempts: number;
    expires_at: Date;
  }>(
    `SELECT id, code_hash, attempts, expires_at
       FROM otp_codes
      WHERE phone = $1 AND consumed_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1`,
    [phone],
  );
  const otp = rows[0];
  if (!otp) throw badRequest('No active OTP for this phone', 'otp_not_found');
  if (otp.expires_at.getTime() < Date.now()) {
    throw badRequest('OTP has expired, request a new one', 'otp_expired');
  }
  if (otp.attempts >= env.OTP_MAX_ATTEMPTS) {
    throw badRequest('Too many attempts, request a new OTP', 'otp_attempts_exceeded');
  }

  const ok = await compareOtp(code, otp.code_hash);
  if (!ok) {
    await pool.query('UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1', [otp.id]);
    throw badRequest('Invalid OTP', 'otp_invalid');
  }

  await pool.query('UPDATE otp_codes SET consumed_at = now() WHERE id = $1', [otp.id]);

  const user = await upsertUser(phone, role);
  const tokens = await issueTokens(user.id, user.role);
  return { user, tokens };
}

async function upsertUser(phone: string, role: Extract<Role, 'client' | 'artisan'>): Promise<AuthUser> {
  const existing = await pool.query<AuthUser>(
    `SELECT id, phone, email, full_name, role, profile_photo, is_verified, is_active
       FROM users WHERE phone = $1`,
    [phone],
  );
  if (existing.rows[0]) return existing.rows[0];

  const inserted = await pool.query<AuthUser>(
    `INSERT INTO users (phone, role, is_verified)
     VALUES ($1, $2, true)
     RETURNING id, phone, email, full_name, role, profile_photo, is_verified, is_active`,
    [phone, role],
  );
  const user = inserted.rows[0];
  if (!user) throw new Error('Failed to create user');

  if (role === 'artisan') {
    await pool.query(
      `INSERT INTO artisan_profiles (user_id) VALUES ($1)
       ON CONFLICT (user_id) DO NOTHING`,
      [user.id],
    );
  }
  return user;
}

// ---------------------------------------------------------------------------
// JWT pair + refresh rotation
// ---------------------------------------------------------------------------

function signAccess(userId: string, role: Role): string {
  const opts: SignOptions = { expiresIn: env.JWT_ACCESS_TTL as SignOptions['expiresIn'] };
  return jwt.sign({ sub: userId, role }, env.JWT_ACCESS_SECRET, opts);
}

function signRefresh(userId: string, role: Role): string {
  const opts: SignOptions = { expiresIn: env.JWT_REFRESH_TTL as SignOptions['expiresIn'] };
  return jwt.sign({ sub: userId, role, typ: 'refresh' }, env.JWT_REFRESH_SECRET, opts);
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function issueTokens(userId: string, role: Role): Promise<TokenPair> {
  const accessToken = signAccess(userId, role);
  const refreshToken = signRefresh(userId, role);
  const decoded = jwt.decode(refreshToken) as { exp?: number } | null;
  const expiresAt = new Date((decoded?.exp ?? Math.floor(Date.now() / 1000) + 60) * 1000);
  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, hashToken(refreshToken), expiresAt],
  );
  return { accessToken, refreshToken };
}

export async function rotateRefreshToken(refreshToken: string): Promise<TokenPair> {
  let payload: { sub: string; role: Role; typ?: string };
  try {
    payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as typeof payload;
  } catch {
    throw unauthorized('Invalid refresh token', 'refresh_invalid');
  }
  if (payload.typ !== 'refresh') throw unauthorized('Wrong token type', 'refresh_wrong_type');

  const tokenHash = hashToken(refreshToken);
  const { rows } = await pool.query<{ id: string; revoked_at: Date | null }>(
    'SELECT id, revoked_at FROM refresh_tokens WHERE token_hash = $1',
    [tokenHash],
  );
  const record = rows[0];
  if (!record) throw unauthorized('Unknown refresh token', 'refresh_unknown');
  if (record.revoked_at) throw unauthorized('Refresh token revoked', 'refresh_revoked');

  await pool.query('UPDATE refresh_tokens SET revoked_at = now() WHERE id = $1', [record.id]);
  return issueTokens(payload.sub, payload.role);
}

export async function revokeAllRefreshTokens(userId: string): Promise<void> {
  await pool.query(
    `UPDATE refresh_tokens SET revoked_at = now()
      WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId],
  );
}
