# Third-Party Services, Deployment & Costs

## Services & monthly cost estimates

Approximate monthly costs for the launch phase. All figures in USD unless
marked otherwise.

| Service | Purpose | Est. monthly cost |
|---------|---------|------------------|
| Render / Railway | Backend hosting | 7 – 25 |
| Vercel | Website hosting | Free tier usually enough; Pro 20 |
| Managed Postgres (Neon / Supabase) | Database | Free – 25 |
| Termii | SMS / OTP in Nigeria | Pay per SMS (₦2 – ₦4 each) |
| Paystack | Payments | No monthly; fees per transaction |
| Firebase Cloud Messaging | Push notifications | Free |
| Firebase Realtime DB or Socket.io | Real-time chat | Free tier / self-hosted |
| Cloudinary or S3 | Image storage | Free tier – 20 |
| Google Maps API | Maps and geocoding | Free up to 28k map loads / month |
| Sentry | Error tracking | Free tier |
| Domain name | `.com` or `.ng` registration | 1 – 2 / month average |

### One-time costs

- **Apple Developer**: USD 99 per year.
- **Google Play**: USD 25 one-time.
- **Business registration (CAC)** in Nigeria if operating as a registered
  business.

## Deployment & hosting

### Backend

Render, Railway, or DigitalOcean App Platform are all good choices for a
Node API. They auto-deploy from GitHub, handle SSL, and scale up when
needed.

### Website and admin

**Vercel.** Push to the main branch, the site is live in seconds. Built-in
CDN, automatic SSL, preview deploys for every pull request.

### Database

Start with a managed Postgres provider that includes PostGIS: **Neon**,
**Supabase**, or **Render's managed Postgres**. Enable daily backups from
day one.

### Mobile app

**EAS Build** from Expo produces both IPA (iOS) and AAB (Android). For
smaller updates, Expo's over-the-air update system (EAS Update) lets you
push JavaScript changes without going through app-store review.

### Environments

- `development` — local machines.
- `staging` — mirrors production, used for testing.
- `production` — real users.

Every environment has its own database, its own Paystack test/live keys,
and its own API URL baked into the mobile build.
