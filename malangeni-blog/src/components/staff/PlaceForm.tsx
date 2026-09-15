"use client";

import { useState } from "react";
import Image from "next/image";
import { api, ApiError, PLACE_ENDPOINTS } from "@/lib/api";
import { fitImage } from "@/lib/cloudinary";
import { IMAGE_ACCEPT, imageProblem, prepareImage } from "@/lib/images";
import type { ApiAttraction, ApiCategory } from "@/lib/types";
import { FilePreview } from "@/components/ui/FilePreview";
import { ErrorLine, INPUT_CLASS, Label, PRIMARY_BUTTON, SECONDARY_BUTTON } from "./ui";

/**
 * Add or edit a place on Explore. Hub team only — the backend rejects anyone
 * else. The category is picked from the list or typed; a new name is created
 * on save. The picture is optional and shown on the cards (Cloudinary crops it
 * to fit, keeping the subject).
 */
export function PlaceForm({
  place,
  categories,
  onSaved,
  onCancel,
}: {
  /** Omit to add a new place. */
  place?: ApiAttraction;
  categories: ApiCategory[];
  /** `warning` is set when the place saved but the picture change didn't. */
  onSaved: (place: ApiAttraction, warning?: string) => void;
  onCancel?: () => void;
}) {
  const [name, setName] = useState(place?.name ?? "");
  const [category, setCategory] = useState(place?.category?.name ?? "");
  const [location, setLocation] = useState(place?.location ?? "Malangeni");
  const [description, setDescription] = useState(place?.description ?? "");
  const [image, setImage] = useState<File | null>(null);
  const [removePicture, setRemovePicture] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const p = place ? `place-${place.id}` : "place-new";

  /** The chosen category's id, creating the category when the name is new. */
  async function categoryId(): Promise<string> {
    const wanted = category.trim();
    const match = (list: ApiCategory[]) => list.find((c) => c.name.toLowerCase() === wanted.toLowerCase());
    const existing = match(categories);
    if (existing) return existing.id;
    try {
      return (await api.post<ApiCategory>(PLACE_ENDPOINTS.categories, { name: wanted })).id;
    } catch (err) {
      // Someone added the same name a moment ago: use theirs.
      if (err instanceof ApiError && err.status === 409) {
        const found = match((await api.get<ApiCategory[]>(PLACE_ENDPOINTS.categories)) ?? []);
        if (found) return found.id;
      }
      throw err;
    }
  }

  function pickImage(file: File | null) {
    if (!file) return;
    const problem = imageProblem(file);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setImage(file);
    setRemovePicture(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !category.trim() || !location.trim()) {
      setError("Name, category and location are required.");
      return;
    }
    setError(null);
    setSubmitting(true);
    let saved: ApiAttraction;
    try {
      const payload = {
        name: name.trim(),
        categoryId: await categoryId(),
        location: location.trim(),
        description: description.trim(),
      };
      saved = place
        ? await api.put<ApiAttraction>(PLACE_ENDPOINTS.place(place.id), payload)
        : await api.post<ApiAttraction>(PLACE_ENDPOINTS.create, payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the place.");
      setSubmitting(false);
      return;
    }

    let warning: string | undefined;
    try {
      if (image) {
        const form = new FormData();
        form.append("file", await prepareImage(image));
        saved = await api.postForm<ApiAttraction>(PLACE_ENDPOINTS.image(saved.id), form);
      } else if (removePicture && place?.imageUrl) {
        saved = await api.del<ApiAttraction>(PLACE_ENDPOINTS.image(saved.id));
      }
    } catch (err) {
      warning = `“${saved.name}” was saved, but the picture didn't update${err instanceof Error ? `: ${err.message}` : "."}`;
    }

    if (!place) {
      setName("");
      setCategory("");
      setLocation("Malangeni");
      setDescription("");
      setImage(null);
    }
    setSubmitting(false);
    onSaved(saved, warning);
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)}>
      {error && <ErrorLine>{error}</ErrorLine>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor={`${p}-name`}>Name</Label>
          <input
            id={`${p}-name`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Community Park"
            maxLength={255}
            required
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <Label htmlFor={`${p}-category`}>Category</Label>
          <input
            id={`${p}-category`}
            list={`${p}-categories`}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Recreation"
            maxLength={255}
            required
            className={INPUT_CLASS}
          />
          <datalist id={`${p}-categories`}>
            {categories.map((c) => (
              <option key={c.id} value={c.name} />
            ))}
          </datalist>
          <p className="mt-1 text-[12px] text-muted">Pick one or type a new category.</p>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor={`${p}-location`}>Location</Label>
          <input
            id={`${p}-location`}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Next to the clinic, Main Road"
            maxLength={255}
            required
            className={INPUT_CLASS}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor={`${p}-description`}>Description (optional)</Label>
          <textarea
            id={`${p}-description`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Open green space with a playground and shaded benches."
            className={INPUT_CLASS}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor={`${p}-image`}>Picture (optional)</Label>
          {image ? (
            <div className="mb-2 flex flex-col items-start gap-1.5">
              <FilePreview file={image} alt="New picture" className="h-auto max-h-40 w-auto rounded-lg border border-line" />
              <button type="button" onClick={() => setImage(null)} className="cursor-pointer text-[12.5px] font-semibold text-accent">
                Don&apos;t use this picture
              </button>
            </div>
          ) : place?.imageUrl && !removePicture ? (
            <div className="mb-2 flex flex-col items-start gap-1.5">
              <Image
                src={fitImage(place.imageUrl, 480)}
                alt="Current picture"
                width={480}
                height={320}
                unoptimized
                className="h-auto max-h-40 w-auto rounded-lg border border-line"
              />
              <button type="button" onClick={() => setRemovePicture(true)} className="cursor-pointer text-[12.5px] font-semibold text-accent">
                Remove picture
              </button>
            </div>
          ) : removePicture ? (
            <p className="mb-2 text-[12.5px] text-muted">
              The picture will be removed.{" "}
              <button type="button" onClick={() => setRemovePicture(false)} className="cursor-pointer font-semibold text-ink underline">
                Undo
              </button>
            </p>
          ) : null}
          <input
            id={`${p}-image`}
            type="file"
            accept={IMAGE_ACCEPT}
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              e.target.value = "";
              pickImage(file);
            }}
            className="block w-full text-[13px] text-muted file:mr-3 file:cursor-pointer file:rounded-lg file:border file:border-line file:bg-card file:px-3 file:py-2 file:text-[13px] file:font-semibold file:text-ink"
          />
          <p className="mt-1 text-[12px] text-muted">JPEG, PNG or WebP. Cards show it cropped to fit, keeping the subject in view.</p>
        </div>
      </div>
      <div className="mt-5 flex gap-2">
        <button type="submit" disabled={submitting} className={PRIMARY_BUTTON}>
          {submitting ? "Saving…" : place ? "Save changes" : "Add place"}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className={SECONDARY_BUTTON}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
