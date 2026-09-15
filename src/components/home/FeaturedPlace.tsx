"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, PLACE_ENDPOINTS } from "@/lib/api";
import { byRating } from "@/lib/places";
import { fillImage } from "@/lib/cloudinary";
import type { ApiAttraction, Page } from "@/lib/types";

/** The hero "Featured place" card on the home page: the best-rated place on Explore. */
export function FeaturedPlace() {
  const [place, setPlace] = useState<ApiAttraction | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const page = await api.get<Page<ApiAttraction>>(PLACE_ENDPOINTS.list);
        const best = [...(page?.content ?? [])].sort(byRating)[0] ?? null;
        if (!cancelled) setPlace(best);
      } catch {
        if (!cancelled) setPlace(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <article className="grid grid-cols-1 overflow-hidden rounded-card border border-line bg-card md:grid-cols-2">
      <div
        role="img"
        aria-label={place ? place.name : "Featured place"}
        className="min-h-[200px] bg-paper bg-cover bg-center md:min-h-[280px]"
        style={place?.imageUrl ? { backgroundImage: `url('${fillImage(place.imageUrl, 1000, 700)}')` } : undefined}
      />
      <div className="flex flex-col p-[22px]">
        <span className="text-[11px] font-semibold uppercase tracking-[1.5px] text-gold">
          Featured place
        </span>
        <h2 className="mb-2 mt-1.5 font-serif text-[25px] font-semibold">
          {place === undefined ? "Loading…" : place ? place.name : "Explore Malangeni"}
        </h2>
        <p className="text-sm text-muted">
          {place?.description ?? "Places, spaces and points of interest around Malangeni."}
        </p>
        <Link
          href="/explore"
          className="mt-auto self-start rounded-lg bg-ink px-[18px] py-2.5 text-[13px] font-semibold text-on-ink"
        >
          Explore places
        </Link>
      </div>
    </article>
  );
}
