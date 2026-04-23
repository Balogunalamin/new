/** Shared API response shapes. Mirrors artisan-backend returned types. */

export type Role = 'client' | 'artisan' | 'admin';

export interface User {
  id: string;
  phone: string;
  email: string | null;
  full_name: string | null;
  role: Role;
  profile_photo: string | null;
  is_verified: boolean;
  is_active: boolean;
  artisan?: {
    bio: string | null;
    years_experience: number | null;
    verification_status: 'pending' | 'approved' | 'rejected';
    avg_rating: string | null;
    total_jobs: number;
    total_earnings: string;
  };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon_url: string | null;
  description: string | null;
  is_active: boolean;
}

export interface ArtisanSummary {
  id: string;
  full_name: string | null;
  profile_photo: string | null;
  avg_rating: string | null;
  total_jobs: number;
  verification_status: 'pending' | 'approved' | 'rejected';
  distance_m?: number | null;
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

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult extends TokenPair {
  user: User;
}
