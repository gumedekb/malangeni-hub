# Malangeni Hub — Backend Tasks

## Done

### Auth & users
- Google sign-in with the Firebase Admin SDK; every request's Firebase token is verified.
- Account created on first sign-in; an existing account with the same email is linked.
- Display name from the Google account (`display_name`, V9), kept in step on every sign-in.
- Username built from the Google name ("thabo.mokoena"), numbered if taken. Old email-based usernames are renamed once, on the next sign-in.
- Tokens with an unverified email are rejected.
- `GET /api/auth/me` returns the signed-in user.
- Admins come only from the `ADMIN_EMAILS` env var, checked on every request.
- Backstage dev account: full admin rights, shown as a normal user in public.
- Admins can set a user to `USER` or `MODERATOR`; admins can't be changed.
- First-sign-in onboarding: `POST /api/users/me/onboarding` (member, formal or informal business).
- Profile pictures: `POST /api/users/me/avatar` to Cloudinary (512×512, JPEG/PNG/WebP, max 5MB).
- Remove picture: `DELETE /api/users/me/avatar`.
- Public profile: `GET /api/users/profile/{username}` (members only).
- `GET /api/users/recent` (members only): newest members and how many joined this week. Backstage staff left out.
- Public user JSON shows only id, username, display name, avatar, role, badge and join date (`PublicUserSerializer`).
- Password login, JWT and admin-created accounts removed.
- `DELETE /api/users/{id}` (self or admin): deletes the account and everything the member posted, their pictures and their Firebase login. Admin accounts can't be deleted.

### Posting bans
- `POST /api/users/{id}/ban` and `/unban` (staff), with an optional reason (no end date).
- Admins and yourself can't be banned.
- Bans are checked at write time (posts, news, events, services); banned users get 400 with the reason. Comments stay open.

### Security
- `@PreAuthorize` role checks on write endpoints.
- Owner-or-staff checks for posts, comments, news, events, services and shops.
- 403 for denied access, 409 for duplicates, no raw error details in 500s.
- User lookup by username or email is admin-only.
- Only `/actuator/health` and `/actuator/info` are public.
- Secrets come from env vars only.
- Validation for phone, email, http(s) URLs, max lengths and coordinates.

### Business verification
- `POST /api/badge-requests`, `GET /mine`, staff queue, approve or reject with a note.
- Approval gives the `BUSINESS` badge and `BUSINESS_OWNER` role.
- Nobody can review their own request.
- Verification log: `GET /api/badge-requests/log`.
- Revoke: `POST /api/badge-requests/users/{userId}/revoke`; drops the role and hides listings.

### Community
- Posts: create, edit (title, details, tag), delete.
- `GET /api/posts` filters combine: `type` (repeatable), `groupId`, `authorId`; paginated, newest first.
- Post pictures: `POST /api/posts/{id}/image` to add or replace, `DELETE` to remove.
- Likes (one per user); like and unlike return the new count.
- Comments with one reply level; trimmed, max 2000 characters; no longer embed the whole post.
- Groups: create, join, leave, members, `joinedByCurrentUser`.
- News written by any member; authors manage their own, staff manage all. `GET /api/news/mine`.
- Attraction ratings (1–5, one per user) with average and count.

### Events
- Members submit events; staff approve or ask for changes with a note.
- Staff events are approved at once; edits go back for approval.
- Required: title, future date and time, location, SA cellphone, description.
- Optional picture: `POST /api/events/{id}/image`.
- Past events hidden and deleted hourly (`EventCleanupJob`).

### Services
- Member listings: name, category, description, SA cellphone, area, optional hours and picture.
- Same approval flow as events.
- `GET /api/services?category=` lists approved services.

### Business directory
- A shop is a listing: name, hours, contact and location.
- Only approved businesses or staff can create one; staff approve or hide it.
- Products, subdomains and e-commerce removed.

### Sponsors
- Sponsor ads per page slot with start and end dates.
- `GET /api/sponsors/active?placement=` returns one random active ad, or 204.
- Staff create, edit, pause and delete sponsors.

### Places (Explore)
- Staff create, edit and delete places; the category must exist; deleting removes its ratings and picture.
- Place pictures: `POST /api/attractions/{id}/image` (Cloudinary), `DELETE` to remove. No typed-in image URLs.
- Moderators can add categories (`POST /api/categories`), not just admins.
- Places have a Google Maps link and optional opening hours (V10), checked like the library's.
- `POST /api/maps/lookup` (staff): reads a pasted Google Maps link — name and pin from the link; address and opening hours from the Google Places API (New) when `GOOGLE_PLACES_API_KEY` is set. Only Google Maps addresses are fetched.

### Library
- `GET /api/library` (public): name, about, location, map link and opening hours.
- `PUT /api/library` (admins and moderators) updates them.
- Stored as one row (V8).

### Data & infrastructure
- PostgreSQL on Neon.
- The JVM runs in Africa/Johannesburg time, so new timestamps are SA time even in a UTC container.
- Flyway migrations (V1–V10); schema validated on startup.
- Pagination on the main list endpoints.
- IDs generated by the server.
- Case-insensitive search.
- Multi-stage `Dockerfile` (Java 21 JRE, non-root) and `.dockerignore`.
- Port read from the `PORT` env var.
- `prod` profile: quiet logs, no local defaults, health probes, Swagger UI off (still on locally at `:8080/swagger-ui/index.html`).
- Docker image tested locally against Neon.
- Render Blueprint (`render.yaml` at the repo root): Docker build of this folder, prod profile, health check, secrets asked for on setup.
- CORS origins come from `CORS_ALLOWED_ORIGINS`; JVM flags from `JAVA_OPTS`.
- Demo data seeder and `/api/admin/demo-data` removed. Database cleared on 2026-09-15, keeping only the admin/dev accounts and the library details.

## To do

### Security & secrets
- [ ] Rate limiting on write endpoints.
- [ ] Request and response DTOs instead of entities.

### Features
- [ ] Remove or use the News, CommunityProject and ContactMessage APIs — the frontend uses none of them.

### Performance

Measured on 2026-09-17 from South Africa against the live service. The API runs on Render
**Ohio (US East)** and the Neon database sits in **AWS Sao Paulo (`sa-east-1`)**, so every
single query crosses to Brazil and back.

- Warm request that touches no database: 0.54 s average, 0.39 s best.
- One database round trip, Ohio to Sao Paulo: **~0.11-0.12 s** (`/actuator/health` minus the no-query request, and again 1.36 s / 11 queries on the feed).
- `GET /api/posts` with 3 posts: 1.90 s average, of which 1.36 s is 11 sequential queries.
- At the shipped page size of 20 that is 62 queries (82 signed in), so roughly **8-10 s**.
- Cold start after the free plan sleeps: **204 s** to the first byte.

Fix the query count first: it is free, needs no migration, and is worth more than any move.

#### Query count (do this first)
- [ ] Count likes and comments for a whole page in one grouped query each, not 2-3 queries per post (`PostService.enrich`). 62 queries drops to 3-4, i.e. ~7.6 s to ~0.45 s.
- [ ] Load post authors and groups with the posts (join fetch / entity graph). `Post.author` and `Post.group` are `@ManyToOne` with no `fetch`, so JPA defaults them to EAGER and issues one query per post.
- [ ] Check the other services for the same shape (events, shops, attractions, services, groups) — anything with an `enrich`-style per-row loop.
- [ ] Consider denormalised `like_count` / `comment_count` columns maintained on write, instead of counting on every read.
- [ ] Cache the signed-in user lookup briefly instead of reading it on every request.
- [ ] Lower the default feed page size, or make the cost sub-linear, so the count stops driving the page time.

#### Where things run (decide before moving anything)
- [ ] Decide the target pair. Co-locating the API and the database matters more than being near the users: once the feed is 3-4 queries, one bad database hop costs more than the whole user leg. Measured from SA (TCP handshake, best of 3, includes ~0.03 s DNS): AWS Cape Town `af-south-1` 0.126, London `eu-west-2` 0.228, Frankfurt `eu-central-1` 0.237, Ohio/Virginia `us-east` 0.321, Sao Paulo `sa-east-1` 0.439.
- [ ] Baseline option, all on current providers: Render **Frankfurt** + Neon **`eu-central-1`**. User leg 0.32 -> 0.24, API-to-database 0.11 -> under 0.005. Neon has no African region (8 AWS regions, Frankfurt and London are the nearest).
- [ ] Cheaper half-step if the Render service should not move: Neon **`us-east-2` (Ohio)** alone, which parks the database next to the API and kills the 0.11 s hop without recreating anything on Render.
- [ ] Note: Render's region cannot be changed on an existing service — it has to be deleted and recreated. Neon's region is fixed per project — new project, `pg_dump | psql`, swap `DB_URL`. Both free.
- [ ] Evaluate free hosts with an actual African region (see the alternatives list): Northflank Sandbox (2 services + 1 database, free forever, lists an `africa-south` region — confirm it is on the free plan), or an Oracle Cloud Always Free Arm VM in `af-johannesburg-1` running both Spring Boot and Postgres on one box. Ruled out: Google Cloud Run `africa-south1` (Tier 2 region, excluded from the free tier), Supabase (no `af-south-1`), Fly.io (no free tier for new accounts).

#### Cold start and config drift
- [ ] Keep the Render service awake: a scheduled `GET /actuator/health` every 10 minutes (a GitHub Actions cron is free on a public repo).
- [ ] Keep Neon awake or accept the cold start after it suspends (free tier sleeps when idle).
- [ ] Find out why the cold start is 204 s when a Spring Boot start is normally 40-60 s — read the Render deploy log before tuning any flags.
- [ ] `render.yaml` describes a service called `malangeni-hub-api`, which does not exist; the live one is `malangeni-hub`. Nothing in that file is applied, so `JAVA_OPTS`, `DB_POOL_SIZE` and the region are not in effect — set them on the live service and fix the name in the file.
- [ ] `render.yaml` says `region: virginia`; the service actually runs in Ohio. Correct it so a rebuild from the blueprint does not move the service.
- [ ] Turn off `show-sql` and DEBUG web logging locally.
- [ ] Decide `spring.jpa.open-in-view`.

### Tests & docs
- [ ] Authorization tests: news ownership, bans, role changes, staff-only endpoints.
- [ ] Tests: likes, comments, post filters, shop ownership, auth rules.
- [ ] OpenAPI annotations on the new controllers.
- [ ] Same pagination and sorting params on every list.
- [ ] README: setup and endpoint map.

### Deploy (Render)
- [ ] Create the service from `render.yaml` (Render → New → Blueprint) and fill in the secret values.
- [x] Firebase key from `FIREBASE_CREDENTIALS_JSON` (or a Secret File).
- [ ] Optional: create a Google Places API (New) key (billing enabled) and set `GOOGLE_PLACES_API_KEY`, so Maps links fill in opening hours.
- [ ] Set `CORS_ALLOWED_ORIGINS` to the frontend's address once it's deployed.
- [ ] Smoke-test the live API: `/actuator/health`, sign in, create a post.
- [ ] Move off the free plan before launch (it sleeps after 15 idle minutes).
- [ ] Later: custom domain, CI checks before deploy.

### Later
- [ ] `bio` field on `User`.
- [ ] Store coordinates as numbers, not text (needed for distance search).
- [ ] Check addresses match map pins.
- [ ] CV review against job ads (link, embed or port the existing app).

## Skipped for the demo
- Rotating the Neon database password and the Cloudinary API secret. Both were pasted into a chat, so rotate them before any real launch.
