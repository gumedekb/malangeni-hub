# Malangeni Hub — Backend Goal

## 1. What this backend is for

Malangeni Hub is a local community platform for a specific area ("Malangeni"). One backend
(Spring Boot + MySQL) must power all of the following, exposed as a REST API consumed by a
web/mobile frontend:

1. **A community content hub** — local news, notices, events, discussions, groups, and
   points of interest (attractions, clinics, transport, etc.), modeled on the four reference
   pages: `malangeni-home.html`, `explore.html`, `community.html`, `services.html`.
2. **A directory + booking layer for the library and local services** — study rooms,
   printing, Wi-Fi, tutoring, hall hire, catalogue — including live availability and the
   ability to actually book/reserve/sign up, not just list contact details.
3. **A mini marketplace platform for local businesses**, in the same spirit as Shopify:
   any small shop, spaza, or local service business in the area can register and get its
   own storefront reachable on a subdomain (e.g. `corner-market.malangenihub.co.za`), where
   it can list products/services, manage basic orders/enquiries, and be discovered from the
   main hub (Explore/Services pages should be able to surface these shops alongside
   library services and attractions).

The backend must be the single source of truth for all of the above — the frontend should
never need to fake, hardcode, or locally compute data that the API should be providing
(ratings, availability, likes/comments, distances, who's logged in, which shop owns which
subdomain, etc.).

## 2. Guiding principles

- **The frontend is the spec.** Every visible piece of data or interactive control in the
  four reference pages (composer, like/comment counts, join buttons, booking buttons,
  availability dots, star ratings, event tags, sponsor slots) must be backed by a real,
  documented API — not left as static/decorative markup.
- **Consistency over one-offs.** All entities that have a category should reference the
  same `Category` table the same way (current inconsistency: `LocalService.category` is a
  free-text string while `Attraction`/`News`/`CommunityProject` use `categoryId` FKs — this
  must be unified).
- **Real relationships, not loose string IDs.** Anywhere a `userId`/`categoryId`-style field
  exists today as a bare `String` with no FK constraint, it should become a proper
  relationship so the API can return the related entity (author name/avatar, category name)
  without the frontend having to stitch IDs together itself.
- **Multi-tenancy is a first-class concern, not a bolt-on.** Shop/business data must be
  isolated per tenant (one shop cannot see or modify another's products/orders), while still
  being discoverable from the shared community hub.
- **Security is mandatory, not optional.** Anything that identifies "the current user"
  (posting, liking, joining a group, booking a room, managing a shop) requires real
  authentication — there is currently none.

## 3. Functional scope (derived from the frontend)

### 3.1 Home feed
- Featured place card with a real average rating.
- Upcoming events list (date, time, location, importance tag).
- A unified community feed mixing news, notices, and community posts, each with author,
  timestamp, optional image, like count, and comment count, filterable by type.
- Sponsored/ad slots served from real data, not static placeholders.

### 3.2 Explore
- Searchable, filterable (by category) grid of places: attractions, clinics, transport,
  food, learning spaces, **and now local shops/businesses that opted into the directory**.
- Distance from the user's location (needs user geolocation + place lat/long, computed
  server-side or via a documented client-side formula against API-provided coordinates).
- Star ratings per place.
- A featured/promoted place slot.

### 3.3 Community
- Post composer → creates a real discussion thread authored by the logged-in user.
- Threads support replies (comments), likes, group tagging, and share.
- Groups: list, member counts, join/leave.
- "New members" widget backed by real user signup timestamps.
- Sponsored slot.

### 3.4 Services
- **Deferred (deliberate)**: the booking/reservation system originally envisioned here is on
  hold until a real list of bookable services exists for this rural community — building
  capacity/slot logic against guessed services would be waste. `LocalService` remains a
  plain directory (name, category, contact details) for now.
- When booking is revisited: description + live availability/status per service, persisted
  booking/signup actions, and opening hours with an "open now" computed flag.
- **Local shops and service businesses** should also be able to appear here (or in Explore)
  with their own service listings once they're onboarded to the shop platform.

### 3.5 Shop platform (Shopify-style, new pillar)
Scoped for a rural community: the storefront is primarily an **information page** (where the
shop is, when it's open, how to contact it), not an e-commerce checkout.
- Any local shop or service business can register an account and create a **Shop**
  (business profile: name, description, logo, category, contact details, address,
  latitude/longitude for the map, opening and closing times).
- Each shop gets a unique, reserved **subdomain identity** (e.g.
  `myshop.malangenihub.co.za`). v1 resolves it via `GET /api/shops/by-subdomain/{name}`;
  real `Host`-header routing is layered on later once DNS/hosting is decided.
- New shops require **admin approval** before appearing in public listings; owners can also
  temporarily deactivate their own shop without deleting it.
- **Optional** products/services catalogue: owners with many products aren't forced to fill
  in inventory — a shop with zero products is fully valid. Per-item `available` flag is
  owner-managed by default, but an admin can **enforce** availability on specific items
  (e.g. scarce/rationed goods), locking that one field to admin control while the owner
  keeps editing everything else.
- **Deferred**: online payments (indefinitely), and order/enquiry flows (later, as a
  lightweight request — no checkout/cart).
- Shops can optionally be surfaced in the main hub's Explore/Services listings so the
  community discovers them without visiting the subdomain directly. *(Still open.)*
- Ownership is enforced per shop: any authenticated user may apply to open a shop, and only
  that owner (or a platform admin) can manage its profile and products.

## 4. Non-functional requirements

- **Authentication & authorization**: real login (password hashing, session/JWT), route
  protection, and ownership checks (a user can only edit their own posts/shop; only a shop
  owner can manage their shop's products/orders). Authorization denials must return 403 —
  never 500 — and error responses must not echo internal exception detail.
- **Privacy**: a user's email, role and signup date are private. When users appear nested in
  public content (post authors, shop owners, event organisers, group members), only their
  id and username may be serialized.
- **Secrets**: no production credentials or signing keys committed to the repo. The JWT
  secret and database credentials are env-var overridable (`JWT_SECRET`, `DB_URL`,
  `DB_USERNAME`, `DB_PASSWORD`); committed values are local-dev defaults only.
- **Data integrity**: proper foreign keys and cascades where relationships exist today only
  as loose ID strings.
- **API documentation**: keep springdoc/OpenAPI accurate as new endpoints are added.
- **Multi-tenant safety**: every shop-scoped query must be filtered by shop/tenant id at the
  repository/service layer, not trusted from client input alone.
- **Testability**: meaningful service/controller tests for anything with business logic
  (booking conflicts, like/unlike toggling, tenant isolation).

## 5. Out of scope (for now)

- Payments/checkout (orders can exist as enquiries/requests without real payment
  processing initially).
- The services booking system (Phase 5) — deliberately deferred until an actual list of
  bookable community services exists; see §3.4.
- Native mobile apps — this is a backend for a web frontend.
- Advanced search (full-text/geo-search engines) — basic SQL filtering/search is enough
  for v1.

See `TASKS.md` for the concrete, ordered list of work required to close the gap between
the current backend and this goal.
