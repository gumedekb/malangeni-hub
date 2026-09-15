import type { ApiEvent, CommunityEvent } from "./types";
import { nameOf } from "./users";

/**
 * Converts a backend event into the shape the event components already render,
 * so real events and the mock ones in `data.ts` share one set of components.
 */
export function toCommunityEvent(e: ApiEvent): CommunityEvent {
  const d = new Date(e.startAt);
  return {
    id: e.id,
    day: String(d.getDate()),
    month: d.toLocaleString("en-ZA", { month: "short" }),
    time: d.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" }),
    title: e.title,
    location: e.location,
    tag: e.tag === "IMPORTANT" ? "important" : "fun",
    description: e.description ?? null,
    dateLabel: d.toLocaleDateString("en-ZA", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    organiser: e.organiser ? nameOf(e.organiser) : null,
    contactNumber: e.contactNumber ?? null,
    imageUrl: e.imageUrl ?? null,
  };
}

export const EVENT_STATUS_LABELS = {
  PENDING: "Waiting for approval",
  NEEDS_CHANGES: "Needs changes",
  APPROVED: "Approved",
} as const;

export const EVENT_STATUS_STYLES = {
  PENDING: "bg-paper text-muted",
  NEEDS_CHANGES: "bg-accent-soft text-accent",
  APPROVED: "bg-fun-soft text-fun",
} as const;
