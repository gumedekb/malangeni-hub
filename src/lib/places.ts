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
  };
}

/** Best-rated first; places with more ratings win ties. */
export function byRating(a: ApiAttraction, b: ApiAttraction): number {
  return (b.averageRating ?? 0) - (a.averageRating ?? 0) || (b.ratingCount ?? 0) - (a.ratingCount ?? 0);
}
