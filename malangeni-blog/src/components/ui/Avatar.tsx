"use client";

import { useState } from "react";
import Image from "next/image";
import { getInitials } from "@/lib/format";

/**
 * Member avatar with a three-step fallback: the uploaded picture, then the
 * Google account photo that comes free with sign-in, then initials on a solid
 * circle. Keeping the order in one place stops the header, the menu and the
 * profile page from disagreeing about which image to show.
 */
export function Avatar({
  src,
  name,
  size = 36,
  className = "",
}: {
  /** Uploaded picture or Google photo; falls back to initials when absent. */
  src?: string | null;
  /** Used for the initials fallback and the alt text. */
  name?: string | null;
  size?: number;
  className?: string;
}) {
  // A picture that failed to load (expired Google link, blocked host) drops to
  // initials instead of leaving a broken-image icon.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const label = name ? getInitials(name) : "You";
  const base = `shrink-0 overflow-hidden rounded-full ${className}`;

  if (src && src !== failedSrc) {
    return (
      <Image
        src={src}
        alt={name ? `${name}'s profile picture` : "Profile picture"}
        width={size}
        height={size}
        // Uploads are square by construction, but Google photos may not be.
        className={`${base} object-cover`}
        style={{ width: size, height: size }}
        unoptimized
        // Google's photo host often refuses (403) requests that carry another
        // site's referrer, which is why new accounts showed no picture.
        referrerPolicy="no-referrer"
        onError={() => setFailedSrc(src)}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`grid place-items-center bg-ink font-semibold text-on-ink ${base}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
    >
      {label}
    </span>
  );
}
