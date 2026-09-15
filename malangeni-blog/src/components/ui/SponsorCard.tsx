"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { api, SPONSOR_ENDPOINTS } from "@/lib/api";
import type { ApiSponsor, SponsorPlacement } from "@/lib/types";

/** A booked sponsor for this slot, or nothing at all when none is booked. */
export function SponsorCard({ placement, className = "" }: { placement: SponsorPlacement; className?: string }) {
  const [sponsor, setSponsor] = useState<ApiSponsor | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const found = await api.get<ApiSponsor | null>(SPONSOR_ENDPOINTS.active(placement));
        if (!cancelled) setSponsor(found ?? null);
      } catch {
        /* no ad is fine */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [placement]);

  if (!sponsor) return null;

  const box = `block rounded-xl border border-dashed border-accent bg-accent-soft px-[18px] py-6 text-center ${className}`;
  const content = (
    <>
      <div className="text-[10px] font-semibold uppercase tracking-[1.5px] text-accent">Sponsored</div>
      {sponsor.imageUrl && (
        <Image
          src={sponsor.imageUrl}
          alt=""
          width={600}
          height={300}
          unoptimized
          className="mt-3 h-auto w-full rounded-lg object-cover"
        />
      )}
      <h4 className="mb-1 mt-2 font-serif text-lg font-semibold">{sponsor.title}</h4>
      {sponsor.pitch && <p className="text-[13.5px] text-muted">{sponsor.pitch}</p>}
    </>
  );

  return sponsor.targetUrl ? (
    <a href={sponsor.targetUrl} target="_blank" rel="noopener noreferrer sponsored" className={box}>
      {content}
    </a>
  ) : (
    <div className={box}>{content}</div>
  );
}
