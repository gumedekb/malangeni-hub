-- Places on Explore get a Google Maps link (for "Get directions") and optional opening hours, in the
-- same shape as the library: a null pair means closed that day; all six null means not listed.
ALTER TABLE attractions ADD COLUMN IF NOT EXISTS maps_url varchar(512);
ALTER TABLE attractions ADD COLUMN IF NOT EXISTS weekday_open time(6);
ALTER TABLE attractions ADD COLUMN IF NOT EXISTS weekday_close time(6);
ALTER TABLE attractions ADD COLUMN IF NOT EXISTS saturday_open time(6);
ALTER TABLE attractions ADD COLUMN IF NOT EXISTS saturday_close time(6);
ALTER TABLE attractions ADD COLUMN IF NOT EXISTS sunday_open time(6);
ALTER TABLE attractions ADD COLUMN IF NOT EXISTS sunday_close time(6);
