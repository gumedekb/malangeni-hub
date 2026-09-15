"use client";

import { useState } from "react";
import Image from "next/image";
import { api, COMMUNITY_ENDPOINTS } from "@/lib/api";
import type { ApiEvent } from "@/lib/types";
import { normalizeSaCell, SA_CELL_MESSAGE } from "@/lib/validation";
import { formatDmyInput, isoToDmy, parseDmy } from "@/lib/dates";
import {
  ErrorLine,
  INPUT_CLASS,
  Label,
  PRIMARY_BUTTON,
  SECONDARY_BUTTON,
} from "@/components/staff/ui";
import { FilePreview } from "@/components/ui/FilePreview";
import { ImageCropDialog, POSTER_SHAPES } from "@/components/ui/ImageCropDialog";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MIN_DESCRIPTION = 5;

type Field = "title" | "date" | "time" | "location" | "contactNumber" | "description" | "image";

/**
 * Submit or edit an event.
 *
 * Layer 1 of checking: every required field must be filled *and* usable —
 * a real SA cellphone number, a date in the future, a description of at least
 * five characters. The backend repeats all of it. Anything a form can't judge
 * (a picture would help, the venue looks wrong) comes back from the hub team as
 * "needs changes" with a note.
 */
export function EventForm({
  event,
  onSaved,
  onCancel,
}: {
  /** Omit to submit a new event. */
  event?: ApiEvent;
  /** `warning` is set when the event saved but the picture didn't upload. */
  onSaved: (event: ApiEvent, warning?: string) => void;
  onCancel?: () => void;
}) {
  const [title, setTitle] = useState(event?.title ?? "");
  // Typed as dd/mm/yyyy; converted to ISO only when sending.
  const [date, setDate] = useState(event?.startAt ? isoToDmy(event.startAt) : "");
  const [time, setTime] = useState(event?.startAt?.slice(11, 16) ?? "");
  const [location, setLocation] = useState(event?.location ?? "");
  const [contactNumber, setContactNumber] = useState(event?.contactNumber ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [tag, setTag] = useState<ApiEvent["tag"]>(event?.tag ?? "FUN");
  const [image, setImage] = useState<File | null>(null);
  // The picked file waiting in the cropper; `image` is what gets uploaded.
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const p = event ? `event-${event.id}` : "event-new";

  function validate() {
    const next: Partial<Record<Field, string>> = {};
    if (!title.trim()) next.title = "Give the event a title.";
    const isoDate = parseDmy(date);
    if (!date.trim()) next.date = "Enter the date.";
    else if (!isoDate) next.date = "Use dd/mm/yyyy with a real date, e.g. 12/07/2026.";
    if (!time) next.time = "Pick the start time.";
    if (isoDate && time && new Date(`${isoDate}T${time}`) <= new Date()) {
      next.date = "The event must be in the future.";
    }
    if (!location.trim()) next.location = "Say where it's happening.";
    const phone = normalizeSaCell(contactNumber);
    if (!phone) next.contactNumber = SA_CELL_MESSAGE;
    if (description.trim().length < MIN_DESCRIPTION) {
      next.description = `Describe it in at least ${MIN_DESCRIPTION} characters.`;
    }
    if (image && !IMAGE_TYPES.includes(image.type)) {
      next.image = "The picture must be a JPEG, PNG or WebP.";
    } else if (image && image.size > MAX_IMAGE_BYTES) {
      next.image = "The picture must be 5MB or smaller.";
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return null;
    return {
      title: title.trim(),
      startAt: `${isoDate}T${time}:00`,
      location: location.trim(),
      contactNumber: phone!,
      description: description.trim(),
      tag,
    };
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = validate();
    if (!payload) return;

    setSubmitting(true);
    let saved: ApiEvent;
    try {
      saved = event
        ? await api.put<ApiEvent>(COMMUNITY_ENDPOINTS.event(event.id), payload)
        : await api.post<ApiEvent>(COMMUNITY_ENDPOINTS.events, payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the event.");
      setSubmitting(false);
      return;
    }

    let warning: string | undefined;
    if (image) {
      try {
        const form = new FormData();
        form.append("file", image);
        saved = await api.postForm<ApiEvent>(COMMUNITY_ENDPOINTS.eventImage(saved.id), form);
      } catch (err) {
        warning = `The event was saved, but the picture didn't upload${
          err instanceof Error ? `: ${err.message}` : "."
        }`;
      }
    }
    setSubmitting(false);
    onSaved(saved, warning);
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)}>
      {error && <ErrorLine>{error}</ErrorLine>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor={`${p}-title`}>Title</Label>
          <input
            id={`${p}-title`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Community clean-up"
            maxLength={255}
            required
            className={INPUT_CLASS}
          />
          <FieldError>{errors.title}</FieldError>
        </div>

        <div>
          <Label htmlFor={`${p}-date`}>Date</Label>
          <input
            id={`${p}-date`}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={date}
            onChange={(e) => setDate(formatDmyInput(e.target.value))}
            placeholder="dd/mm/yyyy"
            maxLength={10}
            required
            className={INPUT_CLASS}
          />
          <p className="mt-1 text-[12px] text-muted">Type it as dd/mm/yyyy, e.g. 12/07/2026.</p>
          <FieldError>{errors.date}</FieldError>
        </div>

        <div>
          <Label htmlFor={`${p}-time`}>Start time</Label>
          <input
            id={`${p}-time`}
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
            className={INPUT_CLASS}
          />
          <FieldError>{errors.time}</FieldError>
        </div>

        <div>
          <Label htmlFor={`${p}-location`}>Where</Label>
          <input
            id={`${p}-location`}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Library grounds"
            maxLength={255}
            required
            className={INPUT_CLASS}
          />
          <FieldError>{errors.location}</FieldError>
        </div>

        <div>
          <Label htmlFor={`${p}-tag`}>Type</Label>
          <select
            id={`${p}-tag`}
            value={tag}
            onChange={(e) => setTag(e.target.value as ApiEvent["tag"])}
            className={`cursor-pointer ${INPUT_CLASS}`}
          >
            <option value="FUN">Fun</option>
            <option value="IMPORTANT">Important</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor={`${p}-contact`}>Contact cellphone number</Label>
          <input
            id={`${p}-contact`}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
            placeholder="0821234567"
            required
            className={INPUT_CLASS}
          />
          <p className="mt-1 text-[12px] text-muted">
            <strong className="font-semibold text-ink">
              This number will be shown publicly
            </strong>{" "}
            so people can contact you about the event.
          </p>
          <FieldError>{errors.contactNumber}</FieldError>
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor={`${p}-description`}>About the event</Label>
          <textarea
            id={`${p}-description`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            minLength={MIN_DESCRIPTION}
            required
            placeholder="Bring gloves — bags are provided."
            className={INPUT_CLASS}
          />
          <p className="mt-1 text-[12px] text-muted">
            At least {MIN_DESCRIPTION} characters. Keep it short if you like —
            people can call you for more details.
          </p>
          <FieldError>{errors.description}</FieldError>
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor={`${p}-image`}>Picture (optional)</Label>
          {image ? (
            <div className="mb-2">
              <FilePreview file={image} alt="New event picture" className="h-auto max-h-48 w-auto rounded-lg border border-line" />
              <button
                type="button"
                onClick={() => setImage(null)}
                className="mt-1.5 cursor-pointer text-[12.5px] font-semibold text-accent"
              >
                Remove new picture
              </button>
            </div>
          ) : event?.imageUrl ? (
            <Image
              src={event.imageUrl}
              alt="Current event picture"
              width={320}
              height={180}
              unoptimized
              className="mb-2 h-auto w-40 rounded-lg border border-line"
            />
          ) : null}
          <input
            id={`${p}-image`}
            type="file"
            accept={IMAGE_TYPES.join(",")}
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              // Let the same file be chosen again after cancelling the cropper.
              e.target.value = "";
              if (!file) return;
              if (!IMAGE_TYPES.includes(file.type)) {
                setErrors((prev) => ({ ...prev, image: "The picture must be a JPEG, PNG or WebP." }));
                return;
              }
              setErrors((prev) => ({ ...prev, image: undefined }));
              setCropFile(file);
            }}
            className="block w-full text-[13px] text-muted file:mr-3 file:cursor-pointer file:rounded-lg file:border file:border-line file:bg-card file:px-3 file:py-2 file:text-[13px] file:font-semibold file:text-ink"
          />
          <p className="mt-1 text-[12px] text-muted">
            A poster or photo. You&apos;ll frame it before it&apos;s added. JPEG, PNG or WebP.
          </p>
          <FieldError>{errors.image}</FieldError>
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        <button type="submit" disabled={submitting} className={PRIMARY_BUTTON}>
          {submitting ? "Saving…" : event ? "Save changes" : "Submit event"}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className={SECONDARY_BUTTON}>
            Cancel
          </button>
        )}
      </div>

      {cropFile && (
        <ImageCropDialog
          file={cropFile}
          shapes={POSTER_SHAPES}
          title="Frame your event picture"
          onCancel={() => setCropFile(null)}
          onDone={(cropped) => {
            setImage(cropped);
            setCropFile(null);
          }}
        />
      )}
    </form>
  );
}

function FieldError({ children }: { children?: string }) {
  if (!children) return null;
  return (
    <p role="alert" className="mt-1 text-[12px] text-accent">
      {children}
    </p>
  );
}
