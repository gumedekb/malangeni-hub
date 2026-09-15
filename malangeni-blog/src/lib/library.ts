import { isOpenNow } from "./shops";
import type { LibraryDetails } from "./types";

/** The three rows of library hours, the days each covers (0 = Sunday) and its fields. */
export const LIBRARY_DAYS = [
  { label: "Mon–Fri", days: [1, 2, 3, 4, 5], open: "weekdayOpen", close: "weekdayClose" },
  { label: "Saturday", days: [6], open: "saturdayOpen", close: "saturdayClose" },
  { label: "Sunday", days: [0], open: "sundayOpen", close: "sundayClose" },
] as const;

export type LibraryTimeField = (typeof LIBRARY_DAYS)[number]["open" | "close"];

/** Open right now by today's row; false on a closed day, null if unknown. */
export function libraryOpenNow(info: LibraryDetails, now = new Date()): boolean | null {
  const row = LIBRARY_DAYS.find((r) => (r.days as readonly number[]).includes(now.getDay()));
  if (!row) return null;
  const open = info[row.open];
  const close = info[row.close];
  if (!open || !close) return false;
  return isOpenNow({ openingTime: open, closingTime: close }, now);
}
