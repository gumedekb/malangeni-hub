-- Phase 9 posting bans + profile pictures.
--
-- On the existing Neon database ddl-auto=update had already added ban_reason, banned_at and
-- profile_image_url (all nullable), but silently FAILED to add banned_from_posting: Postgres
-- rejects adding a NOT NULL column with no default to a table that already has rows. Hibernate
-- logged the failure and carried on, so the app started and only broke on the first query.
--
-- IF NOT EXISTS makes this idempotent: a no-op on a fresh database where V1 already created
-- these columns, and the missing-column fix on the database that was built by ddl-auto.
ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_from_posting boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ban_reason varchar(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_at timestamp(6);
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url varchar(512);

-- Phase 9: news gets an author so ownership rules can be enforced.
ALTER TABLE news ADD COLUMN IF NOT EXISTS author_id varchar(255);

-- Phase 11: Firebase is the credential holder, so a local password is optional.
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
