CREATE TABLE IF NOT EXISTS activation_codes (
 id TEXT PRIMARY KEY,
 code_hash TEXT NOT NULL UNIQUE,
 batch_id TEXT NOT NULL,
 created_at INTEGER NOT NULL,
 used_at INTEGER,
 used_by TEXT,
 revoked_at INTEGER
);
CREATE INDEX IF NOT EXISTS activation_codes_created ON activation_codes(created_at DESC);
