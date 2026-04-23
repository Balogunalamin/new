-- =============================================================================
-- Artisan Hiring Platform — initial schema
-- Mirrors docs/SCHEMA.md. All tables created up front so later phases only
-- add routes, not DDL.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS postgis;

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('client', 'artisan', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM (
    'pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'disputed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM (
    'pending', 'held', 'released', 'refunded', 'failed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- -----------------------------------------------------------------------------
-- users
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone          VARCHAR(32) UNIQUE NOT NULL,
  email          VARCHAR(255) UNIQUE,
  full_name      VARCHAR(255),
  role           user_role NOT NULL DEFAULT 'client',
  profile_photo  VARCHAR(1024),
  is_verified    BOOLEAN NOT NULL DEFAULT false,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- -----------------------------------------------------------------------------
-- artisan_profiles
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS artisan_profiles (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  bio                  TEXT,
  years_experience     INT,
  id_document_url      VARCHAR(1024),
  verification_status  verification_status NOT NULL DEFAULT 'pending',
  rejection_reason     TEXT,
  avg_rating           NUMERIC(2,1),
  total_jobs           INT NOT NULL DEFAULT 0,
  total_earnings       NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_artisan_profiles_status ON artisan_profiles(verification_status);

-- -----------------------------------------------------------------------------
-- categories
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         VARCHAR(128) UNIQUE NOT NULL,
  slug         VARCHAR(128) UNIQUE NOT NULL,
  icon_url     VARCHAR(1024),
  description  TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- artisan_categories (many-to-many with pricing)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS artisan_categories (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id  UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  price_min    NUMERIC(12,2),
  price_max    NUMERIC(12,2),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(artisan_id, category_id)
);
CREATE INDEX IF NOT EXISTS idx_artisan_categories_category ON artisan_categories(category_id);

-- -----------------------------------------------------------------------------
-- locations  (PostGIS geography for fast radius queries)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS locations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  address     VARCHAR(512),
  city        VARCHAR(128),
  state       VARCHAR(128),
  lat         NUMERIC(9,6) NOT NULL,
  lng         NUMERIC(9,6) NOT NULL,
  geog        GEOGRAPHY(Point, 4326) NOT NULL,
  is_primary  BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_locations_geog ON locations USING GIST (geog);
CREATE INDEX IF NOT EXISTS idx_locations_user ON locations(user_id);

-- -----------------------------------------------------------------------------
-- portfolio_items
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS portfolio_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  image_url   VARCHAR(1024) NOT NULL,
  caption     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_portfolio_artisan ON portfolio_items(artisan_id);

-- -----------------------------------------------------------------------------
-- bookings
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         UUID NOT NULL REFERENCES users(id),
  artisan_id        UUID NOT NULL REFERENCES users(id),
  category_id       UUID REFERENCES categories(id),
  description       TEXT,
  status            booking_status NOT NULL DEFAULT 'pending',
  agreed_price      NUMERIC(12,2),
  scheduled_date    TIMESTAMPTZ,
  location_id       UUID REFERENCES locations(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at      TIMESTAMPTZ,
  cancelled_reason  TEXT
);
CREATE INDEX IF NOT EXISTS idx_bookings_client ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_artisan ON bookings(artisan_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- -----------------------------------------------------------------------------
-- messages  (booking_id nullable for pre-booking chat)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id   UUID REFERENCES bookings(id) ON DELETE SET NULL,
  sender_id    UUID NOT NULL REFERENCES users(id),
  receiver_id  UUID NOT NULL REFERENCES users(id),
  content      TEXT NOT NULL,
  sent_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at      TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_messages_pair ON messages(sender_id, receiver_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_booking ON messages(booking_id);

-- -----------------------------------------------------------------------------
-- payments
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id          UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  amount              NUMERIC(12,2) NOT NULL,
  platform_fee        NUMERIC(12,2) NOT NULL DEFAULT 0,
  paystack_reference  VARCHAR(128) UNIQUE,
  status              payment_status NOT NULL DEFAULT 'pending',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  released_at         TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- -----------------------------------------------------------------------------
-- reviews
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  client_id   UUID NOT NULL REFERENCES users(id),
  artisan_id  UUID NOT NULL REFERENCES users(id),
  rating      INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reviews_artisan ON reviews(artisan_id);

-- -----------------------------------------------------------------------------
-- notifications
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        VARCHAR(64) NOT NULL,
  title       VARCHAR(255) NOT NULL,
  body        TEXT,
  data        JSONB,
  is_read     BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);

-- -----------------------------------------------------------------------------
-- otp_codes  (server-side table backing phone-OTP auth — spec §11.1)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS otp_codes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone        VARCHAR(32) NOT NULL,
  code_hash    VARCHAR(255) NOT NULL,
  attempts     INT NOT NULL DEFAULT 0,
  expires_at   TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  consumed_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_otp_phone_active ON otp_codes(phone) WHERE consumed_at IS NULL;

-- -----------------------------------------------------------------------------
-- refresh_tokens  (rotating JWT refresh tokens — spec §11.1 step 8)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash   VARCHAR(255) NOT NULL UNIQUE,
  expires_at   TIMESTAMPTZ NOT NULL,
  revoked_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
