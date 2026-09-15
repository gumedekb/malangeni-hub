"use client";

import { useCallback, useEffect, useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { cropToFile } from "@/lib/crop";

export interface CropShape {
  label: string;
  aspect: number;
}

export const SQUARE: CropShape[] = [{ label: "Square", aspect: 1 }];

/** Poster shapes for events; people pick the one that suits their picture. */
export const POSTER_SHAPES: CropShape[] = [
  { label: "Portrait", aspect: 3 / 4 },
  { label: "Square", aspect: 1 },
  { label: "Landscape", aspect: 16 / 9 },
];

/**
 * Lets the member frame their picture before it's uploaded: drag to move, pinch
 * or slide to zoom, and (for posters) pick a shape. What's inside the frame is
 * exactly what everyone will see.
 */
export function ImageCropDialog({
  file,
  shapes,
  round = false,
  title = "Frame your picture",
  onCancel,
  onDone,
}: {
  file: File;
  shapes: CropShape[];
  /** A round frame, for profile pictures. */
  round?: boolean;
  title?: string;
  onCancel: () => void;
  onDone: (cropped: File) => void;
}) {
  const [source, setSource] = useState<{ file: File; url: string } | null>(null);
  const [shape, setShape] = useState(shapes[0]);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Read as a data URL: nothing to revoke, and safe with React's double-run effects in development.
  useEffect(() => {
    let cancelled = false;
    const reader = new FileReader();
    reader.onload = () => {
      if (!cancelled && typeof reader.result === "string") setSource({ file, url: reader.result });
    };
    reader.onerror = () => {
      if (!cancelled) setError("That file couldn't be read as a picture.");
    };
    reader.readAsDataURL(file);
    return () => {
      cancelled = true;
      reader.abort();
    };
  }, [file]);

  // Escape cancels, like any dialog.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const onCropComplete = useCallback((_: Area, pixels: Area) => setArea(pixels), []);

  const src = source && source.file === file ? source.url : null;

  async function confirm() {
    if (!src || !area) return;
    setWorking(true);
    setError(null);
    try {
      onDone(await cropToFile(src, area, file.name));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't process that picture.");
      setWorking(false);
    }
  }

  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-[520px] overflow-hidden rounded-card border border-line bg-card shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
        <div className="border-b border-line px-5 py-3.5">
          <h2 className="font-serif text-[18px] font-semibold">{title}</h2>
          <p className="text-[12.5px] text-muted">Drag to move and zoom to fit. What&apos;s in the frame is what people see.</p>
        </div>

        <div className="relative h-[min(60vh,380px)] bg-[#111]">
          {src ? (
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              aspect={shape.aspect}
              cropShape={round ? "round" : "rect"}
              showGrid={!round}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          ) : (
            <p className="grid h-full place-items-center text-[13px] text-white/70">{error ?? "Loading picture…"}</p>
          )}
        </div>

        <div className="flex flex-col gap-3 px-5 py-4">
          {shapes.length > 1 && (
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Shape">
              {shapes.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  role="radio"
                  aria-checked={s === shape}
                  onClick={() => setShape(s)}
                  className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-[13px] transition ${
                    s === shape ? "border-ink bg-ink text-on-ink" : "border-line bg-card text-muted hover:text-ink"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
          <label className="flex items-center gap-3 text-[13px] text-muted">
            Zoom
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-accent"
            />
          </label>
          {error && src && (
            <p role="alert" className="text-[13px] text-accent">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="cursor-pointer rounded-lg border border-line px-4 py-2.5 text-[13px] font-semibold text-ink transition hover:border-ink"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!src || !area || working}
              onClick={() => void confirm()}
              className="cursor-pointer rounded-lg bg-accent px-4 py-2.5 text-[13px] font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {working ? "Preparing…" : "Use picture"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
