-- Bookings table for Gui Lin Shan Ju (归林山居)
-- Stores guest reservation requests submitted via the website.

CREATE TABLE IF NOT EXISTS bookings (
  -- Auto-increment primary key
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Public-facing booking reference (e.g. GL-20260614-A8F2)
  -- Generated server-side; human-readable, safe to share with guest.
  booking_ref TEXT NOT NULL UNIQUE,

  -- Snapshot of the chosen room at booking time
  room_id TEXT NOT NULL CHECK (room_id IN ('suite', 'double', 'twin')),
  room_name TEXT NOT NULL,

  -- Stay details
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  nights INTEGER NOT NULL CHECK (nights > 0),
  guests INTEGER NOT NULL CHECK (guests > 0 AND guests <= 4),
  price_per_night INTEGER NOT NULL,    -- in CNY, integer
  total_cny INTEGER NOT NULL,          -- in CNY, integer

  -- Guest contact info
  guest_name TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  remarks TEXT,

  -- Lifecycle
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  locale TEXT NOT NULL DEFAULT 'zh' CHECK (locale IN ('zh', 'en')),

  -- Audit
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ip_hash TEXT,                         -- SHA-256 of submitter IP (no PII)
  user_agent TEXT
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_check_in ON bookings(check_in);
CREATE INDEX IF NOT EXISTS idx_bookings_guest_email ON bookings(guest_email);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);
