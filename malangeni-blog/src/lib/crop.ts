import type { Area } from "react-easy-crop";

/** Longest side of a cropped picture — plenty for a poster, light on mobile data. */
const MAX_SIDE = 1600;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("That file couldn't be read as a picture."));
    img.src = src;
  });
}

/**
 * Cuts the chosen frame out of the picture and returns it as a JPEG, at most
 * 1600px on its longest side. Re-encoding also drops EXIF data such as the GPS
 * location phones attach.
 */
export async function cropToFile(src: string, area: Area, name: string): Promise<File> {
  const img = await loadImage(src);
  const scale = Math.min(1, MAX_SIDE / Math.max(area.width, area.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(area.width * scale));
  canvas.height = Math.max(1, Math.round(area.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser couldn't process that picture.");
  // JPEG has no transparency: paint white first so transparent PNGs don't turn black.
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.88));
  if (!blob) throw new Error("Couldn't process that picture.");
  return new File([blob], `${name.replace(/\.\w+$/, "") || "picture"}.jpg`, { type: "image/jpeg" });
}
