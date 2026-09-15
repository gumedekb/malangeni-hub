"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { NOTIFICATION_CATEGORIES } from "@/lib/notifications/categories";
import { useNotifications } from "@/lib/notifications/NotificationsContext";
import type { AppNotification, NotificationCategory } from "@/lib/types";

type View = "inbox" | "settings";

const META = Object.fromEntries(
  NOTIFICATION_CATEGORIES.map((c) => [c.key, c]),
) as Record<NotificationCategory, (typeof NOTIFICATION_CATEGORIES)[number]>;

/**
 * The header notification bell: an unread badge plus a dropdown that switches
 * between an inbox (latest jobs, events, alerts…) and a settings view where the
 * member chooses which categories they want to hear about.
 */
export function NotificationBell() {
  const {
    visible,
    unreadCount,
    preferences,
    isRead,
    markRead,
    markAllRead,
    toggleCategory,
  } = useNotifications();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("inbox");
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Always reopen on the inbox tab.
  const toggleOpen = () => {
    if (!open) setView("inbox");
    setOpen(!open);
  };

  const badge = unreadCount > 9 ? "9+" : String(unreadCount);
  const anyEnabled = useMemo(
    () => Object.values(preferences).some(Boolean),
    [preferences],
  );

  const openNotification = (n: AppNotification) => {
    markRead(n.id);
    setOpen(false);
    router.push(n.href);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={toggleOpen}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        className="relative grid size-9 cursor-pointer place-items-center rounded-full text-muted transition hover:bg-card hover:text-ink"
      >
        <svg
          className="size-[22px]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid min-w-[17px] place-items-center rounded-full border-2 border-paper bg-accent px-1 text-[10px] font-bold leading-[14px] text-white">
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="fixed inset-x-3 top-[78px] z-40 origin-top animate-menu-in overflow-hidden rounded-2xl border border-line bg-card shadow-[0_16px_44px_rgba(0,0,0,0.2)] motion-reduce:animate-none sm:absolute sm:inset-x-auto sm:right-0 sm:top-[calc(100%+12px)] sm:w-[384px] sm:origin-top-right"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
            <div className="flex items-center gap-2">
              {view === "settings" && (
                <button
                  type="button"
                  onClick={() => setView("inbox")}
                  aria-label="Back to notifications"
                  className="-ml-1 grid size-7 place-items-center rounded-full text-muted transition hover:bg-paper hover:text-ink"
                >
                  <svg
                    className="size-[18px]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M15 6l-6 6 6 6" />
                  </svg>
                </button>
              )}
              <h2 className="font-serif text-[17px] font-semibold">
                {view === "inbox" ? "Notifications" : "Choose notifications"}
              </h2>
            </div>

            {view === "inbox" ? (
              <button
                type="button"
                onClick={() => setView("settings")}
                aria-label="Notification settings"
                className="grid size-8 place-items-center rounded-full text-muted transition hover:bg-paper hover:text-ink"
              >
                <svg
                  className="size-[19px]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="grid size-8 place-items-center rounded-full text-muted transition hover:bg-paper hover:text-ink"
              >
                <svg
                  className="size-[18px]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            )}
          </div>

          {view === "inbox" ? (
            <InboxView
              items={visible}
              isRead={isRead}
              unreadCount={unreadCount}
              anyEnabled={anyEnabled}
              onOpen={openNotification}
              onMarkAllRead={markAllRead}
              onOpenSettings={() => setView("settings")}
            />
          ) : (
            <SettingsView
              preferences={preferences}
              onToggle={toggleCategory}
            />
          )}
        </div>
      )}
    </div>
  );
}

function InboxView({
  items,
  isRead,
  unreadCount,
  anyEnabled,
  onOpen,
  onMarkAllRead,
  onOpenSettings,
}: {
  items: AppNotification[];
  isRead: (id: string) => boolean;
  unreadCount: number;
  anyEnabled: boolean;
  onOpen: (n: AppNotification) => void;
  onMarkAllRead: () => void;
  onOpenSettings: () => void;
}) {
  return (
    <>
      <div className="max-h-[min(66vh,420px)] overflow-y-auto">
        {items.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <div className="mx-auto grid size-11 place-items-center rounded-full bg-paper text-xl">
              {anyEnabled ? "🎉" : "🔕"}
            </div>
            <p className="mt-3 text-sm font-semibold">
              {anyEnabled ? "You're all caught up" : "Notifications are off"}
            </p>
            <p className="mt-1 text-[13px] text-muted">
              {anyEnabled ? (
                "New updates will show up here."
              ) : (
                <>
                  Turn some on in{" "}
                  <button
                    type="button"
                    onClick={onOpenSettings}
                    className="font-semibold text-accent underline underline-offset-2"
                  >
                    settings
                  </button>
                  .
                </>
              )}
            </p>
          </div>
        ) : (
          <ul>
            {items.map((n) => {
              const meta = META[n.category];
              const read = isRead(n.id);
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => onOpen(n)}
                    className={`flex w-full gap-3 border-b border-line px-4 py-3 text-left transition hover:bg-paper ${
                      read ? "" : "bg-accent-soft/40"
                    }`}
                  >
                    <span
                      className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-paper text-[17px]"
                      aria-hidden
                    >
                      {meta.emoji}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span
                          className={`truncate text-[14px] ${
                            read ? "font-medium" : "font-semibold"
                          }`}
                        >
                          {n.title}
                        </span>
                        {!read && (
                          <span
                            className="size-2 shrink-0 rounded-full bg-accent"
                            aria-label="Unread"
                          />
                        )}
                      </span>
                      <span className="mt-0.5 line-clamp-2 block text-[12.5px] leading-snug text-muted">
                        {n.body}
                      </span>
                      <span className="mt-1 flex items-center gap-1.5">
                        <span
                          className={`inline-block rounded-full px-2 py-px text-[10px] font-semibold uppercase tracking-[0.4px] ${meta.chip}`}
                        >
                          {meta.label}
                        </span>
                        <span className="text-[11px] text-muted">
                          {n.timeAgo}
                        </span>
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-line px-3 py-2">
        <button
          type="button"
          onClick={onMarkAllRead}
          disabled={unreadCount === 0}
          className="rounded-lg px-2 py-1.5 text-[13px] font-semibold text-ink transition enabled:hover:bg-paper disabled:cursor-not-allowed disabled:text-muted"
        >
          Mark all as read
        </button>
        <button
          type="button"
          onClick={onOpenSettings}
          className="rounded-lg px-2 py-1.5 text-[13px] font-semibold text-accent transition hover:bg-accent-soft"
        >
          Manage
        </button>
      </div>
    </>
  );
}

function SettingsView({
  preferences,
  onToggle,
}: {
  preferences: Record<NotificationCategory, boolean>;
  onToggle: (category: NotificationCategory) => void;
}) {
  return (
    <div className="max-h-[min(66vh,460px)] overflow-y-auto p-2">
      <p className="px-2 pb-1 pt-2 text-[12.5px] text-muted">
        Pick the updates you want. Turn a category off to stop those
        notifications.
      </p>
      <ul>
        {NOTIFICATION_CATEGORIES.map((c) => {
          const on = preferences[c.key];
          return (
            <li key={c.key}>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-paper">
                <span
                  className="grid size-9 shrink-0 place-items-center rounded-full bg-paper text-[17px]"
                  aria-hidden
                >
                  {c.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-semibold">
                    {c.label}
                  </span>
                  <span className="block text-[12px] text-muted">
                    {c.description}
                  </span>
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  aria-label={`${on ? "Disable" : "Enable"} ${c.label}`}
                  onClick={() => onToggle(c.key)}
                  className={`relative h-[26px] w-[44px] shrink-0 rounded-full transition-colors ${
                    on ? "bg-accent" : "bg-line"
                  }`}
                >
                  <span
                    className={`absolute top-[3px] size-5 rounded-full bg-white shadow-sm transition-[left] ${
                      on ? "left-[21px]" : "left-[3px]"
                    }`}
                  />
                </button>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
