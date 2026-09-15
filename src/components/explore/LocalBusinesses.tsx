"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, SHOP_ENDPOINTS } from "@/lib/api";
import { hoursLabel, isOpenNow } from "@/lib/shops";
import type { Page, Shop } from "@/lib/types";
import { UserBadges } from "@/components/ui/UserBadges";

/**
 * The local business directory: confirmed businesses with their hours, contact
 * and location. Information only — no products or ordering.
 */
export function LocalBusinesses() {
  const [shops, setShops] = useState<Shop[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const page = await api.get<Page<Shop>>(SHOP_ENDPOINTS.list());
        if (!cancelled) setShops(page?.content ?? []);
      } catch {
        if (!cancelled) setShops([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="mt-12">
      <h2 className="font-serif text-[26px] font-semibold">Local businesses</h2>
      <p className="mt-1 text-[14px] text-muted">
        Shops, salons, taxis and services confirmed by the hub team.
      </p>

      {shops === null ? (
        <p className="mt-4 text-[14px] text-muted">Loading…</p>
      ) : shops.length === 0 ? (
        <p className="mt-4 rounded-card border border-dashed border-line bg-card p-6 text-[14px] text-muted">
          No businesses are listed yet. Run one?{" "}
          <Link href="/profile" className="font-semibold text-accent">
            Ask for the business badge
          </Link>{" "}
          on your profile, then add your listing.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shops.map((shop) => (
            <BusinessCard key={shop.id} shop={shop} />
          ))}
        </div>
      )}
    </section>
  );
}

function BusinessCard({ shop }: { shop: Shop }) {
  const open = isOpenNow(shop);
  return (
    <article className="flex flex-col rounded-card border border-line bg-card p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-serif text-[18px] font-semibold">{shop.name}</h3>
        <UserBadges badge="BUSINESS" />
      </div>
      {shop.description && (
        <p className="mt-1.5 text-[13.5px] text-muted">{shop.description}</p>
      )}
      <dl className="mt-3 flex flex-col gap-1.5 text-[13.5px]">
        <div className="flex items-center gap-2">
          {open !== null && (
            <span
              aria-hidden="true"
              className={`size-2 rounded-full ${open ? "bg-fun" : "bg-muted"}`}
            />
          )}
          <span>
            {open === null ? "" : open ? "Open now · " : "Closed · "}
            {hoursLabel(shop)}
          </span>
        </div>
        {shop.address && <div className="text-muted">{shop.address}</div>}
        {shop.phone && (
          <a href={`tel:${shop.phone}`} className="font-semibold text-accent">
            {shop.phone}
          </a>
        )}
        {shop.email && (
          <a href={`mailto:${shop.email}`} className="text-accent">
            {shop.email}
          </a>
        )}
      </dl>
    </article>
  );
}
