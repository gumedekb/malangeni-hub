"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { api, LIBRARY_ENDPOINT } from "@/lib/api";
import { useAuth } from "@/lib/auth/AuthContext";
import { canModerate } from "@/lib/auth/types";
import { LIBRARY_DAYS, libraryOpenNow } from "@/lib/library";
import { hhmm } from "@/lib/shops";
import type { LibraryDetails } from "@/lib/types";

/** Re-check once a minute so the badge flips at opening and closing time. */
function subscribe(onChange: () => void) {
  const id = window.setInterval(onChange, 60_000);
  return () => window.clearInterval(id);
}

/** Malangeni Library: what it is, where it is, and when it's open. Edited in /staff → Library. */
export function LibraryInfo() {
  const { profile } = useAuth();
  const [info, setInfo] = useState<LibraryDetails | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get<LibraryDetails>(LIBRARY_ENDPOINT)
      .then((data) => {
        if (!cancelled) setInfo(data);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // null on the server, so the badge only appears once the visitor's clock is known.
  const open = useSyncExternalStore(
    subscribe,
    () => (info ? libraryOpenNow(info) : null),
    () => null,
  );

  if (failed) {
    return (
      <p className="mt-12 text-[14px] text-muted">Library details are unavailable right now.</p>
    );
  }
  if (!info) return null;

  return (
    <section className="mt-12 rounded-xl border border-line bg-card p-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-serif text-[24px] font-semibold">{info.name}</h2>
        {open !== null && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] text-[11px] font-semibold uppercase tracking-[0.5px] ${
              open ? "bg-fun-soft text-open" : "bg-accent-soft text-accent"
            }`}
          >
            <span className={`size-[7px] rounded-full ${open ? "bg-open" : "bg-accent"}`} />
            {open ? "Open now" : "Closed"}
          </span>
        )}
        {profile && canModerate(profile) && (
          <Link href="/staff#library" className="ml-auto text-[13px] font-semibold text-accent">
            Edit
          </Link>
        )}
      </div>
      {info.about && <p className="mt-1 text-[14px] text-muted">{info.about}</p>}

      <div className="mt-5 grid gap-6 sm:grid-cols-2">
        {(info.location || info.mapsUrl) && (
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[1px] text-muted">
              Location
            </h3>
            {info.location && <p className="mt-1.5 text-[14.5px]">{info.location}</p>}
            {info.mapsUrl && (
              <a
                href={info.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block rounded-lg border border-line px-4 py-2 text-[13px] font-semibold text-ink transition hover:border-ink"
              >
                Get directions
              </a>
            )}
          </div>
        )}

        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-[1px] text-muted">
            Opening hours
          </h3>
          <dl className="mt-1.5 space-y-1 text-[14.5px]">
            {LIBRARY_DAYS.map((row) => {
              const from = hhmm(info[row.open]);
              const to = hhmm(info[row.close]);
              return (
                <div key={row.label} className="flex justify-between gap-4 sm:max-w-[260px]">
                  <dt className="font-semibold">{row.label}</dt>
                  <dd className="text-muted">{from && to ? `${from} – ${to}` : "Closed"}</dd>
                </div>
              );
            })}
          </dl>
        </div>
      </div>
    </section>
  );
}
