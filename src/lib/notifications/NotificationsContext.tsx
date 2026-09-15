"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { api, COMMUNITY_ENDPOINTS, POST_ENDPOINTS, SERVICE_ENDPOINTS } from "@/lib/api";
import { useAuth } from "@/lib/auth/AuthContext";
import { timeAgo } from "@/lib/dates";
import { toCommunityEvent } from "@/lib/events";
import { postPath } from "@/lib/posts";
import { nameOf } from "@/lib/users";
import type {
  ApiEvent,
  ApiPost,
  ApiService,
  AppNotification,
  NotificationCategory,
  Page,
} from "@/lib/types";

/**
 * The bell's feed, built from what's really on the hub: new posts, upcoming
 * events and newly listed services (never your own). Which categories a member
 * wants, and which items they've opened, are kept in localStorage — a
 * server-side inbox is a later step.
 */

const PREFS_KEY = "malangeni.notif.prefs";
const READ_KEY = "malangeni.notif.read";
/** Fired on this tab when we write storage; other tabs get the browser's `storage` event. */
const CHANGE_EVENT = "malangeni-notifications";
/** Newest items kept in the bell. */
const MAX_ITEMS = 25;
/** Anything older than this isn't news any more. */
const MAX_AGE_DAYS = 30;
/** Read ids remembered, so storage doesn't grow for ever. */
const MAX_READ = 500;

type Preferences = Record<NotificationCategory, boolean>;

const DEFAULT_PREFS: Preferences = {
  jobs: true,
  events: true,
  news: true,
  services: true,
  community: true,
};

interface NotificationsContextValue {
  /** Notifications in the member's enabled categories, newest first. */
  visible: AppNotification[];
  /** Enabled-category notifications the member hasn't opened yet. */
  unreadCount: number;
  preferences: Preferences;
  isRead: (id: string) => boolean;
  markRead: (id: string) => void;
  markAllRead: () => void;
  toggleCategory: (category: NotificationCategory) => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

// localStorage as an external store: the server (and first client render) sees
// nothing stored, then the real values arrive without a hydration mismatch.
function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable (private mode) — the change just won't stick */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function parsePrefs(raw: string | null): Preferences {
  if (!raw) return DEFAULT_PREFS;
  try {
    // Merge over defaults so a newly-added category defaults to on.
    return { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<Preferences>) };
  } catch {
    return DEFAULT_PREFS;
  }
}

function parseRead(raw: string | null): Set<string> {
  if (!raw) return new Set();
  try {
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function fromPost(post: ApiPost): AppNotification {
  const category: NotificationCategory =
    post.type === "JOB" ? "jobs" : post.type === "COMMUNITY" ? "community" : "news";
  const label =
    post.type === "JOB"
      ? "New job"
      : post.type === "NOTICE"
        ? "Notice"
        : post.type === "COMMUNITY"
          ? "New discussion"
          : "News";
  const author = nameOf(post.author);
  return {
    id: `post-${post.id}`,
    category,
    title: `${label}: ${post.title}`,
    body: post.body ? `${author} · ${post.body}` : author,
    createdAt: post.createdAt,
    timeAgo: timeAgo(post.createdAt),
    href: postPath(post.id),
  };
}

function fromEvent(event: ApiEvent): AppNotification {
  const shown = toCommunityEvent(event);
  const when = event.createdAt ?? event.startAt;
  return {
    id: `event-${event.id}`,
    category: "events",
    title: `Event: ${event.title}`,
    body: `${shown.day} ${shown.month} · ${shown.time} · ${event.location}`,
    createdAt: when,
    timeAgo: timeAgo(when),
    href: `/events/${encodeURIComponent(event.id)}`,
  };
}

function fromService(service: ApiService, createdAt: string): AppNotification {
  return {
    id: `service-${service.id}`,
    category: "services",
    title: `New service: ${service.name}`,
    body: [nameOf(service.provider), service.areaServed].filter(Boolean).join(" · "),
    createdAt,
    timeAgo: timeAgo(createdAt),
    href: "/services",
  };
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const viewerId = profile ? String(profile.id) : null;

  const [items, setItems] = useState<AppNotification[]>([]);

  const prefsRaw = useSyncExternalStore(subscribe, () => readStorage(PREFS_KEY), () => null);
  const readRaw = useSyncExternalStore(subscribe, () => readStorage(READ_KEY), () => null);
  const preferences = useMemo(() => parsePrefs(prefsRaw), [prefsRaw]);
  const readIds = useMemo(() => parseRead(readRaw), [readRaw]);

  // Re-built when the viewer changes, so their own posts drop out.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [posts, events, services] = await Promise.all([
        api.get<Page<ApiPost>>(POST_ENDPOINTS.list({ size: 20 })).catch(() => null),
        api.get<Page<ApiEvent>>(COMMUNITY_ENDPOINTS.upcomingEvents).catch(() => null),
        api.get<Page<ApiService>>(SERVICE_ENDPOINTS.list).catch(() => null),
      ]);
      if (cancelled) return;
      const mine = (id?: string | null) => viewerId !== null && String(id) === viewerId;
      const all: AppNotification[] = [
        ...(posts?.content ?? []).filter((p) => !mine(p.authorId)).map(fromPost),
        ...(events?.content ?? []).filter((e) => !mine(e.organiserId)).map(fromEvent),
        ...(services?.content ?? [])
          .filter((s) => !!s.createdAt && !mine(s.providerId))
          .map((s) => fromService(s, s.createdAt!)),
      ];
      const cutoff = Date.now() - MAX_AGE_DAYS * 86_400_000;
      setItems(
        all
          .filter((n) => Date.parse(n.createdAt) >= cutoff)
          .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
          .slice(0, MAX_ITEMS),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [viewerId]);

  const toggleCategory = useCallback(
    (category: NotificationCategory) => {
      writeStorage(PREFS_KEY, JSON.stringify({ ...preferences, [category]: !preferences[category] }));
    },
    [preferences],
  );

  const saveRead = useCallback((next: Set<string>) => {
    writeStorage(READ_KEY, JSON.stringify([...next].slice(-MAX_READ)));
  }, []);

  const markRead = useCallback(
    (id: string) => {
      if (readIds.has(id)) return;
      saveRead(new Set(readIds).add(id));
    },
    [readIds, saveRead],
  );

  const visible = useMemo(() => items.filter((n) => preferences[n.category]), [items, preferences]);

  const markAllRead = useCallback(() => {
    const next = new Set(readIds);
    for (const n of visible) next.add(n.id);
    saveRead(next);
  }, [readIds, visible, saveRead]);

  const unreadCount = useMemo(
    () => visible.reduce((count, n) => (readIds.has(n.id) ? count : count + 1), 0),
    [visible, readIds],
  );

  const isRead = useCallback((id: string) => readIds.has(id), [readIds]);

  const value = useMemo(
    () => ({
      visible,
      unreadCount,
      preferences,
      isRead,
      markRead,
      markAllRead,
      toggleCategory,
    }),
    [visible, unreadCount, preferences, isRead, markRead, markAllRead, toggleCategory],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within a NotificationsProvider");
  return ctx;
}
