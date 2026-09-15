-- Shops become a directory listing only (name, hours, contact, location, approve/hide).
-- No product catalogue and no per-shop subdomain site - both removed 2026-09-14.
DROP TABLE IF EXISTS products;
ALTER TABLE shops DROP COLUMN IF EXISTS subdomain;

-- Verification log is read newest decision first.
CREATE INDEX IF NOT EXISTS idx_badge_requests_reviewed_at ON badge_requests (reviewed_at);
