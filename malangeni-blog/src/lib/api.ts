/**
 * Central API client for the backend.
 *
 * Every backend call goes through `apiFetch`. It attaches the caller's Firebase
 * ID token as `Authorization: Bearer <idToken>` whenever someone is signed in,
 * and omits the header entirely when they are not — so the public GETs below
 * work signed out, and everything else is authenticated without callers having
 * to think about tokens.
 *
 * The token is read fresh on every request via `getIdToken()`, which refreshes
 * it automatically. ID tokens expire after an hour, so it is never cached here.
 *
 * Public (no auth required) GETs:
 *   /api/news, /api/attractions, /api/categories, /api/services, /api/projects,
 *   /api/posts, /api/groups, /api/events, /api/shops, /api/sponsors/active,
 *   /api/library
 * Everything else — and every POST/PUT/PATCH/DELETE — requires a signed-in user.
 *
 * The backend origin comes from NEXT_PUBLIC_API_BASE_URL. `next dev` reads it
 * live; `next build` bakes it in, so rebuild after changing it.
 */

import type { PostType } from "./types";

/** Backend origin, without a trailing slash. Paths below include `/api`. */
export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080"
).replace(/\/+$/, "");

export const AUTH_ENDPOINTS = {
  /** The backend's own user record. Creates the account on first call. */
  me: "/api/auth/me",
  /** Multipart avatar upload (field `file`); returns the updated user record. */
  avatar: "/api/users/me/avatar",
  /** A member asking a moderator to confirm they run a business. */
  badgeRequests: "/api/badge-requests",
  /** The member's own badge requests, newest first (for the rejection note). */
  myBadgeRequests: "/api/badge-requests/mine",
  /** First-sign-in answer: member, or formal/informal business owner. */
  onboarding: "/api/users/me/onboarding",
} as const;

/** Hub-team endpoints. The backend enforces the roles; the UI only hides them. */
export const STAFF_ENDPOINTS = {
  /** Admin/moderator: the verification queue, oldest first. */
  badgeRequests: (status: string, page = 0) =>
    `/api/badge-requests?status=${encodeURIComponent(status)}&page=${page}&size=20`,
  approve: (id: string) => `/api/badge-requests/${encodeURIComponent(id)}/approve`,
  reject: (id: string) => `/api/badge-requests/${encodeURIComponent(id)}/reject`,
  /** Admin only: every account, newest first. */
  users: (page = 0) => `/api/users?page=${page}&size=20&sort=createdAt,desc`,
  /** Admin only: USER ⇄ MODERATOR. ADMIN is set in backend config, never here. */
  role: (id: string) => `/api/users/${encodeURIComponent(id)}/role`,
  /** Verification log: who verified or rejected whom, newest first. */
  badgeLog: (page = 0) => `/api/badge-requests/log?page=${page}&size=20`,
  /** Directory listings: `approved=false` is the queue, `true` the live ones. */
  shops: (approved: boolean, page = 0) =>
    `/api/shops/review?approved=${approved}&page=${page}&size=20`,
  approveShop: (id: string, approved: boolean) =>
    `/api/shops/${encodeURIComponent(id)}/approve?approved=${approved}`,
  /** Take a member's business badge away (not admins). Also hides their listing. */
  revokeBusiness: (userId: string) =>
    `/api/badge-requests/users/${encodeURIComponent(userId)}/revoke`,
  /** Event approval queue. */
  eventReview: (status: string, page = 0) =>
    `/api/events/review?status=${encodeURIComponent(status)}&page=${page}&size=20`,
  approveEvent: (id: string) => `/api/events/${encodeURIComponent(id)}/approve`,
  eventNeedsChanges: (id: string) => `/api/events/${encodeURIComponent(id)}/needs-changes`,
};

/** Local business directory — listings only, no products or ordering. */
export const SHOP_ENDPOINTS = {
  /** Public: approved, visible listings. */
  list: (size = 50) => `/api/shops?size=${size}&sort=name,asc`,
  mine: "/api/shops/mine",
  create: "/api/shops",
  shop: (id: string) => `/api/shops/${encodeURIComponent(id)}`,
  active: (id: string, active: boolean) =>
    `/api/shops/${encodeURIComponent(id)}/active?active=${active}`,
};

export const COMMUNITY_ENDPOINTS = {
  groups: "/api/groups",
  group: (id: string) => `/api/groups/${encodeURIComponent(id)}`,
  join: (id: string) => `/api/groups/${encodeURIComponent(id)}/join`,
  leave: (id: string) => `/api/groups/${encodeURIComponent(id)}/leave`,
  members: (id: string) => `/api/groups/${encodeURIComponent(id)}/members`,
  upcomingEvents: "/api/events/upcoming?size=50",
  event: (id: string) => `/api/events/${encodeURIComponent(id)}`,
  /** POST: any signed-in member submits an event (starts PENDING). */
  events: "/api/events",
  /** The caller's own upcoming events in every status. */
  myEvents: "/api/events/mine",
  /** Multipart (field `file`): optional event picture. */
  eventImage: (id: string) => `/api/events/${encodeURIComponent(id)}/image`,
};

/** Places on Explore (the backend calls them attractions), with average ratings. */
export const PLACE_ENDPOINTS = {
  /** Public: every place (Explore sorts them by rating). */
  list: "/api/attractions?size=100",
  /** Hub team list, alphabetical. */
  all: "/api/attractions?size=200&sort=name,asc",
  create: "/api/attractions",
  place: (id: string) => `/api/attractions/${encodeURIComponent(id)}`,
  /** Multipart (field `file`) adds or replaces the picture; DELETE removes it. Hub team only. */
  image: (id: string) => `/api/attractions/${encodeURIComponent(id)}/image`,
  /** Public list; POST (hub team) adds one. */
  categories: "/api/categories",
};

/** Services members offer (plumbing, transport, tutoring…), approved by the hub team. */
export const SERVICE_ENDPOINTS = {
  /** Public: approved listings, alphabetical. */
  list: "/api/services?size=100",
  create: "/api/services",
  service: (id: string) => `/api/services/${encodeURIComponent(id)}`,
  /** The caller's own listings in every status. */
  mine: "/api/services/mine",
  /** Multipart (field `file`): optional picture. */
  image: (id: string) => `/api/services/${encodeURIComponent(id)}/image`,
  /** Hub team. */
  review: (status: string, page = 0) =>
    `/api/services/review?status=${encodeURIComponent(status)}&page=${page}&size=20`,
  approve: (id: string) => `/api/services/${encodeURIComponent(id)}/approve`,
  needsChanges: (id: string) => `/api/services/${encodeURIComponent(id)}/needs-changes`,
};

/** Filters for the post feed; all optional, and combined when several are given. */
export interface PostQuery {
  /** Any of these types — the home feed asks for news, notices and jobs together. */
  types?: PostType[];
  groupId?: string;
  authorId?: number | string;
  page?: number;
  size?: number;
}

/** Community posts: discussions, news, notices and jobs, optionally tagged to a group. */
export const POST_ENDPOINTS = {
  /** Public, newest first. */
  list: ({ types, groupId, authorId, page = 0, size = 10 }: PostQuery = {}) => {
    const query = new URLSearchParams({ page: String(page), size: String(size), sort: "createdAt,desc" });
    for (const type of types ?? []) query.append("type", type);
    if (groupId) query.set("groupId", groupId);
    if (authorId !== undefined && authorId !== null) query.set("authorId", String(authorId));
    return `/api/posts?${query}`;
  },
  create: "/api/posts",
  post: (id: string) => `/api/posts/${encodeURIComponent(id)}`,
  /** POST to like, DELETE to unlike — both idempotent, both return the new count. */
  likes: (id: string) => `/api/posts/${encodeURIComponent(id)}/likes`,
  /** Multipart (field `file`): optional picture, author or hub team. */
  image: (id: string) => `/api/posts/${encodeURIComponent(id)}/image`,
  /** GET (public, oldest first) or POST a comment; a reply sends `parentCommentId`. */
  comments: (id: string) => `/api/posts/${encodeURIComponent(id)}/comments`,
  /** DELETE: the comment's author or the hub team. Its replies go with it. */
  comment: (postId: string, commentId: string) =>
    `/api/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}`,
};

/** Malangeni Library's details: public GET, hub-team PUT. */
export const LIBRARY_ENDPOINT = "/api/library";

/** Another member's public profile. Requires sign-in; never returns email. */
export const publicProfilePath = (username: string) =>
  `/api/users/profile/${encodeURIComponent(username)}`;

/** Members (signed-in only). */
export const MEMBER_ENDPOINTS = {
  /** The newest members, and how many joined this week. */
  recent: (size = 8) => `/api/users/recent?size=${size}`,
  /** DELETE: the member's own account and everything they posted. Never an admin. */
  account: (id: number | string) => `/api/users/${encodeURIComponent(String(id))}`,
};

/** Paid placements. Public; empty (null here) when nothing is booked for the slot. */
export const SPONSOR_ENDPOINTS = {
  active: (placement: string) => `/api/sponsors/active?placement=${encodeURIComponent(placement)}`,
};

/** Error carrying the HTTP status so callers can branch on 401 vs 403 etc. */
export class ApiError extends Error {
  status: number;
  /** Parsed response body, when the server sent JSON. */
  body: unknown;

  constructor(message: string, status: number, body: unknown = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }

  /** Signed in, but lacking the role or ownership the endpoint requires. */
  get isForbidden(): boolean {
    return this.status === 403;
  }

  /** The backend was unreachable (network error, CORS, backend down). */
  get isNetworkError(): boolean {
    return this.status === 0;
  }
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Current Firebase ID token, or null when nobody is signed in.
 *
 * Firebase is imported dynamically and only in the browser: there is no signed-in
 * user during server rendering, and this keeps the SDK out of server bundles so
 * server components can still call the public endpoints.
 */
async function currentIdToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const { auth } = await import("@/lib/firebase");
  // On a fresh page load the persisted session is restored asynchronously;
  // without this, `currentUser` is still null and the first request would go
  // out unauthenticated.
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user) return null;
  try {
    return await user.getIdToken();
  } catch {
    // Token could not be minted or refreshed — fall back to an anonymous
    // request and let the backend answer with 401 if auth was required.
    return null;
  }
}

/**
 * A 401 means the token is missing, expired or rejected. There is nothing to
 * retry — drop the Firebase session so `onAuthStateChanged` clears the app
 * state and the sign-in screen comes back.
 */
async function handleUnauthorized(): Promise<void> {
  if (typeof window === "undefined") return;
  const { auth } = await import("@/lib/firebase");
  if (!auth.currentUser) return;
  const { signOut } = await import("firebase/auth");
  await signOut(auth).catch(() => {
    /* already signed out or offline — the 401 still propagates to the caller */
  });
}

/**
 * Thin fetch wrapper: prefixes the backend origin, sends and receives JSON,
 * attaches the Firebase ID token when signed in, and throws an `ApiError`
 * carrying the server's message on any non-2xx response.
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const { headers, body, ...rest } = options;
  const token = await currentIdToken();

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      body,
      headers: {
        Accept: "application/json",
        // Only on requests that actually carry a body, so plain GETs stay simple.
        // Never for FormData: the browser must set multipart/form-data itself,
        // with the boundary — a manual Content-Type here breaks the upload.
        ...(body && !(body instanceof FormData)
          ? { "Content-Type": "application/json" }
          : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
  } catch {
    throw new ApiError(
      `Could not reach the server at ${API_BASE_URL}. Check that the backend is running and that this origin is allowed by its CORS config.`,
      0,
    );
  }

  const text = await res.text();
  const data = text ? safeJson(text) : null;

  if (!res.ok) {
    const bodyJson = (data ?? {}) as { message?: unknown; error?: unknown };
    const fromBody =
      typeof bodyJson.message === "string"
        ? bodyJson.message
        : typeof bodyJson.error === "string"
          ? bodyJson.error
          : "";

    if (res.status === 401) {
      await handleUnauthorized();
      throw new ApiError(
        fromBody || "Your session has expired. Please sign in again.",
        401,
        data,
      );
    }

    if (res.status === 403) {
      // Signed in, just not allowed. Keep the session — the caller shows a
      // permission message.
      throw new ApiError(
        fromBody || "You don't have permission to do that.",
        403,
        data,
      );
    }

    // Spring often sends an empty body and no statusText, which used to leave
    // callers staring at a bare "Request failed". Naming the status and path
    // makes the common deployment mismatches self-diagnosing — a 404 here means
    // the backend has no handler mapped at that route.
    throw new ApiError(
      fromBody ||
        `${res.status}${res.statusText ? ` ${res.statusText}` : ""} from ${path}`,
      res.status,
      data,
    );
  }

  return data as T;
}

/** Convenience verbs over `apiFetch`. Bodies are serialised as JSON. */
export const api = {
  get: <T>(path: string, options?: RequestInit) =>
    apiFetch<T>(path, { ...options, method: "GET" }),

  post: <T>(path: string, payload?: unknown, options?: RequestInit) =>
    apiFetch<T>(path, {
      ...options,
      method: "POST",
      body: payload === undefined ? undefined : JSON.stringify(payload),
    }),

  /** Multipart POST for file uploads. The FormData is sent as-is, unserialised. */
  postForm: <T>(path: string, form: FormData, options?: RequestInit) =>
    apiFetch<T>(path, { ...options, method: "POST", body: form }),

  put: <T>(path: string, payload?: unknown, options?: RequestInit) =>
    apiFetch<T>(path, {
      ...options,
      method: "PUT",
      body: payload === undefined ? undefined : JSON.stringify(payload),
    }),

  patch: <T>(path: string, payload?: unknown, options?: RequestInit) =>
    apiFetch<T>(path, {
      ...options,
      method: "PATCH",
      body: payload === undefined ? undefined : JSON.stringify(payload),
    }),

  del: <T>(path: string, options?: RequestInit) =>
    apiFetch<T>(path, { ...options, method: "DELETE" }),
};
