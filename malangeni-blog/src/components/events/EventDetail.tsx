"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { api, ApiError, COMMUNITY_ENDPOINTS } from "@/lib/api";
import { useAuth } from "@/lib/auth/AuthContext";
import { EVENT_STATUS_LABELS, toCommunityEvent } from "@/lib/events";
import type { ApiEvent } from "@/lib/types";
import { EventTag } from "./EventRow";
import { ShareButton } from "@/components/posts/ShareButton";

/**
 * One event in full. The backend only returns an unapproved event to its
 * organiser and the hub team.
 */
export function EventDetail({ id }: { id: string }) {
  const { profile } = useAuth();
  const viewerId = profile ? String(profile.id) : null;
  const [raw, setRaw] = useState<ApiEvent | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const e = await api.get<ApiEvent>(COMMUNITY_ENDPOINTS.event(id));
        if (!cancelled) {
          setRaw(e);
          setError(null);
        }
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof ApiError && err.status === 404
            ? "We couldn't find that event. It may have been cancelled or already happened."
            : err instanceof Error
              ? err.message
              : "Could not load this event.",
        );
      }
    })();
    return () => {
      cancelled = true;
    };
    // Re-fetch once the viewer is known: a pending event is only visible to its organiser.
  }, [id, viewerId]);

  const event = raw ? toCommunityEvent(raw) : null;

  if (error && !event) return <Note>{error}</Note>;
  if (!event) return <Note>Loading…</Note>;

  const status = raw?.status;

  return (
    <div className="w-full max-w-[680px] pb-16">
      <div className="flex items-center justify-between gap-3">
        <Link href="/events" className="text-[13px] font-semibold text-accent">
          ← All events
        </Link>
        <ShareButton path={`/events/${encodeURIComponent(id)}`} title={event.title} className="text-[13px] text-muted" />
      </div>

      {status && status !== "APPROVED" && (
        <p className="mt-4 rounded-lg border border-accent bg-accent-soft px-3.5 py-2.5 text-[13px] text-accent">
          {EVENT_STATUS_LABELS[status]} — only the organiser and the hub team can
          see this event.
          {status === "NEEDS_CHANGES" && raw?.reviewNote ? ` Note: “${raw.reviewNote}”` : ""}
        </p>
      )}

      <article className="mt-4 overflow-hidden rounded-card border border-line border-l-[3px] border-l-accent bg-card">
        {event.imageUrl && (
          <Image
            src={event.imageUrl}
            alt={`${event.title} poster`}
            width={1200}
            height={675}
            unoptimized
            className="mx-auto block h-auto max-h-[560px] w-auto max-w-full"
          />
        )}
        <div className="flex items-center gap-5 p-6">
          <div className="min-w-[64px] text-center">
            <div className="font-serif text-[34px] font-semibold leading-none">
              {event.day}
            </div>
            <div className="mt-1 text-[11px] uppercase tracking-[1px] text-muted">
              {event.month}
            </div>
          </div>
          <div className="min-w-0">
            <h2 className="flex flex-wrap items-center font-serif text-[24px] font-semibold">
              {event.title}
              <EventTag tag={event.tag} />
            </h2>
            {event.dateLabel && (
              <p className="mt-1 text-[13px] text-muted">{event.dateLabel}</p>
            )}
          </div>
        </div>

        <dl className="grid grid-cols-1 gap-4 border-t border-line p-6 sm:grid-cols-2">
          <Fact label="Starts">{event.time}</Fact>
          <Fact label="Where">{event.location}</Fact>
          {event.organiser && <Fact label="Organised by">{event.organiser}</Fact>}
          {event.contactNumber && (
            <Fact label="Contact">
              <a href={`tel:${event.contactNumber}`} className="font-semibold text-accent">
                {event.contactNumber}
              </a>
            </Fact>
          )}
        </dl>

        <div className="border-t border-line p-6">
          <h3 className="text-[12px] font-semibold uppercase tracking-[0.5px] text-muted">
            About this event
          </h3>
          <p className="mt-2 whitespace-pre-line text-[14.5px] leading-relaxed">
            {event.description || "More details will be shared closer to the day."}
          </p>
          {event.contactNumber && (
            <p className="mt-3 text-[13px] text-muted">
              Want to know more? Call or WhatsApp the organiser on{" "}
              <a href={`tel:${event.contactNumber}`} className="font-semibold text-accent">
                {event.contactNumber}
              </a>
              .
            </p>
          )}
        </div>
      </article>
    </div>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[12px] font-semibold uppercase tracking-[0.5px] text-muted">
        {label}
      </dt>
      <dd className="mt-0.5 text-[14.5px]">{children}</dd>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="py-14 text-[14px] text-muted">{children}</p>;
}
