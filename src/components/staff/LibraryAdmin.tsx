"use client";

import { useState } from "react";
import { api, LIBRARY_ENDPOINT } from "@/lib/api";
import { LIBRARY_DAYS, type LibraryTimeField } from "@/lib/library";
import { hhmm } from "@/lib/shops";
import type { LibraryDetails } from "@/lib/types";
import {
  ErrorLine,
  FormCard,
  formatDate,
  INPUT_CLASS,
  Label,
  Note,
  PRIMARY_BUTTON,
  useFetch,
} from "./ui";

/** Hub team: edit Malangeni Library's details shown on /services. */
export function LibraryAdmin() {
  const [reload, setReload] = useState(0);
  const [saved, setSaved] = useState(false);
  const { data, error } = useFetch<LibraryDetails>(LIBRARY_ENDPOINT, reload);

  if (error) return <ErrorLine>{error}</ErrorLine>;
  if (!data) return <Note>Loading…</Note>;

  return (
    <FormCard title="Malangeni Library">
      {saved && (
        <p className="mb-4 rounded-lg border border-open bg-fun-soft px-3.5 py-2.5 text-[13px] text-open">
          Saved. The Services page now shows these details.
        </p>
      )}
      {/* Remount after each save so the fields start from what the server stored. */}
      <LibraryForm
        key={data.updatedAt ?? "initial"}
        info={data}
        onSaved={() => {
          setSaved(true);
          setReload((n) => n + 1);
        }}
      />
      {data.updatedAt && (
        <p className="mt-4 text-[12.5px] text-muted">
          Last updated {formatDate(data.updatedAt, true)}
        </p>
      )}
    </FormCard>
  );
}

function LibraryForm({ info, onSaved }: { info: LibraryDetails; onSaved: () => void }) {
  const [name, setName] = useState(info.name);
  const [about, setAbout] = useState(info.about ?? "");
  const [location, setLocation] = useState(info.location ?? "");
  const [mapsUrl, setMapsUrl] = useState(info.mapsUrl ?? "");
  const [times, setTimes] = useState<Record<LibraryTimeField, string>>(
    () =>
      Object.fromEntries(
        LIBRARY_DAYS.flatMap((row) => [
          [row.open, hhmm(info[row.open]) ?? ""],
          [row.close, hhmm(info[row.close]) ?? ""],
        ]),
      ) as Record<LibraryTimeField, string>,
  );
  const [closed, setClosed] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(LIBRARY_DAYS.map((row) => [row.label, !info[row.open] && !info[row.close]])),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const payload: Record<string, string | null> = {
      name: name.trim(),
      about: about.trim() || null,
      location: location.trim() || null,
      mapsUrl: mapsUrl.trim() || null,
    };
    for (const row of LIBRARY_DAYS) {
      const isClosed = closed[row.label];
      payload[row.open] = isClosed ? null : times[row.open] || null;
      payload[row.close] = isClosed ? null : times[row.close] || null;
    }
    try {
      await api.put<LibraryDetails>(LIBRARY_ENDPOINT, payload);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the library details.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)}>
      {error && <ErrorLine>{error}</ErrorLine>}

      <div>
        <Label htmlFor="library-name">Name</Label>
        <input
          id="library-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={255}
          required
          className={INPUT_CLASS}
        />
      </div>
      <div className="mt-4">
        <Label htmlFor="library-about">About (optional)</Label>
        <textarea
          id="library-about"
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          rows={2}
          maxLength={1000}
          placeholder="Books to borrow and a quiet place to read."
          className={INPUT_CLASS}
        />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="library-location">Location (optional)</Label>
          <input
            id="library-location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            maxLength={255}
            placeholder="Street address"
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <Label htmlFor="library-maps">Google Maps link (optional)</Label>
          <input
            id="library-maps"
            type="url"
            value={mapsUrl}
            onChange={(e) => setMapsUrl(e.target.value)}
            maxLength={512}
            placeholder="https://maps.google.com/…"
            className={INPUT_CLASS}
          />
        </div>
      </div>

      <fieldset className="mt-5">
        <legend className="mb-2 text-[13px] font-medium">Opening hours</legend>
        <div className="space-y-3">
          {LIBRARY_DAYS.map((row) => {
            const isClosed = closed[row.label];
            return (
              <div
                key={row.label}
                className="grid grid-cols-[90px_1fr_auto_1fr] items-center gap-2 sm:grid-cols-[110px_160px_auto_160px_auto]"
              >
                <span className="text-[13.5px] font-semibold">{row.label}</span>
                <input
                  type="time"
                  aria-label={`${row.label} opening time`}
                  value={times[row.open]}
                  onChange={(e) => setTimes((t) => ({ ...t, [row.open]: e.target.value }))}
                  disabled={isClosed}
                  required={!isClosed}
                  className={`${INPUT_CLASS} disabled:opacity-50`}
                />
                <span className="text-[13px] text-muted">to</span>
                <input
                  type="time"
                  aria-label={`${row.label} closing time`}
                  value={times[row.close]}
                  onChange={(e) => setTimes((t) => ({ ...t, [row.close]: e.target.value }))}
                  disabled={isClosed}
                  required={!isClosed}
                  className={`${INPUT_CLASS} disabled:opacity-50`}
                />
                <label className="col-span-4 inline-flex items-center gap-2 text-[13px] sm:col-span-1">
                  <input
                    type="checkbox"
                    checked={isClosed}
                    onChange={(e) => setClosed((c) => ({ ...c, [row.label]: e.target.checked }))}
                  />
                  Closed
                </label>
              </div>
            );
          })}
        </div>
      </fieldset>

      <button type="submit" disabled={submitting} className={`${PRIMARY_BUTTON} mt-5`}>
        {submitting ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
