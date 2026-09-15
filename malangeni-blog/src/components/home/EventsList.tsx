"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, COMMUNITY_ENDPOINTS } from "@/lib/api";
import { toCommunityEvent } from "@/lib/events";
import type { ApiEvent, CommunityEvent, Page } from "@/lib/types";
import { EventRow } from "@/components/events/EventRow";

/** The next few approved events, for the home page. */
export function EventsList() {
  const [events, setEvents] = useState<CommunityEvent[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const page = await api.get<Page<ApiEvent>>(COMMUNITY_ENDPOINTS.upcomingEvents);
        if (!cancelled) setEvents((page?.content ?? []).slice(0, 3).map(toCommunityEvent));
      } catch {
        if (!cancelled) setEvents([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <aside className="flex flex-col gap-3.5">
      <div className="flex items-baseline justify-between">
        <h3 className="font-serif text-xl font-semibold">Events</h3>
        <Link href="/events" className="text-[13px] font-semibold text-accent">
          See all →
        </Link>
      </div>

      {events === null ? (
        <p className="text-[13.5px] text-muted">Loading…</p>
      ) : events.length === 0 ? (
        <p className="rounded-[10px] border border-dashed border-line bg-card px-4 py-3.5 text-[13.5px] text-muted">
          Nothing coming up yet.{" "}
          <Link href="/events/new" className="font-semibold text-accent">
            Submit an event
          </Link>
        </p>
      ) : (
        events.map((event) => <EventRow key={event.id} event={event} />)
      )}
    </aside>
  );
}
