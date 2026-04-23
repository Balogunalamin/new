# Features & Scope

## Target users

| User type | Description | Primary goal |
|-----------|-------------|--------------|
| **Client** | Anyone needing a service at home or business | Find a trusted artisan fast |
| **Artisan** | Skilled tradesperson offering services | Get steady, paying jobs |
| **Admin** | Platform operator (internal team) | Keep the marketplace safe and running |

The market at launch is Lagos, Nigeria. Over 80% of smartphone users in
Nigeria are on Android, which directly shapes the mobile strategy (Android
first, iOS second).

## Feature list

### Client features

- Phone + OTP signup and login (email optional).
- Browse artisans by category (plumber, electrician, tailor, carpenter, AC
  technician, painter, mechanic, etc.).
- Search and filter by location, price range, rating, availability.
- Map view showing nearby artisans with distance.
- Artisan profile page with portfolio photos, skills, experience, reviews,
  verification badge.
- In-app chat before booking.
- Request a quote or book a visit.
- Secure payment with escrow (money released only after job confirmation).
- Rate and review completed jobs.
- Booking history and receipts.
- Report an artisan or dispute a job.

### Artisan features

- Separate signup flow with KYC (government ID upload, optional skill
  certificate).
- Profile with portfolio pictures, services offered, pricing ranges, coverage
  area.
- Availability calendar (v2).
- Job requests inbox with accept, decline, or counter-offer.
- In-app chat with clients.
- Earnings dashboard and withdrawal to bank account.
- Push notifications for new requests and messages.
- Rating and performance summary.

### Admin features

- Secure admin login (password + optional 2FA, separate from public signup).
- Dashboard with KPIs: users, active artisans, bookings, revenue, disputes.
- Artisan verification queue: view ID, approve or reject.
- Bookings table with search, filter, and drill-down.
- Dispute management: review chat, refund, release funds, or split.
- Payout approvals for artisan withdrawals.
- User management: search, suspend, ban.
- Category management: add, edit, remove service categories.
- Notifications and broadcast messaging.

## MVP (v1) vs later (v2+)

Building everything at once is the most common reason marketplace projects
fail. The MVP deliberately excludes features that sound important but are
not required to validate the product with real users.

### Ship in v1 (target: 3–4 months)

- Phone + OTP signup for clients and artisans.
- Artisan profile with photos, category, location, bio, price range.
- Browse and search by category and location.
- Simple map view for nearby artisans.
- In-app chat between client and artisan.
- Booking flow: request → accept/decline → complete.
- Paystack payment with **manual escrow** (platform holds funds, releases
  after client confirmation).
- Rating and review after job.
- Admin panel to verify artisans and resolve disputes.
- Push notifications for new messages and booking updates.

### Push to v2 or later

- Availability calendars.
- Advanced filters and sorting.
- Artisan subscription tiers and boosted listings.
- Referral program.
- Automated escrow with milestone payments.
- Emergency or same-hour booking with premium pricing.
- Multi-language support (English, Pidgin, Yoruba, Hausa, Igbo).
- Artisan earnings analytics and insights.
- Video calls inside the app.
- Group jobs (multiple artisans for one project).
