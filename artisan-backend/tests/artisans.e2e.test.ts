import request from 'supertest';
import { buildApp } from '../src/app';
import { pool } from '../src/config/db';
import { resetDb } from './helpers';

const app = buildApp();

/**
 * Lagos reference points used below:
 *   Lekki Phase 1       6.4474, 3.4548
 *   Victoria Island     6.4281, 3.4219   (~3.6 km from Lekki Phase 1)
 *   Ikeja               6.6018, 3.3515   (~22 km from Lekki Phase 1)
 */

async function seedApprovedArtisan(opts: {
  phone: string;
  name: string;
  lat: number;
  lng: number;
  categorySlug: string;
  totalJobs?: number;
  avgRating?: number;
}): Promise<string> {
  const u = await pool.query<{ id: string }>(
    `INSERT INTO users (phone, full_name, role, is_active, is_verified)
     VALUES ($1, $2, 'artisan', true, true) RETURNING id`,
    [opts.phone, opts.name],
  );
  const userId = u.rows[0]!.id;

  await pool.query(
    `INSERT INTO artisan_profiles (user_id, bio, years_experience, verification_status, avg_rating, total_jobs)
     VALUES ($1, $2, 5, 'approved', $3, $4)`,
    [userId, `I am ${opts.name}`, opts.avgRating ?? 4.5, opts.totalJobs ?? 10],
  );

  await pool.query(
    `INSERT INTO locations (user_id, address, city, state, lat, lng, geog, is_primary)
     VALUES ($1, 'N/A', 'Lagos', 'Lagos', $2::numeric, $3::numeric,
             ST_SetSRID(ST_MakePoint($3::double precision, $2::double precision), 4326)::geography,
             true)`,
    [userId, opts.lat, opts.lng],
  );

  const cat = await pool.query<{ id: string }>(
    `INSERT INTO categories (name, slug, description)
     VALUES ($1, $2, 'test') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [opts.categorySlug, opts.categorySlug],
  );
  await pool.query(
    `INSERT INTO artisan_categories (artisan_id, category_id, price_min, price_max)
     VALUES ($1, $2, 5000, 20000)
     ON CONFLICT (artisan_id, category_id) DO NOTHING`,
    [userId, cat.rows[0]!.id],
  );

  return userId;
}

beforeAll(async () => {
  await resetDb();
  await seedApprovedArtisan({
    phone: '+2348000001001',
    name: 'Ada Plumber',
    lat: 6.4474,
    lng: 3.4548,
    categorySlug: 'test-plumber',
    totalJobs: 50,
    avgRating: 4.9,
  });
  await seedApprovedArtisan({
    phone: '+2348000001002',
    name: 'Bola Plumber',
    lat: 6.4281,
    lng: 3.4219,
    categorySlug: 'test-plumber',
    totalJobs: 20,
    avgRating: 4.5,
  });
  await seedApprovedArtisan({
    phone: '+2348000001003',
    name: 'Chidi Plumber',
    lat: 6.6018,
    lng: 3.3515,
    categorySlug: 'test-plumber',
    totalJobs: 5,
    avgRating: 4.0,
  });
});

afterAll(async () => {
  await pool.end();
});

describe('GET /artisans', () => {
  it('returns all approved artisans when no filter is provided', async () => {
    const res = await request(app).get('/artisans');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(3);
    // Ordered by total_jobs DESC when no geo — Ada (50) should lead.
    expect(res.body[0].full_name).toBe('Ada Plumber');
  });

  it('filters by radius using PostGIS and orders by distance', async () => {
    // Anchor at Lekki; 5 km radius should return only Ada (0 km) and Bola (~3.6 km).
    const res = await request(app)
      .get('/artisans')
      .query({ lat: 6.4474, lng: 3.4548, radiusKm: 5 });
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
    expect(res.body[0].full_name).toBe('Ada Plumber');
    expect(res.body[1].full_name).toBe('Bola Plumber');
    expect(Number(res.body[0].distance_m)).toBeLessThan(Number(res.body[1].distance_m));
  });

  it('excludes artisans outside the radius', async () => {
    const res = await request(app)
      .get('/artisans')
      .query({ lat: 6.4474, lng: 3.4548, radiusKm: 1 });
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].full_name).toBe('Ada Plumber');
  });
});

describe('GET /artisans/:id', () => {
  it('returns 404 for a non-artisan user id', async () => {
    const res = await request(app).get('/artisans/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  });
});

describe('GET /categories', () => {
  it('returns active categories seeded by the test setup', async () => {
    const res = await request(app).get('/categories');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    const slugs = res.body.map((c: { slug: string }) => c.slug);
    expect(slugs).toContain('test-plumber');
  });
});
