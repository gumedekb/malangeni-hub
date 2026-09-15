# Project Structure — Malangeni Blog Backend

A learning map of this codebase. This is a **Spring Boot 3.2 / Java 21 REST API** built with
Maven, using MySQL for storage and JWT for authentication. It follows the classic **layered
architecture**: Controller → Service → Repository → Database, with `domain` classes as the
data model flowing through all layers.

## Annotated folder structure

Legend: ✏️ = code you write yourself · ⚙️ = generated/managed by tools (don't hand-edit) ·
📝 = config/docs you edit occasionally

```
MalangeniBlogProjectBackend/
│
├── pom.xml                      📝 Maven "Project Object Model" — THE build file. Declares your
│                                   dependencies (Spring Web, JPA, Security, JWT, MySQL driver...).
│                                   You edit it only to add/remove libraries or change versions.
│                                   Maven reads this and downloads the actual jars for you.
│
├── .gitignore                   📝 Tells git which files to never commit (target/, IDE junk).
├── GOAL.md                      📝 Your own project docs — what the backend must do.
├── TASKS.md                     📝 Your own task list.
│
├── .idea/                       ⚙️ IntelliJ IDEA's private settings (encodings, compiler, VCS).
│                                   Machine-generated. Never edit by hand; most teams gitignore
│                                   most of it. Deleting it just makes IntelliJ regenerate it.
│
├── target/                      ⚙️ Maven's build output — compiled .class files and the final
│                                   .jar. 100% disposable; `mvn clean` deletes it. NEVER edit.
│                                   (Your dependencies themselves live outside the project, in
│                                   ~/.m2/repository — also managed by Maven, never touched.)
│
└── src/
    └── main/
        ├── resources/
        │   └── application.properties   📝 Runtime configuration: server port, DB URL/credentials,
        │                                    Hibernate settings, JWT secret & expiry. Values like
        │                                    ${DB_URL:...} mean "use env var DB_URL, else default".
        │
        └── java/co/za/malangeniblog/    ✏️ ALL of this is your code. Package = your domain
            │                               reversed (co.za) + project name.
            │
            ├── Main.java                ✏️ The entry point. @SpringBootApplication + main() —
            │                               boots the embedded web server and scans this package
            │                               for all your @Component/@Service/@Controller classes.
            │
            ├── config/                  ✏️ Framework configuration written as Java classes.
            │   ├── CorsConfig.java         Which frontend origins may call this API (CORS rules).
            │   └── JpaConfig.java          JPA/auditing setup (e.g. auto-fill createdAt fields).
            │
            ├── domain/                  ✏️ THE DATA MODEL — "entities". Each class = one MySQL
            │   │                           table; each field = a column. Annotated with @Entity.
            │   │                           Hibernate creates/updates the tables from these
            │   │                           (spring.jpa.hibernate.ddl-auto=update).
            │   ├── User.java               A registered person (with Role.java enum: USER/ADMIN…).
            │   ├── Post.java               Community feed post (PostType.java = its enum).
            │   ├── Comment.java            Comment on a post.
            │   ├── Like.java               A user liking a post.
            │   ├── Group.java              Community group (+ GroupMembership.java = who joined).
            │   ├── Event.java              Community event (+ EventTag.java).
            │   ├── News.java               Local news articles.
            │   ├── Attraction.java         Points of interest for the Explore page.
            │   ├── LocalService.java       Library/local services directory.
            │   ├── CommunityProject.java   Community projects.
            │   ├── Category.java           Shared category table other entities reference.
            │   ├── Shop.java               Marketplace storefront (+ Product.java = its items).
            │   ├── Rating.java             Star ratings on rateable things.
            │   ├── Sponsor.java            Sponsors (+ SponsorPlacement.java = where ads show).
            │   └── ContactMessage.java     "Contact us" form submissions.
            │
            ├── repository/              ✏️ DATA ACCESS LAYER. One interface per entity, extending
            │   │                           JpaRepository<Entity, ID>. You write NO SQL — Spring
            │   │                           generates findAll/save/delete, and derives queries
            │   │                           from method names (findByEmail → WHERE email = ?).
            │   └── *Repository.java        (UserRepository, PostRepository, ... 17 of them,
            │                                one per entity — same pattern every time.)
            │
            ├── service/                 ✏️ BUSINESS LOGIC LAYER. Sits between controllers and
            │   │                           repositories. Validation, rules, combining data,
            │   │                           @Transactional boundaries live here.
            │   ├── AuthService.java        Register/login logic — issues JWT tokens.
            │   └── *Service.java           One per feature area (PostService, ShopService, ...),
            │                                mirroring the repositories.
            │
            ├── controller/              ✏️ WEB LAYER — the REST API surface. @RestController
            │   │                           classes that map HTTP routes (@GetMapping etc.) to
            │   │                           service calls and return JSON. No business logic here.
            │   ├── AuthController.java     POST /api/auth/register, /api/auth/login.
            │   └── *Controller.java        One per feature (PostController → /api/posts, ...).
            │
            ├── dto/                     ✏️ Data Transfer Objects — the request/response "shapes"
            │   │                           of your API, separate from database entities so you
            │   │                           never leak fields like password hashes.
            │   ├── RegisterRequest.java / LoginRequest.java   Incoming JSON bodies.
            │   ├── AuthResponse.java                          Outgoing JSON (the JWT token).
            │   └── CommentRequest, RatingRequest,
            │       RatingSummaryResponse, LikeSummaryResponse  ...same idea per feature.
            │
            ├── security/                ✏️ Spring Security + JWT plumbing.
            │   ├── SecurityConfig.java          The rulebook: which URLs are public vs
            │   │                                 login-required, disables sessions (stateless).
            │   ├── JwtService.java              Creates & validates JWT tokens (signing, expiry).
            │   ├── JwtAuthenticationFilter.java Runs on EVERY request: reads the
            │   │                                 "Authorization: Bearer ..." header, validates
            │   │                                 the token, sets the logged-in user.
            │   ├── UserDetailsServiceImpl.java  Tells Spring Security how to load a user
            │   │                                 from YOUR database (via UserRepository).
            │   ├── CustomUserDetails.java       Adapter wrapping your User entity into the
            │   │                                 shape Spring Security expects.
            │   ├── SecurityUtil.java            Helper: "who is the current logged-in user?"
            │   └── PostSecurity / CommentSecurity /
            │       ShopSecurity.java            Ownership checks used in @PreAuthorize rules
            │                                     ("only the author may edit this post").
            │
            ├── exception/               ✏️ Error handling.
            │   ├── ResourceNotFoundException.java  Thrown when an ID doesn't exist → 404.
            │   ├── BadRequestException.java        Thrown on invalid input → 400.
            │   └── GlobalExceptionHandler.java     @RestControllerAdvice — catches exceptions
            │                                        from ALL controllers and turns them into
            │                                        clean JSON error responses.
            │
            └── util/                    ✏️ Small shared helpers.
                ├── IdGenerator.java             Generates entity IDs.
                ├── ValidationUtil.java          Common validation checks.
                └── RepositoryValidationHelper.java  Validation that needs repository lookups.
```

## How a request flows (the thing worth internalizing)

Say the frontend calls `GET /api/posts/123` with a JWT:

1. **`JwtAuthenticationFilter`** (security/) intercepts, validates the token, identifies the user.
2. **`SecurityConfig`** checks the URL is allowed for that user.
3. **`PostController`** matches the route and calls `postService.getById("123")`.
4. **`PostService`** applies logic and calls `postRepository.findById("123")`.
5. **`PostRepository`** — Spring turns it into SQL against MySQL and maps the row to a
   **`Post`** entity (domain/).
6. If not found, `ResourceNotFoundException` is thrown and **`GlobalExceptionHandler`**
   converts it to a JSON 404. Otherwise the entity (or a **DTO**) is serialized to JSON and
   returned.

## What you touch vs. what you don't

- **You write everything under `src/`** plus edit `pom.xml` and `application.properties`.
  That's the whole project — ~110 files, all yours.
- **Never touch** `target/` (build output, regenerated on every build) and `.idea/`
  (IntelliJ's own files). Your actual dependency jars (Spring, Hibernate, JJWT...) aren't
  even in the project folder — Maven keeps them in `~/.m2/repository/` and wires them in at
  build time based on `pom.xml`. You "own" the shopping list (`pom.xml`), Maven owns the
  groceries.
- One convention note: your test folder `src/test/java/` doesn't exist yet — that's the
  standard Maven location where unit/integration tests would go, mirroring the main package
  structure.

The repeating pattern to notice: almost every feature is a vertical slice of four files —
`domain/X.java` → `repository/XRepository.java` → `service/XService.java` →
`controller/XController.java`. Once you understand one slice (e.g. Post), you understand
90% of the codebase.
