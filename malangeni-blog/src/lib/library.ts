import { hhmm, isOpenNow } from "./shops";
import type { OpeningHoursFields } from "./types";

/** The three rows of opening hours, the days each covers (0 = Sunday) and its fields. Used by the library and places. */
export const LIBRARY_DAYS = [
  { label: "Mon–Fri", days: [1, 2, 3, 4, 5], open: "weekdayOpen", close: "weekdayClose" },
  { label: "Saturday", days: [6], open: "saturdayOpen", close: "saturdayClose" },
  { label: "Sunday", days: [0], open: "sundayOpen", close: "sundayClose" },
] as const;

export type LibraryTimeField = (typeof LIBRARY_DAYS)[number]["open" | "close"];

function rowFor(now: Date) {
  return LIBRARY_DAYS.find((r) => (r.days as readonly number[]).includes(now.getDay()));
}

/** True when any hours are set; none at all means they aren't listed (a park, say). */
export function hasHours(hours: OpeningHoursFields): boolean {
  return LIBRARY_DAYS.some((row) => !!hours[row.open] || !!hours[row.close]);
}

/** Today's opening and closing ("HH:mm"), both null when closed today. */
export function todayHours(hours: OpeningHoursFields, now = new Date()): { open: string | null; close: string | null } {
  const row = rowFor(now);
  return { open: row ? hhmm(hours[row.open]) : null, close: row ? hhmm(hours[row.close]) : null };
}

/** Open right now by today's row; false on a closed day, null if unknown. */
export function libraryOpenNow(info: OpeningHoursFields, now = new Date()): boolean | null {
  const row = rowFor(now);
  if (!row) return null;
  const open = info[row.open];
  const close = info[row.close];
  if (!open || !close) return false;
  return isOpenNow({ openingTime: open, closingTime: close }, now);
}
