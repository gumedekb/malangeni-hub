/**
 * Picture handling for post uploads. Unlike avatars (square-cropped in
 * `avatar.ts`), a post picture keeps its shape — it's only shrunk.
 */

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

export const IMAGE_ACCEPT = ACCEPTED.join(",");

/** Before resizing. Phone cameras produce big files; the resize brings them well under the backend's 5MB. */
const MAX_INPUT_BYTES = 15 * 1024 * 1024;

/** Longest side after resizing — plenty for a feed, and far less data on rural connections. */
const MAX_DIMENSION = 1600;

/** Small, already-sized files are sent untouched. */
const SKIP_RESIZE_BYTES = 1.5 * 1024 * 1024;

/** A message explaining why the file can't be used, or null when it's fine. */
export function imageProblem(file: File): string | null {
  if (!ACCEPTED.includes(file.type)) return "The picture must be a JPEG, PNG or WebP.";
  if (file.size > MAX_INPUT_BYTES) return "That picture is too big (over 15MB).";
  return null;
}

/**
 * Shrinks the picture in the browser to at most 1600px on its longest side,
 * as JPEG. Falls back to the original file if the browser can't decode it —
 * the backend still validates and caps it.
 */
export async function prepareImage(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size <= SKIP_RESIZE_BYTES) {
      bitmap.close();
      return file;
    }
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    // JPEG has no transparency: paint white first so transparent PNGs don't turn black.
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.82),
    );
    if (!blob) return file;
    return new File([blob], `${file.name.replace(/\.\w+$/, "")}.jpg`, { type: "image/jpeg" });
  } catch {
    return file;
  }
}
