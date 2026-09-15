-- Events: any member submits, the hub team approves (PENDING -> APPROVED / NEEDS_CHANGES).
-- Existing events were created by staff under the old rules, so they are grandfathered APPROVED;
-- the default then switches to PENDING for everything new.
ALTER TABLE events ADD COLUMN IF NOT EXISTS status varchar(255) NOT NULL DEFAULT 'APPROVED'
    CHECK (status IN ('PENDING', 'APPROVED', 'NEEDS_CHANGES'));
ALTER TABLE events ALTER COLUMN status SET DEFAULT 'PENDING';

-- Nullable at the database level only because old rows predate it; the service requires it.
ALTER TABLE events ADD COLUMN IF NOT EXISTS contact_number varchar(255);
ALTER TABLE events ADD COLUMN IF NOT EXISTS image_url varchar(512);
ALTER TABLE events ADD COLUMN IF NOT EXISTS review_note varchar(1000);
ALTER TABLE events ADD COLUMN IF NOT EXISTS reviewed_by_user_id varchar(255);
ALTER TABLE events ADD COLUMN IF NOT EXISTS reviewed_at timestamp(6);

CREATE INDEX IF NOT EXISTS idx_events_status_start ON events (status, start_at);
