"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api, SERVICE_ENDPOINTS } from "@/lib/api";
import { categoryInfo, SERVICE_CATEGORIES } from "@/lib/services";
import type { ApiService, Page, ServiceCategory } from "@/lib/types";
import { MyServices } from "./MyServices";
import { ServiceListingCard } from "./ServiceListingCard";

/**
 * Services offered by people in Malangeni — plumbers, electricians, transport,
 * tutors and more. Anyone can list one; the hub team approves it first.
 */
export function CommunityServices() {
  const [services, setServices] = useState<ApiService[] | null>(null);
  const [category, setCategory] = useState<ServiceCategory | "ALL">("ALL");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const page = await api.get<Page<ApiService>>(SERVICE_ENDPOINTS.list);
        if (!cancelled) setServices(page?.content ?? []);
      } catch {
        if (!cancelled) setServices([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    return (services ?? []).filter((s) => {
      if (category !== "ALL" && s.serviceCategory !== category) return false;
      if (!term) return true;
      return [s.name, s.description, s.areaServed, categoryInfo(s.serviceCategory).label]
        .filter(Boolean)
        .some((text) => text!.toLowerCase().includes(term));
    });
  }, [services, category, query]);

  return (
    <section className="mt-[26px]">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-card p-5">
        <p className="text-[14px] text-muted">
          Plumber, electrician, driver, tutor? List your service so people can find you.
        </p>
        <Link
          href="/services/new"
          className="rounded-lg bg-accent px-4 py-2.5 text-[13px] font-semibold text-white transition hover:opacity-95"
        >
          Offer a service
        </Link>
      </div>

      <MyServices />

      <h2 className="font-serif text-[24px] font-semibold">Local services</h2>
      <form
        className="mt-3 flex flex-col gap-2.5 sm:flex-row"
        onSubmit={(e) => e.preventDefault()}
        role="search"
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search services, e.g. plumber, transport, maths…"
          aria-label="Search services"
          className="flex-1 rounded-[10px] border border-line bg-card px-4 py-3 text-[15px] outline-none focus:outline-2 focus:outline-accent"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as ServiceCategory | "ALL")}
          aria-label="Category"
          className="cursor-pointer rounded-[10px] border border-line bg-card px-4 py-3 text-[14px] outline-none focus:outline-2 focus:outline-accent"
        >
          <option value="ALL">All categories</option>
          {SERVICE_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.icon} {c.label}
            </option>
          ))}
        </select>
      </form>

      {services === null ? (
        <p className="mt-5 text-[14px] text-muted">Loading…</p>
      ) : services.length === 0 ? (
        <p className="mt-5 rounded-card border border-dashed border-line bg-card p-6 text-[14px] text-muted">
          No services are listed yet — be the first to{" "}
          <Link href="/services/new" className="font-semibold text-accent">
            offer yours
          </Link>
          .
        </p>
      ) : results.length === 0 ? (
        <p className="mt-5 text-[14px] text-muted">No services match that search.</p>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
          {results.map((s) => (
            <ServiceListingCard key={s.id} service={s} />
          ))}
        </div>
      )}
    </section>
  );
}
