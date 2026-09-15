"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

/** A local preview of a picture the member picked. Read as a data URL, so there's nothing to clean up. */
export function FilePreview({
  file,
  alt = "Selected picture",
  className = "",
}: {
  file: File;
  alt?: string;
  className?: string;
}) {
  const [preview, setPreview] = useState<{ file: File; url: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const reader = new FileReader();
    reader.onload = () => {
      if (!cancelled && typeof reader.result === "string") setPreview({ file, url: reader.result });
    };
    reader.readAsDataURL(file);
    return () => {
      cancelled = true;
      reader.abort();
    };
  }, [file]);

  if (!preview || preview.file !== file) return null;
  return <Image src={preview.url} alt={alt} width={480} height={320} unoptimized className={className} />;
}
