"use client";

import { useState } from "react";
import Image from "next/image";
import { api, SERVICE_ENDPOINTS } from "@/lib/api";
import { EVENT_STATUS_LABELS, EVENT_STATUS_STYLES } from "@/lib/events";
import { categoryInfo } from "@/lib/services";
import type { ApiService, EventStatus } from "@/lib/types";
import { ServiceForm } from "@/components/services/ServiceForm";
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

/** Hub team: the service approval queue — same flow as events. */
export function ServicesAdmin() {
  const [status, setStatus] = useState<EventStatus>("PENDING");
  const [pageNo, setPageNo] = useState(0);
  const [reload, setReload] = useState(0);
  const [creating, setCreating] = useState(false);
  const { page, error } = usePage<ApiService>(SERVICE_ENDPOINTS.review(status, pageNo), reload);

  function show(next: EventStatus) {
    setPageNo(0);
    setStatus(next);
  }

  return (
    <section>
      {creating ? (
        <FormCard title="List a service">
          <p className="mb-4 text-[13px] text-muted">
            Services listed by the hub team are published straight away.
          </p>
          <ServiceForm
            onSaved={() => {
              setCreating(false);
              setReload((n) => n + 1);
            }}
            onCancel={() => setCreating(false)}
          />
        </FormCard>
      ) : (
        <button type="button" onClick={() => setCreating(true)} className={`mb-6 ${PRIMARY_BUTTON}`}>
          List a service
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
            ? "No services waiting for approval."
            : status === "NEEDS_CHANGES"
              ? "No services waiting on their providers."
              : "No approved services yet."}
        </Note>
      ) : (
        <div className="flex flex-col gap-4">
          {page.content.map((s) => (
            <ServiceReviewCard key={s.id} service={s} onChanged={() => setReload((n) => n + 1)} />
          ))}
          <Pager page={page} onPage={setPageNo} />
        </div>
      )}
    </section>
  );
}

function ServiceReviewCard({ service, onChanged }: { service: ApiService; onChanged: () => void }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const status = service.status ?? "PENDING";
  const category = categoryInfo(service.serviceCategory);

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
    if (!window.confirm(`Delete “${service.name}”? It will be removed for everyone.`)) return;
    setError(null);
    setBusy(true);
    try {
      await api.del(SERVICE_ENDPOINTS.service(service.id));
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the service.");
      setBusy(false);
    }
  }

  return (
    <article className="overflow-hidden rounded-card border border-line bg-card">
      {service.imageUrl && (
        <Image
          src={service.imageUrl}
          alt=""
          width={1200}
          height={675}
          unoptimized
          className="mx-auto block h-auto max-h-[220px] w-auto max-w-full"
        />
      )}
      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-serif text-[18px] font-semibold">
            {category.icon} {service.name}
          </h3>
          <span className="rounded-full bg-tag px-2.5 py-[3px] text-[10px] font-semibold uppercase tracking-[0.5px] text-gold">
            {category.label}
          </span>
          <span className={`rounded-full px-2.5 py-[3px] text-[11px] font-semibold ${EVENT_STATUS_STYLES[status]}`}>
            {EVENT_STATUS_LABELS[status]}
          </span>
        </div>

        <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-[13.5px] sm:grid-cols-2">
          <Fact label="Area served">{service.areaServed || "—"}</Fact>
          <Fact label="Hours">{service.operatingHours || "Not given"}</Fact>
          <Fact label="Contact">
            {service.contactNumber ? (
              <a href={`tel:${service.contactNumber}`} className="text-accent">
                {service.contactNumber}
              </a>
            ) : (
              "—"
            )}
          </Fact>
          <Fact label="Listed by">
            <MemberLink user={service.provider} />
          </Fact>
          <Fact label="Submitted on">{formatDate(service.createdAt)}</Fact>
          <Fact label="Picture">{service.imageUrl ? "Yes" : "None"}</Fact>
        </dl>
        {service.description && (
          <p className="mt-3 whitespace-pre-line text-[13.5px] text-muted">{service.description}</p>
        )}

        {service.reviewNote && (
          <p className="mt-3 rounded-lg border border-line bg-paper px-3.5 py-2.5 text-[13px] text-muted">
            {status === "PENDING" ? "Previously asked for" : "Last note"}
            {service.reviewedBy ? ` (${service.reviewedBy.username})` : ""}: “{service.reviewNote}”
          </p>
        )}

        <div className="mt-4 border-t border-line pt-4">
          {error && <ErrorLine>{error}</ErrorLine>}
          {status === "NEEDS_CHANGES" ? (
            <p className="text-[13px] text-muted">
              Waiting for the provider to make changes — it comes back to
              “Waiting for approval” when they do.
            </p>
          ) : (
            <>
              <label htmlFor={`service-note-${service.id}`} className="mb-1.5 block text-[13px] font-medium">
                Note to the provider (optional)
              </label>
              <textarea
                id={`service-note-${service.id}`}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                maxLength={1000}
                placeholder="e.g. Please add a photo, or say which villages you cover"
                className={INPUT_CLASS}
              />
              <p className="mt-1 text-[12px] text-muted">
                With “Needs changes” this tells them what to fix.
              </p>
            </>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {status !== "APPROVED" && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void act(SERVICE_ENDPOINTS.approve(service.id))}
                className={PRIMARY_BUTTON}
              >
                Approve
              </button>
            )}
            {status !== "NEEDS_CHANGES" && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void act(SERVICE_ENDPOINTS.needsChanges(service.id))}
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
