"use client";

import { useState } from "react";
import Image from "next/image";
import { api, SERVICE_ENDPOINTS } from "@/lib/api";
import { IMAGE_ACCEPT, imageProblem, prepareImage } from "@/lib/images";
import { SERVICE_CATEGORIES } from "@/lib/services";
import type { ApiService, ServiceCategory } from "@/lib/types";
import { normalizeSaCell, SA_CELL_MESSAGE } from "@/lib/validation";
import {
  ErrorLine,
  INPUT_CLASS,
  Label,
  PRIMARY_BUTTON,
  SECONDARY_BUTTON,
} from "@/components/staff/ui";

const MIN_DESCRIPTION = 5;
const MAX_DESCRIPTION = 1000;

type Field = "name" | "category" | "description" | "contactNumber" | "areaServed" | "image";

/**
 * List or edit a service. Same two layers as events: required, format-checked
 * fields here (the backend repeats every rule); anything a form can't judge
 * comes back from the hub team as "needs changes" with a note.
 */
export function ServiceForm({
  service,
  onSaved,
  onCancel,
}: {
  /** Omit to list a new service. */
  service?: ApiService;
  /** `warning` is set when the listing saved but the picture didn't upload. */
  onSaved: (service: ApiService, warning?: string) => void;
  onCancel?: () => void;
}) {
  const [name, setName] = useState(service?.name ?? "");
  const [category, setCategory] = useState<ServiceCategory | "">(service?.serviceCategory ?? "");
  const [description, setDescription] = useState(service?.description ?? "");
  const [contactNumber, setContactNumber] = useState(service?.contactNumber ?? "");
  const [areaServed, setAreaServed] = useState(service?.areaServed ?? "");
  const [hours, setHours] = useState(service?.operatingHours ?? "");
  const [image, setImage] = useState<File | null>(null);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const p = service ? `service-${service.id}` : "service-new";

  function validate() {
    const next: Partial<Record<Field, string>> = {};
    if (!name.trim()) next.name = "Give your service a name.";
    if (!category) next.category = "Choose a category.";
    const desc = description.trim();
    if (desc.length < MIN_DESCRIPTION) next.description = `Describe it in at least ${MIN_DESCRIPTION} characters.`;
    else if (desc.length > MAX_DESCRIPTION) next.description = `Keep it under ${MAX_DESCRIPTION} characters.`;
    const phone = normalizeSaCell(contactNumber);
    if (!phone) next.contactNumber = SA_CELL_MESSAGE;
    if (!areaServed.trim()) next.areaServed = "Say where you work.";
    if (image) {
      const problem = imageProblem(image);
      if (problem) next.image = problem;
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return null;
    return {
      name: name.trim(),
      serviceCategory: category,
      description: desc,
      contactNumber: phone!,
      areaServed: areaServed.trim(),
      // Empty clears it on edit.
      operatingHours: hours.trim(),
    };
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = validate();
    if (!payload) return;

    setSubmitting(true);
    let saved: ApiService;
    try {
      saved = service
        ? await api.put<ApiService>(SERVICE_ENDPOINTS.service(service.id), payload)
        : await api.post<ApiService>(SERVICE_ENDPOINTS.create, payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the service.");
      setSubmitting(false);
      return;
    }

    let warning: string | undefined;
    if (image) {
      try {
        const form = new FormData();
        form.append("file", await prepareImage(image));
        saved = await api.postForm<ApiService>(SERVICE_ENDPOINTS.image(saved.id), form);
      } catch (err) {
        warning = `The service was saved, but the picture didn't upload${
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
        <div>
          <Label htmlFor={`${p}-name`}>Name of your service</Label>
          <input
            id={`${p}-name`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Sipho's Plumbing"
            maxLength={255}
            required
            className={INPUT_CLASS}
          />
          <FieldError>{errors.name}</FieldError>
        </div>

        <div>
          <Label htmlFor={`${p}-category`}>Category</Label>
          <select
            id={`${p}-category`}
            value={category}
            onChange={(e) => setCategory(e.target.value as ServiceCategory)}
            required
            className={`cursor-pointer ${INPUT_CLASS}`}
          >
            <option value="" disabled>
              Choose a category…
            </option>
            {SERVICE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.icon} {c.label}
              </option>
            ))}
          </select>
          <FieldError>{errors.category}</FieldError>
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor={`${p}-description`}>Short description</Label>
          <textarea
            id={`${p}-description`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            minLength={MIN_DESCRIPTION}
            maxLength={MAX_DESCRIPTION}
            required
            placeholder="Burst pipes, geysers, taps and toilets. Call-outs same day."
            className={INPUT_CLASS}
          />
          <p className="mt-1 flex justify-between text-[12px] text-muted">
            <span>At least {MIN_DESCRIPTION} characters — people can call you for details.</span>
            <span>
              {description.length}/{MAX_DESCRIPTION}
            </span>
          </p>
          <FieldError>{errors.description}</FieldError>
        </div>

        <div>
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
            so people can contact you.
          </p>
          <FieldError>{errors.contactNumber}</FieldError>
        </div>

        <div>
          <Label htmlFor={`${p}-area`}>Area served</Label>
          <input
            id={`${p}-area`}
            value={areaServed}
            onChange={(e) => setAreaServed(e.target.value)}
            placeholder="Malangeni and nearby villages"
            maxLength={255}
            required
            className={INPUT_CLASS}
          />
          <FieldError>{errors.areaServed}</FieldError>
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor={`${p}-hours`}>Operating hours (optional)</Label>
          <input
            id={`${p}-hours`}
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder="Mon–Fri 08:00–17:00, Sat mornings"
            maxLength={255}
            className={INPUT_CLASS}
          />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor={`${p}-image`}>Picture (optional)</Label>
          {service?.imageUrl && !image && (
            <Image
              src={service.imageUrl}
              alt="Current picture"
              width={320}
              height={180}
              unoptimized
              className="mb-2 h-auto w-40 rounded-lg border border-line"
            />
          )}
          <input
            id={`${p}-image`}
            type="file"
            accept={IMAGE_ACCEPT}
            onChange={(e) => setImage(e.target.files?.[0] ?? null)}
            className="block w-full text-[13px] text-muted file:mr-3 file:cursor-pointer file:rounded-lg file:border file:border-line file:bg-card file:px-3 file:py-2 file:text-[13px] file:font-semibold file:text-ink"
          />
          <p className="mt-1 text-[12px] text-muted">
            A photo of your work, van or shop. JPEG, PNG or WebP — resized on your phone.
          </p>
          <FieldError>{errors.image}</FieldError>
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        <button type="submit" disabled={submitting} className={PRIMARY_BUTTON}>
          {submitting ? "Saving…" : service ? "Save changes" : "Submit service"}
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

function FieldError({ children }: { children?: string }) {
  if (!children) return null;
  return (
    <p role="alert" className="mt-1 text-[12px] text-accent">
      {children}
    </p>
  );
}
