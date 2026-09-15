-- Services become member-submitted listings with hub-team approval (same states as events).
-- Any existing admin-entered rows are carried over and grandfathered APPROVED.

ALTER TABLE local_services ADD COLUMN IF NOT EXISTS service_category varchar(255) NOT NULL DEFAULT 'OTHER'
    CHECK (service_category IN ('PLUMBING', 'ELECTRICAL', 'BUILDING', 'MECHANIC', 'TRANSPORT', 'TUTORING',
                                'HAIR_BEAUTY', 'CATERING', 'CLEANING', 'GARDENING', 'CHILDCARE',
                                'IT_REPAIRS', 'OTHER'));
ALTER TABLE local_services ALTER COLUMN service_category DROP DEFAULT;

ALTER TABLE local_services ADD COLUMN IF NOT EXISTS status varchar(255) NOT NULL DEFAULT 'APPROVED'
    CHECK (status IN ('PENDING', 'APPROVED', 'NEEDS_CHANGES'));
ALTER TABLE local_services ALTER COLUMN status SET DEFAULT 'PENDING';

-- Nullable at the database level only because old rows predate them; the service requires them.
ALTER TABLE local_services ADD COLUMN IF NOT EXISTS description varchar(1000);
ALTER TABLE local_services ADD COLUMN IF NOT EXISTS contact_number varchar(255);
ALTER TABLE local_services ADD COLUMN IF NOT EXISTS area_served varchar(255);
ALTER TABLE local_services ADD COLUMN IF NOT EXISTS operating_hours varchar(255);
ALTER TABLE local_services ADD COLUMN IF NOT EXISTS image_url varchar(512);
ALTER TABLE local_services ADD COLUMN IF NOT EXISTS review_note varchar(1000);
ALTER TABLE local_services ADD COLUMN IF NOT EXISTS reviewed_by_user_id varchar(255);
ALTER TABLE local_services ADD COLUMN IF NOT EXISTS reviewed_at timestamp(6);
ALTER TABLE local_services ADD COLUMN IF NOT EXISTS provider_id varchar(255);
ALTER TABLE local_services ADD COLUMN IF NOT EXISTS created_at timestamp(6);

-- Carry over what the old rows had before dropping the old columns.
UPDATE local_services SET contact_number = phone WHERE contact_number IS NULL;
UPDATE local_services SET area_served = address WHERE area_served IS NULL;
UPDATE local_services SET created_at = now() WHERE created_at IS NULL;

ALTER TABLE local_services DROP COLUMN IF EXISTS category_id;
ALTER TABLE local_services DROP COLUMN IF EXISTS phone;
ALTER TABLE local_services DROP COLUMN IF EXISTS email;
ALTER TABLE local_services DROP COLUMN IF EXISTS address;

CREATE INDEX IF NOT EXISTS idx_local_services_status_category ON local_services (status, service_category);
