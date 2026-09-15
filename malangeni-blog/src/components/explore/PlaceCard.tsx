import Image from "next/image";
import { fillImage } from "@/lib/cloudinary";
import { directionsHref } from "@/lib/places";
import type { Place } from "@/lib/types";
import { TodayHours } from "@/components/ui/TodayHours";

/**
 * Card pictures are cropped by Cloudinary to the card's exact shape, keeping the
 * subject (g_auto), so the browser shows them as-is instead of cutting them again.
 */
function PlacePicture({ place, width, height }: { place: Place; width: number; height: number }) {
  if (!place.image) {
    return (
      <div className="grid aspect-[3/2] w-full place-items-center bg-paper text-3xl" aria-hidden="true">
        📍
      </div>
    );
  }
  return (
    <Image
      src={fillImage(place.image, width, height)}
      alt=""
      width={width}
      height={height}
      unoptimized
      className="aspect-[3/2] h-auto w-full object-cover"
    />
  );
}

/** Today's hours (when listed) and a button that opens Google Maps directions. */
function PlaceFooter({ place }: { place: Place }) {
  return (
    <>
      <TodayHours hours={place} className="mt-2.5" />
      <a
        href={directionsHref(place)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1.5 self-start rounded-lg border border-line px-3.5 py-2 text-[13px] font-semibold text-ink transition hover:border-ink"
      >
        <svg
          className="size-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 11l18-8-8 18-2-8-8-2z" />
        </svg>
        Get directions
      </a>
    </>
  );
}

/** Standard place tile in the Explore grid. */
export function PlaceCard({ place }: { place: Place }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-line bg-card transition hover:-translate-y-0.5 hover:shadow-[0_6px_22px_rgba(0,0,0,0.07)]">
      <div className="relative">
        <PlacePicture place={place} width={600} height={400} />
        <span className="absolute left-2.5 top-2.5 rounded-full bg-ink/85 px-2.5 py-1 text-[11px] font-semibold text-on-ink">
          {place.category}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-serif text-lg font-semibold">{place.name}</h3>
        {place.location && <p className="mt-0.5 text-[12.5px] text-muted">📍 {place.location}</p>}
        {place.description && <p className="mt-1.5 line-clamp-3 text-[13px] text-muted">{place.description}</p>}
        <PlaceFooter place={place} />
      </div>
    </article>
  );
}

/** Wide, promoted tile for the best-rated place, leading the Explore grid. */
export function FeaturedPlaceCard({ place }: { place: Place }) {
  return (
    <article className="grid grid-cols-1 overflow-hidden rounded-xl border border-line bg-card transition hover:-translate-y-0.5 hover:shadow-[0_6px_22px_rgba(0,0,0,0.07)] sm:col-span-2 md:grid-cols-[1.1fr_1fr]">
      <div className="relative">
        <PlacePicture place={place} width={900} height={600} />
        <span className="absolute left-2.5 top-2.5 rounded-full bg-ink/85 px-2.5 py-1 text-[11px] font-semibold text-on-ink">
          ★ Featured
        </span>
      </div>
      <div className="flex flex-col p-4">
        <span className="text-[11px] font-semibold uppercase tracking-[1px] text-gold">{place.category}</span>
        <h3 className="mt-1 font-serif text-lg font-semibold">{place.name}</h3>
        {place.location && <p className="mt-0.5 text-[12.5px] text-muted">📍 {place.location}</p>}
        {place.description && <p className="mt-2 text-sm text-muted">{place.description}</p>}
        <PlaceFooter place={place} />
      </div>
    </article>
  );
}
