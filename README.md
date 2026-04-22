# Artisan Hiring Platform

A web + mobile marketplace that connects clients with local artisans —
plumbers, electricians, carpenters, tailors, AC technicians, painters,
mechanics, and more.

**Launch market:** Lagos, Nigeria, with scope to expand.

**Status:** Phase 1 (Foundation) backend scaffold in progress. See
[`artisan-backend/README.md`](./artisan-backend/README.md) to run the API
locally. Mobile (`artisan-mobile/`) and web (`artisan-web/`) workspaces are
not scaffolded yet.

## Problem

Finding reliable artisans is typically done through word-of-mouth, which is
slow, unreliable, and does not scale. Clients struggle to verify skill,
pricing, and trust. Artisans struggle to find consistent work outside their
immediate network. A structured marketplace with verification, escrow
payments, and reviews solves both problems.

## Business model

Revenue comes primarily from:

- Platform commission on completed bookings (suggested 10–15%).
- Optional paid artisan subscriptions for higher search ranking (v2+).
- Featured listings and urgent/emergency booking premiums (v2+).

## System shape

Three client surfaces talk to one backend API:

- **Mobile app** — React Native + Expo, single codebase for iOS and Android,
  role-based (client or artisan).
- **Website** — Next.js marketing site and web app.
- **Admin panel** — Next.js under `/admin`, web-only, role-guarded.

Backend: Node.js + Express + PostgreSQL (with PostGIS for geospatial
queries). Paystack for payments, Termii for SMS / OTP, Firebase Cloud
Messaging for push.

## Documentation

| Area | File |
|------|------|
| Users, feature list, MVP vs v2+ | [`docs/FEATURES.md`](./docs/FEATURES.md) |
| High-level architecture + tech stack | [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) |
| Full database schema | [`docs/SCHEMA.md`](./docs/SCHEMA.md) |
| Monorepo / per-app folder layouts | [`docs/PROJECT_STRUCTURE.md`](./docs/PROJECT_STRUCTURE.md) |
| iOS + Android mobile strategy | [`docs/MOBILE.md`](./docs/MOBILE.md) |
| Admin panel strategy | [`docs/ADMIN.md`](./docs/ADMIN.md) |
| Authentication flows | [`docs/AUTH.md`](./docs/AUTH.md) |
| Payments + escrow | [`docs/PAYMENTS.md`](./docs/PAYMENTS.md) |
| Third-party services + deployment + costs | [`docs/SERVICES.md`](./docs/SERVICES.md) |
| Security considerations | [`docs/SECURITY.md`](./docs/SECURITY.md) |
| Build order, launch strategy, next steps | [`docs/ROADMAP.md`](./docs/ROADMAP.md) |
| Glossary | [`docs/GLOSSARY.md`](./docs/GLOSSARY.md) |

## Repository layout

```
.
├── README.md                 you are here
├── docs/                     product + technical docs (see table above)
└── artisan-backend/          Node.js + Express + Postgres API
    └── README.md             run locally, endpoints, migrations
```

Future workspaces (not yet scaffolded):

```
├── artisan-web/              Next.js marketing + app + admin panel
└── artisan-mobile/           React Native + Expo app
```
