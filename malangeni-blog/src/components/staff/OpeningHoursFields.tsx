"use client";

import { LIBRARY_DAYS, type LibraryTimeField } from "@/lib/library";
import { hhmm } from "@/lib/shops";
import type { OpeningHoursFields as Hours } from "@/lib/types";
import { INPUT_CLASS } from "./ui";

/** The hours editor's state: a time per field, and which rows are ticked "Closed". */
export interface HoursForm {
  times: Record<LibraryTimeField, string>;
  closed: Record<string, boolean>;
}

/** Form state from saved (or looked-up) hours; a row with no times starts as closed. */
export function hoursForm(hours: Hours): HoursForm {
  return {
    times: Object.fromEntries(
      LIBRARY_DAYS.flatMap((row) => [
        [row.open, hhmm(hours[row.open]) ?? ""],
        [row.close, hhmm(hours[row.close]) ?? ""],
      ]),
    ) as Record<LibraryTimeField, string>,
    closed: Object.fromEntries(LIBRARY_DAYS.map((row) => [row.label, !hours[row.open] && !hours[row.close]])),
  };
}

/** What the API expects: "HH:mm", or null on a closed day. */
export function hoursPayload(form: HoursForm): Record<LibraryTimeField, string | null> {
  const out = {} as Record<LibraryTimeField, string | null>;
  for (const row of LIBRARY_DAYS) {
    const shut = form.closed[row.label];
    out[row.open] = shut ? null : form.times[row.open] || null;
    out[row.close] = shut ? null : form.times[row.close] || null;
  }
  return out;
}

/** No hours at all — for a place whose hours aren't listed. */
export const NO_HOURS: Record<LibraryTimeField, null> = {
  weekdayOpen: null,
  weekdayClose: null,
  saturdayOpen: null,
  saturdayClose: null,
  sundayOpen: null,
  sundayClose: null,
};

/** Mon–Fri, Saturday and Sunday: opening and closing time, or "Closed". */
export function OpeningHoursFields({
  value,
  onChange,
  idPrefix,
}: {
  value: HoursForm;
  onChange: (next: HoursForm) => void;
  idPrefix: string;
}) {
  return (
    <div className="space-y-3">
      {LIBRARY_DAYS.map((row) => {
        const isClosed = value.closed[row.label];
        return (
          <div
            key={row.label}
            className="grid grid-cols-[90px_1fr_auto_1fr] items-center gap-2 sm:grid-cols-[110px_160px_auto_160px_auto]"
          >
            <span className="text-[13.5px] font-semibold">{row.label}</span>
            <input
              type="time"
              id={`${idPrefix}-${row.open}`}
              aria-label={`${row.label} opening time`}
              value={value.times[row.open]}
              onChange={(e) => onChange({ ...value, times: { ...value.times, [row.open]: e.target.value } })}
              disabled={isClosed}
              required={!isClosed}
              className={`${INPUT_CLASS} disabled:opacity-50`}
            />
            <span className="text-[13px] text-muted">to</span>
            <input
              type="time"
              id={`${idPrefix}-${row.close}`}
              aria-label={`${row.label} closing time`}
              value={value.times[row.close]}
              onChange={(e) => onChange({ ...value, times: { ...value.times, [row.close]: e.target.value } })}
              disabled={isClosed}
              required={!isClosed}
              className={`${INPUT_CLASS} disabled:opacity-50`}
            />
            <label className="col-span-4 inline-flex items-center gap-2 text-[13px] sm:col-span-1">
              <input
                type="checkbox"
                checked={isClosed}
                onChange={(e) => onChange({ ...value, closed: { ...value.closed, [row.label]: e.target.checked } })}
              />
              Closed
            </label>
          </div>
        );
      })}
    </div>
  );
}
