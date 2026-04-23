import { pool } from '../../config/db';

export interface ArtisanSummary {
  id: string;
  full_name: string | null;
  profile_photo: string | null;
  avg_rating: string | null;
  total_jobs: number;
  verification_status: 'pending' | 'approved' | 'rejected';
  /** Distance in metres (only set when lat/lng supplied) */
  distance_m?: number | null;
}

export interface BrowseParams {
  categoryId?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  q?: string;
  minRating?: number;
  limit?: number;
}

/**
 * Browse / nearby artisans. When lat + lng are supplied, uses the PostGIS
 * query from docs/SCHEMA.md (spec §7.12) to filter by radius and order by
 * distance. Without coordinates, returns the most-reviewed approved artisans.
 */
export async function browse(p: BrowseParams): Promise<ArtisanSummary[]> {
  const conditions: string[] = [
    "u.role = 'artisan'",
    'u.is_active = true',
    "ap.verification_status = 'approved'",
  ];
  const values: unknown[] = [];
  const push = (v: unknown): string => {
    values.push(v);
    return `$${values.length}`;
  };

  if (p.categoryId) {
    conditions.push(
      `EXISTS (SELECT 1 FROM artisan_categories ac
               WHERE ac.artisan_id = u.id AND ac.category_id = ${push(p.categoryId)})`,
    );
  }
  if (p.q) {
    conditions.push(`u.full_name ILIKE ${push(`%${p.q}%`)}`);
  }
  if (typeof p.minRating === 'number') {
    conditions.push(`ap.avg_rating >= ${push(p.minRating)}`);
  }

  const hasGeo = typeof p.lat === 'number' && typeof p.lng === 'number';
  let distanceSelect = 'NULL::double precision AS distance_m';
  let geoJoin = 'LEFT JOIN locations l ON l.user_id = u.id AND l.is_primary = true';
  let orderBy = 'ap.total_jobs DESC, ap.avg_rating DESC NULLS LAST';

  if (hasGeo) {
    const lngIdx = push(p.lng);
    const latIdx = push(p.lat);
    const radiusMeters = push(Math.round(((p.radiusKm ?? 10) as number) * 1000));
    distanceSelect = `ST_Distance(l.geog, ST_MakePoint(${lngIdx}, ${latIdx})::geography) AS distance_m`;
    geoJoin = 'JOIN locations l ON l.user_id = u.id';
    conditions.push(
      `ST_DWithin(l.geog, ST_MakePoint(${lngIdx}, ${latIdx})::geography, ${radiusMeters})`,
    );
    orderBy = 'distance_m ASC';
  }

  const limit = push(p.limit ?? 20);
  const sql = `
    SELECT u.id, u.full_name, u.profile_photo,
           ap.avg_rating, ap.total_jobs, ap.verification_status,
           ${distanceSelect}
      FROM users u
      JOIN artisan_profiles ap ON ap.user_id = u.id
      ${geoJoin}
     WHERE ${conditions.join(' AND ')}
     ORDER BY ${orderBy}
     LIMIT ${limit}
  `;

  const { rows } = await pool.query<ArtisanSummary>(sql, values);
  return rows;
}

export interface ArtisanDetail {
  user: {
    id: string;
    full_name: string | null;
    profile_photo: string | null;
    phone: string;
  };
  profile: {
    bio: string | null;
    years_experience: number | null;
    verification_status: 'pending' | 'approved' | 'rejected';
    avg_rating: string | null;
    total_jobs: number;
  } | null;
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    price_min: string | null;
    price_max: string | null;
  }>;
  portfolio: Array<{ id: string; image_url: string; caption: string | null }>;
  review_summary: { count: number; avg: string | null };
}

export async function findDetail(id: string): Promise<ArtisanDetail | null> {
  const user = await pool.query<{
    id: string;
    full_name: string | null;
    profile_photo: string | null;
    phone: string;
    role: string;
  }>(
    `SELECT id, full_name, profile_photo, phone, role FROM users WHERE id = $1`,
    [id],
  );
  const u = user.rows[0];
  if (!u || u.role !== 'artisan') return null;

  const profile = await pool.query<NonNullable<ArtisanDetail['profile']>>(
    `SELECT bio, years_experience, verification_status, avg_rating, total_jobs
       FROM artisan_profiles WHERE user_id = $1`,
    [id],
  );

  const categories = await pool.query<ArtisanDetail['categories'][number]>(
    `SELECT c.id, c.name, c.slug, ac.price_min, ac.price_max
       FROM artisan_categories ac
       JOIN categories c ON c.id = ac.category_id
      WHERE ac.artisan_id = $1
      ORDER BY c.name`,
    [id],
  );

  const portfolio = await pool.query<ArtisanDetail['portfolio'][number]>(
    `SELECT id, image_url, caption FROM portfolio_items
      WHERE artisan_id = $1 ORDER BY created_at DESC LIMIT 20`,
    [id],
  );

  const summary = await pool.query<{ count: string; avg: string | null }>(
    `SELECT COUNT(*)::int AS count, AVG(rating)::numeric(2,1) AS avg
       FROM reviews WHERE artisan_id = $1`,
    [id],
  );
  const s = summary.rows[0] ?? { count: '0', avg: null };

  return {
    user: {
      id: u.id,
      full_name: u.full_name,
      profile_photo: u.profile_photo,
      phone: u.phone,
    },
    profile: profile.rows[0] ?? null,
    categories: categories.rows,
    portfolio: portfolio.rows,
    review_summary: { count: Number(s.count), avg: s.avg },
  };
}

export async function updateArtisanProfile(
  userId: string,
  input: { bio?: string; years_experience?: number },
): Promise<void> {
  await pool.query(
    `UPDATE artisan_profiles SET
        bio              = COALESCE($2, bio),
        years_experience = COALESCE($3, years_experience),
        updated_at       = now()
      WHERE user_id = $1`,
    [userId, input.bio ?? null, input.years_experience ?? null],
  );
}

export async function upsertArtisanCategory(
  userId: string,
  categoryId: string,
  priceMin: number | null,
  priceMax: number | null,
): Promise<void> {
  await pool.query(
    `INSERT INTO artisan_categories (artisan_id, category_id, price_min, price_max)
          VALUES ($1, $2, $3, $4)
     ON CONFLICT (artisan_id, category_id)
     DO UPDATE SET price_min = EXCLUDED.price_min, price_max = EXCLUDED.price_max`,
    [userId, categoryId, priceMin, priceMax],
  );
}

export async function addPortfolioItem(
  userId: string,
  imageUrl: string,
  caption: string | null,
): Promise<{ id: string; image_url: string; caption: string | null }> {
  const { rows } = await pool.query<{ id: string; image_url: string; caption: string | null }>(
    `INSERT INTO portfolio_items (artisan_id, image_url, caption)
          VALUES ($1, $2, $3)
     RETURNING id, image_url, caption`,
    [userId, imageUrl, caption],
  );
  if (!rows[0]) throw new Error('Failed to insert portfolio item');
  return rows[0];
}
