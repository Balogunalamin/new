# Project Structure

Three workspaces (kept in one repository for now; could be split into
separate repos later without changing code layout):

```
artisan-backend/    Node.js + Express + PostgreSQL
artisan-web/        Next.js (marketing + web app + admin panel)
artisan-mobile/     React Native + Expo (iOS + Android)
```

## Backend folder layout

```
artisan-backend/
  src/
    config/          env, db, paystack, firebase, termii clients
    modules/
      auth/          OTP, JWT, sessions
      users/
      artisans/
      categories/
      bookings/
      payments/      paystack webhooks, escrow logic
      chat/          socket.io handlers
      reviews/
      admin/         admin-only endpoints
    middleware/      auth guards, role guards, validation
    db/              migrations, seeds
    utils/
  tests/
  .env.example
  package.json
```

## Web folder layout (Next.js App Router)

```
artisan-web/
  app/
    (marketing)/
      page.tsx                   landing page
      about/page.tsx
      download/page.tsx
    (app)/
      browse/page.tsx            public artisan browse
      artisan/[id]/page.tsx
    admin/
      login/page.tsx
      dashboard/page.tsx
      artisans/page.tsx          KYC queue
      bookings/page.tsx
      disputes/page.tsx
      payouts/page.tsx
  components/
    ui/                          shadcn/ui components
    admin/                       Tremor dashboard widgets
  lib/
    api.ts                       typed API client
    auth.ts
  middleware.ts                  protect /admin routes
```

## Mobile folder layout (Expo)

```
artisan-mobile/
  app/                           expo-router file-based routing
    (auth)/
      login.tsx
      verify-otp.tsx
    (tabs)/
      index.tsx                  home / browse
      bookings.tsx
      messages.tsx
      profile.tsx
    artisan/[id].tsx
    booking/[id].tsx
  components/
  lib/
    api.ts                       shared types with web where possible
    auth.ts
    push.ts
  assets/
  app.json                       expo config
  eas.json                       build config
```
