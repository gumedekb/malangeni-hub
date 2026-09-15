"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, COMMUNITY_ENDPOINTS } from "@/lib/api";
import { toCommunityEvent } from "@/lib/events";
import type { ApiEvent, CommunityEvent, Page } from "@/lib/types";
import { EventRow } from "./EventRow";
import { MyEvents } from "./MyEvents";

/**
 * Every approved upcoming event. Signed-in members also see their own
 * submissions, whatever their status.
 */
export function EventsIndex() {
  const [events, setEvents] = useState<CommunityEvent[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const page = await api.get<Page<ApiEvent>>(COMMUNITY_ENDPOINTS.upcomingEvents);
        if (!cancelled) setEvents((page?.content ?? []).map(toCommunityEvent));
      } catch {
        if (!cancelled) setEvents([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="max-w-[680px] pb-16">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-card p-5">
        <p className="text-[14px] text-muted">
          Organising something? Share it with the community.
        </p>
        <Link
          href="/events/new"
          className="rounded-lg bg-accent px-4 py-2.5 text-[13px] font-semibold text-white transition hover:opacity-95"
        >
          Submit an event
        </Link>
      </div>

      <MyEvents />

      <h2 className="mb-3 font-serif text-[20px] font-semibold">Coming up</h2>
      {!events ? (
        <p className="py-10 text-[14px] text-muted">Loading…</p>
      ) : events.length === 0 ? (
        <p className="rounded-card border border-dashed border-line bg-card p-6 text-[14px] text-muted">
          Nothing is coming up yet.
        </p>
      ) : (
        <div className="flex flex-col gap-3.5">
          {events.map((event) => (
            <EventRow key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
