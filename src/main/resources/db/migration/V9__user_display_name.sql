-- The member's name from their Google account (e.g. "Thabo Mokoena"), shown on posts and
-- profiles instead of the username. Filled in on the next sign-in.
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name varchar(255);
