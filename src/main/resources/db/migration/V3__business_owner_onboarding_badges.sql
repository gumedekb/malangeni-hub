-- SHOP_OWNER becomes BUSINESS_OWNER, first-sign-in account type, business badge requests,
-- backstage staff flag, and the local password column goes (Firebase is the only sign-in).

-- Drop whichever CHECK constraint guards users.role. Its name depends on who created it
-- (Flyway V1 vs the old ddl-auto), so look it up rather than guess.
DO $$
DECLARE c record;
BEGIN
    FOR c IN SELECT conname FROM pg_constraint
             WHERE conrelid = 'users'::regclass AND contype = 'c'
               AND pg_get_constraintdef(oid) LIKE '%role%'
    LOOP
        EXECUTE format('ALTER TABLE users DROP CONSTRAINT %I', c.conname);
    END LOOP;
END $$;

UPDATE users SET role = 'BUSINESS_OWNER' WHERE role = 'SHOP_OWNER';
ALTER TABLE users ADD CONSTRAINT users_role_check
    CHECK (role IN ('ADMIN', 'USER', 'MODERATOR', 'BUSINESS_OWNER'));

ALTER TABLE users DROP COLUMN IF EXISTS password;

ALTER TABLE users ADD COLUMN IF NOT EXISTS account_type varchar(255)
    CHECK (account_type IN ('MEMBER', 'BUSINESS_FORMAL', 'BUSINESS_INFORMAL'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS badge_request_status varchar(255)
    CHECK (badge_request_status IN ('PENDING', 'APPROVED', 'REJECTED'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS backstage boolean NOT NULL DEFAULT false;

CREATE TABLE badge_requests (
    id                   varchar(255) NOT NULL PRIMARY KEY,
    user_id              varchar(255) NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    business_type        varchar(255) CHECK (business_type IN ('FORMAL', 'INFORMAL')),
    business_name        varchar(255) NOT NULL,
    category             varchar(255),
    location             varchar(255),
    contact_number       varchar(255),
    registration_number  varchar(255),
    description          varchar(1000),
    status               varchar(255) NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    reviewed_by_user_id  varchar(255),
    reviewed_at          timestamp(6),
    review_note          varchar(1000),
    created_at           timestamp(6)
);

CREATE INDEX idx_badge_requests_status_created ON badge_requests (status, created_at);
-- At most one waiting request per member; the service checks first, this settles races.
CREATE UNIQUE INDEX uq_badge_requests_one_pending ON badge_requests (user_id) WHERE status = 'PENDING';
