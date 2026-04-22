import request from 'supertest';
import { buildApp } from '../src/app';
import { pool } from '../src/config/db';
import { _testGetLastOtp } from '../src/config/termii';
import { resetDb } from './helpers';

const app = buildApp();

beforeAll(async () => {
  await resetDb();
});

afterAll(async () => {
  await pool.end();
});

describe('POST /auth/request-otp', () => {
  it('creates an OTP and returns ok', async () => {
    const res = await request(app)
      .post('/auth/request-otp')
      .send({ phone: '+2348000000011' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });

    const { rows } = await pool.query('SELECT phone FROM otp_codes WHERE phone = $1', [
      '+2348000000011',
    ]);
    expect(rows).toHaveLength(1);
  });

  it('rejects an invalid phone', async () => {
    const res = await request(app).post('/auth/request-otp').send({ phone: 'nope' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('validation_error');
  });
});

describe('POST /auth/verify-otp', () => {
  const phone = '+2348000000012';

  beforeAll(async () => {
    await request(app).post('/auth/request-otp').send({ phone });
  });

  it('returns a token pair for the correct OTP and creates the user', async () => {
    const otp = _testGetLastOtp(phone);
    expect(otp).toBeDefined();

    const res = await request(app)
      .post('/auth/verify-otp')
      .send({ phone, otp, role: 'client' });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.refreshToken).toEqual(expect.any(String));
    expect(res.body.user.phone).toBe(phone);
    expect(res.body.user.role).toBe('client');

    // /me works with the access token.
    const me = await request(app)
      .get('/me')
      .set('authorization', `Bearer ${res.body.accessToken}`);
    expect(me.status).toBe(200);
    expect(me.body.phone).toBe(phone);
  });

  it('rejects an incorrect OTP', async () => {
    const otherPhone = '+2348000000013';
    await request(app).post('/auth/request-otp').send({ phone: otherPhone });
    const res = await request(app)
      .post('/auth/verify-otp')
      .send({ phone: otherPhone, otp: '000000', role: 'client' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('otp_invalid');
  });

  it('creates an artisan profile when role=artisan', async () => {
    const artisanPhone = '+2348000000014';
    await request(app).post('/auth/request-otp').send({ phone: artisanPhone });
    const otp = _testGetLastOtp(artisanPhone);
    const res = await request(app)
      .post('/auth/verify-otp')
      .send({ phone: artisanPhone, otp, role: 'artisan' });
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('artisan');

    const { rows } = await pool.query(
      `SELECT ap.user_id FROM artisan_profiles ap
        JOIN users u ON u.id = ap.user_id
       WHERE u.phone = $1`,
      [artisanPhone],
    );
    expect(rows).toHaveLength(1);
  });
});
