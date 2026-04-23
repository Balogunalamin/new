# artisan-mobile

Phase 2 (Client mobile flow) — React Native + Expo client for the Artisan
Hiring Platform. Talks to the Phase 1 API in
[`../artisan-backend`](../artisan-backend).

## What's included

- **Auth flow** — phone + OTP login backed by `expo-secure-store` (iOS
  Keychain / Android Keystore) for JWT pair storage.
- **Browse tab** — category chips, nearby-artisan list using
  `expo-location` + the backend's PostGIS `ST_DWithin` query. Falls back to
  top-artisan ordering when location is denied.
- **Artisan detail** — profile, bio, services with pricing, portfolio
  count.
- **Profile tab** — `/me` data + sign out.
- **API client** — `lib/api.ts` with automatic access-token refresh on 401
  and typed endpoints mirroring the backend.

Booking, chat, payments, and reviews are intentionally deferred —
they require v1 endpoints that aren't in the Phase 1 backend yet
(roadmap §13.2 onward).

## Quick start

Prerequisite: the backend from `../artisan-backend` must be running and
reachable.

```bash
cd artisan-mobile
npm install
npx expo start                  # opens the Metro dev server
```

Scan the QR code with the [Expo Go](https://expo.dev/client) app on a
physical Android device (easiest in Nigeria since emulator + local
backend can be fiddly). Android and iOS simulators also work.

### API URL configuration

`lib/api.ts` reads the base URL in this order:

1. `EXPO_PUBLIC_API_BASE_URL` env var (set via `eas.json` for each
   build profile).
2. `extra.apiBaseUrl` in `app.json`.
3. Default: `http://localhost:3000`.

When testing from a physical device with the backend on your laptop,
`localhost` points at the **phone**, not the laptop. Set
`EXPO_PUBLIC_API_BASE_URL=http://<your-laptop-lan-ip>:3000` before `expo
start`, or use `expo start --tunnel`.

## Build profiles

`eas.json` ships three:

| Profile | API URL | Use |
|---------|---------|-----|
| `development` | `http://localhost:3000` | local dev builds with dev client |
| `preview` | `https://staging.api.artisanhq.com` | internal testers |
| `production` | `https://api.artisanhq.com` | App Store / Play Store |

Build iOS without a Mac:

```bash
npx eas build --platform ios --profile preview
```

## Scripts

| Command | What it does |
|---------|--------------|
| `npm start` | `expo start` — Metro bundler |
| `npm run android` / `ios` / `web` | platform-targeted `expo start` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | `expo lint` |

## Layout

```
app/
  _layout.tsx           root Stack + AuthProvider + redirect effect
  index.tsx             entry redirect based on auth status
  (auth)/
    _layout.tsx
    login.tsx           phone + role picker
    verify.tsx          6-digit OTP
  (tabs)/
    _layout.tsx         bottom tabs
    index.tsx           browse / nearby artisans
    profile.tsx         /me + sign out
  artisan/[id].tsx      artisan detail
lib/
  api.ts                typed fetch wrapper + auto refresh
  auth.ts               AuthContext + useAuth hook
  tokens.ts             expo-secure-store read/write
  types.ts              shared types mirroring backend responses
```
