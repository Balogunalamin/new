# Architecture & Tech Stack

The architecture follows a classic API-first pattern: a single backend API
serves both the website and the mobile app. Business logic lives in one
place and is never duplicated.

## High-level diagram

```text
  [ Mobile App  ]          [ Website ]           [ Admin Panel ]
  React Native             Next.js               (inside Next.js)
        |                     |                         |
        +---------------------+-------------------------+
                              |
                        HTTPS / REST
                              |
                  +-----------v-----------+
                  |   Backend API         |
                  |   Node.js + Express   |
                  +-----------+-----------+
                              |
            +-----------------+------------------+
            |                 |                  |
       [Postgres]        [Paystack]         [Firebase/FCM]
       (PostGIS)         (payments)         (push, chat)
```

## Principles

- One backend serves all clients (mobile, web, admin).
- No business logic in the frontend; frontends are thin.
- Stateless API; scale horizontally when traffic grows.
- Postgres is the single source of truth.
- Third-party services (Paystack, Firebase, Termii) handle commodity
  problems.

## Tech stack

| Layer | Technology | Why |
|-------|------------|-----|
| Mobile app | React Native + Expo | One codebase for iOS and Android; builds iOS without a Mac |
| Website + Admin | Next.js (React, TypeScript) | Fast, SEO-friendly, shares code with the app |
| Backend API | Node.js + Express (or NestJS) | Same language as frontend; huge ecosystem |
| Database | PostgreSQL + PostGIS | Relational data + geographic queries for "nearby" |
| Chat / real-time | Socket.io or Firebase Realtime DB | Low latency messaging, read receipts |
| Payments | Paystack (primary) / Flutterwave (alt) | Nigeria-native, simple escrow-compatible flows |
| Maps | Google Maps API or Mapbox | Accurate geocoding and routing in Lagos |
| Push notifications | Firebase Cloud Messaging | Free, works with Expo out of the box |
| SMS / OTP | Termii or Twilio | Termii is cheaper and faster in Nigeria |
| File storage | AWS S3 or Cloudinary | Portfolio images and KYC documents |
| Hosting (web) | Vercel | Zero-config deploys for Next.js |
| Hosting (API) | Render / Railway / DigitalOcean | Simple managed Node hosting |

## Why React Native over Flutter

Both are excellent. React Native is the right choice here for four specific
reasons:

1. **Shared language across the stack.** Website, mobile app, and backend
   are all JavaScript / TypeScript. Types, validation, API clients, and
   utility code can be reused across web and mobile. Flutter uses Dart,
   which cannot be shared with the Next.js site.
2. **Solo / small-team efficiency.** Staying in one language reduces context
   switching and accelerates debugging.
3. **This app is not animation-heavy.** It is lists, forms, chat, maps, and
   payments — all of which React Native handles cleanly. Flutter's custom
   rendering advantage is most useful in animation- or graphics-heavy apps.
4. **Hiring in Lagos.** JavaScript and React developers are significantly
   more common (and cheaper) than Flutter developers.

Use **Expo** specifically (not bare React Native). Expo handles push
notifications, over-the-air updates, and — critically — builds iOS apps in
the cloud so a Mac is not required.
