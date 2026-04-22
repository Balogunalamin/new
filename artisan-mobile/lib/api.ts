import Constants from 'expo-constants';
import { clearTokens, loadTokens, saveTokens } from './tokens';
import type {
  ArtisanDetail,
  ArtisanSummary,
  AuthResult,
  Category,
  Role,
  TokenPair,
  User,
} from './types';

const fromExpoExtra = (Constants.expoConfig?.extra ?? {}) as { apiBaseUrl?: string };
const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? fromExpoExtra.apiBaseUrl ?? 'http://localhost:3000';

class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | undefined | null>;
  auth?: boolean;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = new URL(path.startsWith('/') ? path : `/${path}`, BASE_URL);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

async function rawRequest<T>(
  path: string,
  opts: RequestOptions & { accessToken?: string } = {},
): Promise<T> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (opts.accessToken) headers.authorization = `Bearer ${opts.accessToken}`;
  const res = await fetch(buildUrl(path, opts.query), {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  const payload = text ? (JSON.parse(text) as unknown) : null;
  if (!res.ok) {
    const err = (payload as { error?: { code?: string; message?: string } } | null)?.error;
    throw new ApiError(res.status, err?.code ?? 'error', err?.message ?? res.statusText);
  }
  return payload as T;
}

/**
 * Authenticated request with automatic token refresh on 401.
 * On refresh failure, clears tokens and rethrows so the UI can redirect to login.
 */
async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const needsAuth = opts.auth !== false;
  if (!needsAuth) return rawRequest<T>(path, opts);

  const tokens = await loadTokens();
  if (!tokens) throw new ApiError(401, 'no_tokens', 'Not signed in');

  try {
    return await rawRequest<T>(path, { ...opts, accessToken: tokens.accessToken });
  } catch (err) {
    if (!(err instanceof ApiError) || err.status !== 401) throw err;
    // Access token expired — rotate using the refresh token.
    let fresh: TokenPair;
    try {
      fresh = await rawRequest<TokenPair>('/auth/refresh', {
        method: 'POST',
        body: { refreshToken: tokens.refreshToken },
      });
    } catch (refreshErr) {
      await clearTokens();
      throw refreshErr;
    }
    await saveTokens(fresh);
    return rawRequest<T>(path, { ...opts, accessToken: fresh.accessToken });
  }
}

// ---------------------------------------------------------------------------
// Typed endpoints (mirror artisan-backend routes)
// ---------------------------------------------------------------------------

export const api = {
  async requestOtp(phone: string): Promise<{ ok: true }> {
    return rawRequest('/auth/request-otp', { method: 'POST', body: { phone } });
  },

  async verifyOtp(phone: string, otp: string, role: Extract<Role, 'client' | 'artisan'>): Promise<AuthResult> {
    const result = await rawRequest<AuthResult>('/auth/verify-otp', {
      method: 'POST',
      body: { phone, otp, role },
    });
    await saveTokens({ accessToken: result.accessToken, refreshToken: result.refreshToken });
    return result;
  },

  async logout(): Promise<void> {
    try {
      await request('/auth/logout', { method: 'POST' });
    } finally {
      await clearTokens();
    }
  },

  async me(): Promise<User> {
    return request<User>('/me');
  },

  async categories(): Promise<Category[]> {
    return request<Category[]>('/categories', { auth: false });
  },

  async browseArtisans(params: {
    categoryId?: string;
    lat?: number;
    lng?: number;
    radiusKm?: number;
    q?: string;
    minRating?: number;
    limit?: number;
  }): Promise<ArtisanSummary[]> {
    return request<ArtisanSummary[]>('/artisans', { auth: false, query: params });
  },

  async artisanDetail(id: string): Promise<ArtisanDetail> {
    return request<ArtisanDetail>(`/artisans/${id}`, { auth: false });
  },
};

export { ApiError, BASE_URL };
