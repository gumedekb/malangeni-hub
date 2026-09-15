/** Roles the backend assigns to a user record. Roles grant *permissions*. */
export type Role = "ADMIN" | "MODERATOR" | "USER" | "BUSINESS_OWNER";

/**
 * Badges grant *recognition*, never permissions — which is why they're a
 * separate field from `role`. Someone can be a recognised business owner
 * without gaining any moderation power, and a moderator needn't be a business.
 *
 * Only admins and moderators may assign a badge; members can never set their
 * own (see the badge request flow). Starting with businesses only: badges have
 * to be kept true as circumstances change, and a shop outlasts a term of
 * office, so it's the cheapest one to maintain.
 */
export type Badge = "BUSINESS";

/** Where a member's request for a business badge has got to. */
export type BadgeRequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "REVOKED";

/** FORMAL = registered (e.g. CIPC); INFORMAL = spaza, salon, stall, home business. */
export type BusinessType = "FORMAL" | "INFORMAL";

/**
 * The member's answer to "how will you use the hub?" on first sign-in. A
 * self-declaration only — the business badge still needs a moderator.
 */
export type AccountType = "MEMBER" | "BUSINESS_FORMAL" | "BUSINESS_INFORMAL";

/**
 * The backend's own user record, returned by `GET /api/auth/me`.
 *
 * It is created automatically on the user's first authenticated request —
 * there is no registration step. The username is built from the Google name
 * ("thabo.mokoena"), with a number added when it's already taken.
 *
 * `id` is the identifier every other backend API uses. The Firebase uid is
 * never exposed by the backend, so ownership checks must compare against
 * `profile.id`, never `firebaseUser.uid`.
 */
export interface Profile {
  id: number | string;
  username: string;
  /** Name from their Google account ("Thabo Mokoena"); kept in step on every sign-in. */
  displayName?: string | null;
  email: string;
  role: Role;
  createdAt: string;
  /**
   * Custom profile picture, uploaded to Firebase Storage by the browser — the
   * backend only ever stores the URL string. Absent when the member hasn't set
   * one, in which case the UI falls back to their Google photo, then initials.
   */
  avatarUrl?: string | null;
  /** Recognition badge, assigned by a moderator. Never settable by the member. */
  badge?: Badge | null;
  /** Status of this member's own badge request, so the profile can reflect it. */
  badgeRequestStatus?: BadgeRequestStatus | null;
  /** Absent until answered on `/welcome` — `OnboardingGate` sends them there. */
  accountType?: AccountType | null;
  /** Staff account shown to the public as a plain member. Own record only. */
  backstage?: boolean;
}

/**
 * The user record as the backend serialises it, before normalisation.
 *
 * The avatar upload endpoint returns the picture as `profileImageUrl`, while the
 * rest of the app reads `avatarUrl`. Rather than teach every component both
 * names, we reconcile them once at the API boundary (see `normalizeProfile`).
 */
type RawProfile = Profile & { profileImageUrl?: string | null };

/**
 * Collapses the backend's `profileImageUrl` onto `avatarUrl` so the UI has a
 * single field to read. An explicit `avatarUrl` wins when present; otherwise we
 * fall back to `profileImageUrl`, then to null.
 */
export function normalizeProfile(raw: RawProfile): Profile {
  const { profileImageUrl, ...profile } = raw;
  return { ...profile, avatarUrl: raw.avatarUrl ?? profileImageUrl ?? null };
}

/**
 * What other members may see about someone. Deliberately excludes `email` and
 * `firebaseUid` — and that exclusion has to be enforced by the backend, since
 * leaving a field out of this type does not remove it from the JSON.
 */
export interface PublicProfile {
  id: number | string;
  username: string;
  /** Name from their Google account; absent until their next sign-in. */
  displayName?: string | null;
  /** Backstage staff come back as USER. */
  role?: Role;
  createdAt?: string;
  avatarUrl?: string | null;
  badge?: Badge | null;
}

/** A badge request as staff see it in the verification queue. */
export interface BadgeRequest {
  id: string;
  userId: string;
  user?: PublicProfile;
  businessType?: BusinessType | null;
  businessName: string;
  category?: string | null;
  location?: string | null;
  contactNumber?: string | null;
  registrationNumber?: string | null;
  description?: string | null;
  status: BadgeRequestStatus;
  reviewedByUserId?: string | null;
  /** The team member who verified or rejected it. */
  reviewedBy?: PublicProfile | null;
  reviewedAt?: string | null;
  /** Staff note; the reason shown to the member on rejection. */
  reviewNote?: string | null;
  /** Set when an approved badge was later taken away. */
  revokedBy?: PublicProfile | null;
  revokedAt?: string | null;
  revokeNote?: string | null;
  createdAt: string;
}

/** A full account record, as only admins receive it from `GET /api/users`. */
export interface StaffUser {
  id: string;
  username: string;
  email: string;
  role: Role;
  createdAt?: string;
  badge?: Badge | null;
  backstage?: boolean;
  accountType?: AccountType | null;
}

/**
 * What we ask a business owner for. Everything here is information they hand to
 * customers anyway — trading name, where they trade, how to reach them. We
 * deliberately do not ask for an ID number, ID copies, bank details or proof of
 * address: none of it helps confirm the shop is real, and all of it would be
 * damaging to leak.
 */
export interface BadgeRequestInput {
  businessType?: BusinessType;
  businessName: string;
  category: string;
  location: string;
  contactNumber: string;
  /** Formal businesses only, and optional even then. */
  registrationNumber?: string;
  description?: string;
}

/** Business categories offered in the request form. */
export const BUSINESS_CATEGORIES = [
  "Spaza / general dealer",
  "Food & takeaways",
  "Hair & beauty",
  "Transport",
  "Repairs & trades",
  "Health",
  "Learning & tutoring",
  "Other",
] as const;

/**
 * The only fields a member may change about themselves.
 *
 * Deliberately narrow: email comes from Google and is the account's identity,
 * and `role` / `id` / `firebaseUid` must never be settable by the client. The
 * backend has to enforce this too — see the "Add backend feature" section of
 * TASKS.md.
 */
export interface UpdateProfileInput {
  username?: string;
  avatarUrl?: string | null;
}

/** Username rules, mirrored by the backend so validation agrees on both sides. */
export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;
const USERNAME_PATTERN = /^[a-zA-Z0-9._-]+$/;

/** Returns an error message for an invalid username, or null when it's fine. */
export function validateUsername(value: string): string | null {
  const name = value.trim();
  if (name.length < USERNAME_MIN)
    return `Username must be at least ${USERNAME_MIN} characters.`;
  if (name.length > USERNAME_MAX)
    return `Username must be ${USERNAME_MAX} characters or fewer.`;
  if (!USERNAME_PATTERN.test(name))
    return "Use only letters, numbers, dots, underscores and hyphens.";
  return null;
}

/** True when the profile holds any of the given roles. */
export function hasRole(profile: Profile | null, ...roles: Role[]): boolean {
  return !!profile && roles.includes(profile.role);
}

export function isAdmin(profile: Profile | null): boolean {
  return hasRole(profile, "ADMIN");
}

export function canModerate(profile: Profile | null): boolean {
  return hasRole(profile, "ADMIN", "MODERATOR");
}

export function isBusinessOwner(profile: Profile | null): boolean {
  return hasRole(profile, "BUSINESS_OWNER");
}

/**
 * Ownership check against a backend record's owner id. Ids are compared as
 * strings because the backend may serialise them as either numbers or strings.
 */
export function isOwner(
  profile: Profile | null,
  ownerId: number | string | null | undefined,
): boolean {
  if (!profile || ownerId === null || ownerId === undefined) return false;
  return String(profile.id) === String(ownerId);
}
