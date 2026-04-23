# artisan-backend

Phase 1 (Foundation) backend for the Artisan Hiring Platform.

- **Stack:** Node.js 20, TypeScript, Express 4, PostgreSQL 16 + PostGIS 3.4,
  Zod, Pino, JWT, bcrypt.
- **In scope for this phase:** auth (phone OTP → JWT pair), users,
  artisan profiles, categories, health, the "nearby artisans" PostGIS
  query.
- **Not in this phase:** bookings, payments, chat, reviews, admin. The
  migration creates all of those tables up-front so future work only needs
  to add routes.

## Quick start

```bash
cp .env.example .env
docker compose up -d db          # starts postgis
npm install
npm run migrate                  # applies migrations/*.sql
npm run seed                     # inserts the 20 starter categories
npm run dev                      # listens on :3000
```

## Smoke test

```bash
curl localhost:3000/health
curl localhost:3000/categories | head

curl -X POST localhost:3000/auth/request-otp \
  -H 'content-type: application/json' \
  -d '{"phone":"+2348000000001"}'
# in dev, the server log prints the OTP

curl -X POST localhost:3000/auth/verify-otp \
  -H 'content-type: application/json' \
  -d '{"phone":"+2348000000001","otp":"123456","role":"client"}'
# → { accessToken, refreshToken, user }

curl localhost:3000/me -H "authorization: Bearer <accessToken>"

# Nearby artisans in Lekki (needs at least one approved artisan seeded)
curl "localhost:3000/artisans?lat=6.4698&lng=3.5852&radiusKm=10"
```

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | `ts-node-dev` with auto-reload |
| `npm run build` | TypeScript → `dist/` |
| `npm start` | runs compiled `dist/src/index.js` |
| `npm run migrate` | applies `migrations/*.sql` in order |
| `npm run migrate:down` | rolls the most recent migration back (if it contains a `-- DOWN` section) |
| `npm run seed` | inserts starter categories |
| `npm test` | Jest + Supertest end-to-end tests |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint over `src/`, `tests/`, `scripts/` |

## Endpoints (Phase 1)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/health` | — | liveness + db ping |
| POST | `/auth/request-otp` | — | `{ phone }` |
| POST | `/auth/verify-otp` | — | `{ phone, otp, role? }` → `{ accessToken, refreshToken, user }` |
| POST | `/auth/refresh` | refresh JWT | rotates the pair |
| POST | `/auth/logout` | access JWT | revokes refresh tokens for the current user |
| GET | `/me` | access JWT | current user (+ artisan profile when applicable) |
| PATCH | `/me` | access JWT | name, email, profile photo |
| GET | `/categories` | — | active categories |
| GET | `/artisans` | — | query: `categoryId?`, `lat?`, `lng?`, `radiusKm?` (default 10), `q?`, `minRating?` |
| GET | `/artisans/:id` | — | profile + categories + portfolio + reviews summary |
| PATCH | `/artisans/me` | artisan JWT | bio, years of experience, category prices |
| POST | `/artisans/me/portfolio` | artisan JWT | `{ imageUrl, caption? }` |

## SMS provider

`TERMII_MODE=mock` (the default) skips real SMS and logs the generated OTP
via Pino so tests and local dev never hit the network. Switch to
`TERMII_MODE=live` and fill `TERMII_API_KEY` + `TERMII_SENDER_ID` for real
delivery.

## Layout

```
src/
  config/           env, db pool, logger, Termii client
  modules/
    auth/           OTP + JWT
    users/          /me
    artisans/       browse, nearby (PostGIS), profile, portfolio
    categories/     public list
    health/         /health
  middleware/       auth, role, validate, errorHandler
  utils/            asyncHandler, otp, http
migrations/         SQL migrations (applied in filename order)
seeds/              SQL seed scripts
scripts/            Node runners for migrate + seed
tests/              Supertest e2e suites (require DB)
```
