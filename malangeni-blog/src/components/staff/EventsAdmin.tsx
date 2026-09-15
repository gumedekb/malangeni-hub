"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { api, COMMUNITY_ENDPOINTS, STAFF_ENDPOINTS } from "@/lib/api";
import { EVENT_STATUS_LABELS, EVENT_STATUS_STYLES } from "@/lib/events";
import type { ApiEvent, EventStatus } from "@/lib/types";
import { EventTag } from "@/components/events/EventRow";
import { EventForm } from "@/components/events/EventForm";
import {
  ErrorLine,
  Fact,
  FormCard,
  formatDate,
  INPUT_CLASS,
  MemberLink,
  Note,
  Pager,
  PRIMARY_BUTTON,
  SECONDARY_BUTTON,
  TabButton,
  usePage,
} from "./ui";

const STATUSES: EventStatus[] = ["PENDING", "NEEDS_CHANGES", "APPROVED"];

/**
 * Hub team: the event approval queue (Pending → Approved / Needs changes, like
 * business verification), plus publishing the team's own events directly.
 */
export function EventsAdmin() {
  const [status, setStatus] = useState<EventStatus>("PENDING");
  const [pageNo, setPageNo] = useState(0);
  const [reload, setReload] = useState(0);
  const [creating, setCreating] = useState(false);
  const { page, error } = usePage<ApiEvent>(STAFF_ENDPOINTS.eventReview(status, pageNo), reload);

  function show(next: EventStatus) {
    setPageNo(0);
    setStatus(next);
  }

  return (
    <section>
      {creating ? (
        <FormCard title="Create an event">
          <p className="mb-4 text-[13px] text-muted">
            Events created by the hub team are published straight away.
          </p>
          <EventForm
            onSaved={() => {
              setCreating(false);
              setReload((n) => n + 1);
            }}
            onCancel={() => setCreating(false)}
          />
        </FormCard>
      ) : (
        <button type="button" onClick={() => setCreating(true)} className={`mb-6 ${PRIMARY_BUTTON}`}>
          Create an event
        </button>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <TabButton key={s} small active={status === s} onClick={() => show(s)}>
            {EVENT_STATUS_LABELS[s]}
          </TabButton>
        ))}
      </div>

      {error ? (
        <Note>{error}</Note>
      ) : !page ? (
        <Note>Loading…</Note>
      ) : page.content.length === 0 ? (
        <Note>
          {status === "PENDING"
            ? "No events waiting for approval."
            : status === "NEEDS_CHANGES"
              ? "No events waiting on their organisers."
              : "No approved upcoming events."}
        </Note>
      ) : (
        <div className="flex flex-col gap-4">
          {page.content.map((ev) => (
            <EventReviewCard key={ev.id} event={ev} onChanged={() => setReload((n) => n + 1)} />
          ))}
          <Pager page={page} onPage={setPageNo} />
        </div>
      )}
    </section>
  );
}

function EventReviewCard({ event, onChanged }: { event: ApiEvent; onChanged: () => void }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const status = event.status ?? "PENDING";

  async function act(url: string) {
    setError(null);
    setBusy(true);
    try {
      await api.post(url, note.trim() ? { note: note.trim() } : undefined);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the decision.");
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Delete “${event.title}”? It will be removed for everyone.`)) return;
    setError(null);
    setBusy(true);
    try {
      await api.del(COMMUNITY_ENDPOINTS.event(event.id));
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the event.");
      setBusy(false);
    }
  }

  return (
    <article className="overflow-hidden rounded-card border border-line bg-card">
      {event.imageUrl && (
        <Image
          src={event.imageUrl}
          alt={`${event.title} poster`}
          width={1200}
          height={675}
          unoptimized
          className="mx-auto block h-auto max-h-[240px] w-auto max-w-full"
        />
      )}
      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/events/${encodeURIComponent(event.id)}`} className="font-serif text-[18px] font-semibold hover:underline">
            {event.title}
          </Link>
          <EventTag tag={event.tag === "IMPORTANT" ? "important" : "fun"} />
          <span className={`rounded-full px-2.5 py-[3px] text-[11px] font-semibold ${EVENT_STATUS_STYLES[status]}`}>
            {EVENT_STATUS_LABELS[status]}
          </span>
        </div>

        <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-[13.5px] sm:grid-cols-2">
          <Fact label="When">{formatDate(event.startAt, true)}</Fact>
          <Fact label="Where">{event.location}</Fact>
          <Fact label="Contact">
            {event.contactNumber ? (
              <a href={`tel:${event.contactNumber}`} className="text-accent">
                {event.contactNumber}
              </a>
            ) : (
              "—"
            )}
          </Fact>
          <Fact label="Submitted by">
            <MemberLink user={event.organiser} />
          </Fact>
          <Fact label="Submitted on">{formatDate(event.createdAt)}</Fact>
          <Fact label="Picture">{event.imageUrl ? "Yes" : "None"}</Fact>
        </dl>
        {event.description && (
          <p className="mt-3 whitespace-pre-line text-[13.5px] text-muted">{event.description}</p>
        )}

        {event.reviewNote && (
          <p className="mt-3 rounded-lg border border-line bg-paper px-3.5 py-2.5 text-[13px] text-muted">
            {status === "PENDING" ? "Previously asked for" : "Last note"}
            {event.reviewedBy ? ` (${event.reviewedBy.username})` : ""}: “{event.reviewNote}”
          </p>
        )}

        <div className="mt-4 border-t border-line pt-4">
          {error && <ErrorLine>{error}</ErrorLine>}
          {status !== "NEEDS_CHANGES" && (
            <>
              <label htmlFor={`event-note-${event.id}`} className="mb-1.5 block text-[13px] font-medium">
                Note to the organiser (optional)
              </label>
              <textarea
                id={`event-note-${event.id}`}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                maxLength={1000}
                placeholder="e.g. Please add a poster, or confirm the hall is booked"
                className={INPUT_CLASS}
              />
              <p className="mt-1 text-[12px] text-muted">
                With “Needs changes” this tells them what to fix.
              </p>
            </>
          )}
          {status === "NEEDS_CHANGES" && (
            <p className="text-[13px] text-muted">
              Waiting for the organiser to make changes — it comes back to
              “Waiting for approval” when they do.
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {status !== "APPROVED" && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void act(STAFF_ENDPOINTS.approveEvent(event.id))}
                className={PRIMARY_BUTTON}
              >
                Approve
              </button>
            )}
            {status !== "NEEDS_CHANGES" && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void act(STAFF_ENDPOINTS.eventNeedsChanges(event.id))}
                className={SECONDARY_BUTTON}
              >
                Needs changes
              </button>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={() => void remove()}
              className={`${SECONDARY_BUTTON} text-accent`}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
