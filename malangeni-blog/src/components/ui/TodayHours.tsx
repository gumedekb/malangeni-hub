"use client";

import { useSyncExternalStore } from "react";
import { hasHours, libraryOpenNow, todayHours } from "@/lib/library";
import type { OpeningHoursFields } from "@/lib/types";

/** Re-checks once a minute so the badge flips at opening and closing time. */
function subscribe(onChange: () => void) {
  const id = window.setInterval(onChange, 60_000);
  return () => window.clearInterval(id);
}

const currentMinute = () => Math.floor(Date.now() / 60_000);

/**
 * "Open now · Today 08:00–16:30" or "Closed · Closed today", by the visitor's
 * clock. Nothing on the server (it doesn't know the visitor's time), and
 * nothing at all when the place has no hours listed.
 */
export function TodayHours({ hours, className = "" }: { hours: OpeningHoursFields; className?: string }) {
  const minute = useSyncExternalStore(subscribe, currentMinute, () => null);
  if (minute === null || !hasHours(hours)) return null;

  const now = new Date(minute * 60_000);
  const open = libraryOpenNow(hours, now);
  const today = todayHours(hours, now);

  return (
    <p className={`flex flex-wrap items-center gap-2 text-[12.5px] text-muted ${className}`}>
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-[2px] text-[10.5px] font-semibold uppercase tracking-[0.5px] ${
          open ? "bg-fun-soft text-open" : "bg-accent-soft text-accent"
        }`}
      >
        <span className={`size-[6px] rounded-full ${open ? "bg-open" : "bg-accent"}`} />
        {open ? "Open now" : "Closed"}
      </span>
      {today.open && today.close ? `Today ${today.open}–${today.close}` : "Closed today"}
    </p>
  );
}
