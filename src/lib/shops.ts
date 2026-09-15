import type { Shop } from "./types";

/** "08:00:00" → "08:00". */
export function hhmm(time?: string | null): string | null {
  return time ? time.slice(0, 5) : null;
}

export function hoursLabel(shop: Pick<Shop, "openingTime" | "closingTime">): string {
  const open = hhmm(shop.openingTime);
  const close = hhmm(shop.closingTime);
  if (open && close) return `${open} – ${close}`;
  if (open) return `Opens ${open}`;
  if (close) return `Closes ${close}`;
  return "Hours not listed";
}

/** True/false when both times are known, null otherwise. Handles past-midnight hours. */
export function isOpenNow(
  shop: Pick<Shop, "openingTime" | "closingTime">,
  now = new Date(),
): boolean | null {
  const open = hhmm(shop.openingTime);
  const close = hhmm(shop.closingTime);
  if (!open || !close) return null;
  const current = now.toTimeString().slice(0, 5);
  return open <= close
    ? current >= open && current < close
    : current >= open || current < close;
}
