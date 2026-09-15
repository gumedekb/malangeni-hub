import Link from "next/link";
import type { CommunityEvent } from "@/lib/types";

export const TAG_STYLES: Record<NonNullable<CommunityEvent["tag"]>, string> = {
  important: "bg-accent-soft text-accent",
  fun: "bg-fun-soft text-fun",
};

export function EventTag({ tag }: { tag: CommunityEvent["tag"] }) {
  if (!tag) return null;
  return (
    <span
      className={`ml-1.5 inline-block rounded-full px-[7px] py-0.5 text-[10px] font-semibold uppercase tracking-[0.5px] ${TAG_STYLES[tag]}`}
    >
      {tag === "important" ? "Important" : "Fun"}
    </span>
  );
}

/** One event in a list — the home column and the "all events" page share it. */
export function EventRow({ event }: { event: CommunityEvent }) {
  return (
    <Link
      href={`/events/${encodeURIComponent(event.id)}`}
      className="flex items-center gap-3.5 rounded-[10px] border border-line border-l-[3px] border-l-accent bg-card px-4 py-3.5 transition hover:translate-x-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.05)]"
    >
      <div className="min-w-[46px] text-center">
        <div className="font-serif text-[22px] font-semibold leading-none">
          {event.day}
        </div>
        <div className="text-[10px] uppercase tracking-[1px] text-muted">
          {event.month}
        </div>
      </div>
      <div>
        <h4 className="flex items-center text-[15px] font-semibold">
          {event.title}
          <EventTag tag={event.tag} />
        </h4>
        <span className="text-[12.5px] text-muted">
          {event.time} · {event.location}
        </span>
      </div>
    </Link>
  );
}
