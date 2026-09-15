/**
 * Dates are typed and shown as dd/mm/yyyy — the South African convention —
 * while the backend exchanges ISO (yyyy-mm-dd). These convert between the two.
 */

/** "12/07/2026" (also 1/7/2026, 12-07-2026, 12.07.2026) → "2026-07-12", or null if not a real date. */
export function parseDmy(input: string): string | null {
  const m = input.trim().match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (!m) return null;
  const [day, month, year] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const d = new Date(Date.UTC(year, month - 1, day));
  // Rejects 31/02/2026 and friends, which Date would silently roll over.
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) {
    return null;
  }
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** "2026-07-12…" → "12/07/2026". */
export function isoToDmy(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

/**
 * Light formatting while typing: digits only get slashes added (12072026 →
 * 12/07/2026); anything typed with slashes is left alone apart from stripping
 * stray characters.
 */
export function formatDmyInput(raw: string): string {
  if (/^\d+$/.test(raw)) {
    const d = raw.slice(0, 8);
    return [d.slice(0, 2), d.slice(2, 4), d.slice(4)].filter(Boolean).join("/");
  }
  return raw.replace(/[^\d/]/g, "").slice(0, 10);
}

/** "Just now", "5 minutes ago", "3 hours ago", "Yesterday", then dd/mm/yyyy. */
export function timeAgo(iso: string, now = new Date()): string {
  const then = new Date(iso);
  const minutes = Math.floor((now.getTime() - then.getTime()) / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  if (hours < 48) return "Yesterday";
  return isoToDmy(then.toISOString());
}
