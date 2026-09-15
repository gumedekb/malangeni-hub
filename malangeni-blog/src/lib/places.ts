import type { ApiAttraction, Place } from "./types";

/** A backend attraction in the shape the Explore cards render. */
export function toPlace(a: ApiAttraction): Place {
  return {
    id: a.id,
    name: a.name,
    category: a.category?.name ?? "Other",
    image: a.imageUrl ?? "",
    location: a.location,
    description: a.description ?? undefined,
    mapsUrl: a.mapsUrl ?? null,
    latitude: a.latitude ?? null,
    longitude: a.longitude ?? null,
    weekdayOpen: a.weekdayOpen ?? null,
    weekdayClose: a.weekdayClose ?? null,
    saturdayOpen: a.saturdayOpen ?? null,
    saturdayClose: a.saturdayClose ?? null,
    sundayOpen: a.sundayOpen ?? null,
    sundayClose: a.sundayClose ?? null,
  };
}

/** Best-rated first; places with more ratings win ties. */
export function byRating(a: ApiAttraction, b: ApiAttraction): number {
  return (b.averageRating ?? 0) - (a.averageRating ?? 0) || (b.ratingCount ?? 0) - (a.ratingCount ?? 0);
}

/**
 * Google Maps directions to a place: to its pin when we have one, else its saved
 * Maps link, else a search for its name and location.
 */
export function directionsHref(place: Pick<Place, "name" | "location" | "mapsUrl" | "latitude" | "longitude">): string {
  if (place.latitude && place.longitude) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${place.latitude},${place.longitude}`)}`;
  }
  if (place.mapsUrl) return place.mapsUrl;
  const query = [place.name, place.location].filter(Boolean).join(", ");
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}
