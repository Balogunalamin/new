import { pool } from '../../config/db';
import type { AuthUser } from '../auth/auth.service';

export interface UserWithArtisan extends AuthUser {
  artisan?: {
    bio: string | null;
    years_experience: number | null;
    verification_status: 'pending' | 'approved' | 'rejected';
    avg_rating: string | null;
    total_jobs: number;
    total_earnings: string;
  };
}

export async function findById(id: string): Promise<UserWithArtisan | null> {
  const { rows } = await pool.query<AuthUser>(
    `SELECT id, phone, email, full_name, role, profile_photo, is_verified, is_active
       FROM users WHERE id = $1`,
    [id],
  );
  const user = rows[0];
  if (!user) return null;

  if (user.role === 'artisan') {
    const prof = await pool.query(
      `SELECT bio, years_experience, verification_status, avg_rating, total_jobs, total_earnings
         FROM artisan_profiles WHERE user_id = $1`,
      [id],
    );
    if (prof.rows[0]) return { ...user, artisan: prof.rows[0] };
  }
  return user;
}

export interface UpdateMeInput {
  full_name?: string | null;
  email?: string | null;
  profile_photo?: string | null;
}

export async function updateMe(id: string, input: UpdateMeInput): Promise<UserWithArtisan> {
  await pool.query(
    `UPDATE users SET
       full_name     = COALESCE($2, full_name),
       email         = COALESCE($3, email),
       profile_photo = COALESCE($4, profile_photo),
       updated_at    = now()
     WHERE id = $1`,
    [id, input.full_name ?? null, input.email ?? null, input.profile_photo ?? null],
  );
  const user = await findById(id);
  if (!user) throw new Error('User vanished after update');
  return user;
}
