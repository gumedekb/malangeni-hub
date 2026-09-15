import { api, AUTH_ENDPOINTS } from "@/lib/api";
import { normalizeProfile, type Profile } from "@/lib/auth/types";

/**
 * Profile picture upload.
 *
 * The browser downscales the image and posts it to the backend's multipart
 * avatar endpoint, which stores it and returns the updated user record. Phone
 * cameras produce 3–5 MB files and most of our members are on metered mobile
 * data, so shipping the original would be careless — a 512px square is all a
 * 96px avatar ever needs.
 */

/** Longest edge of the stored image, in pixels. */
const MAX_DIMENSION = 512;
/** Rejected before any resizing work happens. */
const MAX_INPUT_BYTES = 8 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

export const AVATAR_ACCEPT = ACCEPTED.join(",");

/** Thrown for problems worth showing the member verbatim. */
export class AvatarError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AvatarError";
  }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new AvatarError("That file could not be read as an image."));
    };
    img.src = url;
  });
}

/**
 * Centre-crops to a square and scales down to at most MAX_DIMENSION.
 * Always re-encodes as JPEG, which also strips EXIF — including the GPS
 * coordinates phones attach, which members would not expect to publish.
 */
async function toSquareJpeg(file: File): Promise<Blob> {
  const img = await loadImage(file);
  const side = Math.min(img.naturalWidth, img.naturalHeight);
  const target = Math.min(side, MAX_DIMENSION);

  const canvas = document.createElement("canvas");
  canvas.width = target;
  canvas.height = target;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new AvatarError("Your browser could not process that image.");

  ctx.drawImage(
    img,
    (img.naturalWidth - side) / 2, // source x — centre crop
    (img.naturalHeight - side) / 2, // source y
    side,
    side,
    0,
    0,
    target,
    target,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new AvatarError("Could not process that image.")),
      "image/jpeg",
      0.85,
    );
  });
}

/**
 * Validates, downscales and uploads the picture to the backend, returning the
 * updated user record. The backend persists the image and owns the resulting
 * URL, so the caller only has to adopt the returned profile into app state.
 */
export async function uploadAvatar(file: File): Promise<Profile> {
  if (!ACCEPTED.includes(file.type))
    throw new AvatarError("Please choose a JPEG, PNG or WebP image.");
  if (file.size > MAX_INPUT_BYTES)
    throw new AvatarError("That image is too large — please choose one under 8 MB.");

  const blob = await toSquareJpeg(file);

  // Sent as multipart under the field name the backend expects. Naming the part
  // (`avatar.jpg`) keeps the upload readable server-side; the extension matches
  // the JPEG we always re-encode to above.
  const form = new FormData();
  form.append("file", blob, "avatar.jpg");

  const updated = await api.postForm<Profile>(AUTH_ENDPOINTS.avatar, form);
  return normalizeProfile(updated);
}
