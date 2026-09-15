-- Business badges can be revoked: new REVOKED status + who/when/why.

-- Replace the status CHECK constraints (looked up rather than guessed by name). Only the
-- constraints listing APPROVED are status checks; business_type's check is left alone.
DO $$
DECLARE c record;
BEGIN
    FOR c IN SELECT conrelid::regclass AS tbl, conname FROM pg_constraint
             WHERE conrelid IN ('users'::regclass, 'badge_requests'::regclass)
               AND contype = 'c'
               AND pg_get_constraintdef(oid) LIKE '%APPROVED%'
    LOOP
        EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', c.tbl, c.conname);
    END LOOP;
END $$;

ALTER TABLE badge_requests ADD CONSTRAINT badge_requests_status_check
    CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'REVOKED'));
ALTER TABLE users ADD CONSTRAINT users_badge_request_status_check
    CHECK (badge_request_status IN ('PENDING', 'APPROVED', 'REJECTED', 'REVOKED'));

ALTER TABLE badge_requests ADD COLUMN IF NOT EXISTS revoked_by_user_id varchar(255);
ALTER TABLE badge_requests ADD COLUMN IF NOT EXISTS revoked_at timestamp(6);
ALTER TABLE badge_requests ADD COLUMN IF NOT EXISTS revoke_note varchar(1000);
