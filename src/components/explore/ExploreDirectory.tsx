"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PlaceCard, FeaturedPlaceCard } from "./PlaceCard";
import { api, PLACE_ENDPOINTS } from "@/lib/api";
import { useAuth } from "@/lib/auth/AuthContext";
import { canModerate } from "@/lib/auth/types";
import { byRating, toPlace } from "@/lib/places";
import type { ApiAttraction, Page, Place } from "@/lib/types";
import { FeedNote } from "@/components/posts/FeedNote";

/** Places from the backend, best-rated first, with search and category filters built from the data. */
export function ExploreDirectory() {
  const { profile } = useAuth();
  // The hub team adds and edits places in /staff → Places.
  const staff = canModerate(profile);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [places, setPlaces] = useState<Place[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const page = await api.get<Page<ApiAttraction>>(PLACE_ENDPOINTS.list);
        if (cancelled) return;
        setPlaces([...(page?.content ?? [])].sort(byRating).map(toPlace));
        setError(null);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load places.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  // Only the categories that actually have places.
  const categories = useMemo(
    () => ["All", ...Array.from(new Set((places ?? []).map((p) => p.category))).sort()],
    [places],
  );

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    const filtered = (places ?? []).filter((place) => {
      const matchesCategory = category === "All" || place.category === category;
      const matchesTerm =
        term === "" ||
        place.name.toLowerCase().includes(term) ||
        place.category.toLowerCase().includes(term) ||
        (place.description ?? "").toLowerCase().includes(term);
      return matchesCategory && matchesTerm;
    });
    // The best-rated place leads the unfiltered grid as the wide featured card.
    const featureFirst = category === "All" && term === "";
    return filtered.map((place, i) => ({ ...place, featured: featureFirst && i === 0 }));
  }, [places, query, category]);

  return (
    <>
      <form
        className="mt-[22px] flex flex-col gap-2.5 sm:flex-row"
        onSubmit={(e) => e.preventDefault()}
        role="search"
      >
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search places, e.g. parks, clinics…"
          aria-label="Search places"
          className="flex-1 rounded-[10px] border border-line bg-card px-4 py-3.5 text-[15px] outline-none focus:outline-2 focus:outline-accent"
        />
        <button
          type="submit"
          className="cursor-pointer rounded-[10px] bg-ink px-[22px] py-3.5 text-sm font-semibold text-on-ink sm:py-0"
        >
          Search
        </button>
      </form>

      {categories.length > 2 && (
        <div className="mt-4 flex flex-wrap gap-[9px]">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              aria-pressed={category === cat}
              className={`cursor-pointer rounded-full border px-[15px] py-[7px] text-[13.5px] transition ${
                category === cat
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-line bg-card text-muted hover:text-ink"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {staff && (
        <p className="mt-4 text-right text-[13px]">
          <Link href="/staff#places" className="font-semibold text-accent">
            Manage places →
          </Link>
        </p>
      )}

      <section className="mt-[26px] grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
        {error && places === null ? (
          <FeedNote tone="error" onRetry={() => setNonce((n) => n + 1)}>
            {error}
          </FeedNote>
        ) : places === null ? (
          <FeedNote>Loading…</FeedNote>
        ) : results.length === 0 ? (
          <FeedNote tone="empty">
            {places.length === 0 ? (
              staff ? (
                <>
                  No places yet.{" "}
                  <Link href="/staff#places" className="font-semibold text-accent">
                    Add the first one
                  </Link>
                  .
                </>
              ) : (
                "No places have been added yet."
              )
            ) : (
              "No places match your search. Try another category or term."
            )}
          </FeedNote>
        ) : (
          results.map((place) =>
            place.featured ? (
              <FeaturedPlaceCard key={place.id} place={place} />
            ) : (
              <PlaceCard key={place.id} place={place} />
            ),
          )
        )}
      </section>
    </>
  );
}
