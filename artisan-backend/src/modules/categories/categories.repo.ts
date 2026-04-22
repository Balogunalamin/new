import { pool } from '../../config/db';

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon_url: string | null;
  description: string | null;
  is_active: boolean;
}

export async function listActive(): Promise<Category[]> {
  const { rows } = await pool.query<Category>(
    `SELECT id, name, slug, icon_url, description, is_active
     FROM categories
     WHERE is_active = true
     ORDER BY name ASC`,
  );
  return rows;
}
