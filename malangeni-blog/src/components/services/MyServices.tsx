"use client";

import { useEffect, useState } from "react";
import { api, SERVICE_ENDPOINTS } from "@/lib/api";
import { useAuth } from "@/lib/auth/AuthContext";
import { EVENT_STATUS_LABELS, EVENT_STATUS_STYLES } from "@/lib/events";
import { categoryInfo } from "@/lib/services";
import type { ApiService } from "@/lib/types";
import { SECONDARY_BUTTON } from "@/components/staff/ui";
import { ServiceForm } from "./ServiceForm";

/**
 * The signed-in member's own listings in every status, so they can follow the
 * review, fix what the hub team asked for, or remove a listing.
 */
export function MyServices() {
  const { profile } = useAuth();
  const viewerId = profile ? String(profile.id) : null;
  const [services, setServices] = useState<ApiService[] | null>(null);
  const [reload, setReload] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!viewerId) return;
    let cancelled = false;
    void (async () => {
      try {
        const mine = await api.get<ApiService[]>(SERVICE_ENDPOINTS.mine);
        if (!cancelled) setServices(mine ?? []);
      } catch {
        if (!cancelled) setServices([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [viewerId, reload]);

  if (!viewerId || !services || services.length === 0) return null;

  async function remove(service: ApiService) {
    if (!window.confirm(`Remove “${service.name}” from the services list?`)) return;
    setBusy(service.id);
    setNotice(null);
    try {
      await api.del(SERVICE_ENDPOINTS.service(service.id));
      setNotice("Service removed.");
      setReload((n) => n + 1);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not remove the service.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="mb-8">
      <h2 className="font-serif text-[20px] font-semibold">Your services</h2>
      {notice && (
        <p role="status" className="mt-3 rounded-lg border border-line bg-fun-soft px-3.5 py-2.5 text-[13px] text-fun">
          {notice}
        </p>
      )}
      <div className="mt-3 flex flex-col gap-3">
        {services.map((s) => {
          const status = s.status ?? "PENDING";
          const category = categoryInfo(s.serviceCategory);
          return (
            <article key={s.id} className="rounded-card border border-line bg-card p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">
                  {category.icon} {s.name}
                </span>
                <span className={`rounded-full px-2.5 py-[3px] text-[11px] font-semibold ${EVENT_STATUS_STYLES[status]}`}>
                  {EVENT_STATUS_LABELS[status]}
                </span>
              </div>
              <p className="mt-1 text-[13px] text-muted">
                {category.label} · {s.areaServed}
              </p>

              {status === "NEEDS_CHANGES" && (
                <p className="mt-3 rounded-lg border border-accent bg-accent-soft px-3.5 py-2.5 text-[13px] text-accent">
                  The hub team asked for changes
                  {s.reviewNote ? `: “${s.reviewNote}”` : "."} Edit the listing and
                  it goes back for approval.
                </p>
              )}
              {status === "PENDING" && (
                <p className="mt-2 text-[12.5px] text-muted">
                  Only you and the hub team can see it until it&apos;s approved.
                </p>
              )}

              {editingId === s.id ? (
                <div className="mt-4 border-t border-line pt-4">
                  <ServiceForm
                    service={s}
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
                  <button type="button" onClick={() => setEditingId(s.id)} className={SECONDARY_BUTTON}>
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={busy === s.id}
                    onClick={() => void remove(s)}
                    className={`${SECONDARY_BUTTON} text-accent`}
                  >
                    Remove
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
