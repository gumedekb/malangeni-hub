/**
 * Cloudinary delivery transformations. A picture is stored once; the URL asks
 * Cloudinary for the size and crop each spot needs. Anything not on Cloudinary
 * (Google photos, other hosts) is returned unchanged.
 */
const UPLOAD = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/;

function withTransform(url: string, transform: string): string {
  const match = url.match(UPLOAD);
  return match ? `${match[1]}${transform}/${match[2]}` : url;
}

/** Exactly width×height for cards: Cloudinary fills the frame and keeps the interesting part (g_auto). */
export function fillImage(url: string, width: number, height: number): string {
  return withTransform(url, `c_fill,g_auto,w_${width},h_${height},q_auto,f_auto`);
}

/** The whole picture, never cropped, no bigger than `max` on its longest side. */
export function fitImage(url: string, max = 1200): string {
  return withTransform(url, `c_limit,w_${max},h_${max},q_auto,f_auto`);
}
