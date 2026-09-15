"use client";

import { useState } from "react";
import { api, LIBRARY_ENDPOINT } from "@/lib/api";
import type { LibraryDetails, MapsLookupResult } from "@/lib/types";
import { MapsLinkField } from "./MapsLinkField";
import { hoursForm, hoursPayload, OpeningHoursFields, type HoursForm } from "./OpeningHoursFields";
import { ErrorLine, FormCard, formatDate, INPUT_CLASS, Label, Note, PRIMARY_BUTTON, useFetch } from "./ui";

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
        <p className="mt-4 text-[12.5px] text-muted">Last updated {formatDate(data.updatedAt, true)}</p>
      )}
    </FormCard>
  );
}

function LibraryForm({ info, onSaved }: { info: LibraryDetails; onSaved: () => void }) {
  const [name, setName] = useState(info.name);
  const [about, setAbout] = useState(info.about ?? "");
  const [location, setLocation] = useState(info.location ?? "");
  const [mapsUrl, setMapsUrl] = useState(info.mapsUrl ?? "");
  const [hours, setHours] = useState<HoursForm>(() => hoursForm(info));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A pasted Google Maps link fills in the hours, and the address if none was typed yet.
  function applyLookup(found: MapsLookupResult) {
    if (found.hoursFound) setHours(hoursForm(found));
    if (found.address && (!location.trim() || location.trim() === "Malangeni")) setLocation(found.address);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.put<LibraryDetails>(LIBRARY_ENDPOINT, {
        name: name.trim(),
        about: about.trim() || null,
        location: location.trim() || null,
        mapsUrl: mapsUrl.trim() || null,
        ...hoursPayload(hours),
      });
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
      <div className="mt-4">
        <Label htmlFor="library-maps">Google Maps link (optional)</Label>
        <MapsLinkField id="library-maps" value={mapsUrl} onChange={setMapsUrl} onLookup={applyLookup} />
      </div>
      <div className="mt-4">
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

      <fieldset className="mt-5">
        <legend className="mb-2 text-[13px] font-medium">Opening hours</legend>
        <OpeningHoursFields idPrefix="library" value={hours} onChange={setHours} />
      </fieldset>

      <button type="submit" disabled={submitting} className={`${PRIMARY_BUTTON} mt-5`}>
        {submitting ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
