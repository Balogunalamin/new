# Database Schema

PostgreSQL is the backing store, with the PostGIS extension enabled for
geographic queries (needed for "nearby artisans"). Below are the core tables
with key fields.

The Phase 1 migration at
[`artisan-backend/migrations/1700000000000_init.sql`](../artisan-backend/migrations/1700000000000_init.sql)
creates all tables listed here up-front so later phases only add routes, not
DDL.

## `users`

Shared table for clients, artisans, and admins. The `role` column
distinguishes them.

```sql
id               UUID PRIMARY KEY
phone            VARCHAR UNIQUE NOT NULL
email            VARCHAR UNIQUE
full_name        VARCHAR
role             ENUM('client','artisan','admin')
profile_photo    VARCHAR                          -- URL
is_verified      BOOLEAN DEFAULT false
is_active        BOOLEAN DEFAULT true
created_at       TIMESTAMP
updated_at       TIMESTAMP
```

## `artisan_profiles`

Extra fields that only artisans have.

```sql
id                    UUID PK
user_id               UUID FK -> users(id) UNIQUE
bio                   TEXT
years_experience      INT
id_document_url       VARCHAR
verification_status   ENUM('pending','approved','rejected')
rejection_reason      TEXT
avg_rating            DECIMAL(2,1)
total_jobs            INT DEFAULT 0
total_earnings        DECIMAL(12,2) DEFAULT 0
```

## `categories`

```sql
id           UUID PK
name         VARCHAR UNIQUE        -- e.g. 'Plumber', 'Electrician'
slug         VARCHAR UNIQUE
icon_url     VARCHAR
description  TEXT
is_active    BOOLEAN DEFAULT true
```

## `artisan_categories` (many-to-many)

```sql
id            UUID PK
artisan_id    UUID FK -> users(id)
category_id   UUID FK -> categories(id)
price_min     DECIMAL
price_max     DECIMAL
UNIQUE(artisan_id, category_id)
```

## `locations`

PostGIS `geography` column enables fast radius queries.

```sql
id          UUID PK
user_id     UUID FK -> users(id)
address     VARCHAR
city        VARCHAR
state       VARCHAR
lat         DECIMAL(9,6)
lng         DECIMAL(9,6)
geog        GEOGRAPHY(Point, 4326)   -- PostGIS
is_primary  BOOLEAN DEFAULT true
```

## `portfolio_items`

```sql
id           UUID PK
artisan_id   UUID FK -> users(id)
image_url    VARCHAR
caption      TEXT
created_at   TIMESTAMP
```

## `bookings` (the core table)

```sql
id                UUID PK
client_id         UUID FK -> users(id)
artisan_id        UUID FK -> users(id)
category_id       UUID FK -> categories(id)
description       TEXT
status            ENUM('pending','accepted','in_progress','completed','cancelled','disputed')
agreed_price      DECIMAL(12,2)
scheduled_date    TIMESTAMP
location_id       UUID FK -> locations(id)
created_at        TIMESTAMP
completed_at      TIMESTAMP
cancelled_reason  TEXT
```

## `messages`

```sql
id            UUID PK
booking_id    UUID FK -> bookings(id)   -- nullable; allow pre-booking chat
sender_id     UUID FK -> users(id)
receiver_id   UUID FK -> users(id)
content       TEXT
sent_at       TIMESTAMP
read_at       TIMESTAMP
```

## `payments`

```sql
id                    UUID PK
booking_id            UUID FK -> bookings(id)
amount                DECIMAL(12,2)
platform_fee          DECIMAL(12,2)
paystack_reference    VARCHAR UNIQUE
status                ENUM('pending','held','released','refunded','failed')
created_at            TIMESTAMP
released_at           TIMESTAMP
```

## `reviews`

```sql
id           UUID PK
booking_id   UUID FK -> bookings(id) UNIQUE   -- one review per booking
client_id    UUID FK -> users(id)
artisan_id   UUID FK -> users(id)
rating       INT CHECK (rating BETWEEN 1 AND 5)
comment      TEXT
created_at   TIMESTAMP
```

## `notifications`

```sql
id         UUID PK
user_id    UUID FK -> users(id)
type       VARCHAR
title      VARCHAR
body       TEXT
data       JSONB
is_read    BOOLEAN DEFAULT false
created_at TIMESTAMP
```

## Example: nearby artisans query

```sql
SELECT u.id, u.full_name, ap.avg_rating,
       ST_Distance(l.geog, ST_MakePoint(:lng, :lat)::geography) AS distance_m
FROM users u
JOIN artisan_profiles ap ON ap.user_id = u.id
JOIN artisan_categories ac ON ac.artisan_id = u.id
JOIN locations l ON l.user_id = u.id
WHERE u.role = 'artisan'
  AND ap.verification_status = 'approved'
  AND ac.category_id = :category_id
  AND ST_DWithin(l.geog, ST_MakePoint(:lng, :lat)::geography, 10000)  -- 10 km
ORDER BY distance_m ASC
LIMIT 20;
```
