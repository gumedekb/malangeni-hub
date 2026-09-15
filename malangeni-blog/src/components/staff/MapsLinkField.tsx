"use client";

import { useState } from "react";
import { api, MAPS_ENDPOINTS } from "@/lib/api";
import type { MapsLookupResult } from "@/lib/types";
import { INPUT_CLASS, SECONDARY_BUTTON } from "./ui";

const MAPS_LINK =
  /^https:\/\/(maps\.app\.goo\.gl\/|goo\.gl\/maps|(www\.)?google\.[a-z.]+\/maps|maps\.google\.[a-z.]+)/i;

export function looksLikeMapsLink(value: string): boolean {
  return MAPS_LINK.test(value.trim());
}

/**
 * A Google Maps link field that reads the link as soon as it's pasted: the pin
 * and directions always, and — when the server has a Google Places key — the
 * address and opening hours, handed to `onLookup` to fill the form.
 */
export function MapsLinkField({
  id,
  value,
  onChange,
  onLookup,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onLookup: (found: MapsLookupResult) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  async function lookup(url: string) {
    if (!looksLikeMapsLink(url)) {
      setStatus({ ok: false, text: "That doesn't look like a Google Maps link." });
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const found = await api.post<MapsLookupResult>(MAPS_ENDPOINTS.lookup, { url });
      onLookup(found);
      setStatus({
        ok: found.hoursFound,
        text: found.note ?? (found.hoursFound ? "Filled in from Google — check before saving." : "Link read."),
      });
    } catch (err) {
      setStatus({ ok: false, text: err instanceof Error ? err.message : "Couldn't read that link." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id={id}
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onPaste={(e) => {
            const pasted = e.clipboardData.getData("text").trim();
            if (looksLikeMapsLink(pasted)) void lookup(pasted);
          }}
          maxLength={512}
          placeholder="https://maps.app.goo.gl/…"
          className={INPUT_CLASS}
        />
        <button
          type="button"
          onClick={() => void lookup(value)}
          disabled={busy || !value.trim()}
          className={`${SECONDARY_BUTTON} shrink-0 whitespace-nowrap`}
        >
          {busy ? "Reading…" : "Fill from Google"}
        </button>
      </div>
      <p className="mt-1 text-[12px] text-muted">
        In Google Maps, open the place, tap Share and copy the link. Pasting it fills in what Google knows.
      </p>
      {status && (
        <p role="status" className={`mt-1.5 text-[12.5px] ${status.ok ? "text-open" : "text-accent"}`}>
          {status.text}
        </p>
      )}
    </div>
  );
}
