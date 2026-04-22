# Build Order, Launch Strategy & Next Steps

## Build order

Order matters. This sequence front-loads the work that creates the most
value for the least risk.

### Phase 1 — Foundation (weeks 1–3)

- Set up backend repo with Express, Postgres, Docker, basic auth.
- Build auth module (phone OTP via Termii, JWT, refresh tokens).
- Build `users` and `artisan_profiles` endpoints.
- Build `categories` endpoint (seed with 15–20 common trades).
- Set up Postgres with PostGIS; write the "nearby artisans" query.
- Test all API endpoints with Postman.

> This is the phase currently being scaffolded in `artisan-backend/`.

### Phase 2 — Client mobile flow (weeks 4–7)

- Set up Expo project, `expo-router`, secure storage, API client.
- Build signup / login screens.
- Build home / browse screen with category grid and map.
- Build artisan profile screen.
- Build booking request flow.
- Integrate Paystack checkout and webhook handling.
- Build chat screen (Socket.io or Firebase).
- Build review submission.

### Phase 3 — Artisan mobile flow (weeks 8–10)

- Artisan signup with KYC upload.
- Profile editor: portfolio photos, categories, pricing.
- Job inbox with accept / decline.
- Earnings screen and withdrawal request.
- Push notifications wired up.

### Phase 4 — Admin and website (weeks 11–13)

- Marketing landing page.
- Admin login with role guard.
- Artisan verification queue.
- Bookings and disputes dashboards.
- Payout approval flow.

### Phase 5 — Polish and launch (weeks 14–16)

- End-to-end testing with real users.
- Fix priority bugs.
- Play Store listing and submission.
- Launch in one Lagos area first (e.g. Lekki or Ikeja), not all of Lagos at
  once.
- Onboard the first 20–30 artisans manually.

## Launch strategy

### Start narrow

Do not launch across all of Lagos on day one. Pick one area (Lekki, Ikeja,
or Yaba) and saturate it with verified artisans before expanding.
**Liquidity** — enough supply for every demand request — is what makes a
marketplace feel alive. A half-empty marketplace dies fast.

### Manual artisan onboarding

Recruit the first 20–50 artisans personally. Interview them, verify their
work, and help them set up their profiles. This sets the quality bar for
everyone who joins later.

### Two-sided marketing

Chicken-and-egg is the core marketplace problem. In the first two months,
spend more time and money on the **supply side** (artisans) than the
**demand side**. Without enough artisans, new clients leave empty-handed
and never come back.

### Feedback loop

Talk to every one of your first 100 users (clients and artisans). WhatsApp
them. Call them. Find out what is broken and fix it within the week.
Nothing beats direct user feedback for shaping v2.

## Next steps

1. Choose a project name and register the domain (`.com.ng` or `.com`).
2. Register the business with CAC (Nigeria) if not already done.
3. Create accounts: GitHub, Vercel, Render (or Railway), Paystack, Termii,
   Expo, Google Cloud (for Maps), Firebase.
4. Set up backend repo and deploy a "hello world" API.
5. Set up web repo and deploy a placeholder landing page.
6. Set up mobile repo and get "hello world" running on a physical Android
   phone via Expo Go.
7. Build auth module end-to-end (the rest of the app depends on this).
8. Start Phase 2 of the build order.
