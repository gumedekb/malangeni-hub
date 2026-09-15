import type { NotificationCategory } from "@/lib/types";

/**
 * Presentation metadata for each notification category. `emoji` is the leading
 * icon, `dot` a Tailwind background class for the small colour dot, and `chip`
 * the pill styling used in the preferences list. Ordered as shown in the UI.
 */
export const NOTIFICATION_CATEGORIES: {
  key: NotificationCategory;
  label: string;
  description: string;
  emoji: string;
  dot: string;
  chip: string;
}[] = [
  {
    key: "jobs",
    label: "Job opportunities",
    description: "Local openings, learnerships and workshops",
    emoji: "💼",
    dot: "bg-gold",
    chip: "bg-tag text-gold",
  },
  {
    key: "events",
    label: "Events",
    description: "What's on around Malangeni",
    emoji: "📅",
    dot: "bg-accent",
    chip: "bg-accent-soft text-accent",
  },
  {
    key: "news",
    label: "News & notices",
    description: "Announcements from the hub",
    emoji: "📰",
    dot: "bg-ink",
    chip: "bg-card text-ink",
  },
  {
    key: "services",
    label: "Services",
    description: "New local services",
    emoji: "🛎️",
    dot: "bg-open",
    chip: "bg-fun-soft text-fun",
  },
  {
    key: "community",
    label: "Community activity",
    description: "New discussions",
    emoji: "💬",
    dot: "bg-fun",
    chip: "bg-fun-soft text-fun",
  },
];
