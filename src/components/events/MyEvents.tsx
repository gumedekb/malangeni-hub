"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, COMMUNITY_ENDPOINTS } from "@/lib/api";
import { useAuth } from "@/lib/auth/AuthContext";
import { EVENT_STATUS_LABELS, EVENT_STATUS_STYLES } from "@/lib/events";
import type { ApiEvent } from "@/lib/types";
import { formatDate, SECONDARY_BUTTON } from "@/components/staff/ui";
import { EventForm } from "./EventForm";

/**
 * The signed-in member's own upcoming events in every status, so they can
 * follow the review, fix what the hub team asked for, or cancel.
 */
export function MyEvents() {
  const { profile } = useAuth();
  const viewerId = profile ? String(profile.id) : null;
  const [events, setEvents] = useState<ApiEvent[] | null>(null);
  const [reload, setReload] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!viewerId) return;
    let cancelled = false;
    void (async () => {
      try {
        const mine = await api.get<ApiEvent[]>(COMMUNITY_ENDPOINTS.myEvents);
        if (!cancelled) setEvents(mine ?? []);
      } catch {
        if (!cancelled) setEvents([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [viewerId, reload]);

  if (!viewerId || !events || events.length === 0) return null;

  async function cancel(event: ApiEvent) {
    if (!window.confirm(`Cancel “${event.title}”? It will be removed for everyone.`)) return;
    setBusy(event.id);
    setNotice(null);
    try {
      await api.del(COMMUNITY_ENDPOINTS.event(event.id));
      setNotice("Event cancelled.");
      setReload((n) => n + 1);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not cancel the event.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="mb-8">
      <h2 className="font-serif text-[20px] font-semibold">Your events</h2>
      {notice && (
        <p role="status" className="mt-3 rounded-lg border border-line bg-fun-soft px-3.5 py-2.5 text-[13px] text-fun">
          {notice}
        </p>
      )}
      <div className="mt-3 flex flex-col gap-3">
        {events.map((ev) => {
          const status = ev.status ?? "PENDING";
          return (
            <article key={ev.id} className="rounded-card border border-line bg-card p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/events/${encodeURIComponent(ev.id)}`} className="font-semibold hover:underline">
                  {ev.title}
                </Link>
                <span className={`rounded-full px-2.5 py-[3px] text-[11px] font-semibold ${EVENT_STATUS_STYLES[status]}`}>
                  {EVENT_STATUS_LABELS[status]}
                </span>
              </div>
              <p className="mt-1 text-[13px] text-muted">
                {formatDate(ev.startAt, true)} · {ev.location}
              </p>

              {status === "NEEDS_CHANGES" && (
                <p className="mt-3 rounded-lg border border-accent bg-accent-soft px-3.5 py-2.5 text-[13px] text-accent">
                  The hub team asked for changes
                  {ev.reviewNote ? `: “${ev.reviewNote}”` : "."} Edit the event
                  and it goes back for approval.
                </p>
              )}
              {status === "PENDING" && (
                <p className="mt-2 text-[12.5px] text-muted">
                  Only you and the hub team can see it until it&apos;s approved.
                </p>
              )}

              {editingId === ev.id ? (
                <div className="mt-4 border-t border-line pt-4">
                  <EventForm
                    event={ev}
                    onSaved={(saved, warning) => {
                      setEditingId(null);
                      setNotice(
                        warning ??
                          (saved.status === "APPROVED"
                            ? "Saved."
                            : "Saved — your changes are waiting for approval."),
                      );
                      setReload((n) => n + 1);
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                </div>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => setEditingId(ev.id)} className={SECONDARY_BUTTON}>
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={busy === ev.id}
                    onClick={() => void cancel(ev)}
                    className={`${SECONDARY_BUTTON} text-accent`}
                  >
                    Cancel event
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
