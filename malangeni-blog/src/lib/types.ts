/**
 * Domain types for the Malangeni Hub frontend: the shapes the Spring Boot
 * backend returns, plus the display shapes the event rows and place cards use.
 */

/** An event in the shape the event rows and detail page render. */
export interface CommunityEvent {
  id: string;
  day: string;
  month: string;
  title: string;
  time: string;
  location: string;
  tag: "important" | "fun" | null;
  description?: string | null;
  dateLabel?: string;
  organiser?: string | null;
  contactNumber?: string | null;
  imageUrl?: string | null;
}

/**
 * Opening hours in three rows, as the library and places store them. Times are
 * "HH:mm:ss"; a null pair means closed that day, and all six null (places only)
 * means the hours aren't listed.
 */
export interface OpeningHoursFields {
  weekdayOpen?: string | null;
  weekdayClose?: string | null;
  saturdayOpen?: string | null;
  saturdayClose?: string | null;
  sundayOpen?: string | null;
  sundayClose?: string | null;
}

/** What a pasted Google Maps link says about a place (`POST /api/maps/lookup`). Times are "HH:mm". */
export interface MapsLookupResult extends OpeningHoursFields {
  name?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  mapsUrl?: string | null;
  hoursFound: boolean;
  /** Why the hours weren't filled in, or what to double-check. */
  note?: string | null;
}

/** A place on Explore, in the shape the cards render. */
export interface Place extends OpeningHoursFields {
  mapsUrl?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  id: string;
  name: string;
  /** Category name from the backend, e.g. "Learning". */
  category: string;
  image: string;
  location?: string;
  featured?: boolean;
  description?: string;
}

/** A place category (Learning, Health…). Staff add new ones while adding places. */
export interface ApiCategory {
  id: string;
  name: string;
}

/**
 * How another member appears: post authors, commenters, group members,
 * service providers. The backend's public projection — it never has an email.
 */
export interface PublicUser {
  id: string;
  username: string;
  /** Name from their Google account ("Thabo Mokoena"); filled in on their next sign-in. */
  displayName?: string | null;
  avatarUrl?: string | null;
  role?: string;
  badge?: string | null;
  createdAt?: string;
}

export type PostType = "COMMUNITY" | "NEWS" | "NOTICE" | "JOB" | "INFORMATIONAL";

/** A post as the backend returns it from `/api/posts`. */
export interface ApiPost {
  id: string;
  authorId: string;
  /** Missing on the response to creating a post — fill it from the signed-in profile. */
  author?: PublicUser | null;
  type: PostType;
  title: string;
  body: string;
  imageUrl?: string | null;
  groupId?: string | null;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  likedByCurrentUser?: boolean;
}

/** A comment on a post. A reply points at a top-level comment (one level deep). */
export interface ApiComment {
  id: string;
  postId: string;
  authorId: string;
  /** Missing on the response to adding a comment — fill it from the signed-in profile. */
  author?: PublicUser | null;
  body: string;
  parentCommentId?: string | null;
  createdAt: string;
}

/** What liking or unliking returns. */
export interface LikeSummary {
  likeCount: number;
  likedByCurrentUser: boolean;
}

/** `GET /api/users/recent`: the newest members and how many joined this week. */
export interface RecentMembers {
  members: PublicUser[];
  joinedThisWeek: number;
}

export type SponsorPlacement = "HOME" | "EXPLORE" | "COMMUNITY" | "SERVICES" | "FEED";

/** A booked sponsor slot from `/api/sponsors/active`. */
export interface ApiSponsor {
  id: string;
  title: string;
  pitch?: string | null;
  imageUrl?: string | null;
  targetUrl?: string | null;
  placement: SponsorPlacement;
}

/** Spring's `Page<T>` envelope. */
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  last: boolean;
  first: boolean;
  empty: boolean;
}

/** Malangeni Library details from `/api/library`. Times are "HH:mm:ss"; a null pair means closed. */
export interface LibraryDetails extends OpeningHoursFields {
  name: string;
  about?: string | null;
  location?: string | null;
  mapsUrl?: string | null;
  updatedAt?: string | null;
}

/**
 * Notification categories a member can opt in/out of. Each maps to a source of
 * updates on the hub (job openings, events, news, services, community
 * activity). Preferences are stored per-category — see NotificationsContext.
 */
export type NotificationCategory =
  | "jobs"
  | "events"
  | "news"
  | "services"
  | "community";

export interface AppNotification {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  /** Human-friendly relative time, e.g. "2 hours ago". */
  timeAgo: string;
  /** When the thing happened, for sorting. */
  createdAt: string;
  /** Where tapping the notification takes the member. */
  href: string;
}

/** A community group as the backend returns it. */
export interface ApiGroup {
  id: string;
  name: string;
  icon?: string | null;
  description?: string | null;
  memberCount?: number;
  /** Only present when the request was signed in. */
  joinedByCurrentUser?: boolean;
}

export interface GroupMembership {
  id: string;
  groupId: string;
  userId: string;
  user?: PublicUser;
  joinedAt: string;
}

/** An event as the backend returns it (`startAt` is local time, no zone). */
export interface ApiEvent {
  id: string;
  title: string;
  description?: string | null;
  location: string;
  startAt: string;
  tag: "IMPORTANT" | "FUN";
  organiserId?: string | null;
  status?: EventStatus;
  /** SA cellphone number — public on purpose, so people can ask for details. */
  contactNumber?: string | null;
  imageUrl?: string | null;
  /** The hub team's note to the organiser (what to change, or how it was checked). */
  reviewNote?: string | null;
  reviewedBy?: PublicUser | null;
  reviewedAt?: string | null;
  createdAt?: string;
  organiser?: PublicUser | null;
}

/**
 * A local business directory listing. Information only — the hub is not a shop
 * builder: no products, no ordering, no per-shop website.
 */
export interface Shop {
  id: string;
  ownerId: string;
  owner?: PublicUser;
  name: string;
  description?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  /** "HH:mm:ss" from the backend. */
  openingTime?: string | null;
  closingTime?: string | null;
  /** Set by the hub team; unapproved listings are hidden from the public. */
  approved: boolean;
  /** Set by the owner; false hides the listing without deleting it. */
  active: boolean;
  createdAt: string;
}

export interface ShopInput {
  name: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  openingTime?: string;
  closingTime?: string;
}

/** Mirrors badge requests: members submit, the hub team approves or sends it back. */
export type EventStatus = "PENDING" | "APPROVED" | "NEEDS_CHANGES";

/** What kind of service a member offers; labels and icons live in `lib/services.ts`. */
export type ServiceCategory =
  | "PLUMBING"
  | "ELECTRICAL"
  | "BUILDING"
  | "MECHANIC"
  | "TRANSPORT"
  | "TUTORING"
  | "HAIR_BEAUTY"
  | "CATERING"
  | "CLEANING"
  | "GARDENING"
  | "CHILDCARE"
  | "IT_REPAIRS"
  | "OTHER";

/**
 * A service a member offers, as the backend returns it. Listed by anyone,
 * approved by the hub team — same states as events.
 */
export interface ApiService {
  id: string;
  name: string;
  serviceCategory: ServiceCategory;
  description?: string | null;
  /** SA cellphone number — public on purpose, so people can get in touch. */
  contactNumber?: string | null;
  areaServed?: string | null;
  operatingHours?: string | null;
  imageUrl?: string | null;
  status?: EventStatus;
  reviewNote?: string | null;
  reviewedBy?: PublicUser | null;
  reviewedAt?: string | null;
  providerId?: string | null;
  provider?: PublicUser | null;
  createdAt?: string;
}

/** A place on Explore, as the backend's `/api/attractions` returns it. */
export interface ApiAttraction extends OpeningHoursFields {
  id: string;
  name: string;
  description?: string | null;
  location: string;
  imageUrl?: string | null;
  /** The place on Google Maps, for "Get directions". */
  mapsUrl?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  category?: { id: string; name: string } | null;
  averageRating?: number | null;
  ratingCount?: number | null;
}
