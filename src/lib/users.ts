import type { Profile } from "./auth/types";
import type { PublicUser } from "./types";

/** Small helpers for showing members and sending people to sign in. */

type Named = { username?: string | null; displayName?: string | null };

/** The name to show for a member: their Google name when known, otherwise their username. */
export function nameOf(user?: Named | null): string {
  return user?.displayName?.trim() || user?.username || "Member";
}

/** A member's public profile page. */
export function profileHref(username: string): string {
  return `/u/${encodeURIComponent(username)}`;
}

/**
 * The signed-in member as others see them. The API returns a new post or
 * comment without its author, so this fills the gap until the next load.
 */
export function asPublicUser(profile: Profile): PublicUser {
  return {
    id: String(profile.id),
    username: profile.username,
    displayName: profile.displayName ?? null,
    avatarUrl: profile.avatarUrl ?? null,
    // Backstage staff are shown to everyone as plain members.
    role: profile.backstage ? "USER" : profile.role,
    badge: profile.badge ?? null,
    createdAt: profile.createdAt,
  };
}

/** The sign-in page, coming back to `next` afterwards. */
export function loginHref(next?: string | null): string {
  return next && next !== "/login" ? `/login?next=${encodeURIComponent(next)}` : "/login";
}

/** `next` from the sign-in URL when it is a same-site path, otherwise home. */
export function safeNext(value: string | null | undefined): string {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/login")
    ? value
    : "/";
}
