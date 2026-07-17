-- ============================================================
-- 025 — Email verification & Google OAuth support
-- ============================================================

-- Allow phone to be nullable (Google users may not have a phone)
ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;

-- Add email_verified column (default false for existing users)
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- Add google_id column for linking Google accounts
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(100) UNIQUE;

-- Add password_hash column if not exists (some users created via Google have no password)
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Index for google_id lookups
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;

-- Index for email_verified
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);
