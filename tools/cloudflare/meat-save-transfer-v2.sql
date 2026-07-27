-- ==========================================================
-- 1. VERSION 2 SAVE TRANSFER TABLE
-- ----------------------------------------------------------
-- Stores encrypted, signed, one-use transfers for ten minutes.
-- The original transfers table remains untouched.
-- ==========================================================

CREATE TABLE IF NOT EXISTS save_transfers_v2 (
  code TEXT PRIMARY KEY
    CHECK (length(code) = 7),

  transfer_version INTEGER NOT NULL
    CHECK (transfer_version = 2),

  summary TEXT NOT NULL
    CHECK (length(summary) <= 4000),

  encrypted_payload TEXT NOT NULL
    CHECK (length(encrypted_payload) <= 1650000),

  iv TEXT NOT NULL
    CHECK (length(iv) <= 128),

  signature TEXT NOT NULL
    CHECK (length(signature) <= 128),

  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,

  claimed INTEGER NOT NULL DEFAULT 0
    CHECK (claimed IN (0, 1))
);

-- ==========================================================
-- 2. EXPIRATION INDEX
-- ==========================================================

CREATE INDEX IF NOT EXISTS
  idx_save_transfers_v2_expires_at
ON save_transfers_v2 (expires_at);
