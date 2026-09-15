"use client";

import { Fragment, useState } from "react";
import Image from "next/image";
import { api, PLACE_ENDPOINTS } from "@/lib/api";
import { fillImage } from "@/lib/cloudinary";
import type { ApiAttraction, ApiCategory } from "@/lib/types";
import { PlaceForm } from "./PlaceForm";
import { ErrorLine, FormCard, Note, SECONDARY_BUTTON, Table, useFetch, usePage } from "./ui";

/** Hub team: add, edit and remove the places shown on Explore. They appear straight away. */
export function PlacesAdmin() {
  const [reload, setReload] = useState(0);
  const { page, error } = usePage<ApiAttraction>(PLACE_ENDPOINTS.all, reload);
  const { data: categories } = useFetch<ApiCategory[]>(PLACE_ENDPOINTS.categories, reload);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  function saved(warning?: string) {
    setNotice(warning ?? null);
    setEditingId(null);
    setReload((n) => n + 1);
  }

  async function remove(place: ApiAttraction) {
    if (!window.confirm(`Delete “${place.name}”? Its ratings and picture go with it.`)) return;
    setNotice(null);
    setBusy(place.id);
    try {
      await api.del(PLACE_ENDPOINTS.place(place.id));
      setReload((n) => n + 1);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not delete the place.");
    } finally {
      setBusy(null);
    }
  }

  const places = page?.content ?? [];

  return (
    <section>
      <FormCard title="Add a place">
        <PlaceForm categories={categories ?? []} onSaved={(_, warning) => saved(warning)} />
      </FormCard>

      <h3 className="mb-3 font-serif text-[18px] font-semibold">Places</h3>
      {notice && <ErrorLine>{notice}</ErrorLine>}
      {error ? (
        <Note>{error}</Note>
      ) : !page ? (
        <Note>Loading…</Note>
      ) : places.length === 0 ? (
        <Note>No places yet — add the first one above. It shows on Explore straight away.</Note>
      ) : (
        <Table head={["Place", "Category", "Location", ""]} minWidth={680}>
          {places.map((place) => (
            <Fragment key={place.id}>
              <tr className="border-b border-line align-middle last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {place.imageUrl ? (
                      <Image
                        src={fillImage(place.imageUrl, 96, 64)}
                        alt=""
                        width={48}
                        height={32}
                        unoptimized
                        className="h-8 w-12 shrink-0 rounded object-cover"
                      />
                    ) : (
                      <span className="grid h-8 w-12 shrink-0 place-items-center rounded bg-paper" aria-hidden="true">
                        📍
                      </span>
                    )}
                    <span className="font-semibold">{place.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted">{place.category?.name ?? "—"}</td>
                <td className="px-4 py-3 text-muted">{place.location}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(editingId === place.id ? null : place.id)}
                      className={SECONDARY_BUTTON}
                    >
                      {editingId === place.id ? "Close" : "Edit"}
                    </button>
                    <button
                      type="button"
                      disabled={busy === place.id}
                      onClick={() => void remove(place)}
                      className={SECONDARY_BUTTON}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
              {editingId === place.id && (
                <tr className="border-b border-line bg-paper last:border-0">
                  <td colSpan={4} className="px-4 py-4">
                    <PlaceForm
                      place={place}
                      categories={categories ?? []}
                      onSaved={(_, warning) => saved(warning)}
                      onCancel={() => setEditingId(null)}
                    />
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </Table>
      )}
    </section>
  );
}
