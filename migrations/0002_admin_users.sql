-- Admin users for Gui Lin Shan Ju internal dashboard.
-- Passwords hashed with PBKDF2-SHA256, 100,000 iterations (Workers Web Crypto API).
-- The seed user is created with the initial password '888888' and
-- must_change_password = 1 so the admin is forced to set a new password on first login.

CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,    -- hex-encoded PBKDF2 derived key (256 bits)
  password_salt TEXT NOT NULL,    -- hex-encoded random salt (128 bits)
  password_algo TEXT NOT NULL DEFAULT 'pbkdf2-sha256-100k',
  must_change_password INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_login_at TEXT,
  failed_login_count INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT
);

CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);

-- Seed: admin / 888888 (must change on first login)
-- The hash below is PBKDF2-SHA256(password='888888', salt='guiLinShanJuSeed!', iterations=100000).
-- Verify:    node -e "console.log(crypto.pbkdf2Sync('888888','guiLinShanJuSeed!',100000,32,'sha256').toString('hex'))"
-- Once the admin changes their password, a new random salt + hash replaces this seed row.
INSERT OR IGNORE INTO admin_users (username, password_hash, password_salt, password_algo, must_change_password)
VALUES (
  'admin',
  '2c7a0750fc34dcdc2dd84533f81686ba20a56888ece3c19db6de723c3c96481b',
  '6775694c696e5368616e4a755365656421',
  'pbkdf2-sha256-100k',
  1
);